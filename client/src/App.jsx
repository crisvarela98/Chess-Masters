import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { io } from "socket.io-client";
import { Crown, Gem, Home, Map, ShoppingBag, Swords, Target, Trophy, Zap } from "lucide-react";
import ChessBoard from "./game/ChessBoard.jsx";
import { missions, modes, player as initialPlayer, shopItems, storyTournaments, tactics, tournaments } from "./data/gameData.js";

const FTUE_KEY = "cm_ftue_done_v2";
const PROFILE_KEY = "cm_profile_v2";
const STORY_KEY = "cm_story_progress_v2";
const TRAINING_KEY = "cm_training_owned_v2";
const DAILY_KEY = "cm_daily_claims_v2";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const SOCKET_URL = API_URL;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const nav = [
  ["home", "Inicio", Home],
  ["story", "Historia", Map],
  ["online", "Online", Swords],
  ["shop", "Tienda", ShoppingBag],
  ["training", "Entreno", Target]
];

const boardFiles = ["a", "b", "c", "d", "e", "f", "g", "h"];
const pieceTypeClass = { p: "pawn", r: "rook", n: "knight", b: "bishop", q: "queen", k: "king" };

const ftueMatchSteps = [
  {
    title: "Paso 1 - Mueve el peon",
    text: "Abre el centro moviendo el peon marcado.",
    player: { from: "e2", to: "e4" },
    ai: { from: "e7", to: "e5" },
    success: "Excelente. Ya controlas el centro."
  },
  {
    title: "Paso 2 - Aprende caballo",
    text: "Saca el caballo en L para apoyar el ataque.",
    player: { from: "b1", to: "c3" },
    ai: { from: "b8", to: "c6" },
    success: "Muy bien. Caballo desarrollado."
  },
  {
    title: "Paso 3 - Mueve el alfil",
    text: "Activa el alfil para apuntar al rey rival.",
    player: { from: "f1", to: "c4" },
    ai: { from: "d7", to: "d6" },
    success: "Genial. Alfil en diagonal de ataque."
  },
  {
    title: "Paso 4 - Activa la reina",
    text: "Lleva la reina a la casilla marcada para preparar el golpe final.",
    player: { from: "d1", to: "h5" },
    ai: { from: "g8", to: "f6" },
    success: "Perfecto. Ya tienes la red de mate."
  },
  {
    title: "Paso 5 - Consigue jaque mate",
    text: "Remata la partida capturando en f7. Ganas si o si.",
    player: { from: "h5", to: "f7" },
    ai: null,
    success: "Jaque mate. Ganaste tu primera partida en menos de 1 minuto."
  }
];

