import mongoose from "mongoose";

const tournamentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    league: { type: String, required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reward: { type: Number, default: 100 },
    status: { type: String, default: "open" }
  },
  { timestamps: true }
);

export default mongoose.model("Tournament", tournamentSchema);
