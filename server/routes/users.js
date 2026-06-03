import express from "express";
import User from "../models/User.js";
import { levelFromXp, rewardFor, xpToNextLevel } from "../controllers/progression.js";

const router = express.Router();

function sameUtcDay(left, right) {
  return left.getUTCFullYear() === right.getUTCFullYear() && left.getUTCMonth() === right.getUTCMonth() && left.getUTCDate() === right.getUTCDate();
}

function buildLevelReward(level) {
  return {
    level,
    title: `Rango ${level}`,
    coins: 150 + level * 45,
    diamonds: level % 5 === 0 ? 3 : 1,
    xp: 40 + level * 12
  };
}

function moveGemPrice(name) {
  const catalog = {
    Horquilla: 6,
    Clavada: 10,
    Descubierto: 15,
    "Mate Pastor": 20,
    "Jaque doble": 25,
    Desviacion: 32
  };
  return catalog[name] || 12;
}

function validAvatar(avatar) {
  return ["king", "queen", "knight", "rook", "bishop", "pawn"].includes(String(avatar || ""));
}

function matchReward(mode, result) {
  if (mode === "Historia") {
    if (result === "win") return { coins: 180, xp: 120 };
    if (result === "draw") return { coins: 70, xp: 40 };
    return { coins: 30, xp: 15 };
  }
  if (mode === "Online") {
    if (result === "win") return { coins: 220, xp: 160 };
    if (result === "draw") return { coins: 90, xp: 60 };
    return { coins: 40, xp: 20 };
  }
  return { coins: 0, xp: 0 };
}

function ensureUserShape(user) {
  user.unlockedTactics = Array.isArray(user.unlockedTactics) ? user.unlockedTactics : [];
  user.claimedLevelRewards = Array.isArray(user.claimedLevelRewards) ? user.claimedLevelRewards : [];
  user.recentMatches = Array.isArray(user.recentMatches) ? user.recentMatches : [];
  user.sessions = Array.isArray(user.sessions) ? user.sessions : [];
  user.favoriteOpponents = Array.isArray(user.favoriteOpponents) ? user.favoriteOpponents : [];
  user.storyProgress = user.storyProgress && typeof user.storyProgress === "object" ? user.storyProgress : {};
  user.stats = {
    matches: user.stats?.matches || 0,
    wins: user.stats?.wins || 0,
    streak: user.stats?.streak || 0,
    totalPlaySeconds: user.stats?.totalPlaySeconds || 0,
    lastSessionSeconds: user.stats?.lastSessionSeconds || 0,
    totalSessions: user.stats?.totalSessions || 0
  };
}

function buildRecentOpponents(recentMatches = [], realUsernames = null) {
  const buckets = new Map();

  for (const match of recentMatches) {
    const name = String(match.opponent || "").trim();
    if (!name) continue;
    const normalizedName = name.toLowerCase();
    const canonicalName = realUsernames?.get(normalizedName) || name;
    if (realUsernames && !realUsernames.has(normalizedName)) continue;
    const current = buckets.get(canonicalName) || { username: canonicalName, matches: 0, wins: 0, losses: 0, draws: 0, lastPlayedAt: null };
    current.matches += 1;
    if (match.result === "win") current.wins += 1;
    if (match.result === "loss") current.losses += 1;
    if (match.result === "draw") current.draws += 1;
    const playedAt = new Date(match.playedAt || Date.now());
    if (!current.lastPlayedAt || playedAt > current.lastPlayedAt) {
      current.lastPlayedAt = playedAt;
    }
    buckets.set(canonicalName, current);
  }

  return Array.from(buckets.values())
    .sort((left, right) => {
      if (right.matches !== left.matches) return right.matches - left.matches;
      return new Date(right.lastPlayedAt || 0) - new Date(left.lastPlayedAt || 0);
    })
    .slice(0, 8)
    .map((entry) => ({
      username: entry.username,
      matches: entry.matches,
      wins: entry.wins,
      losses: entry.losses,
      draws: entry.draws,
      lastPlayedAt: entry.lastPlayedAt
    }));
}

