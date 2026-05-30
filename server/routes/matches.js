import express from "express";
import Match from "../models/Match.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const match = await Match.create(req.body);
    res.status(201).json(match);
  } catch (error) {
    next(error);
  }
});

router.get("/:userId", async (req, res, next) => {
  try {
    const matches = await Match.find({ players: req.params.userId }).sort({ createdAt: -1 }).limit(30);
    res.json(matches);
  } catch (error) {
    next(error);
  }
});

router.use((error, _req, res, _next) => {
  res.status(500).json({ message: error.message });
});

export default router;
