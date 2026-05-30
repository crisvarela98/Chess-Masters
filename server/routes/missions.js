import express from "express";
import Mission from "../models/Mission.js";

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    res.json(await Mission.find().sort({ rewardXp: 1 }));
  } catch (error) {
    next(error);
  }
});

router.use((error, _req, res, _next) => {
  res.status(500).json({ message: error.message });
});

export default router;
