import express from "express";
import User from "../models/User.js";
import { levelFromXp, rewardFor } from "../controllers/progression.js";

const router = express.Router();

router.get("/demo", async (_req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { username: "Cristian" },
      {
        $setOnInsert: {
          username: "Cristian",
          avatar: "C",
          level: 7,
          xp: 12450,
          coins: 12450,
          diamonds: 330,
          league: "Bronce II",
          unlockedTactics: ["Horquilla"],
          stats: { matches: 150, wins: 68, streak: 7 }
        }
      },
      { new: true, upsert: true }
    );

    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.post("/progress", async (req, res, next) => {
  try {
    const { userId, type = "win", tactic } = req.body;
    const reward = rewardFor(type);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.coins += reward.coins;
    user.xp += reward.xp;
    user.level = levelFromXp(user.xp);
    const unlocked = tactic || reward.tactic;
    if (unlocked && !user.unlockedTactics.includes(unlocked)) {
      user.unlockedTactics.push(unlocked);
    }

    await user.save();
    res.json({ user, reward });
  } catch (error) {
    next(error);
  }
});

router.use((error, _req, res, _next) => {
  res.status(500).json({ message: error.message });
});

export default router;
