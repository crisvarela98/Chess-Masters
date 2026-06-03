import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    googleId: { type: String, unique: true, sparse: true },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    passwordHash: { type: String, select: false },
    avatar: { type: String, default: "king" },
    age: { type: Number, min: 6 },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    xpToNextLevel: { type: Number, default: 500 },
    coins: { type: Number, default: 5000 },
    diamonds: { type: Number, default: 15 },
    league: { type: String, default: "Bronce III" },
    unlockedTactics: [{ type: String }],
    completedMissions: [{ type: String }],
    storyProgress: { type: mongoose.Schema.Types.Mixed, default: {} },
    favoriteOpponents: [
      {
        username: { type: String, required: true },
        addedAt: { type: Date, default: Date.now }
      }
    ],
    claimedLevelRewards: [{ type: Number }],
    lastDailyRewardAt: { type: Date, default: null },
    stats: {
      matches: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      totalPlaySeconds: { type: Number, default: 0 },
      lastSessionSeconds: { type: Number, default: 0 },
      totalSessions: { type: Number, default: 0 }
    },
    sessions: [
      {
        startedAt: { type: Date, required: true },
        endedAt: { type: Date, required: true },
        durationSeconds: { type: Number, required: true, min: 1 }
      }
    ],
    recentMatches: [
      {
        mode: { type: String, required: true },
        opponent: { type: String, required: true },
        result: { type: String, enum: ["win", "loss", "draw"], required: true },
        playedAt: { type: Date, required: true },
        summary: { type: String, default: "" },
        rewardCoins: { type: Number, default: 0 },
        rewardXp: { type: Number, default: 0 },
        rewardVideoBonus: { type: Number, default: 0 }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
