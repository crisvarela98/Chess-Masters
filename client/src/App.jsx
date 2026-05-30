import {
  Award,
  Bolt,
  Bot,
  Crown,
  Gem,
  Home,
  Map,
  Medal,
  Play,
  Puzzle,
  Shield,
  ShoppingBag,
  Swords,
  Target,
  Trophy,
  User,
  Zap
} from "lucide-react";
import { useState } from "react";
import ChessBoard from "./game/ChessBoard.jsx";
import {
  miniGames,
  missions,
  modes,
  player,
  shopItems,
  storyNodes,
  tactics,
  tournaments
} from "./data/gameData.js";

const nav = [
  ["home", "Inicio", Home],
  ["modes", "Jugar", Play],
  ["game", "Partida", Swords],
  ["story", "Historia", Map],
  ["profile", "Perfil", User]
];

function StatPill({ icon: Icon, label }) {
  return (
    <span className="stat-pill">
      <Icon size={15} /> {label}
    </span>
  );
}

function Header({ onNavigate }) {
  return (
    <header className="app-header">
      <div className="avatar">{player.avatar}</div>
      <div className="player-lines">
        <strong>{player.username}</strong>
        <span>Nv. {player.level}</span>
      </div>
      <div className="wallet">
        <StatPill icon={Crown} label={player.coins.toLocaleString("es-AR")} />
        <StatPill icon={Gem} label={player.diamonds} />
      </div>
      <button className="icon-button" onClick={() => onNavigate("profile")} aria-label="Perfil">
        <User size={18} />
      </button>
    </header>
  );
}

