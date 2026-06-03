import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { boardFiles, ftueMatchSteps, pieceTypeClass } from "../constants/appConstants.js";
import { API_URL } from "../constants/appConstants.js";
import { normalizeProfileFromUser } from "../lib/appUtils.js";
import { player as initialPlayer } from "../data/gameData.js";

export default function FtueScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState(null);
  const [hint, setHint] = useState(ftueMatchSteps[0].text);
  const [form, setForm] = useState({ username: "", email: "" });
  const [registerError, setRegisterError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [celebration, setCelebration] = useState(false);

  const currentStep = ftueMatchSteps[step];
  const sources = currentStep ? [currentStep.player.from] : [];
  const targets = currentStep && selected === currentStep.player.from ? [currentStep.player.to] : [];
  const board = game.board();
  const ready = form.username.trim().length > 1 && form.email.includes("@");

  useEffect(() => {
    if (!currentStep) return;
    setSelected(null);
    setHint(currentStep.text);
  }, [currentStep]);

  useEffect(() => {
    if (step >= ftueMatchSteps.length) return undefined;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  function squareName(row, col) {
    return `${boardFiles[col]}${8 - row}`;
  }

  function onSquareClick(square) {
    if (!currentStep) return;

    if (!selected) {
      if (sources.includes(square)) {
        setSelected(square);
        setHint("Bien. Ahora completa la jugada en la casilla marcada.");
      } else {
        setHint("Sigue la maniobra guiada para avanzar.");
      }
      return;
    }

    if (sources.includes(square)) {
      setSelected(square);
      setHint("Perfecto. Remata el movimiento en la casilla iluminada.");
      return;
    }

    if (!(targets.includes(square) && currentStep.player.from === selected && currentStep.player.to === square)) {
      setHint("Esa no es la jugada del tutorial. Sigue la ruta marcada.");
      return;
    }

    const next = new Chess(game.fen());
    const move = next.move({ from: selected, to: square, promotion: "q" });
    if (!move) {
      setHint("Ese movimiento no es legal.");
      return;
    }

    if (currentStep.ai) {
      next.move(currentStep.ai);
    }

    setGame(next);
    setSelected(null);
    setHint(currentStep.success);

    if (step === ftueMatchSteps.length - 1) {
      setCelebration(true);
      window.setTimeout(() => {
        setCelebration(false);
        setStep(ftueMatchSteps.length);
      }, 1600);
      return;
    }

    setStep((value) => value + 1);
  }

  async function handleRegister() {
    if (!ready || submitting) return;
    setSubmitting(true);
    setRegisterError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username.trim(), email: form.email.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo crear la cuenta.");
      onComplete(normalizeProfileFromUser(data.user));
    } catch (error) {
      const offlineFallback = {
        ...initialPlayer,
        userId: null,
        username: form.username.trim(),
        avatar: initialPlayer.avatar,
        email: form.email.trim()
      };
      if (String(error?.message || "").includes("Failed to fetch")) {
        setRegisterError("No se pudo conectar con el servidor. Vas a entrar igual en modo local.");
        onComplete(offlineFallback);
        return;
      }
      setRegisterError(error.message || "No se pudo crear la cuenta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="screen ftue-screen">
      {step < ftueMatchSteps.length ? (
        <section className="ftue-step">
          <div className="ftue-step-meta">
            <span className="inline-note">Paso {step + 1} de 5</span>
            <span className="inline-note">Tiempo {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>
          </div>
          <div className="screen-head compact">
            <span className="screen-kicker">Tutorial inicial</span>
            <strong>{currentStep.title}</strong>
            <p className="screen-lead">{currentStep.text}</p>
          </div>
          <div className="board ftue-board" aria-label="Tablero FTUE">
            {board.map((row, rowIndex) =>
              row.map((piece, colIndex) => {
                const square = squareName(rowIndex, colIndex);
                const isDark = (rowIndex + colIndex) % 2 === 1;
                const isSelected = selected === square;
                const isSource = sources.includes(square);
                const isTarget = targets.includes(square);
                return (
                  <button
                    className={`square ${isDark ? "dark" : "light"} ${isSelected ? "selected" : ""} ${isSource ? "forced-source" : ""} ${isTarget ? "forced-target" : ""}`}
                    key={square}
                    onClick={() => onSquareClick(square)}
                    aria-label={square}
                  >
                    {colIndex === 0 ? <span className={`coord coord-rank ${isDark ? "on-dark" : "on-light"}`}>{8 - rowIndex}</span> : null}
                    {rowIndex === 7 ? <span className={`coord coord-file ${isDark ? "on-dark" : "on-light"}`}>{boardFiles[colIndex]}</span> : null}
                    {piece ? <span className={`piece piece-sprite ${piece.color}-${pieceTypeClass[piece.type]}`} /> : null}
                  </button>
                );
              })
            )}
          </div>
          {celebration ? (
            <div className="ftue-win-banner">
              <strong>Ganaste la maniobra</strong>
              <span>Entraste con todo, diste jaque y ya estas listo para jugar.</span>
            </div>
          ) : null}
          <p className="ftue-hint">{hint}</p>
        </section>
      ) : (
        <section className="register-panel">
          <div className="screen-head compact">
            <span className="screen-kicker">Tu cuenta inicial</span>
            <h3>Registro rapido</h3>
            <p className="screen-lead">Completa estos datos y entra directo al menu principal con tu progreso guardado.</p>
          </div>
          <label>
            Usuario
            <input value={form.username} onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))} />
          </label>
          <label>
            Mail
            <input value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
          </label>
          <p className="inline-note">Tu cuenta arranca con 5000 monedas y 15 diamantes.</p>
          {registerError ? <small className="error-text">{registerError}</small> : null}
          <button className="primary-action" onClick={handleRegister} disabled={!ready || submitting}>
            {submitting ? "Creando cuenta..." : "Entrar al menu principal"}
          </button>
        </section>
      )}
    </main>
  );
}
