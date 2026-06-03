import User from "../models/User.js";

export default function registerGameSockets(io) {
  const onlineUsers = new Map();
  const duelRooms = new Map();
  const tournamentRooms = new Map();
  const matchRooms = new Map();

  function emitUserList() {
    io.emit("userList", Array.from(onlineUsers.values()));
  }

  function normalizeRoomId(roomId) {
    return String(roomId || "").trim().toUpperCase();
  }

  async function ensureOnlineUser(username) {
    const cleanUsername = String(username || "").trim();
    if (!cleanUsername) return;
    await User.findOneAndUpdate(
      { username: cleanUsername },
      {
        $setOnInsert: {
          username: cleanUsername,
          avatar: "king",
          coins: 5000,
          diamonds: 15,
          level: 1,
          xp: 0,
          xpToNextLevel: 500,
          league: "Bronce III",
          unlockedTactics: ["Horquilla"],
          stats: { matches: 0, wins: 0, streak: 0, totalPlaySeconds: 0, lastSessionSeconds: 0, totalSessions: 0 }
        }
      },
      { upsert: true }
    );
  }

  function publicPlayers(room) {
    return room.players.map((player) => ({
      username: player.username,
      color: player.color
    }));
  }

  function lobbySnapshot(roomId, room) {
    return {
      roomId,
      maxPlayers: room.maxPlayers,
      started: Boolean(room.started),
      hostSocketId: room.hostSocketId,
      players: publicPlayers(room)
    };
  }

  function getRoom(socketId) {
    for (const [roomId, room] of duelRooms.entries()) {
      if (room.players.some((player) => player.socketId === socketId)) return { type: "duel", roomId, room };
    }
    for (const [roomId, room] of matchRooms.entries()) {
      if (room.players.some((player) => player.socketId === socketId)) return { type: "match", roomId, room };
    }
    for (const [roomId, room] of tournamentRooms.entries()) {
      if (room.players.some((player) => player.socketId === socketId)) return { type: "tournament", roomId, room };
    }
    return null;
  }

  function removeSocketFromLobby(socket, rooms, roomType) {
    for (const [roomId, room] of rooms.entries()) {
      const index = room.players.findIndex((player) => player.socketId === socket.id);
      if (index === -1) continue;

      room.players.splice(index, 1);
      socket.to(roomId).emit("roomClosed", { roomId, reason: "El rival se desconecto." });

      if (roomType === "tournament") {
        io.to(roomId).emit("tournamentLobbyUpdated", lobbySnapshot(roomId, room));
      }

      const shouldDelete =
        room.players.length === 0 ||
        roomType === "match" ||
        roomType === "duel" ||
        (roomType === "tournament" && room.hostSocketId === socket.id);

      if (shouldDelete) {
        rooms.delete(roomId);
      }
    }
  }

  function removeSocketEverywhere(socket) {
    removeSocketFromLobby(socket, duelRooms, "duel");
    removeSocketFromLobby(socket, tournamentRooms, "tournament");
    removeSocketFromLobby(socket, matchRooms, "match");
  }

  function createMatchRoom(tournamentRoomId, index, playerA, playerB) {
    const matchRoomId = `${tournamentRoomId}-M${index + 1}`;
    const players = [
      { socketId: playerA.socketId, username: playerA.username, color: "white" },
      { socketId: playerB.socketId, username: playerB.username, color: "black" }
    ];

    matchRooms.set(matchRoomId, {
      kind: "match",
      tournamentRoomId,
      players
    });

    const payloadA = {
      roomId: matchRoomId,
      tournamentRoomId,
      opponent: playerB.username,
      isWhite: true,
      players: publicPlayers({ players })
    };
    const payloadB = {
      roomId: matchRoomId,
      tournamentRoomId,
      opponent: playerA.username,
      isWhite: false,
      players: publicPlayers({ players })
    };

    const socketA = io.sockets.sockets.get(playerA.socketId);
    const socketB = io.sockets.sockets.get(playerB.socketId);
    socketA?.join(matchRoomId);
    socketB?.join(matchRoomId);
    io.to(playerA.socketId).emit("tournamentMatchReady", payloadA);
    io.to(playerB.socketId).emit("tournamentMatchReady", payloadB);
  }

  function startTournament(roomId) {
    const tournament = tournamentRooms.get(roomId);
    if (!tournament || tournament.started) return false;
    if (tournament.players.length < 3) return false;

    const shuffled = [...tournament.players];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    tournament.started = true;
    tournament.round = 1;
    tournament.pairings = [];

    for (let index = 0; index < shuffled.length; index += 2) {
      const playerA = shuffled[index];
      const playerB = shuffled[index + 1];

      if (!playerB) {
        io.to(playerA.socketId).emit("tournamentBye", {
          roomId,
          message: "Pasas de ronda por bye."
        });
        continue;
      }

      tournament.pairings.push([playerA.username, playerB.username]);
      createMatchRoom(roomId, index / 2, playerA, playerB);
    }

    io.to(roomId).emit("tournamentStarted", lobbySnapshot(roomId, tournament));
    return true;
  }

  io.on("connection", (socket) => {
    socket.on("userOnline", ({ username }) => {
      if (!username) return;
      onlineUsers.set(socket.id, username);
      ensureOnlineUser(username).catch(() => {});
      emitUserList();
    });

    socket.on("createRoom", ({ roomId, player }) => {
      const normalizedRoomId = normalizeRoomId(roomId);
      const username = String(player || onlineUsers.get(socket.id) || "Jugador");

      if (!normalizedRoomId) {
        socket.emit("roomError", { message: "Codigo de sala invalido." });
        return;
      }

      if (duelRooms.has(normalizedRoomId)) {
        socket.emit("roomError", { message: "Esa sala ya existe. Genera otro codigo." });
        return;
      }

      removeSocketEverywhere(socket);
      socket.join(normalizedRoomId);
      duelRooms.set(normalizedRoomId, {
        kind: "duel",
        hostSocketId: socket.id,
        players: [{ socketId: socket.id, username, color: "white" }]
      });

      socket.emit("roomCreated", { roomId: normalizedRoomId, player: username, color: "white" });
    });

    socket.on("joinRoom", ({ roomId, player }) => {
      const normalizedRoomId = normalizeRoomId(roomId);
      const username = String(player || onlineUsers.get(socket.id) || "Jugador");
      const room = duelRooms.get(normalizedRoomId);

      if (!room) {
        socket.emit("roomError", { message: "No existe una sala con ese codigo." });
        return;
      }

      if (room.players.some((roomPlayer) => roomPlayer.socketId === socket.id)) {
        socket.emit("joinedRoom", {
          roomId: normalizedRoomId,
          players: publicPlayers(room)
        });
        return;
      }

      if (room.players.length >= 2) {
        socket.emit("roomError", { message: "Esa sala ya esta completa." });
        return;
      }

      removeSocketEverywhere(socket);
      socket.join(normalizedRoomId);
      room.players.push({ socketId: socket.id, username, color: "black" });

      socket.emit("joinedRoom", {
        roomId: normalizedRoomId,
        players: publicPlayers(room)
      });
      socket.to(normalizedRoomId).emit("playerJoined", { roomId: normalizedRoomId, player: username });
      io.to(normalizedRoomId).emit("roomReady", {
        roomId: normalizedRoomId,
        players: publicPlayers(room)
      });
    });

    socket.on("createTournamentRoom", ({ roomId, player, maxPlayers }) => {
      const normalizedRoomId = normalizeRoomId(roomId);
      const username = String(player || onlineUsers.get(socket.id) || "Jugador");
      const capacity = Math.min(16, Math.max(3, Number(maxPlayers) || 3));

      if (!normalizedRoomId) {
        socket.emit("roomError", { message: "Codigo de torneo invalido." });
        return;
      }
      if (tournamentRooms.has(normalizedRoomId) || duelRooms.has(normalizedRoomId)) {
        socket.emit("roomError", { message: "Ese codigo ya esta en uso." });
        return;
      }

      removeSocketEverywhere(socket);
      socket.join(normalizedRoomId);
      tournamentRooms.set(normalizedRoomId, {
        kind: "tournament",
        hostSocketId: socket.id,
        maxPlayers: capacity,
        started: false,
        players: [{ socketId: socket.id, username, color: "host" }],
        pairings: [],
        round: 0
      });

      socket.emit("tournamentCreated", lobbySnapshot(normalizedRoomId, tournamentRooms.get(normalizedRoomId)));
      io.to(normalizedRoomId).emit("tournamentLobbyUpdated", lobbySnapshot(normalizedRoomId, tournamentRooms.get(normalizedRoomId)));
    });

    socket.on("joinTournamentRoom", ({ roomId, player }) => {
      const normalizedRoomId = normalizeRoomId(roomId);
      const username = String(player || onlineUsers.get(socket.id) || "Jugador");
      const room = tournamentRooms.get(normalizedRoomId);

      if (!room) {
        socket.emit("roomError", { message: "No existe un torneo con ese codigo." });
        return;
      }
      if (room.started) {
        socket.emit("roomError", { message: "Ese torneo ya empezo." });
        return;
      }
      if (room.players.length >= room.maxPlayers) {
        socket.emit("roomError", { message: "Ese torneo ya llego al limite de jugadores." });
        return;
      }
      if (room.players.some((roomPlayer) => roomPlayer.socketId === socket.id)) {
        socket.emit("joinedRoom", lobbySnapshot(normalizedRoomId, room));
        return;
      }

      removeSocketEverywhere(socket);
      socket.join(normalizedRoomId);
      room.players.push({ socketId: socket.id, username, color: "guest" });

      socket.emit("joinedRoom", lobbySnapshot(normalizedRoomId, room));
      socket.to(normalizedRoomId).emit("tournamentLobbyUpdated", lobbySnapshot(normalizedRoomId, room));
      io.to(normalizedRoomId).emit("tournamentLobbyUpdated", lobbySnapshot(normalizedRoomId, room));
    });

    socket.on("startTournament", ({ roomId }) => {
      const normalizedRoomId = normalizeRoomId(roomId);
      const room = tournamentRooms.get(normalizedRoomId);

      if (!room) {
        socket.emit("roomError", { message: "No existe el torneo." });
        return;
      }
      if (room.hostSocketId !== socket.id) {
        socket.emit("roomError", { message: "Solo el anfitrion puede iniciar el torneo." });
        return;
      }
      if (room.players.length < 3) {
        socket.emit("roomError", { message: "Necesitas al menos 3 jugadores para comenzar." });
        return;
      }

      const started = startTournament(normalizedRoomId);
      if (!started) {
        socket.emit("roomError", { message: "No se pudo iniciar el torneo." });
      }
    });

    socket.on("movePiece", ({ roomId, move, fen }) => {
      const normalizedRoomId = normalizeRoomId(roomId);
      const duelRoom = duelRooms.get(normalizedRoomId);
      const matchRoom = matchRooms.get(normalizedRoomId);
      const room = duelRoom || matchRoom;

      if (!room || !room.players.some((player) => player.socketId === socket.id)) {
        socket.emit("roomError", { message: "No estas dentro de esa sala." });
        return;
      }

      socket.to(normalizedRoomId).emit("opponentMove", { roomId: normalizedRoomId, move, fen });
    });

    socket.on("gameOver", ({ roomId, result }) => {
      const normalizedRoomId = normalizeRoomId(roomId);
      const room = duelRooms.get(normalizedRoomId) || matchRooms.get(normalizedRoomId);
      if (!room) return;

      socket.to(normalizedRoomId).emit("gameOver", { roomId: normalizedRoomId, result });
      if (room.tournamentRoomId) {
        io.to(room.tournamentRoomId).emit("tournamentMatchComplete", {
          roomId: normalizedRoomId,
          result
        });
      }
      duelRooms.delete(normalizedRoomId);
      matchRooms.delete(normalizedRoomId);
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.id);
      removeSocketEverywhere(socket);
      emitUserList();
    });
  });
}
