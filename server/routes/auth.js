import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import { sendWelcomeEmail } from "../services/mailer.js";

const router = express.Router();

function normalizeUsername(value) {
  const cleaned = (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, 16);
  return cleaned || `jugador${Math.floor(1000 + Math.random() * 9000)}`;
}

async function buildUniqueUsername(baseName) {
  const base = normalizeUsername(baseName);
  let username = base;
  let suffix = 1;

  while (await User.exists({ username })) {
    username = `${base}${suffix}`;
    suffix += 1;
  }

  return username;
}

function databaseReady() {
  return mongoose.connection.readyState === 1;
}

function baseUserPayload({ username, email, age }) {
  const numericAge = Number(age);
  return {
    username,
    email,
    authProvider: "local",
    age: Number.isFinite(numericAge) && numericAge >= 6 ? numericAge : undefined,
    avatar: "king",
    level: 1,
    xp: 0,
    xpToNextLevel: 500,
    coins: 5000,
    diamonds: 15,
    league: "Bronce III",
    unlockedTactics: ["Horquilla"],
    claimedLevelRewards: [],
    stats: { matches: 0, wins: 0, streak: 0, totalPlaySeconds: 0, lastSessionSeconds: 0, totalSessions: 0 }
  };
}

router.post("/register", async (req, res, next) => {
  try {
    if (!databaseReady()) {
      return res.status(503).json({ message: "Base de datos no conectada. Activa MongoDB para registrar usuarios." });
    }

    const { username, email, age } = req.body;
    const normalizedEmail = String(email || "").toLowerCase().trim();

    if (!normalizedEmail.includes("@")) {
      return res.status(400).json({ message: "Email invalido." });
    }
    if (String(username || "").trim().length < 2) {
      return res.status(400).json({ message: "El usuario debe tener al menos 2 caracteres." });
    }

    const existingByEmail = await User.findOne({ email: normalizedEmail });
    if (existingByEmail) {
      return res.status(409).json({ message: "Ese email ya esta registrado." });
    }

    const resolvedUsername = await buildUniqueUsername(String(username || "").trim() || normalizedEmail.split("@")[0]);

    const user = await User.create(
      baseUserPayload({
        username: resolvedUsername,
        email: normalizedEmail,
        age
      })
    );

    const mail = await sendWelcomeEmail({ to: user.email, username: user.username }).catch(() => ({ sent: false, reason: "smtp_error" }));

    return res.json({ user, mail });
  } catch (error) {
    return next(error);
  }
});

router.use((error, _req, res, _next) => {
  res.status(500).json({ message: error.message });
});

export default router;