function mergeRecentMatches(currentMatches = [], incomingMatches = []) {
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  const bucket = new Map();

  for (const match of [...incomingMatches, ...currentMatches]) {
    const playedAt = new Date(match.playedAt || Date.now());
    if (Date.now() - playedAt.getTime() >= twoDaysMs) continue;
    const key = [
      String(match.mode || ""),
      String(match.opponent || ""),
      String(match.result || ""),
      playedAt.toISOString()
    ].join("|");
    bucket.set(key, {
      mode: String(match.mode || "partida"),
      opponent: String(match.opponent || "Rival"),
      result: match.result === "draw" ? "draw" : match.result === "win" ? "win" : "loss",
      playedAt,
      summary: String(match.summary || ""),
      rewardCoins: Math.max(0, Number(match.rewardCoins) || 0),
      rewardXp: Math.max(0, Number(match.rewardXp) || 0),
      rewardVideoBonus: Math.max(0, Number(match.rewardVideoBonus) || 0)
    });
  }

  return Array.from(bucket.values())
    .sort((left, right) => new Date(right.playedAt) - new Date(left.playedAt))
    .slice(0, 12);
}

function maxNumber(current, incoming, fallback = 0) {
  return Math.max(Number(current) || fallback, Number(incoming) || fallback);
}

