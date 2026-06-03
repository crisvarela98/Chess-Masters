import { useEffect, useRef, useState } from "react";
import { player as initialPlayer } from "../data/gameData.js";
import { applyLocalProgress, generateLevelRewards, sameUtcDay, cleanRecentMatches } from "../lib/profileUtils.js";
import { API_URL, FTUE_KEY, PROFILE_KEY, STORY_KEY, TRAINING_KEY } from "../constants/appConstants.js";
import { findAvatarOption, localMatchReward, normalizeProfileFromUser, readStorage, saveStorage } from "../lib/appUtils.js";

export function usePlayerProgress({ navigateTo }) {
  const [profile, setProfile] = useState(() => ({ ...initialPlayer, ...readStorage(PROFILE_KEY, {}) }));
  const [storyProgress, setStoryProgress] = useState(() => readStorage(STORY_KEY, {}));
  const [ownedMoves, setOwnedMoves] = useState(() => readStorage(TRAINING_KEY, ["Horquilla"]));
  const [activeStoryMatch, setActiveStoryMatch] = useState(null);
  const syncProfileRef = useRef("");

  useEffect(() => {
    if (profile.userId || (profile.level === 1 && profile.coins === 5000 && profile.diamonds === 15)) return;
    if (profile.username === "Cristian") {
      setProfile((prev) => ({
        ...initialPlayer,
        userId: prev.userId || null,
        username: prev.username,
        avatar: prev.avatar,
        email: prev.email || ""
      }));
    }
  }, [profile]);

  useEffect(() => saveStorage(PROFILE_KEY, profile), [profile]);
  useEffect(() => saveStorage(STORY_KEY, storyProgress), [storyProgress]);
  useEffect(() => saveStorage(TRAINING_KEY, ownedMoves), [ownedMoves]);

  useEffect(() => {
    const username = String(profile.username || "").trim();
    if (!username || username === "Jugador") return undefined;
    if (syncProfileRef.current === username) return undefined;

    syncProfileRef.current = username;
    fetch(`${API_URL}/api/user/sync-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...profile,
        unlockedTactics: ownedMoves,
        storyProgress
      })
    })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data.user) {
          updateProfileReward(data.user);
          setOwnedMoves(data.user.unlockedTactics?.length ? data.user.unlockedTactics : ["Horquilla"]);
          setStoryProgress(data.user.storyProgress || {});
        }
      })
      .catch(() => {
        syncProfileRef.current = "";
      });

    return undefined;
  }, [profile.username]);

  useEffect(() => {
    if (!profile.userId) return undefined;
    fetch(`${API_URL}/api/user/${profile.userId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((user) => {
        if (user?._id) {
          setProfile((prev) => ({ ...prev, ...normalizeProfileFromUser(user) }));
          setOwnedMoves(user.unlockedTactics?.length ? user.unlockedTactics : ["Horquilla"]);
          setStoryProgress(user.storyProgress || {});
        }
      })
      .catch(() => {});
    return undefined;
  }, [profile.userId]);

  useEffect(() => {
    if (!profile.userId) return undefined;

    const sessionStartedAt = new Date();
    let sent = false;

    function flushSession() {
      if (sent) return;
      sent = true;
      const durationSeconds = Math.max(1, Math.round((Date.now() - sessionStartedAt.getTime()) / 1000));
      const payload = JSON.stringify({
        userId: profile.userId,
        startedAt: sessionStartedAt.toISOString(),
        endedAt: new Date().toISOString(),
        durationSeconds
      });

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(`${API_URL}/api/user/session`, blob);
        return;
      }

      fetch(`${API_URL}/api/user/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }

    window.addEventListener("beforeunload", flushSession);
    return () => {
      window.removeEventListener("beforeunload", flushSession);
      flushSession();
    };
  }, [profile.userId]);

  function updateProfileReward(nextUser) {
    setProfile((prev) => ({ ...prev, ...normalizeProfileFromUser(nextUser) }));
  }

  function finishFtue(nextProfile, resetNavigation) {
    localStorage.setItem(FTUE_KEY, "1");
    setProfile((prev) => ({ ...prev, ...nextProfile }));
    resetNavigation("home");
  }

  function claimDaily() {
    if (profile.lastDailyRewardAt && sameUtcDay(new Date(profile.lastDailyRewardAt), new Date())) return;

    if (!profile.userId) {
      setProfile((prev) => applyLocalProgress(prev, 80, 300, 1, { lastDailyRewardAt: new Date().toISOString() }));
      return;
    }

    fetch(`${API_URL}/api/user/claim-daily`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: profile.userId })
    })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data.user) updateProfileReward(data.user);
      })
      .catch(() => {});
  }

  function claimLevelReward(level) {
    if ((profile.claimedLevelRewards || []).includes(level) || profile.level < level) return;

    const reward = generateLevelRewards().find((item) => item.level === level);
    if (!reward) return;

    if (!profile.userId) {
      setProfile((prev) => applyLocalProgress(prev, reward.xp, reward.coins, reward.diamonds, {
        claimedLevelRewards: [...(prev.claimedLevelRewards || []), level]
      }));
      return;
    }

    fetch(`${API_URL}/api/user/claim-level-reward`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: profile.userId, level })
    })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data.user) updateProfileReward(data.user);
      })
      .catch(() => {});
  }

  function buyMove(moveName, currency, price) {
    if (ownedMoves.includes(moveName)) return;
    if (currency === "coins" && profile.coins < price) return;
    if (currency === "diamonds" && profile.diamonds < price) return;

    if (!profile.userId) {
      setProfile((prev) => ({
        ...prev,
        coins: currency === "coins" ? prev.coins - price : prev.coins,
        diamonds: currency === "diamonds" ? prev.diamonds - price : prev.diamonds
      }));
      setOwnedMoves((prev) => [...prev, moveName]);
      return;
    }

    fetch(`${API_URL}/api/user/purchase-move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: profile.userId, moveName, currency, price })
    })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data.user) {
          updateProfileReward(data.user);
          setOwnedMoves(data.user.unlockedTactics?.length ? data.user.unlockedTactics : ["Horquilla"]);
        }
      })
      .catch(() => {});
  }

  function watchAdReward(type, amount) {
    if (profile.userId) {
      fetch(`${API_URL}/api/user/rewarded-ad`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.userId, rewardType: type, amount })
      })
        .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
        .then(({ ok, data }) => {
          if (ok && data.user) updateProfileReward(data.user);
        })
        .catch(() => {});
      return;
    }

    if (type === "coins") {
      setProfile((prev) => applyLocalProgress(prev, 0, amount, 0));
      return;
    }
    setProfile((prev) => applyLocalProgress(prev, 0, 0, amount));
  }

  function selectAvatar(avatarId) {
    if (!findAvatarOption(avatarId)) return;
    if (profile.avatar === avatarId) return;

    setProfile((prev) => ({ ...prev, avatar: avatarId }));

    if (!profile.userId) return;
    fetch(`${API_URL}/api/user/avatar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: profile.userId, avatar: avatarId })
    })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data.user) updateProfileReward(data.user);
      })
      .catch(() => {});
  }

  function recordMatch(match) {
    const entry = { ...match, playedAt: new Date().toISOString() };
    const reward = localMatchReward(match.mode, match.result);
    setProfile((prev) => ({
      ...applyLocalProgress(prev, reward.xp, reward.coins, 0),
      recentMatches: cleanRecentMatches([
        {
          ...entry,
          rewardXp: reward.xp,
          rewardCoins: reward.coins,
          rewardVideoBonus: match.rewardVideoBonus || 0
        },
        ...(prev.recentMatches || [])
      ]).slice(0, 12),
      stats: {
        ...prev.stats,
        matches: (prev.stats?.matches || 0) + 1,
        wins: (prev.stats?.wins || 0) + (match.result === "win" ? 1 : 0),
        streak: match.result === "win" ? (prev.stats?.streak || 0) + 1 : 0
      }
    }));

    return fetch(`${API_URL}/api/user/record-match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: profile.userId,
        username: profile.username,
        avatar: profile.avatar,
        ...match,
        rewardVideoBonus: match.rewardVideoBonus || 0
      })
    })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data.user) {
          updateProfileReward(data.user);
        } else if (ok && data.recentMatches) {
          setProfile((prev) => ({
            ...prev,
            recentMatches: cleanRecentMatches(data.recentMatches),
            stats: { ...prev.stats, ...(data.stats || {}) }
          }));
        }
      })
      .catch(() => null);
  }

  function startStoryMatch(tournament, match) {
    setActiveStoryMatch({ tournament, match });
    navigateTo("story-match");
  }

  function addStoryWin(tournamentId, matchId) {
    const nextProgressUpdater = (prev) => {
      const current = prev[tournamentId] || [];
      if (current.includes(matchId)) return prev;
      return { ...prev, [tournamentId]: [...current, matchId] };
    };

    setStoryProgress(nextProgressUpdater);
    if (profile.userId) {
      fetch(`${API_URL}/api/user/story-progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.userId, tournamentId, matchId })
      })
        .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
        .then(({ ok, data }) => {
          if (ok && data.storyProgress) setStoryProgress(data.storyProgress);
          if (ok && data.user) updateProfileReward(data.user);
        })
        .catch(() => {});
    }
    setActiveStoryMatch(null);
    navigateTo("home", { replace: true });
  }

  return {
    profile,
    storyProgress,
    ownedMoves,
    activeStoryMatch,
    claimDaily,
    claimLevelReward,
    buyMove,
    watchAdReward,
    selectAvatar,
    recordMatch,
    startStoryMatch,
    addStoryWin,
    finishFtue,
    setActiveStoryMatch
  };
}
