export default function registerGameSockets(io) {
  const onlineUsers = new Map();
  const rooms = new Map();

  function emitUserList() {
    io.emit("userList", Array.from(onlineUsers.values()));
  }

  function normalizeRoomId(roomId) {
    return String(roomId || "").trim().toUpperCase();
  }

  function publicRoom(roomId, room) {
    return {
      roomId,
      players: room.players.map((player) => ({ username: player.username, color: player.color }))
    };
  }

  function removeSocketFromRooms(socket) {
    for (const [roomId, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex((player) => player.socketId === socket.id);
      if (playerIndex === -1) continue;

      room.players.splice(playerIndex, 1);
      socket.to(roomId).emit("roomClosed", { roomId, reason: "El rival se desconecto." });
      socket.to(roomId).emit("playerDisconnected", { roomId });

      if (room.players.length === 0) {
        rooms.delete(roomId);
      }
    }
  }

  io.on("connection", (socket) => {
    socket.on("userOnline", ({ username }) => {
      if (!username) return;
      onlineUsers.set(socket.id, String(username));
      emitUserList();
    });

    socket.on("createRoom", ({ roomId, player }) => {
      const normalizedRoomId = normalizeRoomId(roomId);
      const username = String(player || onlineUsers.get(socket.id) || "Jugador");

      if (!normalizedRoomId) {
        socket.emit("roomError", { message: "Codigo de sala invalido." });
        return;
      }

      if (rooms.has(normalizedRoomId)) {
        socket.emit("roomError", { message: "Esa sala ya existe. Genera otro codigo." });
        return;
      }

      removeSocketFromRooms(socket);
      socket.join(normalizedRoomId);
      rooms.set(normalizedRoomId, {
        hostSocketId: socket.id,
        players: [{ socketId: socket.id, username, color: "white" }]
      });

      socket.emit("roomCreated", { roomId: normalizedRoomId, player: username, color: "white" });
    });

    socket.on("joinRoom", ({ roomId, player }) => {
      const normalizedRoomId = normalizeRoomId(roomId);
      const username = String(player || onlineUsers.get(socket.id) || "Jugador");
      const room = rooms.get(normalizedRoomId);

      if (!room) {
        socket.emit("roomError", { message: "No existe una sala con ese codigo." });
        return;
      }

      if (room.players.some((roomPlayer) => roomPlayer.socketId === socket.id)) {
        socket.emit("joinedRoom", publicRoom(normalizedRoomId, room));
        return;
      }

      if (room.players.length >= 2) {
        socket.emit("roomError", { message: "Esa sala ya esta completa." });
        return;
      }

      removeSocketFromRooms(socket);
      socket.join(normalizedRoomId);
      room.players.push({ socketId: socket.id, username, color: "black" });

      socket.emit("joinedRoom", publicRoom(normalizedRoomId, room));
      socket.to(normalizedRoomId).emit("playerJoined", { roomId: normalizedRoomId, player: username });
      io.to(normalizedRoomId).emit("roomReady", publicRoom(normalizedRoomId, room));
    });

    socket.on("movePiece", ({ roomId, move, fen }) => {
      const normalizedRoomId = normalizeRoomId(roomId);
      const room = rooms.get(normalizedRoomId);

      if (!room || !room.players.some((player) => player.socketId === socket.id)) {
        socket.emit("roomError", { message: "No estas dentro de esa sala." });
        return;
      }

      socket.to(normalizedRoomId).emit("opponentMove", { roomId: normalizedRoomId, move, fen });
    });

    socket.on("gameOver", ({ roomId, result }) => {
      const normalizedRoomId = normalizeRoomId(roomId);
      io.to(normalizedRoomId).emit("gameOver", { roomId: normalizedRoomId, result });
      rooms.delete(normalizedRoomId);
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.id);
      removeSocketFromRooms(socket);
      emitUserList();
    });
  });
}