router.get("/demo", async (_req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { username: "Cristian" },
      {
        $setOnInsert: {
          username: "Cristian",
          avatar: "king",
          level: 7,
          xp: 12450,
          coins: 12450,
          diamonds: 330,
          league: "Bronce II",
          unlockedTactics: ["Horquilla"],
          stats: { matches: 150, wins: 68, streak: 7 }
        }
      },
      { new: true, upsert: true }
    );

    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.post("/progress", async (req, res, next) => {
  try {
    const { userId, type = "win", tactic } = req.body;
    const reward = rewardFor(type);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    ensureUserShape(user);

    user.coins += reward.coins;
    user.xp += reward.xp;
    user.level = levelFromXp(user.xp);
    user.xpToNextLevel = xpToNextLevel(user.level);
    const unlocked = tactic || reward.tactic;
    if (unlocked && !user.unlockedTactics.includes(unlocked)) {
      user.unlockedTactics.push(unlocked);
    }

    await user.save();
    res.json({ user, reward });
  } catch (error) {
    next(error);
  }
});

router.get("/leaderboard", async (_req, res, next) => {
  try {
    const users = await User.find({})
      .select("username avatar level xp coins diamonds stats favoriteOpponents league")
      .lean();

    const ranking = users
      .map((user) => {
        const wins = user.stats?.wins || 0;
        const playSeconds = user.stats?.totalPlaySeconds || 0;
        const score = (user.level || 1) * 1800 + (user.xp || 0) + wins * 120 + Math.floor((user.coins || 0) / 40) + Math.floor(playSeconds / 30);
        return {
          username: user.username,
          avatar: user.avatar || "king",
          level: user.level || 1,
          xp: user.xp || 0,
          coins: user.coins || 0,
          diamonds: user.diamonds || 0,
          wins,
          totalPlaySeconds: playSeconds,
          score,
          league: user.league || "Bronce III"
        };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, 30);

    res.json({ ok: true, ranking });
  } catch (error) {
    next(error);
  }
});

router.post("/sync-profile", async (req, res, next) => {
  try {
    const {
      username,
      avatar,
      level,
      xp,
      xpToNextLevel: nextLevelXp,
      coins,
      diamonds,
      league,
      stats,
      recentMatches,
      unlockedTactics,
      claimedLevelRewards,
      storyProgress
    } = req.body;
    const cleanUsername = String(username || "").trim();
    if (!cleanUsername) return res.status(400).json({ message: "username faltante." });

    const user = await User.findOneAndUpdate(
      { username: cleanUsername },
      {
        $setOnInsert: {
          username: cleanUsername,
          avatar: validAvatar(avatar) ? avatar : "king",
          coins: 5000,
          diamonds: 15,
          level: 1,
          xp: 0,
          xpToNextLevel: 500,
          league: "Bronce III",
          unlockedTactics: ["Horquilla"]
        }
      },
      { new: true, upsert: true }
    );

    ensureUserShape(user);
    if (validAvatar(avatar)) user.avatar = avatar;
    user.level = maxNumber(user.level, level, 1);
    user.xp = maxNumber(user.xp, xp, 0);
    user.xpToNextLevel = maxNumber(user.xpToNextLevel, nextLevelXp, 500);
    user.coins = maxNumber(user.coins, coins, 5000);
    user.diamonds = maxNumber(user.diamonds, diamonds, 15);
    if (league) user.league = String(league);

    user.stats = {
      ...user.stats,
      matches: maxNumber(user.stats?.matches, stats?.matches, 0),
      wins: maxNumber(user.stats?.wins, stats?.wins, 0),
      streak: maxNumber(user.stats?.streak, stats?.streak, 0),
      totalPlaySeconds: maxNumber(user.stats?.totalPlaySeconds, stats?.totalPlaySeconds, 0),
      lastSessionSeconds: maxNumber(user.stats?.lastSessionSeconds, stats?.lastSessionSeconds, 0),
      totalSessions: maxNumber(user.stats?.totalSessions, stats?.totalSessions, 0)
    };

    user.unlockedTactics = Array.from(new Set([...(user.unlockedTactics || []), ...((unlockedTactics || []).length ? unlockedTactics : ["Horquilla"])]));
    user.claimedLevelRewards = Array.from(new Set([...(user.claimedLevelRewards || []), ...(claimedLevelRewards || [])]));
    user.recentMatches = mergeRecentMatches(user.recentMatches, recentMatches || []);
    if (storyProgress && typeof storyProgress === "object") {
      user.storyProgress = { ...(user.storyProgress || {}), ...storyProgress };
    }

    await user.save();
    res.json({ ok: true, user });
  } catch (error) {
    next(error);
  }
});

router.get("/social/:userId", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select("username recentMatches favoriteOpponents");
    if (!user) return res.status(404).json({ message: "User not found" });
    ensureUserShape(user);
    const users = await User.find({ username: { $ne: user.username } }).select("username").lean();
    const realUsernames = new Map(users.map((entry) => [String(entry.username || "").toLowerCase(), entry.username]));
    const favoriteOpponents = (user.favoriteOpponents || [])
      .filter((entry) => realUsernames.has(String(entry.username || "").toLowerCase()))
      .map((entry) => ({
        username: realUsernames.get(String(entry.username || "").toLowerCase()),
        addedAt: entry.addedAt
      }));
    res.json({
      ok: true,
      recentOpponents: buildRecentOpponents(user.recentMatches, realUsernames),
      favoriteOpponents
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:userId", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.post("/avatar", async (req, res, next) => {
  try {
    const { userId, avatar } = req.body;
    if (!userId) return res.status(400).json({ message: "userId faltante." });
    if (!validAvatar(avatar)) return res.status(400).json({ message: "Avatar invalido." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.avatar = avatar;
    await user.save();
    res.json({ ok: true, user });
  } catch (error) {
    next(error);
  }
});

router.post("/favorite-opponent", async (req, res, next) => {
  try {
    const { userId, opponent } = req.body;
    const username = String(opponent || "").trim();
    if (!userId) return res.status(400).json({ message: "userId faltante." });
    if (!username) return res.status(400).json({ message: "opponent faltante." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    ensureUserShape(user);

    const exists = user.favoriteOpponents.some((item) => item.username === username);
    if (exists) {
      user.favoriteOpponents = user.favoriteOpponents.filter((item) => item.username !== username);
    } else {
      user.favoriteOpponents.unshift({ username, addedAt: new Date() });
      user.favoriteOpponents = user.favoriteOpponents.slice(0, 12);
    }

    await user.save();
    res.json({ ok: true, favoriteOpponents: user.favoriteOpponents });
  } catch (error) {
    next(error);
  }
});

router.post("/record-match", async (req, res, next) => {
  try {
    const { userId, username, avatar, mode, opponent, result, summary, rewardVideoBonus = 0 } = req.body;
    const cleanUsername = String(username || "").trim();
    if (!userId && !cleanUsername) return res.status(400).json({ message: "userId o username faltante." });

    let user = userId ? await User.findById(userId) : null;
    if (!user && cleanUsername) {
      user = await User.findOneAndUpdate(
        { username: cleanUsername },
        {
          $setOnInsert: {
            username: cleanUsername,
            avatar: validAvatar(avatar) ? avatar : "king",
            coins: 5000,
            diamonds: 15,
            level: 1,
            xp: 0,
            xpToNextLevel: 500,
            league: "Bronce III",
            unlockedTactics: ["Horquilla"]
          }
        },
        { new: true, upsert: true }
      );
    }
    if (!user) return res.status(404).json({ message: "User not found" });
    ensureUserShape(user);

    const reward = matchReward(String(mode || ""), result);
    user.recentMatches = (user.recentMatches || []).filter((match) => Date.now() - new Date(match.playedAt).getTime() < 2 * 24 * 60 * 60 * 1000);
    user.recentMatches.unshift({
      mode: String(mode || "partida"),
      opponent: String(opponent || "Rival"),
      result: result === "draw" ? "draw" : result === "win" ? "win" : "loss",
      playedAt: new Date(),
      summary: String(summary || ""),
      rewardCoins: reward.coins,
      rewardXp: reward.xp,
      rewardVideoBonus: Math.max(0, Number(rewardVideoBonus) || 0)
    });
    user.recentMatches = user.recentMatches.slice(0, 12);

    user.coins += reward.coins;
    user.xp += reward.xp;
    user.level = levelFromXp(user.xp);
    user.xpToNextLevel = xpToNextLevel(user.level);

    user.stats.matches = (user.stats.matches || 0) + 1;
    if (result === "win") {
      user.stats.wins = (user.stats.wins || 0) + 1;
      user.stats.streak = (user.stats.streak || 0) + 1;
    } else {
      user.stats.streak = 0;
    }

    await user.save();
    res.json({ ok: true, recentMatches: user.recentMatches, stats: user.stats, reward, user });
  } catch (error) {
    next(error);
  }
});

router.post("/claim-daily", async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId faltante." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    if (user.lastDailyRewardAt && sameUtcDay(new Date(user.lastDailyRewardAt), now)) {
      return res.status(409).json({ message: "La recompensa diaria ya fue reclamada hoy." });
    }

    const reward = { title: "Corona del Amanecer", coins: 300, diamonds: 1, xp: 80 };
    user.lastDailyRewardAt = now;
    user.coins += reward.coins;
    user.diamonds += reward.diamonds;
    user.xp += reward.xp;
    user.level = levelFromXp(user.xp);
    user.xpToNextLevel = xpToNextLevel(user.level);

    await user.save();
    res.json({ ok: true, reward, user });
  } catch (error) {
    next(error);
  }
});

router.post("/claim-level-reward", async (req, res, next) => {
  try {
    const { userId, level } = req.body;
    const levelNumber = Number(level);
    if (!userId) return res.status(400).json({ message: "userId faltante." });
    if (!Number.isInteger(levelNumber) || levelNumber < 1 || levelNumber > 50) {
      return res.status(400).json({ message: "Nivel invalido." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    ensureUserShape(user);
    if (user.level < levelNumber) return res.status(403).json({ message: "Aun no alcanzaste ese nivel." });
    if ((user.claimedLevelRewards || []).includes(levelNumber)) {
      return res.status(409).json({ message: "Esa recompensa ya fue reclamada." });
    }

    const reward = buildLevelReward(levelNumber);
    user.claimedLevelRewards.push(levelNumber);
    user.coins += reward.coins;
    user.diamonds += reward.diamonds;
    user.xp += reward.xp;
    user.level = levelFromXp(user.xp);
    user.xpToNextLevel = xpToNextLevel(user.level);

    await user.save();
    res.json({ ok: true, reward, user });
  } catch (error) {
    next(error);
  }
});

router.post("/rewarded-ad", async (req, res, next) => {
  try {
    const { userId, rewardType, amount } = req.body;
    const rewardAmount = Math.max(0, Number(amount) || 0);
    if (!userId) return res.status(400).json({ message: "userId faltante." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (rewardType === "coins") {
      user.coins += rewardAmount;
    } else if (rewardType === "diamonds") {
      user.diamonds += rewardAmount;
    } else {
      return res.status(400).json({ message: "Tipo de recompensa invalido." });
    }

    await user.save();
    res.json({ ok: true, user });
  } catch (error) {
    next(error);
  }
});

router.post("/purchase-move", async (req, res, next) => {
  try {
    const { userId, moveName, currency, price } = req.body;
    const numericPrice = Math.max(0, Number(price) || 0);
    if (!userId) return res.status(400).json({ message: "userId faltante." });
    if (!moveName) return res.status(400).json({ message: "moveName faltante." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    ensureUserShape(user);
    if ((user.unlockedTactics || []).includes(moveName)) {
      return res.status(409).json({ message: "Ese movimiento ya fue comprado." });
    }

    if (currency === "coins") {
      if (user.coins < numericPrice) return res.status(400).json({ message: "Monedas insuficientes." });
      user.coins -= numericPrice;
    } else if (currency === "diamonds") {
      const gemCost = numericPrice || moveGemPrice(moveName);
      if (user.diamonds < gemCost) return res.status(400).json({ message: "Diamantes insuficientes." });
      user.diamonds -= gemCost;
    } else {
      return res.status(400).json({ message: "Moneda invalida." });
    }

    user.unlockedTactics.push(moveName);
    await user.save();
    res.json({ ok: true, user });
  } catch (error) {
    next(error);
  }
});

router.post("/story-progress", async (req, res, next) => {
  try {
    const { userId, tournamentId, matchId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId faltante." });
    if (!tournamentId) return res.status(400).json({ message: "tournamentId faltante." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    ensureUserShape(user);

    const nextProgress = { ...(user.storyProgress || {}) };
    const current = Array.isArray(nextProgress[tournamentId]) ? nextProgress[tournamentId] : [];
    if (!current.includes(matchId)) {
      nextProgress[tournamentId] = [...current, matchId];
    }
    user.storyProgress = nextProgress;

    await user.save();
    res.json({ ok: true, storyProgress: user.storyProgress, user });
  } catch (error) {
    next(error);
  }
});

router.post("/session", async (req, res, next) => {
  try {
    const { userId, startedAt, endedAt, durationSeconds } = req.body;
    const seconds = Math.max(1, Math.round(Number(durationSeconds) || 0));

    if (!userId) return res.status(400).json({ message: "userId faltante." });
    if (!startedAt || !endedAt) return res.status(400).json({ message: "Faltan fechas de sesion." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    ensureUserShape(user);

    user.sessions.push({
      startedAt: new Date(startedAt),
      endedAt: new Date(endedAt),
      durationSeconds: seconds
    });

    user.stats.totalPlaySeconds = (user.stats.totalPlaySeconds || 0) + seconds;
    user.stats.lastSessionSeconds = seconds;
    user.stats.totalSessions = (user.stats.totalSessions || 0) + 1;

    await user.save();
    res.json({
      ok: true,
      stats: {
        totalPlaySeconds: user.stats.totalPlaySeconds,
        lastSessionSeconds: user.stats.lastSessionSeconds,
        totalSessions: user.stats.totalSessions
      }
    });
  } catch (error) {
    next(error);
  }
});

router.use((error, _req, res, _next) => {
  res.status(500).json({ message: error.message });
});

export default router;
