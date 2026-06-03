export function levelProgress(profile) {
  return Math.min(100, Math.round((profile.xp / profile.xpToNextLevel) * 100));
}

export function resolveLevelFromXp(totalXp) {
  let remaining = totalXp;
  let level = 1;
  while (remaining >= level * 500) {
    remaining -= level * 500;
    level += 1;
  }
  return { level, xpToNextLevel: level * 500 };
}

export function applyLocalProgress(prev, deltaXp = 0, deltaCoins = 0, deltaDiamonds = 0, extra = {}) {
  const xp = prev.xp + deltaXp;
  const levelData = resolveLevelFromXp(xp);
  return {
    ...prev,
    ...extra,
    xp,
    level: levelData.level,
    xpToNextLevel: levelData.xpToNextLevel,
    coins: prev.coins + deltaCoins,
    diamonds: prev.diamonds + deltaDiamonds
  };
}

export function sameUtcDay(left, right) {
  return left.getUTCFullYear() === right.getUTCFullYear() && left.getUTCMonth() === right.getUTCMonth() && left.getUTCDate() === right.getUTCDate();
}

export function cleanRecentMatches(matches) {
  return (matches || []).filter((match) => Date.now() - new Date(match.playedAt).getTime() < 2 * 24 * 60 * 60 * 1000);
}

export function generateLevelRewards() {
  return Array.from({ length: 50 }, (_, index) => {
    const level = index + 1;
    return {
      level,
      title: `Rango ${level}`,
      subtitle: level % 10 === 0 ? "Cofre imperial" : level % 5 === 0 ? "Tesoro de ascenso" : "Botin del tablero",
      coins: 150 + level * 45,
      diamonds: level % 5 === 0 ? 3 : 1,
      xp: 40 + level * 12
    };
  });
}
