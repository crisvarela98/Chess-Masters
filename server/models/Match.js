import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    moves: [{ san: String, from: String, to: String, color: String }],
    result: { type: String, default: "pending" },
    mode: { type: String, default: "ai" }
  },
  { timestamps: true }
);

export default mongoose.model("Match", matchSchema);
