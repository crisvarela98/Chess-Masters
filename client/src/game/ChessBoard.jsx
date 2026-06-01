import { Chess } from "chess.js";
import { useEffect, useMemo, useState } from "react";
import { Lightbulb, Pause, RotateCcw, ShieldAlert } from "lucide-react";
import { getCoachAdvice, pickAiMove } from "./chessCoach.js";

const pieceTypeClass = { p: "pawn", r: "rook", n: "knight", b: "bishop", q: "queen", k: "king" };

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

function squareName(row, col) {
  return `${files[col]}${8 - row}`;
}

export default function ChessBoard({
  compact = false,
  aiStrength = 2,
  playerName = "Cristian",
  opponentName = "AlexG195",
  mode = "ai",
  socket = null,
  roomId = "",
  isWhite = true,
  onMatchComplete
}) {
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("Toca una pieza blanca para jugar.");
  const [lastMove, setLastMove] = useState(null);
  const [, forceTick] = useState(0);

  const legalTargets = useMemo(() => {
    if (!selected) return [];
    return game.moves({ square: selected, verbose: true }).map((move) => move.to);
  }, [game, selected]);

  const board = game.board();
  const coach = getCoachAdvice(game, lastMove);
  const myColor = isWhite ? "w" : "b";
  const canPlayColor = game.turn() === myColor;

  function refresh(nextGame, nextHistory) {
    setGame(nextGame);
    setHistory(nextHistory);
    forceTick((value) => value + 1);
  }

  function makeAiMove(nextGame, nextHistory) {
    if (nextGame.isGameOver()) return;
    const aiMove = pickAiMove(nextGame, aiStrength);
    if (!aiMove) return;
    const played = nextGame.move({ from: aiMove.from, to: aiMove.to, promotion: "q" });
    const updated = [...nextHistory, played];
    setLastMove(played);
    setMessage(played.captured ? "La IA capturo material. Busca una respuesta activa." : "Turno blanco.");
    refresh(nextGame, updated);
  }

  function finishIfNeeded(nextGame) {
    if (!nextGame.isGameOver()) return;
    const winner = nextGame.isCheckmate() ? (nextGame.turn() === "w" ? "black" : "white") : "draw";
    if (onMatchComplete) onMatchComplete(winner);
  }

  useEffect(() => {
    if (mode !== "online" || !socket) return undefined;

    function onOpponentMove({ roomId: payloadRoom, move }) {
      if (payloadRoom !== roomId || !move) return;
      const nextGame = new Chess(game.fen());
      const played = nextGame.move(move);
      if (!played) return;
      const nextHistory = [...history, played];
      setLastMove(played);
      setSelected(null);
      setMessage("Turno propio.");
      refresh(nextGame, nextHistory);
      finishIfNeeded(nextGame);
    }

    socket.on("opponentMove", onOpponentMove);
    return () => socket.off("opponentMove", onOpponentMove);
  }, [socket, mode, roomId, game, history]);

  useEffect(() => {
    if (mode !== "online") return;
    setMessage(canPlayColor ? "Tu turno." : "Turno rival.");
  }, [mode, canPlayColor]);

  function handleSquareClick(square) {
    if (game.isGameOver()) return;
    if (mode === "online" && !canPlayColor) return;

    const piece = game.get(square);

    if (!selected && piece?.color === game.turn()) {
      setSelected(square);
      setMessage("Elige una casilla iluminada.");
      return;
    }

    if (selected) {
      const nextGame = new Chess(game.fen());
      const played = nextGame.move({ from: selected, to: square, promotion: "q" });
      if (!played) {
        setSelected(piece?.color === game.turn() ? square : null);
        setMessage(piece?.color === game.turn() ? "Nueva pieza seleccionada." : "Movimiento no legal.");
        return;
      }

      const nextHistory = [...history, played];
      setSelected(null);
      setLastMove(played);
      setMessage(played.san.includes("#") ? "Jaque mate. Victoria brillante." : "Buena jugada.");
      refresh(nextGame, nextHistory);
      finishIfNeeded(nextGame);

      if (mode === "online" && socket && roomId) {
        socket.emit("movePiece", { roomId, move: { from: played.from, to: played.to, promotion: "q" }, fen: nextGame.fen() });
      } else {
        window.setTimeout(() => makeAiMove(nextGame, nextHistory), 420);
      }
    }
  }

  function resetGame() {
    setGame(new Chess());
    setSelected(null);
    setHistory([]);
    setLastMove(null);
    setMessage("Nueva partida lista.");
  }

  return (
    <section className={`play-area ${compact ? "compact" : ""}`}>
      <div className="game-topbar">
        <div>
          <strong>{opponentName}</strong>
          <span>{mode === "online" ? "En linea" : "IA nivel " + aiStrength}</span>
        </div>
        <div className="clock">08:45</div>
      </div>

      <div className="board" aria-label="Tablero de ajedrez">
        {board.flatMap((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const square = squareName(rowIndex, colIndex);
            const isDark = (rowIndex + colIndex) % 2 === 1;
            const isSelected = selected === square;
            const isTarget = legalTargets.includes(square);
            const isLast = lastMove && (lastMove.from === square || lastMove.to === square);
            return (
              <button
                className={`square ${isDark ? "dark" : "light"} ${isSelected ? "selected" : ""} ${
                  isTarget ? "target" : ""
                } ${isLast ? "last" : ""}`}
                key={square}
                onClick={() => handleSquareClick(square)}
                aria-label={square}
              >
                {piece ? <span className={`piece piece-sprite ${piece.color}-${pieceTypeClass[piece.type]}`} /> : null}
              </button>
            );
          })
        )}
      </div>

      <div className="game-topbar bottom">
        <div>
          <strong>{playerName}</strong>
          <span>Tu lado: {isWhite ? "Blancas" : "Negras"}</span>
        </div>
        <div className="clock">09:30</div>
      </div>

      <aside className="coach-panel">
        <div className="coach-title">Coach IA</div>
        <p>{coach}</p>
        <div className="move-message">{message}</div>
        <div className="game-actions">
          <button onClick={() => setMessage(coach)}>
            <Lightbulb size={17} /> Pista
          </button>
          <button onClick={resetGame}>
            <RotateCcw size={17} /> Reiniciar
          </button>
          <button>
            <Pause size={17} /> Pausa
          </button>
          <button className="danger">
            <ShieldAlert size={17} /> Rendirse
          </button>
        </div>
        <ol className="moves-list">
          {history.slice(-8).map((move, index) => (
            <li key={`${move.san}-${index}`}>{move.san}</li>
          ))}
        </ol>
      </aside>
    </section>
  );
}
