import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { sendWelcomeEmail } from "../services/mailer.js";

const router = express.Router();

function getGoogleClientConfig() {
  const googleClientId = String(process.env.GOOGLE_CLIENT_ID || "").trim();
  if (!googleClientId) return { googleClientId: "", googleClient: null };
  return { googleClientId, googleClient: new OAuth2Client(googleClientId) };
}

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

function baseUserPayload({ username, email, age, provider, googleId, passwordHash }) {
  const numericAge = Number(age);
  return {
    username,
    email,
    googleId,
    passwordHash,
    authProvider: provider,
    age: Number.isFinite(numericAge) && numericAge >= 6 ? numericAge : undefined,
    avatar: username.charAt(0).toUpperCase(),
    level: 1,
    xp: 0,
    coins: 500,
    diamonds: 30,
    league: "Bronce III",
    unlockedTactics: ["Horquilla"],
    stats: { matches: 0, wins: 0, streak: 0 }
  };
}

router.post("/register", async (req, res, next) => {
  try {
    if (!databaseReady()) {
      return res.status(503).json({ message: "Base de datos no conectada. Activa MongoDB para registrar usuarios." });
    }

    const { username, email, password, age } = req.body;
    const normalizedEmail = String(email || "").toLowerCase().trim();
    const rawPassword = String(password || "");

    if (!normalizedEmail.includes("@")) {
      return res.status(400).json({ message: "Email invalido." });
    }
    if (rawPassword.length < 6) {
      return res.status(400).json({ message: "La contrasena debe tener al menos 6 caracteres." });
    }

    const existingByEmail = await User.findOne({ email: normalizedEmail });
    if (existingByEmail) {
      return res.status(409).json({ message: "Ese email ya esta registrado." });
    }

    const resolvedUsername = await buildUniqueUsername(String(username || "").trim() || normalizedEmail.split("@")[0]);
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const user = await User.create(
      baseUserPayload({
        username: resolvedUsername,
        email: normalizedEmail,
        age,
        provider: "local",
        passwordHash
      })
    );

    const mail = await sendWelcomeEmail({ to: user.email, username: user.username }).catch(() => ({ sent: false, reason: "smtp_error" }));

    return res.json({ user, mail });
  } catch (error) {
    return next(error);
  }
});

router.post("/google", async (req, res, next) => {
  try {
    const { googleClientId, googleClient } = getGoogleClientConfig();
    if (!googleClient) {
      return res.status(500).json({ message: "GOOGLE_CLIENT_ID no configurado en backend." });
    }

    if (!databaseReady()) {
      return res.status(503).json({ message: "Base de datos no conectada. Activa MongoDB para login con Google." });
    }

    const { credential, age, preferredUsername } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Credential de Google faltante." });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId
    });
    const payload = ticket.getPayload();

    if (!payload?.email || payload.email_verified !== true) {
      return res.status(401).json({ message: "Google no devolvio email verificado." });
    }

    const email = payload.email.toLowerCase();
    let isNewUser = false;
    let user = await User.findOne({ email });

    if (!user) {
      isNewUser = true;
      const username = await buildUniqueUsername(
        preferredUsername?.trim() || payload.given_name || payload.name || email.split("@")[0]
      );

      user = await User.create(
        baseUserPayload({
          username,
          email,
          googleId: payload.sub,
          age,
          provider: "google"
        })
      );
    } else {
      user.googleId = payload.sub;
      user.authProvider = "google";
      const numericAge = Number(age);
      if (Number.isFinite(numericAge) && numericAge >= 6) {
        user.age = numericAge;
      }
      await user.save();
    }

    let mail = { sent: false, reason: "not_new_user" };
    if (isNewUser) {
      mail = await sendWelcomeEmail({ to: user.email, username: user.username }).catch(() => ({ sent: false, reason: "smtp_error" }));
    }

    return res.json({
      user,
      mail,
      google: {
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      }
    });
  } catch (error) {
    if (String(error?.message || "").toLowerCase().includes("token used too late")) {
      return res.status(401).json({ message: "La sesion de Google expiro. Vuelve a intentar." });
    }
    return next(error);
  }
});

router.use((error, _req, res, _next) => {
  res.status(500).json({ message: error.message });
});

export default router;
