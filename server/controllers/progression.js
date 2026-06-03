export function levelFromXp(xp) {
  let level = 1;
  while (xp >= level * 500) {
    xp -= level * 500;
    level += 1;
  }
  return level;
}

export function xpToNextLevel(level) {
  return Math.max(500, level * 500);
}

export function rewardFor(type) {
  const rewards = {
    win: { coins: 50, xp: 100 },
    puzzle: { coins: 25, xp: 50 },
    ftue: { coins: 200, xp: 200, tactic: "Horquilla" }
  };

  return rewards[type] || { coins: 0, xp: 0 };
}
