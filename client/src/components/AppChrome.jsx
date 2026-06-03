import { ArrowLeft, Crown, Gem, ScrollText, WandSparkles } from "lucide-react";
import { levelProgress } from "../lib/profileUtils.js";
import { findAvatarOption } from "../lib/appUtils.js";
import { nav } from "../constants/appConstants.js";
import splashBranding from "../assets/branding/splash-branding.jpg";

export function SplashScreen() {
  return (
    <main className="splash-screen">
      <div className="splash-core">
        <div className="splash-aura" aria-hidden="true" />
        <img className="splash-branding-image" src={splashBranding} alt="Chess Masters y logo del creador" />
      </div>
    </main>
  );
}

export function StatPill({ icon: Icon, label }) {
  return (
    <span className="stat-pill">
      <Icon size={14} />
      {label}
    </span>
  );
}

export function WalletPill({ type, icon: Icon, label }) {
  return (
    <span className={`stat-pill ${type}`}>
      <Icon size={14} />
      {label}
    </span>
  );
}

export function AvatarMark({ avatar, size = "normal" }) {
  const selectedAvatar = findAvatarOption(avatar);

  return (
    <div className={`avatar-mark ${size} ${selectedAvatar ? `tone-${selectedAvatar.tone}` : "tone-gold"}`}>
      <span>{selectedAvatar?.glyph || avatar || "K"}</span>
    </div>
  );
}

export function BackButton({ onBack }) {
  return (
    <button className="back-button" onClick={onBack}>
      <ArrowLeft size={16} />
      Volver
    </button>
  );
}

export function GameTipToast({ tip }) {
  if (!tip) return null;

  return (
    <div className="tips-toast" aria-live="polite">
      <span className="tip-icon"><WandSparkles size={14} /></span>
      <p>{tip}</p>
    </div>
  );
}

export function Header({ profile, onOpenProfile, onOpenReview, onOpenTips }) {
  const xpPercent = levelProgress(profile);

  return (
    <header className="app-header">
      <button className="profile-summary" onClick={onOpenProfile}>
        <div className="profile-overview">
          <AvatarMark avatar={profile.avatar} />
          <div className="profile-identity">
            <strong>{profile.username}</strong>
            <span>Nivel {profile.level}</span>
          </div>
        </div>
        <div className="xp-bar header-xp">
          <span style={{ width: `${xpPercent}%` }} />
        </div>
        <div className="header-wallet">
          <WalletPill type="coins" icon={Crown} label={profile.coins.toLocaleString("es-AR")} />
          <WalletPill type="diamonds" icon={Gem} label={profile.diamonds} />
        </div>
      </button>
      <div className="header-side-actions">
        <button className="review-button tips-button" onClick={onOpenTips}>
          <WandSparkles size={16} />
          <span>Info</span>
        </button>
        <button className="review-button" onClick={onOpenReview}>
          <ScrollText size={16} />
          <span>Historial</span>
        </button>
      </div>
    </header>
  );
}

export function BottomNav({ route, onNavigate }) {
  return (
    <nav className="bottom-nav">
      {nav.map(([value, label, Icon]) => (
        <button className={route === value ? "active" : ""} key={value} onClick={() => onNavigate(value)}>
          <Icon size={16} />
          {label}
        </button>
      ))}
    </nav>
  );
}
