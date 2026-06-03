import { player as initialPlayer } from "../data/gameData.js";
import { avatarOptions } from "../constants/appConstants.js";
import { cleanRecentMatches } from "./profileUtils.js";

export function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function findAvatarOption(avatarId) {
  return avatarOptions.find((option) => option.id === avatarId) || null;
}

export function normalizeProfileFromUser(user) {
  return {
    ...initialPlayer,
    ...user,
    userId: user._id,
    avatar: user.avatar || initialPlayer.avatar,
    xpToNextLevel: user.xpToNextLevel || initialPlayer.xpToNextLevel,
    tacticsUnlocked: user.unlockedTactics?.length || initialPlayer.tacticsUnlocked,
    claimedLevelRewards: user.claimedLevelRewards || [],
    storyProgress: user.storyProgress || {},
    recentMatches: cleanRecentMatches(user.recentMatches || []),
    stats: { ...initialPlayer.stats, ...(user.stats || {}) }
  };
}

export function localMatchReward(mode, result) {
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
