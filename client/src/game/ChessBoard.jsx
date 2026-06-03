import { Chess } from "chess.js";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb, Pause, ShieldAlert, Video } from "lucide-react";
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
  modeLabel = "IA",
  socket = null,
  roomId = "",
  isWhite = true,
  ownedMoves = [],
  rewardCoins = 0,
  onDoubleReward,
  onSurrender,
  onMatchComplete,
  onExitToMenu
}) {
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("Toca una pieza para jugar.");
  const [lastMove, setLastMove] = useState(null);
  const [paused, setPaused] = useState(false);
  const [showMovesPanel, setShowMovesPanel] = useState(false);
  const [showOwnedMoves, setShowOwnedMoves] = useState(false);
  const [resultState, setResultState] = useState(null);
  const [doubled, setDoubled] = useState(false);

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
  }

  function describeResult(winner) {
    if (winner === "draw") {
      return {
        title: "Empate",
        subtitle: "La partida termino equilibrada. Toca ver video si quieres duplicar la recompensa base.",
        tone: "draw"
      };
    }
    const playerWon = winner === (isWhite ? "white" : "black");
    return playerWon
      ? {
          title: "Ganaste",
          subtitle: "Buena partida. Cerraste mejor la posicion y te llevaste la victoria.",
          tone: "win"
        }
      : {
          title: "Perdiste",
          subtitle: "Esta vez no alcanzo. Mira la secuencia y vuelve mas fuerte.",
          tone: "loss"
        };
  }

  function finishIfNeeded(nextGame, nextHistory) {
    if (!nextGame.isGameOver()) return;
    const winner = nextGame.isCheckmate() ? (nextGame.turn() === "w" ? "black" : "white") : "draw";
    const result = describeResult(winner);
    setResultState({
      ...result,
      winner,
      summary: nextGame.isCheckmate() ? `Jaque mate en ${nextHistory.length} jugadas.` : `Final ${modeLabel.toLowerCase()} por empate.`
    });
    if (onMatchComplete) {
      onMatchComplete(winner, {
        summary: nextGame.isCheckmate() ? `Jaque mate en ${nextHistory.length} jugadas.` : `Final ${modeLabel.toLowerCase()} por empate.`
      });
    }
  }

  function makeAiMove(nextGame, nextHistory) {
    if (nextGame.isGameOver()) return;
    const aiMove = pickAiMove(nextGame, aiStrength);
    if (!aiMove) return;
    const played = nextGame.move({ from: aiMove.from, to: aiMove.to, promotion: "q" });
    const updated = [...nextHistory, played];
    setLastMove(played);
    setMessage(played.captured ? "Tu rival capturo material. Busca una respuesta activa." : "Tu turno.");
    refresh(nextGame, updated);
    finishIfNeeded(nextGame, updated);
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
      setMessage("Tu turno.");
      refresh(nextGame, nextHistory);
      finishIfNeeded(nextGame, nextHistory);
    }

    socket.on("opponentMove", onOpponentMove);
    return () => socket.off("opponentMove", onOpponentMove);
  }, [socket, mode, roomId, game, history]);

  useEffect(() => {
    if (mode === "online" && !resultState) {
      setMessage(canPlayColor ? "Tu turno." : "Turno rival.");
    }
  }, [mode, canPlayColor, resultState]);

  function handleSquareClick(square) {
    if (paused || game.isGameOver() || resultState) return;
    if (mode === "online" && !canPlayColor) return;

    const piece = game.get(square);

    if (selected === square) {
      setSelected(null);
      setMessage("Pieza desmarcada.");
      return;
    }

    if (!selected) {
      if (piece?.color === game.turn()) {
        setSelected(square);
        setMessage("Elige una casilla iluminada.");
      }
      return;
    }

    if (piece?.color === game.turn()) {
      setSelected(square);
      setMessage("Nueva pieza seleccionada.");
      return;
    }

    const nextGame = new Chess(game.fen());
    const played = nextGame.move({ from: selected, to: square, promotion: "q" });
    if (!played) {
      setMessage("Movimiento no legal.");
      return;
    }

    const nextHistory = [...history, played];
    setSelected(null);
    setLastMove(played);
    setMessage(played.san.includes("#") ? "Jaque mate." : "Buena jugada.");
    refresh(nextGame, nextHistory);

    if (mode === "online" && socket && roomId) {
      socket.emit("movePiece", { roomId, move: { from: played.from, to: played.to, promotion: "q" }, fen: nextGame.fen() });
      finishIfNeeded(nextGame, nextHistory);
      if (nextGame.isGameOver()) {
        socket.emit("gameOver", { roomId, result: played.san.includes("#") ? "checkmate" : "draw" });
      }
      return;
    }

    finishIfNeeded(nextGame, nextHistory);

    if (nextGame.isGameOver()) return;

    if (mode !== "online") {
      window.setTimeout(() => makeAiMove(nextGame, nextHistory), 420);
    } else {
      setMessage("No hay conexion activa con la sala.");
    }
  }

  function handleDoubleReward() {
    if (doubled || !resultState) return;
    setDoubled(true);
    if (onDoubleReward) onDoubleReward();
  }

  function handleSurrender() {
    const summary = "Abandonaste la partida antes del final.";
    setResultState({
      title: "Rendicion",
      subtitle: "La partida se cerro por abandono. Puedes volver a intentarlo cuando quieras.",
      tone: "loss",
      winner: isWhite ? "black" : "white",
      summary
    });
    if (onMatchComplete) onMatchComplete(isWhite ? "black" : "white", { summary });
    if (onSurrender) onSurrender();
  }

  return (
    <section className={`play-area ${compact ? "compact" : ""} ${resultState ? "finished" : ""}`}>
      <div className="match-strip">
        <div className="match-player-card">
          <small>Tu lado</small>
          <strong>{playerName}</strong>
        </div>
        <div className="match-mode-pill">{modeLabel}</div>
        <div className="match-player-card rival">
          <small>Rival</small>
          <strong>{opponentName}</strong>
        </div>
      </div>

      <div className="board-shell">
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
                  className={`square ${isDark ? "dark" : "light"} ${isSelected ? "selected" : ""} ${isTarget ? "target" : ""} ${isLast ? "last" : ""}`}
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  aria-label={square}
                >
                  {colIndex === 0 ? <span className={`coord coord-rank ${isDark ? "on-dark" : "on-light"}`}>{8 - rowIndex}</span> : null}
                  {rowIndex === 7 ? <span className={`coord coord-file ${isDark ? "on-dark" : "on-light"}`}>{files[colIndex]}</span> : null}
                  {piece ? <span className={`piece piece-sprite ${piece.color}-${pieceTypeClass[piece.type]}`} /> : null}
                </button>
              );
            })
          )}
        </div>

        {resultState ? (
          <div className={`result-overlay ${resultState.tone}`}>
            <strong>{resultState.title}</strong>
            <p>{resultState.subtitle}</p>
            <small>{resultState.summary}</small>
            <span className="result-reward-note">Recompensa base +{rewardCoins} monedas</span>
            <div className="result-actions">
              <button className="video-action" onClick={handleDoubleReward} disabled={doubled}>
                <Video size={16} />
                {doubled ? "Recompensa duplicada" : `Ver video y duplicar +${rewardCoins} monedas`}
              </button>
              {onExitToMenu ? (
                <button className="premium-button light result-menu-button" onClick={onExitToMenu}>
                  Ir al menu principal
                </button>
              ) : null}
            </div>
            <div className="ad-slot">
              <span>El espacio del video recompensado queda listo para integrar anuncios reales.</span>
            </div>
          </div>
        ) : null}
      </div>

      <aside className="coach-panel in-game-panel">
        <div className="coach-strip">
          <div className="coach-title">Coach IA</div>
          <div className="move-message">{message}</div>
        </div>

        <div className="game-actions compact-actions">
          <button onClick={() => setMessage(coach)}>
            <Lightbulb size={16} /> Pista
          </button>
          <button onClick={() => setPaused((value) => !value)}>
            <Pause size={16} /> {paused ? "Seguir" : "Pausa"}
          </button>
          <button className="danger" onClick={handleSurrender}>
            <ShieldAlert size={16} /> Rendirse
          </button>
        </div>

        <div className="assist-panel">
          <button className="dropdown-toggle" onClick={() => setShowOwnedMoves((value) => !value)}>
            <span>Tus movimientos comprados</span>
            {showOwnedMoves ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showOwnedMoves ? (
            <div className="owned-moves-list">
              {ownedMoves.length ? ownedMoves.map((move) => <span key={move}>{move}</span>) : <span>No tienes ayudas compradas todavia.</span>}
            </div>
          ) : null}
        </div>

        <div className="assist-panel">
          <button className="dropdown-toggle" onClick={() => setShowMovesPanel((value) => !value)}>
            <span>Movimientos recientes</span>
            {showMovesPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showMovesPanel ? (
            <ol className="moves-list compact-list">
              {history.length ? history.slice(-12).map((move, index) => <li key={`${move.san}-${index}`}>{move.san}</li>) : <li>Aun no hay jugadas.</li>}
            </ol>
          ) : null}
        </div>
      </aside>
    </section>
  );
}
