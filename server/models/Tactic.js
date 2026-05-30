import mongoose from "mongoose";

const tacticSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true },
    difficulty: { type: String, default: "easy" },
    levelRequired: { type: Number, default: 1 },
    rewardCoins: { type: Number, default: 50 },
    unlockedByDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Tactic", tacticSchema);
