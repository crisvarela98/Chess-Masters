import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import path from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import matchRoutes from "./routes/matches.js";
import missionRoutes from "./routes/missions.js";
import tacticRoutes from "./routes/tactics.js";
import tournamentRoutes from "./routes/tournaments.js";
import userRoutes from "./routes/users.js";
import registerGameSockets from "./sockets/gameSocket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 4000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({ origin: clientUrl }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "CHESS MASTERS API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/tactics", tacticRoutes);
app.use("/api/missions", missionRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/tournaments", tournamentRoutes);

const io = new Server(server, {
  cors: { origin: clientUrl, methods: ["GET", "POST"] }
});

registerGameSockets(io);

async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI is missing. API will start without database connection.");
    return;
  } else {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");
  }
}

async function start() {
  server.listen(port, () => {
    console.log(`CHESS MASTERS API running on http://localhost:${port}`);
  });

  connectDatabase().catch((error) => {
    console.warn("MongoDB connection failed. API is running without database connection.");
    console.warn(error.message);
  });
}

start().catch((error) => {
  console.error("Server failed to start", error);
  process.exit(1);
});
