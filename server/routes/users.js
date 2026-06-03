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

router.post("/record-match", async (req, res, next) => {
  try {
    const { userId, mode, opponent, result, summary, rewardVideoBonus = 0 } = req.body;
    if (!userId) return res.status(400).json({ message: "userId faltante." });

    const user = await User.findById(userId);
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
