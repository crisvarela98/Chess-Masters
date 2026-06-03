import { BookOpen, ChevronRight, Crown, Gem, Gift, Globe2, Play, Sparkles } from "lucide-react";

const playModes = [
  {
    route: "story",
    title: "Modo historia",
    text: "Avanza torneo por torneo y desbloquea retos nuevos.",
    tone: "gold",
    icon: BookOpen
  },
  {
    route: "online",
    title: "Online",
    text: "Busca rival o crea una sala privada para jugar en vivo.",
    tone: "blue",
    icon: Globe2
  },
  {
    route: "minigames",
    title: "Mini juego",
    text: "Muy pronto tendras una experiencia casual para sumar monedas.",
    tone: "violet",
    icon: Sparkles
  }
];

function ModeCard({ icon: Icon, title, text, tone, onClick }) {
  return (
    <button className={`mode-card play-mode-card ${tone}`} onClick={onClick}>
      <div className="mode-card-top">
        <span className="mode-card-icon">
          <Icon size={18} />
        </span>
        <ChevronRight size={16} className="mode-card-arrow" />
      </div>
      <span className="mode-card-copy">
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
    </button>
  );
}

export function PlayHubScreen({ onNavigate }) {
  return (
    <main className="screen screen-flow">
      <div className="screen-head">
        <span className="screen-kicker">Tu siguiente jugada</span>
        <h2 className="section-title">Jugar</h2>
        <p className="screen-lead">Elige el modo ideal para este momento y entra directo a la accion.</p>
      </div>

      <section className="play-hub compact-hub">
        <div className="mode-list mode-list-premium">
          {playModes.map((mode) => (
            <ModeCard
              key={mode.route}
              icon={mode.icon}
              title={mode.title}
              text={mode.text}
              tone={mode.tone}
              onClick={() => onNavigate(mode.route)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export function HomeScreen({ profile, onNavigate, onWatchAd }) {
  return (
    <main className="screen home-screen">
      <section className="hero-board home-hero clean-hero">
        <span className="hero-status solo">Nivel {profile.level}</span>
        <div className="hero-copy centered">
          <small>Hola, {profile.username}</small>
          <h1>Chess Masters</h1>
          <p>Juega partidas, reclama recursos y sigue progresando con una experiencia clara y rapida.</p>
        </div>
        <div className="hero-pill-row">
          <span className="hero-pill">Historia</span>
          <span className="hero-pill">Online</span>
          <span className="hero-pill">Recompensas</span>
        </div>
        <div className="home-primary-actions">
          <button className="play-launch premium-button" onClick={() => onNavigate("play")}>
            <Play size={18} />
            <span>Jugar</span>
          </button>
          <button className="reward-launch premium-button light" onClick={() => onNavigate("rewards")}>
            <Gift size={18} />
            <span>Recompensas</span>
          </button>
        </div>
      </section>

      <section className="ad-hub home-ad-hub section-card">
        <div className="ad-hub-title">
          <strong>Anuncios recompensados</strong>
          <span>Un toque rapido para sumar recursos.</span>
        </div>
        <div className="compact-ad-row compact-home-ads">
          <button className="ad-reward-button coins" onClick={() => onWatchAd("coins", 450)}>
            <div className="ad-button-copy">
              <small>Monedas</small>
              <strong>450 monedas</strong>
              <span>Ver anuncio</span>
            </div>
            <div className="ad-button-icon">
              <Crown size={18} />
            </div>
          </button>
          <button className="ad-reward-button diamonds" onClick={() => onWatchAd("diamonds", 2)}>
            <div className="ad-button-copy">
              <small>Diamantes</small>
              <strong>2 diamantes</strong>
              <span>Ver anuncio</span>
            </div>
            <div className="ad-button-icon">
              <Gem size={18} />
            </div>
          </button>
        </div>
      </section>
    </main>
  );
}
