import mongoose from "mongoose";

const missionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    rewardCoins: { type: Number, default: 25 },
    rewardXp: { type: Number, default: 50 },
    type: { type: String, required: true },
    goal: { type: Number, default: 1 }
  },
  { timestamps: true }
);

export default mongoose.model("Mission", missionSchema);
