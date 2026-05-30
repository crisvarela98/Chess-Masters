import express from "express";
import Tactic from "../models/Tactic.js";

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    res.json(await Tactic.find().sort({ levelRequired: 1 }));
  } catch (error) {
    next(error);
  }
});

router.use((error, _req, res, _next) => {
  res.status(500).json({ message: error.message });
});

export default router;
