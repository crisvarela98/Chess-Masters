import { useEffect, useRef, useState } from "react";
import { sameUtcDay, generateLevelRewards } from "../lib/profileUtils.js";
import { storyTournaments } from "../data/gameData.js";
import ChessBoard from "../game/ChessBoard.jsx";

export function RewardsScreen({ profile, onClaimDaily, onClaimLevelReward }) {
  const levelRewards = generateLevelRewards();
  const dailyClaimed = profile.lastDailyRewardAt ? sameUtcDay(new Date(profile.lastDailyRewardAt), new Date()) : false;
  const [tab, setTab] = useState("daily");

  return (
    <main className="screen screen-flow">
      <div className="screen-head">
        <span className="screen-kicker">Progreso y recursos</span>
        <h2 className="section-title">Recompensas</h2>
        <p className="screen-lead">Reclama lo diario y cobra cada premio importante a medida que subes de nivel.</p>
      </div>

      <div className="shop-tabs shop-tabs-tight premium-tabs">
        <button className={tab === "daily" ? "active" : ""} onClick={() => setTab("daily")}>Diarias</button>
        <button className={tab === "general" ? "active" : ""} onClick={() => setTab("general")}>Generales</button>
      </div>

      {tab === "daily" ? (
        <>
          <section className="reward-legend section-card">
            <strong>Diarias</strong>
            <span>Se renuevan cada 24 horas y estan pensadas para darte un empujon rapido.</span>
          </section>
          <section className="reward-card epic premium-reward-card">
            <div className="reward-copy">
              <strong>Corona del Amanecer</strong>
              <span>Una ayuda corta para arrancar el dia con recursos y seguir avanzando sin romper el balance.</span>
            </div>
            <div className="reward-values">
              <em>300 monedas</em>
              <em>1 diamante</em>
              <em>80 XP</em>
            </div>
            <small className="reward-note">Disponible una vez por dia.</small>
            <button className={`premium-button ${dailyClaimed ? "disabled" : ""}`} onClick={onClaimDaily} disabled={dailyClaimed}>
              {dailyClaimed ? "Ya reclamada hoy" : "Reclamar diaria"}
            </button>
          </section>
        </>
      ) : null}

      {tab === "general" ? (
        <>
          <section className="reward-legend section-card">
            <strong>Generales</strong>
            <span>Se desbloquean por nivel, se reclaman una sola vez y marcan tu progreso real.</span>
          </section>
          <div className="list">
            {levelRewards.map((reward) => {
              const claimed = (profile.claimedLevelRewards || []).includes(reward.level);
              const unlocked = profile.level >= reward.level;

              return (
                <article className={`reward-card ${claimed ? "done" : ""}`} key={reward.level}>
                  <div className="reward-copy">
                    <strong>Nivel {reward.level} - {reward.title}</strong>
                    <span>{reward.subtitle}</span>
                  </div>
                  <div className="reward-values">
                    <em>{reward.coins} monedas</em>
                    <em>{reward.diamonds} diamantes</em>
                    <em>{reward.xp} XP</em>
                  </div>
                  <button className={`premium-button ${!unlocked || claimed ? "disabled" : ""}`} disabled={!unlocked || claimed} onClick={() => onClaimLevelReward(reward.level)}>
                    {claimed ? "Reclamada" : unlocked ? "Reclamar" : `Bloqueada hasta nivel ${reward.level}`}
                  </button>
                </article>
              );
            })}
          </div>
        </>
      ) : null}
    </main>
  );
}