function levelProgress(profile) {
  return Math.min(100, Math.round((profile.xp / profile.xpToNextLevel) * 100));
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function StatPill({ icon: Icon, label }) {
  return (
    <span className="stat-pill">
      <Icon size={14} />
      {label}
    </span>
  );
}

function Header({ profile, onOpenProfile, onOpenReview }) {
  const xpPercent = levelProgress(profile);

  return (
    <header className="app-header">
      <button className="profile-summary" onClick={onOpenProfile}>
        <div className="profile-name-row">
          <strong>{profile.username}</strong>
          <span>Nivel {profile.level}</span>
        </div>
        <div className="xp-bar header-xp">
          <span style={{ width: `${xpPercent}%` }} />
        </div>
        <div className="header-wallet">
          <StatPill icon={Crown} label={profile.coins.toLocaleString("es-AR")} />
          <StatPill icon={Gem} label={profile.diamonds} />
        </div>
      </button>
      <button className="review-button" onClick={onOpenReview}>
        Revision
      </button>
    </header>
  );
}

function FtueScreen({ onComplete }) {
  const googleEnabled = GOOGLE_CLIENT_ID.trim().length > 0;
  const [step, setStep] = useState(0);
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState(null);
  const [hint, setHint] = useState(ftueMatchSteps[0].text);
  const [mode, setMode] = useState(() => (googleEnabled ? "google" : "email"));
  const [form, setForm] = useState({ username: "", age: "", email: "", password: "" });
  const [googleAuth, setGoogleAuth] = useState({ credential: "", email: "", name: "" });
  const [googleError, setGoogleError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const googleButtonId = "google-login-ftue";

  const currentStep = ftueMatchSteps[step];
  const sources = currentStep ? [currentStep.player.from] : [];
  const targets = currentStep && selected === currentStep.player.from ? [currentStep.player.to] : [];
  const board = game.board();

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

  useEffect(() => {
    if (mode === "google" && !googleEnabled) {
      setMode("email");
    }
  }, [mode, googleEnabled]);

  useEffect(() => {
    if (mode !== "google") {
      setGoogleError("");
    }
  }, [mode]);

  useEffect(() => {
    if (step < ftueMatchSteps.length || mode !== "google") return undefined;
    if (!googleEnabled) {
      return undefined;
    }

    let cancelled = false;

    const decodeJwt = (credential) => {
      try {
        const payload = credential.split(".")[1];
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(window.atob(base64));
      } catch {
        return null;
      }
    };

    const renderGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id) return;
      const container = document.getElementById(googleButtonId);
      if (!container) return;
      container.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: ({ credential }) => {
          if (!credential) return;
          const decoded = decodeJwt(credential);
          setGoogleAuth({
            credential,
            email: decoded?.email || "",
            name: decoded?.name || ""
          });
          setGoogleError("");
          setForm((prev) => ({
            ...prev,
            email: decoded?.email || prev.email,
            username: prev.username || decoded?.given_name || decoded?.name || prev.username
          }));
        }
      });
      window.google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 260
      });
    };

    const existingScript = document.querySelector("script[data-google-identity='1']");
    if (existingScript) {
      renderGoogleButton();
      return undefined;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "1";
    script.onload = renderGoogleButton;
    script.onerror = () => setGoogleError("No se pudo cargar Google Sign-In.");
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [step, mode, googleEnabled]);

  const readyLocal = form.username.trim().length > 1 && Number(form.age) > 5 && form.email.includes("@");
  const ready = readyLocal && (mode === "google" ? Boolean(googleAuth.credential) : form.password.length >= 6);

  function squareName(row, col) {
    return `${boardFiles[col]}${8 - row}`;
  }

  function moveIsAllowed(from, to) {
    if (!currentStep) return false;
    return currentStep.player.from === from && currentStep.player.to === to;
  }

  function onSquareClick(square) {
    if (!currentStep) return;

    if (!selected) {
      if (sources.includes(square)) {
        setSelected(square);
        setHint("Bien. Ahora mueve a la casilla destino iluminada.");
      } else {
        setHint("Sigue la jugada guiada para avanzar.");
      }
      return;
    }

    if (sources.includes(square)) {
      setSelected(square);
      setHint("Perfecto, ahora termina la jugada en la casilla iluminada.");
      return;
    }

    if (!targets.includes(square) || !moveIsAllowed(selected, square)) {
      setHint("Casi. Sigue las casillas marcadas para completar el paso.");
      return;
    }

    const next = new Chess(game.fen());
    const move = next.move({ from: selected, to: square, promotion: "q" });
    if (!move) {
      setHint("Ese movimiento no es legal. Prueba la opcion iluminada.");
      return;
    }

    if (step === ftueMatchSteps.length - 1 && !next.isCheckmate()) {
      setHint("Falta el mate. Usa la jugada indicada.");
      return;
    }

    if (currentStep.ai) {
      next.move({ from: currentStep.ai.from, to: currentStep.ai.to, promotion: "q" });
    }

    setGame(next);
    setSelected(null);
    setHint(currentStep.success);
    setStep((value) => value + 1);
  }

  async function handleRegister() {
    if (!ready || submitting) return;
    setSubmitting(true);
    setGoogleError("");

    try {
      if (mode === "google") {
        const response = await fetch(`${API_URL}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            credential: googleAuth.credential,
            age: Number(form.age),
            preferredUsername: form.username.trim()
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "No se pudo validar la cuenta Google.");

        onComplete({
          ...initialPlayer,
          username: data.user.username,
          avatar: data.user.avatar || data.user.username.charAt(0).toUpperCase(),
          email: data.user.email || form.email
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          age: Number(form.age)
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo crear la cuenta por email.");

      onComplete({
        ...initialPlayer,
        username: data.user.username,
        avatar: data.user.avatar || data.user.username.charAt(0).toUpperCase(),
        email: data.user.email || form.email
      });
    } catch (error) {
      setGoogleError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="screen">
      <h2>Bienvenido a Chess Masters</h2>
      {step < ftueMatchSteps.length ? (
        <section className="ftue-step">
          <span className="inline-note">Paso {step + 1} de 5</span>
          <span className="inline-note">Objetivo: ganar en menos de 1:00 - Tiempo {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>
          <strong>{currentStep.title}</strong>
          <p>{currentStep.text}</p>
          <div className="board ftue-board" aria-label="Tablero FTUE">
            {board.flatMap((row, rowIndex) =>
              row.map((piece, colIndex) => {
                const square = squareName(rowIndex, colIndex);
                const isDark = (rowIndex + colIndex) % 2 === 1;
                const isSelected = selected === square;
                const isSource = sources.includes(square);
                const isTarget = targets.includes(square);
                return (
                  <button
                    className={`square ${isDark ? "dark" : "light"} ${isSelected ? "selected" : ""} ${
                      isSource ? "forced-source" : ""
                    } ${isTarget ? "forced-target" : ""}`}
                    key={square}
                    onClick={() => onSquareClick(square)}
                    aria-label={square}
                  >
                    {piece ? <span className={`piece piece-sprite ${piece.color}-${pieceTypeClass[piece.type]}`} /> : null}
                  </button>
                );
              })
            )}
          </div>
          <p className="ftue-hint">{hint}</p>
        </section>
      ) : (
        <section className="register-panel">
          <h3>Registro inicial</h3>
          <label>
            Nombre
            <input value={form.username} onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))} />
          </label>
          <label>
            Edad
            <input type="number" min="6" value={form.age} onChange={(event) => setForm((prev) => ({ ...prev, age: event.target.value }))} />
          </label>
          <div className="segment">
            {googleEnabled ? (
              <button className={mode === "google" ? "active" : ""} onClick={() => setMode("google")}>
                Gmail
              </button>
            ) : null}
            <button className={mode === "email" ? "active" : ""} onClick={() => setMode("email")}>
              Mail + clave
            </button>
          </div>
          <label>
            {mode === "google" ? "Gmail" : "Mail"}
            <input
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              readOnly={mode === "google"}
            />
          </label>
          {mode === "google" ? (
            <div className="google-box">
              <div id={googleButtonId} />
              {googleAuth.email ? <small>Cuenta conectada: {googleAuth.email}</small> : <small>Conecta tu cuenta Gmail para continuar.</small>}
            </div>
          ) : (
            <label>
              Contrasena
              <input type="password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} />
            </label>
          )}
          {googleError ? <small className="error-text">{googleError}</small> : null}
          <button className="primary-action small" disabled={!ready || submitting} onClick={handleRegister}>
            {submitting ? "Conectando..." : "Crear cuenta y entrar"}
          </button>
        </section>
      )}
    </main>
  );
}

function HomeScreen({ onNavigate, missionsData, dailyClaimed, onClaimDaily }) {
  return (
    <main className="screen home-screen">
      <section className="brand-panel compact">
        <h1>Chess Masters</h1>
        <p>Progreso real por sesiones cortas, con historia, online y entrenamiento.</p>
        <div className="mode-list slim">
          {modes.map(([name, text, tone]) => (
            <button className={`mode-card ${tone}`} key={name} onClick={() => onNavigate(name.includes("Online") ? "online" : name.includes("historia") ? "story" : name.includes("Tienda") ? "shop" : name.includes("Mini") ? "minigames" : "training")}>
              <span>
                <strong>{name}</strong>
                <small>{text}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="daily-reward mission-feed">
        <div className="daily-head">
          <strong>Recompensas diarias</strong>
          <span>{dailyClaimed ? "Reclamadas hoy" : "Listas para reclamar"}</span>
        </div>
        <div className="list">
          {missionsData.map(([title, goal, coins, xp], index) => (
            <article className="mission-card" key={title}>
              <div>
                <strong>{title}</strong>
                <span>{Math.min(index + 1, goal)} / {goal}</span>
              </div>
              <div className="progress">
                <span style={{ width: `${Math.min(100, ((index + 1) / goal) * 100)}%` }} />
              </div>
              <em>+{coins} monedas - +{xp} XP</em>
            </article>
          ))}
        </div>
        <button onClick={onClaimDaily} disabled={dailyClaimed}>
          {dailyClaimed ? "Ya reclamado" : "Reclamar recompensas"}
        </button>
      </section>
    </main>
  );
}

function StoryScreen({ progress, onPlayMatch }) {
  return (
    <main className="screen">
      <h2>Modo historia</h2>
      <div className="list">
        {storyTournaments.map((tournament) => (
          <article className="story-tournament" key={tournament.id}>
            <div className="story-title">
              <strong>{tournament.name}</strong>
              <span>5 partidas - super facil a complicado</span>
            </div>
            <div className="story-match-list">
              {tournament.matches.map((match) => {
                const played = progress[tournament.id]?.includes(match.id);
                return (
                  <button
                    className={`story-match ${played ? "done" : ""}`}
                    key={`${tournament.id}-${match.id}`}
                    onClick={() => onPlayMatch(tournament, match)}
                  >
                    <span>Partida {match.id}</span>
                    <small>{match.level}</small>
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

function StoryMatchScreen({ profile, activeMatch, onBack, onComplete }) {
  return (
    <main className="screen game-screen">
      <h2>
        {activeMatch.tournament.name} - Partida {activeMatch.match.id}
      </h2>
      <p className="inline-note">Dificultad: {activeMatch.match.level}</p>
      <ChessBoard
        aiStrength={Math.max(1, activeMatch.match.ai)}
        playerName={profile.username}
        opponentName="Rival historia"
        onMatchComplete={() => onComplete(activeMatch.tournament.id, activeMatch.match.id)}
      />
      <div className="inline-actions">
        <button onClick={() => onComplete(activeMatch.tournament.id, activeMatch.match.id)}>Marcar partida como ganada</button>
        <button onClick={onBack}>Volver al mapa</button>
      </div>
    </main>
  );
}

function TrainingScreen({ ownedMoves, onBuyMove }) {
  return (
    <main className="screen">
      <h2>Entrenamiento</h2>
      <div className="list">
        {tactics.map(([name, description, level, reward, coinPrice, gemPrice]) => {
          const owned = ownedMoves.includes(name);
          return (
            <article className="row-card training-row" key={name}>
              <div className="badge">
                <Target size={16} />
              </div>
              <div>
                <strong>{name}</strong>
                <span>{description}</span>
                <small>Nivel {level} - recompensa +{reward}</small>
              </div>
              <div className="buy-actions">
                {owned ? (
                  <button className="owned">Probar</button>
                ) : (
                  <>
                    <button onClick={() => onBuyMove(name, "coins", coinPrice)}>{coinPrice} oro</button>
                    <button onClick={() => onBuyMove(name, "diamonds", gemPrice)}>{gemPrice} gem</button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}

function MiniGameScreen({ coinsWon, onPlay }) {
  const [target, setTarget] = useState(() => Math.floor(Math.random() * 9));
  const [status, setStatus] = useState("Toca la casilla correcta para ganar monedas.");

  function handlePick(index) {
    if (index === target) {
      setStatus("Ganaste 70 monedas.");
      onPlay(70);
    } else {
      setStatus("Casi. Te doy 20 monedas igual para seguir.");
      onPlay(20);
    }
    setTarget(Math.floor(Math.random() * 9));
  }

  return (
    <main className="screen">
      <h2>Mini juego</h2>
      <p className="inline-note">Monedas ganadas en esta sesion: {coinsWon}</p>
      <div className="mini-grid">
        {Array.from({ length: 9 }).map((_, index) => (
          <button key={index} onClick={() => handlePick(index)}>
            <Zap size={16} />
            Casilla {index + 1}
          </button>
        ))}
      </div>
      <p className="inline-note">{status}</p>
    </main>
  );
}

function ReviewScreen({ profile }) {
  return (
    <main className="screen">
      <h2>Revision</h2>
      <div className="review-layout">
        <ChessBoard compact aiStrength={3} playerName={profile.username} />
        <section className="analysis-panel">
          <strong>Analisis rapido</strong>
          <p>Precision media 87%. Mejora inmediata: dejar menos piezas sin defensa.</p>
          <button>Ver variantes</button>
          <button>Guardar revision</button>
        </section>
      </div>
    </main>
  );
}

function ProfileScreen({ profile }) {
  return (
    <main className="screen">
      <h2>Perfil</h2>
      <section className="profile-card">
        <div className="big-avatar">{profile.avatar}</div>
        <h3>{profile.username}</h3>
        <strong>{profile.league}</strong>
        <div className="stats-grid">
          <span>{profile.stats.matches}<small>Partidas</small></span>
          <span>{profile.stats.wins}%<small>Victorias</small></span>
          <span>{profile.stats.streak}<small>Racha</small></span>
          <span>{profile.tacticsUnlocked}<small>Tacticas</small></span>
        </div>
      </section>
    </main>
  );
}

function ShopScreen() {
  return (
    <main className="screen">
      <h2>Tienda</h2>
      <div className="list">
        {shopItems.map(([name, text, price]) => (
          <article className="row-card" key={name}>
            <div className="badge">
              <ShoppingBag size={16} />
            </div>
            <div>
              <strong>{name}</strong>
              <span>{text}</span>
            </div>
            <button>{price}</button>
          </article>
        ))}
      </div>
    </main>
  );
}

function OnlineScreen({ profile }) {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [isHost, setIsHost] = useState(true);
  const [status, setStatus] = useState("Conecta para jugar online.");
  const [ready, setReady] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const onlineSocket = io(SOCKET_URL, { transports: ["websocket"] });
    setSocket(onlineSocket);

    onlineSocket.on("connect", () => {
      setStatus("Conectado al servidor online.");
      onlineSocket.emit("userOnline", { username: profile.username });
    });
    onlineSocket.on("roomCreated", ({ roomId: created }) => {
      setRoomId(created);
      setIsHost(true);
      setReady(false);
      setStatus(`Sala creada: ${created}`);
    });
    onlineSocket.on("roomReady", () => {
      setReady(true);
      setStatus("Sala completa. Ya pueden jugar.");
    });
    onlineSocket.on("playerJoined", ({ player }) => {
      setStatus(`${player} entro a la sala.`);
      setReady(true);
    });
    onlineSocket.on("userList", (users) => setOnlineUsers(users));

    return () => onlineSocket.disconnect();
  }, [profile.username]);

  function createRoom() {
    if (!socket) return;
    const generated = `sala-${Math.floor(1000 + Math.random() * 9000)}`;
    socket.emit("createRoom", { roomId: generated, player: profile.username });
  }

  function joinRoom() {
    if (!socket || !roomInput.trim()) return;
    socket.emit("joinRoom", { roomId: roomInput.trim(), player: profile.username });
    setRoomId(roomInput.trim());
    setIsHost(false);
    setStatus(`Entraste a ${roomInput.trim()}. Esperando inicio...`);
  }

  return (
    <main className="screen">
      <h2>Online</h2>
      <p className="inline-note">{status}</p>
      <div className="online-panel">
        <button onClick={createRoom}>Crear sala</button>
        <div className="join-row">
          <input placeholder="Codigo de sala" value={roomInput} onChange={(event) => setRoomInput(event.target.value)} />
          <button onClick={joinRoom}>Unirme</button>
        </div>
        <small>Sala activa: {roomId || "sin sala"}</small>
        <small>Usuarios conectados: {onlineUsers.length ? onlineUsers.join(", ") : "nadie por ahora"}</small>
      </div>
      {roomId && ready ? (
        <ChessBoard
          mode="online"
          socket={socket}
          roomId={roomId}
          isWhite={isHost}
          playerName={profile.username}
          opponentName="Rival online"
        />
      ) : null}
    </main>
  );
}

function BottomNav({ route, onNavigate }) {
  return (
    <nav className="bottom-nav">
      {nav.map(([id, label, Icon]) => (
        <button className={route === id ? "active" : ""} key={id} onClick={() => onNavigate(id)}>
          <Icon size={18} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export default function App() {
  const [profile, setProfile] = useState(() => ({ ...initialPlayer, ...readStorage(PROFILE_KEY, {}) }));
  const [route, setRoute] = useState(() => (localStorage.getItem(FTUE_KEY) ? "home" : "ftue"));
  const [storyProgress, setStoryProgress] = useState(() => readStorage(STORY_KEY, {}));
  const [ownedMoves, setOwnedMoves] = useState(() => readStorage(TRAINING_KEY, ["Horquilla"]));
  const [dailyClaimed, setDailyClaimed] = useState(() => readStorage(DAILY_KEY, false));
  const [coinsWon, setCoinsWon] = useState(0);
  const [activeStoryMatch, setActiveStoryMatch] = useState(null);

  useEffect(() => saveStorage(PROFILE_KEY, profile), [profile]);
  useEffect(() => saveStorage(STORY_KEY, storyProgress), [storyProgress]);
  useEffect(() => saveStorage(TRAINING_KEY, ownedMoves), [ownedMoves]);
  useEffect(() => saveStorage(DAILY_KEY, dailyClaimed), [dailyClaimed]);

  function finishFtue(nextProfile) {
    localStorage.setItem(FTUE_KEY, "1");
    setProfile((prev) => ({ ...prev, ...nextProfile }));
    setRoute("home");
  }

  function claimDaily() {
    if (dailyClaimed) return;
    const coins = missions.reduce((total, mission) => total + mission[2], 0);
    const xp = missions.reduce((total, mission) => total + mission[3], 0);
    setProfile((prev) => ({ ...prev, coins: prev.coins + coins, xp: prev.xp + xp }));
    setDailyClaimed(true);
  }

  function buyMove(moveName, currency, price) {
    if (ownedMoves.includes(moveName)) return;
    if (currency === "coins" && profile.coins < price) return;
    if (currency === "diamonds" && profile.diamonds < price) return;

    setProfile((prev) => ({
      ...prev,
      coins: currency === "coins" ? prev.coins - price : prev.coins,
      diamonds: currency === "diamonds" ? prev.diamonds - price : prev.diamonds
    }));
    setOwnedMoves((prev) => [...prev, moveName]);
  }

  function addStoryWin(tournamentId, matchId) {
    setStoryProgress((prev) => {
      const current = prev[tournamentId] || [];
      if (current.includes(matchId)) return prev;
      return { ...prev, [tournamentId]: [...current, matchId] };
    });
    setProfile((prev) => ({
      ...prev,
      coins: prev.coins + 120,
      xp: prev.xp + 90
    }));
    setActiveStoryMatch(null);
    setRoute("story");
  }

  function addMiniGameCoins(amount) {
    setCoinsWon((prev) => prev + amount);
    setProfile((prev) => ({ ...prev, coins: prev.coins + amount }));
  }

  const screens = useMemo(
    () => ({
      home: <HomeScreen onNavigate={setRoute} missionsData={missions} dailyClaimed={dailyClaimed} onClaimDaily={claimDaily} />,
      story: <StoryScreen progress={storyProgress} onPlayMatch={(tournament, match) => {
        setActiveStoryMatch({ tournament, match });
        setRoute("story-match");
      }} />,
      "story-match": (
        activeStoryMatch ? (
          <StoryMatchScreen
            profile={profile}
            activeMatch={activeStoryMatch}
            onBack={() => setRoute("story")}
            onComplete={addStoryWin}
          />
        ) : (
          <StoryScreen
            progress={storyProgress}
            onPlayMatch={(tournament, match) => {
              setActiveStoryMatch({ tournament, match });
              setRoute("story-match");
            }}
          />
        )
      ),
      online: <OnlineScreen profile={profile} />,
      shop: <ShopScreen />,
      training: <TrainingScreen ownedMoves={ownedMoves} onBuyMove={buyMove} />,
      minigames: <MiniGameScreen coinsWon={coinsWon} onPlay={addMiniGameCoins} />,
      review: <ReviewScreen profile={profile} />,
      tournaments: (
        <main className="screen">
          <h2>Torneos</h2>
          <div className="list">
            {tournaments.map(([name, league, status, reward]) => (
              <article className="row-card" key={name}>
                <div className="badge">
                  <Trophy size={16} />
                </div>
                <div>
                  <strong>{name}</strong>
                  <span>{league} - {status}</span>
                </div>
                <em>+{reward}</em>
              </article>
            ))}
          </div>
        </main>
      ),
      profile: <ProfileScreen profile={profile} />,
      ftue: <FtueScreen onComplete={finishFtue} />
    }),
    [activeStoryMatch, coinsWon, dailyClaimed, ownedMoves, profile, storyProgress]
  );

  const showShell = route !== "ftue";

  return (
    <div className="app-shell">
      {showShell ? (
        <>
          <Header profile={profile} onOpenProfile={() => setRoute("profile")} onOpenReview={() => setRoute("review")} />
          {screens[route] || screens.home}
          <BottomNav route={route} onNavigate={setRoute} />
        </>
      ) : (
        screens.ftue
      )}
    </div>
  );
}

