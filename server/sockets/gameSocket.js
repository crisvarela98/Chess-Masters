export default function registerGameSockets(io) {
  io.on("connection", (socket) => {
    socket.on("createRoom", ({ roomId, player }) => {
      socket.join(roomId);
      socket.emit("roomCreated", { roomId, player });
    });

    socket.on("joinRoom", ({ roomId, player }) => {
      socket.join(roomId);
      socket.to(roomId).emit("playerJoined", { player });
      io.to(roomId).emit("roomReady", { roomId });
    });

    socket.on("movePiece", ({ roomId, move, fen }) => {
      socket.to(roomId).emit("opponentMove", { move, fen });
    });

    socket.on("gameOver", ({ roomId, result }) => {
      io.to(roomId).emit("gameOver", { result });
    });

    socket.on("disconnect", () => {
      socket.broadcast.emit("playerDisconnected", { socketId: socket.id });
    });
  });
}
