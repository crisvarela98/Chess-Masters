import dotenv from "dotenv";
import mongoose from "mongoose";
import Mission from "../models/Mission.js";
import Tactic from "../models/Tactic.js";
import Tournament from "../models/Tournament.js";
import User from "../models/User.js";

dotenv.config();

const tactics = [
  ["Horquilla", "Ataca dos piezas a la vez.", "fork", "easy", 1, 100, true],
  ["Clavada", "Inmoviliza una pieza que protege algo importante.", "pin", "easy", 2, 120, true],
  ["Descubierto", "Mueve una pieza para revelar un ataque.", "discovered", "medium", 3, 140, false],
  ["Mate Pastor", "Patron inicial para atacar f7.", "mate", "easy", 4, 160, false],
  ["Jaque doble", "Dos piezas atacan al rey al mismo tiempo.", "double-check", "medium", 5, 190, false],
  ["Desviacion", "Obliga al defensor a abandonar su casilla.", "deflection", "medium", 6, 220, false]
];

const missions = [
  ["Juega 1 partida", "Completa una partida contra IA u online.", 50, 100, "play", 1],
  ["Gana 1 partida", "Consigue una victoria.", 100, 150, "win", 1],
  ["Resuelve 3 puzzles", "Completa tres desafios tacticos.", 75, 100, "puzzle", 3],
  ["Aprende una maniobra", "Termina una leccion tactica.", 80, 120, "learn", 1],
  ["Gana con jaque mate", "Finaliza una partida con mate.", 150, 200, "checkmate", 1]
];

const tournaments = [
  ["Copa Principiantes", "Bronce", 100, "open"],
  ["Liga de Bronce", "Bronce", 250, "open"],
  ["Copa de Plata", "Plata", 500, "locked"],
  ["Campeonato de Oro", "Oro", 900, "locked"],
  ["Gran Maestros", "Elite", 2000, "locked"]
];

async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required. Copy .env.example to .env first.");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all([User.deleteMany({}), Tactic.deleteMany({}), Mission.deleteMany({}), Tournament.deleteMany({})]);

  await User.create({
    username: "Cristian",
    avatar: "C",
    level: 7,
    xp: 12450,
    coins: 12450,
    diamonds: 330,
    league: "Bronce II",
    unlockedTactics: ["Horquilla", "Clavada"],
    completedMissions: [],
    stats: { matches: 150, wins: 68, streak: 7 }
  });

  await Tactic.insertMany(
    tactics.map(([name, description, type, difficulty, levelRequired, rewardCoins, unlockedByDefault]) => ({
      name,
      description,
      type,
      difficulty,
      levelRequired,
      rewardCoins,
      unlockedByDefault
    }))
  );

  await Mission.insertMany(
    missions.map(([title, description, rewardCoins, rewardXp, type, goal]) => ({
      title,
      description,
      rewardCoins,
      rewardXp,
      type,
      goal
    }))
  );

  await Tournament.insertMany(
    tournaments.map(([name, league, reward, status]) => ({
      name,
      league,
      reward,
      status
    }))
  );

  await mongoose.disconnect();
  console.log("Seed completed");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