function HomeScreen({ onNavigate }) {
  const quickLinks = [
    ["story", "Modo historia", Map],
    ["training", "Entrenamiento", Target],
    ["training", "Puzzles", Puzzle],
    ["tournaments", "Torneos", Trophy],
    ["missions", "Misiones", Award],
    ["minigames", "Mini juegos", Bolt],
    ["shop", "Tienda", ShoppingBag],
    ["profile", "Perfil", User]
  ];

  return (
    <main className="screen home-screen">
      <section className="brand-panel">
        <div className="logo-crown">♕</div>
        <h1>CHESS MASTERS</h1>
        <p>Sube de liga aprendiendo tacticas sin sentir que estas estudiando.</p>
        <div className="xp-bar">
          <span style={{ width: "68%" }} />
        </div>
        <button className="primary-action" onClick={() => onNavigate("modes")}>
          <Play size={22} /> Jugar
        </button>
      </section>

      <section className="daily-reward">
        <div>
          <strong>Recompensa diaria</strong>
          <span>Cofre comun listo</span>
        </div>
        <button onClick={() => onNavigate("missions")}>Reclamar</button>
      </section>

      <section className="quick-grid">
        {quickLinks.map(([route, label, Icon]) => (
          <button key={label} onClick={() => onNavigate(route)}>
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
      </section>
    </main>
  );
}

function ModeScreen({ onNavigate }) {
  return (
    <main className="screen">
      <h2>Selecciona modo</h2>
      <div className="mode-list">
        {modes.map(([name, text, tone]) => (
          <button className={`mode-card ${tone}`} key={name} onClick={() => onNavigate(name === "Partida rapida" ? "game" : "story")}>
            <Swords size={24} />
            <span>
              <strong>{name}</strong>
              <small>{text}</small>
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}

function FtueScreen() {
  const steps = [
    ["Aprende a mover", "Toca las casillas amarillas para mover el peon."],
    ["Conoce una maniobra", "El caballo ataca dos piezas a la vez."],
    ["Aplica y gana", "Usa La Horquilla para ganar material."],
    ["Recompensas", "+200 monedas y +200 XP."],
    ["Sigue progresando", "Desbloqueaste Horquilla."]
  ];
  return (
    <main className="screen">
      <h2>FTUE - Primeros 5 minutos</h2>
      <div className="ftue-rail">
        {steps.map(([title, text], index) => (
          <article className="ftue-card" key={title}>
            <div className="mini-board">
              {Array.from({ length: 16 }).map((_, cell) => (
                <span className={(cell + index) % 5 === 0 ? "hint" : ""} key={cell} />
              ))}
              <b>{index + 1}</b>
            </div>
            <strong>{title}</strong>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </main>
  );
}

function GameScreen() {
  return (
    <main className="screen game-screen">
      <h2>Pantalla de juego</h2>
      <ChessBoard />
    </main>
  );
}

function TrainingScreen() {
  return (
    <main className="screen">
      <h2>Coleccion de maniobras</h2>
      <div className="list">
        {tactics.map(([name, description, level, reward]) => (
          <article className="row-card" key={name}>
            <div className="badge"><Target size={18} /></div>
            <div>
              <strong>{name}</strong>
              <span>{description}</span>
            </div>
            <small>Nv. {level}</small>
            <button>Practicar</button>
            <em>+{reward}</em>
          </article>
        ))}
      </div>
    </main>
  );
}

function StoryScreen() {
  return (
    <main className="screen story-screen">
      <h2>Mapa de historia</h2>
      <div className="map-panel">
        {storyNodes.map(([name, unlocked, stars, rival], index) => (
          <article className={`story-node ${unlocked ? "unlocked" : "locked"}`} key={name}>
            <span>{index + 1}</span>
            <strong>{name}</strong>
            <small>{rival}</small>
            <em>{"★".repeat(stars)}{"☆".repeat(3 - stars)}</em>
          </article>
        ))}
      </div>
    </main>
  );
}

function TournamentScreen() {
  return (
    <main className="screen">
      <h2>Torneos</h2>
      <div className="list">
        {tournaments.map(([name, league, status, reward]) => (
          <article className="row-card" key={name}>
            <div className="badge"><Trophy size={18} /></div>
            <div>
              <strong>{name}</strong>
              <span>{league} · {status}</span>
            </div>
            <em>+{reward}</em>
          </article>
        ))}
      </div>
    </main>
  );
}

function MissionScreen() {
  return (
    <main className="screen">
      <h2>Misiones diarias</h2>
      <div className="list">
        {missions.map(([title, goal, coins, xp], index) => (
          <article className="mission-card" key={title}>
            <div>
              <strong>{title}</strong>
              <span>{Math.min(index, goal)} / {goal}</span>
            </div>
            <div className="progress"><span style={{ width: `${Math.min(100, (index / goal) * 100)}%` }} /></div>
            <em>+{coins} oro · +{xp} XP</em>
          </article>
        ))}
      </div>
      <button className="primary-action small">Reclamar todo</button>
    </main>
  );
}

function MiniGameScreen() {
  return (
    <main className="screen">
      <h2>Minijuegos</h2>
      <div className="mode-list">
        {miniGames.map(([name, text]) => (
          <button className="mode-card blue" key={name}>
            <Zap size={23} />
            <span>
              <strong>{name}</strong>
              <small>{text}</small>
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}

function ReviewScreen() {
  return (
    <main className="screen">
      <h2>Revision de la partida</h2>
      <div className="review-layout">
        <ChessBoard compact />
        <section className="analysis-panel">
          <strong>Analisis</strong>
          <p>Precision 87%. Mejor jugada: C5. Error critico: pieza sin defensa.</p>
          <button>Ver variantes</button>
          <button>Compartir</button>
        </section>
      </div>
    </main>
  );
}

function ProfileScreen() {
  return (
    <main className="screen">
      <h2>Perfil</h2>
      <section className="profile-card">
        <div className="big-avatar">{player.avatar}</div>
        <h3>{player.username}</h3>
        <strong>{player.league}</strong>
        <div className="stats-grid">
          <span>{player.stats.matches}<small>Partidas</small></span>
          <span>{player.stats.wins}%<small>Victorias</small></span>
          <span>{player.stats.streak}<small>Racha</small></span>
          <span>{player.tacticsUnlocked}<small>Tacticas</small></span>
        </div>
        <div className="achievement"><Medal size={22} /> Primer torneo ganado</div>
      </section>
    </main>
  );
}

function ShopScreen() {
  return (
    <main className="screen">
      <h2>Tienda</h2>
      <div className="shop-wallet">
        <StatPill icon={Crown} label={`${player.coins} monedas`} />
        <StatPill icon={Gem} label={`${player.diamonds} diamantes`} />
      </div>
      <div className="list">
        {shopItems.map(([name, text, price]) => (
          <article className="row-card" key={name}>
            <div className="badge"><ShoppingBag size={18} /></div>
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

function BottomNav({ route, onNavigate }) {
  return (
    <nav className="bottom-nav">
      {nav.map(([id, label, Icon]) => (
        <button className={route === id ? "active" : ""} key={id} onClick={() => onNavigate(id)}>
          <Icon size={19} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export default function App() {
  const [route, setRoute] = useState("home");
  const screens = {
    home: <HomeScreen onNavigate={setRoute} />,
    modes: <ModeScreen onNavigate={setRoute} />,
    ftue: <FtueScreen />,
    game: <GameScreen />,
    training: <TrainingScreen />,
    story: <StoryScreen />,
    tournaments: <TournamentScreen />,
    missions: <MissionScreen />,
    minigames: <MiniGameScreen />,
    review: <ReviewScreen />,
    profile: <ProfileScreen />,
    shop: <ShopScreen />
  };

  return (
    <div className="app-shell">
      <Header onNavigate={setRoute} />
      <div className="screen-switcher">
        <button onClick={() => setRoute("ftue")}>FTUE</button>
        <button onClick={() => setRoute("training")}>Tacticas</button>
        <button onClick={() => setRoute("missions")}>Misiones</button>
        <button onClick={() => setRoute("review")}>Revision</button>
      </div>
      {screens[route]}
      <BottomNav route={route} onNavigate={setRoute} />
    </div>
  );
}
