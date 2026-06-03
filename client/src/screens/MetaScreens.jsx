import { useState } from "react";
import { Crown, Gem, Globe, Map, Palette, Gift, Search, Target, ChevronDown } from "lucide-react";
import { avatarOptions } from "../constants/appConstants.js";
import { cleanRecentMatches, levelProgress } from "../lib/profileUtils.js";
import { AvatarMark, WalletPill } from "../components/AppChrome.jsx";
import { shopItems, tactics } from "../data/gameData.js";

export function TrainingScreen({ ownedMoves, onBuyMove }) {
  return (
    <main className="screen screen-flow">
      <div className="screen-head">
        <span className="screen-kicker">Asistencia tactica</span>
        <h2 className="section-title">Movimientos</h2>
        <p className="screen-lead">Compra ayudas de IA para detectar ideas defensivas y recursos concretos dentro de la partida.</p>
      </div>

      <div className="list">
        {tactics.map(([name, text, level, reward, price, gems]) => {
          const owned = ownedMoves.includes(name);
          return (
            <article className="row-card section-card shop-row" key={name}>
              <div className="badge">
                <Target size={16} />
              </div>
              <div className="shop-copy">
                <strong>{name}</strong>
                <span>{text}</span>
                <small>Nivel sugerido {level} - impacto {reward}</small>
              </div>
              {owned ? (
                <button className="premium-button disabled">Comprado</button>
              ) : (
                <div className="buy-actions premium-buy-actions">
                  <button className="premium-button success" onClick={() => onBuyMove(name, "coins", price)}>
                    <Crown size={14} />
                    {price}
                  </button>
                  <button className="premium-button alt" onClick={() => onBuyMove(name, "diamonds", gems)}>
                    <Gem size={14} />
                    {gems}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}

export function MiniGameScreen() {
  return (
    <main className="screen screen-flow">
      <section className="mini-game-card coming-soon">
        <strong>Proximamente</strong>
        <span>Estamos preparando una nueva experiencia de mini juegos para esta seccion.</span>
      </section>
    </main>
  );
}

export function ReviewScreen({ profile }) {
  const recentMatches = cleanRecentMatches(profile.recentMatches || []);

  return (
    <main className="screen screen-flow">
      <div className="screen-head">
        <span className="screen-kicker">Tu actividad reciente</span>
        <h2 className="section-title">Historial</h2>
        <p className="screen-lead">Aqui ves tus ultimas partidas importantes, con resultado y premios ganados.</p>
      </div>

      {recentMatches.length === 0 ? (
        <section className="empty-review">
          <Search size={24} />
          <strong>No tenes partidas para mostrar.</strong>
          <p>Anda a jugar, proba una partida nueva y vuelve luego para revisar tus resultados.</p>
        </section>
      ) : (
        <div className="history-grid">
          {recentMatches.map((match, index) => {
            const resultLabel = match.result === "win" ? "Victoria" : match.result === "draw" ? "Empate" : "Derrota";

            return (
              <article className="history-card" key={`${match.playedAt}-${index}`}>
                <div className={`badge review-badge ${match.mode === "Online" ? "online" : "story"}`}>
                  {match.mode === "Online" ? <Globe size={16} /> : <Map size={16} />}
                </div>

                <div className="history-card-main">
                  <div className="history-top-row">
                    <strong>{match.mode} vs {match.opponent}</strong>
                    <span className={`history-result ${match.result}`}>{resultLabel}</span>
                  </div>
                  <small className="history-meta">{new Date(match.playedAt).toLocaleString("es-AR")}</small>
                </div>

                <div className="history-reward-block">
                  <span>XP +{match.rewardXp || 0}</span>
                  <span>Monedas +{match.rewardCoins || 0}</span>
                  <span>{match.rewardVideoBonus ? `Video +${match.rewardVideoBonus}` : "Video +0"}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

export function ProfileScreen({ profile, onSelectAvatar }) {
  const latestMatch = cleanRecentMatches(profile.recentMatches || [])[0];
  const xpPercent = levelProgress(profile);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const selectedAvatar = avatarOptions.find((option) => option.id === profile.avatar);

  return (
    <main className="screen screen-flow">
      <div className="screen-head">
        <span className="screen-kicker">Identidad del jugador</span>
        <h2 className="section-title">Perfil</h2>
        <p className="screen-lead">Tu progreso, tu liga online y tu configuracion visual en un solo lugar.</p>
      </div>

      <section className="profile-card">
        <div className="profile-hero">
          <AvatarMark avatar={profile.avatar} size="large" />
          <div className="profile-hero-copy">
            <h3>{profile.username}</h3>
            <strong>Liga online: {profile.league}</strong>
            <small>{selectedAvatar?.name || "Avatar base"} equipado</small>
          </div>
        </div>

        <div className="profile-progress">
          <div className="profile-progress-head">
            <span>Progreso de nivel</span>
            <small>{profile.xp} / {profile.xpToNextLevel} XP</small>
          </div>
          <div className="xp-bar">
            <span style={{ width: `${xpPercent}%` }} />
          </div>
        </div>

        <div className="profile-wallet-row">
          <WalletPill type="diamonds" icon={Gem} label={profile.diamonds} />
          <WalletPill type="coins" icon={Crown} label={profile.coins.toLocaleString("es-AR")} />
        </div>

        <div className="stats-grid">
          <span>{profile.stats.matches}<small>Partidas</small></span>
          <span>{profile.stats.wins}<small>Victorias</small></span>
          <span>{profile.stats.totalSessions}<small>Sesiones</small></span>
          <span>{profile.claimedLevelRewards?.length || 0}<small>Recompensas</small></span>
        </div>

        <div className="avatar-section">
          <div className="avatar-section-head">
            <strong>Avatares base</strong>
            <small>Mas avatares van a llegar a Tienda en la parte visual.</small>
          </div>
          <button className={`avatar-dropdown ${showAvatarMenu ? "open" : ""}`} onClick={() => setShowAvatarMenu((prev) => !prev)}>
            <span>{selectedAvatar ? `Elegir avatar · ${selectedAvatar.name}` : "Elegir avatar"}</span>
            <ChevronDown size={16} />
          </button>
          {showAvatarMenu ? (
            <div className="avatar-grid">
              {avatarOptions.map((option) => (
                <button
                  key={option.id}
                  className={`avatar-option ${profile.avatar === option.id ? "active" : ""}`}
                  onClick={() => {
                    onSelectAvatar(option.id);
                    setShowAvatarMenu(false);
                  }}
                >
                  <AvatarMark avatar={option.id} />
                  <span>{option.name}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="profile-match-card">
          <strong>Ultima partida</strong>
          {latestMatch ? (
            <>
              <span>{latestMatch.result === "win" ? "Victoria" : latestMatch.result === "draw" ? "Empate" : "Derrota"} en {latestMatch.mode}</span>
              <small>{latestMatch.opponent} - {new Date(latestMatch.playedAt).toLocaleString("es-AR")}</small>
            </>
          ) : (
            <>
              <span>Aun no tienes partidas registradas.</span>
              <small>Juega historia u online para ver actividad aqui.</small>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export function ShopScreen({ profile, ownedMoves, onBuyMove }) {
  const [tab, setTab] = useState("moves");
  const [toast, setToast] = useState("");
  const [highlightedItem, setHighlightedItem] = useState("");
  const movesItems = shopItems.filter((item) => item[2] === "moves");
  const visualItems = shopItems.filter((item) => item[2] === "visual");
  const currencyItems = shopItems.filter((item) => item[2] === "currency");

  function triggerToast(message, itemName = "") {
    setToast(message);
    setHighlightedItem(itemName);
    window.clearTimeout(window.__cmShopToastTimer);
    window.__cmShopToastTimer = window.setTimeout(() => {
      setToast("");
      setHighlightedItem("");
    }, 2200);
  }

  return (
    <main className="screen screen-flow">
      {toast ? <div className="toast success">{toast}</div> : null}

      <div className="screen-head">
        <span className="screen-kicker">Tienda premium</span>
        <h2 className="section-title">Tienda</h2>
        <p className="screen-lead">Compra ayudas tacticas, mejoras visuales y paquetes de recursos sin perder claridad en mobile.</p>
      </div>

      <section className="shop-wallet-strip section-card">
        <WalletPill type="coins" icon={Crown} label={profile.coins.toLocaleString("es-AR")} />
        <WalletPill type="diamonds" icon={Gem} label={profile.diamonds} />
      </section>

      <div className="shop-tabs shop-tabs-tight premium-tabs">
        <button className={tab === "moves" ? "active" : ""} onClick={() => setTab("moves")}>Movimientos</button>
        <button className={tab === "visual" ? "active" : ""} onClick={() => setTab("visual")}>Parte visual</button>
        <button className={tab === "currency" ? "active" : ""} onClick={() => setTab("currency")}>Monedas y diamantes</button>
      </div>

      {tab === "moves" ? (
        <div className="list">
          {movesItems.map(([name, text, , price]) => {
            const tacticInfo = tactics.find(([tacticName]) => tacticName.toLowerCase().includes(name.split(" ")[0].toLowerCase()));
            const gemPrice = tacticInfo ? tacticInfo[5] : Math.max(8, Math.round(price / 200));

            return (
              <article className={`row-card section-card shop-row ${highlightedItem === name ? "purchase-overlay" : ""}`} key={name}>
                <div className="badge">
                  <Target size={16} />
                </div>
                <div className="shop-copy">
                  <strong>{name}</strong>
                  <span>{text}</span>
                  <small>Util para momentos tacticos dentro de la partida.</small>
                </div>
                <div className="buy-actions premium-buy-actions">
                  <button
                    className="premium-button success"
                    onClick={() => {
                      if (ownedMoves.includes(name)) {
                        triggerToast("Ese movimiento ya es tuyo", name);
                        return;
                      }
                      if (profile.coins < price) {
                        triggerToast("No tienes oro suficiente", name);
                        return;
                      }
                      onBuyMove(name, "coins", price);
                      triggerToast("Compra realizada", name);
                    }}
                  >
                    <Crown size={14} />
                    {price}
                  </button>
                  <button
                    className="premium-button alt"
                    onClick={() => {
                      if (ownedMoves.includes(name)) {
                        triggerToast("Ese movimiento ya es tuyo", name);
                        return;
                      }
                      if (profile.diamonds < gemPrice) {
                        triggerToast("No tienes gemas suficientes", name);
                        return;
                      }
                      onBuyMove(name, "diamonds", gemPrice);
                      triggerToast("Compra realizada", name);
                    }}
                  >
                    <Gem size={14} />
                    {gemPrice}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {tab === "visual" ? (
        <div className="list">
          {visualItems.map(([name, text, , , gems]) => (
            <article className={`row-card section-card shop-row ${highlightedItem === name ? "purchase-overlay" : ""}`} key={name}>
              <div className="badge">
                <Palette size={16} />
              </div>
              <div className="shop-copy">
                <strong>{name}</strong>
                <span>{text}</span>
                <small>Contenido premium para personalizar tu tablero y tus fichas.</small>
              </div>
              <button className="premium-button light" onClick={() => triggerToast("Contenido visual pronto disponible", name)}>
                <Gem size={14} />
                {gems}
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "currency" ? (
        <div className="list">
          {currencyItems.map(([name, text, , price, amount]) => (
            <article className={`row-card section-card shop-row ${highlightedItem === name ? "purchase-overlay" : ""}`} key={name}>
              <div className="badge">
                <Gift size={16} />
              </div>
              <div className="shop-copy">
                <strong>{name}</strong>
                <span>{text}</span>
                <small>Cantidad incluida: {amount}</small>
              </div>
              <button className="premium-button light" onClick={() => triggerToast("Pagos reales proximamente", name)}>
                {price}
              </button>
            </article>
          ))}
        </div>
      ) : null}
    </main>
  );
}
