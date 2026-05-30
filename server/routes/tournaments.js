import express from "express";
import Tournament from "../models/Tournament.js";

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    res.json(await Tournament.find().sort({ reward: 1 }));
  } catch (error) {
    next(error);
  }
});

router.use((error, _req, res, _next) => {
  res.status(500).json({ message: error.message });
});

export default router;