export function StoryScreen({ profile, progress, onPlayMatch }) {
  return (
    <main className="screen screen-flow">
      <div className="screen-head">
        <span className="screen-kicker">Camino competitivo</span>
        <h2 className="section-title">Modo historia</h2>
        <p className="screen-lead">Cada torneo tiene cinco partidas. Gana, sube de nivel y abre el siguiente recorrido.</p>
      </div>

      <div className="list">
        {storyTournaments.map((tournament) => {
          const completedMatches = progress[tournament.id] || [];
          const unlocked = profile.level >= (tournament.unlockLevel || 1);
          const nextMatch = tournament.matches.find((match) => !completedMatches.includes(match.id)) || null;
          const completedCount = completedMatches.length;
          const totalMatches = tournament.matches.length;
          const finished = completedCount >= totalMatches;
          const statusLabel = finished ? "Completado" : unlocked ? "Activo" : `Nivel ${tournament.unlockLevel}`;

          return (
            <article className={`story-tournament ${!unlocked ? "locked" : ""}`} key={tournament.id}>
              <div className="story-header-row">
                <div className="story-title">
                  <strong>{tournament.name}</strong>
                  <span>
                    {unlocked
                      ? finished
                        ? `Completaste ${totalMatches} de ${totalMatches} partidas.`
                        : `Vas ${completedCount} de ${totalMatches}. Sigue con la ${completedCount + 1} de ${totalMatches}.`
                      : `Se desbloquea en nivel ${tournament.unlockLevel}.`}
                  </span>
                </div>
                <span className={`story-status ${finished ? "done" : unlocked ? "live" : "locked"}`}>{statusLabel}</span>
              </div>

              <div className="story-progress-strip">
                {tournament.matches.map((match) => (
                  <span
                    key={`${tournament.id}-${match.id}`}
                    className={`story-node ${completedMatches.includes(match.id) ? "done" : nextMatch?.id === match.id && unlocked ? "current" : ""}`}
                  >
                    {match.id}
                  </span>
                ))}
              </div>

              <button
                className={`story-match story-cta ${finished ? "done" : ""}`}
                disabled={!unlocked}
                onClick={() => {
                  if (nextMatch) onPlayMatch(tournament, nextMatch);
                }}
              >
                <span>
                  {!unlocked
                    ? `Bloqueado hasta nivel ${tournament.unlockLevel}`
                    : finished
                      ? `Torneo ${tournament.name} completado`
                      : `${tournament.name} - ${completedCount + 1} de ${totalMatches}`}
                </span>
                <small>
                  {!unlocked
                    ? "Sigue subiendo de nivel para abrirlo."
                    : finished
                      ? "Ya ganaste todas las partidas de este torneo."
                      : completedCount > 0
                        ? "Ganaste la anterior. Continua con la siguiente."
                        : "Empieza tu recorrido en este torneo."}
                </small>
              </button>
            </article>
          );
        })}
      </div>
    </main>
  );
}

export function StoryMatchScreen({ profile, activeMatch, onComplete, onReturnHome, onRecordMatch, ownedMoves, onDoubleReward }) {
  const winTimerRef = useRef(null);
  const completedRef = useRef(false);

  useEffect(() => () => {
    if (winTimerRef.current) {
      window.clearTimeout(winTimerRef.current);
    }
  }, []);

  if (!activeMatch) return null;

  function handleExitToMenu() {
    if (completedRef.current) {
      return;
    }

    if (winTimerRef.current) {
      window.clearTimeout(winTimerRef.current);
      winTimerRef.current = null;
      completedRef.current = true;
      onComplete(activeMatch.tournament.id, activeMatch.match.id);
      return;
    }

    onReturnHome();
  }

  return (
    <main className="screen">
      <ChessBoard
        mode="ai"
        aiStrength={activeMatch.match.ai}
        playerName={profile.username}
        opponentName={`${activeMatch.tournament.name} - Rival ${activeMatch.match.id}`}
        modeLabel="Historia"
        ownedMoves={ownedMoves}
        rewardCoins={180}
        onDoubleReward={() => onDoubleReward(180)}
        onMatchComplete={(winner, detail) => {
          const result = winner === "white" ? "win" : winner === "draw" ? "draw" : "loss";
          onRecordMatch({
            mode: "Historia",
            opponent: `${activeMatch.tournament.name} - Rival ${activeMatch.match.id}`,
            result,
            summary: detail?.summary || "Partida de historia completada.",
            rewardVideoBonus: detail?.videoBonus || 0
          });
          if (winner === "white") {
            winTimerRef.current = window.setTimeout(() => {
              completedRef.current = true;
              onComplete(activeMatch.tournament.id, activeMatch.match.id);
            }, 5000);
          }
        }}
        onExitToMenu={handleExitToMenu}
      />
    </main>
  );
}
