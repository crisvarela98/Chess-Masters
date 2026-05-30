import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    avatar: { type: String, default: "C" },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    diamonds: { type: Number, default: 0 },
    league: { type: String, default: "Bronce III" },
    unlockedTactics: [{ type: String }],
    completedMissions: [{ type: String }],
    stats: {
      matches: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      streak: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
