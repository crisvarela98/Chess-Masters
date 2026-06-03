import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Star, Trophy, Users, UserRound } from "lucide-react";
import ChessBoard from "../game/ChessBoard.jsx";
import { GLOBAL_BOTS } from "../data/onlineBots.js";
import { SOCKET_URL } from "../constants/appConstants.js";
import { BackButton, AvatarMark } from "../components/AppChrome.jsx";

function clampTournamentSize(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 8;
  return Math.min(16, Math.max(3, Math.round(numeric)));
}

function buildFallbackRanking(profile) {
  const playerRankingScore = (profile.level * 1800) + profile.xp + ((profile.stats?.wins || 0) * 120) + Math.floor(profile.coins / 40) + Math.floor((profile.stats?.totalPlaySeconds || 0) / 30);
  return [
    {
      username: profile.username,
      avatar: profile.avatar,
      level: profile.level,
      xp: profile.xp,
      coins: profile.coins,
      diamonds: profile.diamonds,
      wins: profile.stats?.wins || 0,
      totalPlaySeconds: profile.stats?.totalPlaySeconds || 0,
      score: playerRankingScore,
      league: profile.league
    }
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);
}

export default function OnlineScreen({ profile, onRecordMatch, ownedMoves, onDoubleReward, onReturnHome, onBack }) {
  const [socket, setSocket] = useState(null);
  const [socketId, setSocketId] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [status, setStatus] = useState("Busca una partida o crea una sala privada.");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchCountdown, setSearchCountdown] = useState(10);
  const [launchCountdown, setLaunchCountdown] = useState(0);
  const [opponentName, setOpponentName] = useState("Rival online");
  const [opponentMeta, setOpponentMeta] = useState(null);
  const [matchActive, setMatchActive] = useState(false);
  const [isWhite, setIsWhite] = useState(true);
  const [onlineMode, setOnlineMode] = useState("duel");
  const [tournamentSize, setTournamentSize] = useState(8);
  const [tournamentLobby, setTournamentLobby] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentOpponents, setRecentOpponents] = useState([]);
  const [favoriteOpponents, setFavoriteOpponents] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [loadingSocial, setLoadingSocial] = useState(true);
  const returnTimerRef = useRef(null);

  const tournamentPlayers = tournamentLobby?.players || [];
  const tournamentHost = tournamentLobby?.hostSocketId === socketId;

  const ranking = useMemo(() => {
    const base = leaderboard.length ? [...leaderboard] : buildFallbackRanking(profile);
    const hasLocalUser = base.some((entry) => entry.username === profile.username);
    if (!hasLocalUser) {
      base.unshift(buildFallbackRanking(profile)[0]);
    }
    return base.slice(0, 30);
  }, [leaderboard, profile]);

  useEffect(() => {
    const onlineSocket = io(SOCKET_URL, { transports: ["websocket"] });
    setSocket(onlineSocket);

    onlineSocket.on("connect", () => {
      setSocketId(onlineSocket.id || "");
      onlineSocket.emit("userOnline", { username: profile.username });
    });

    onlineSocket.on("userList", (users) => setOnlineUsers(users));

    onlineSocket.on("roomCreated", ({ roomId }) => {
      setRoomCode(roomId);
      setJoinCode(roomId);
      setStatus(`Esperando rival... comparte este codigo: ${roomId}`);
      setSearching(false);
      setLaunchCountdown(0);
      setOpponentMeta(null);
      setIsWhite(true);
    });

    onlineSocket.on("joinedRoom", ({ roomId }) => {
      setRoomCode(roomId);
      setStatus(`Te uniste a la sala ${roomId}. Esperando inicio...`);
    });

    onlineSocket.on("playerJoined", ({ player }) => {
      setOpponentName(player || "Rival de sala");
      setOpponentMeta({ username: player || "Rival de sala", realUser: true });
      setStatus("Tu rival ya entro a la sala. Preparando inicio...");
    });

    onlineSocket.on("roomReady", ({ roomId, players }) => {
      setRoomCode(roomId);
      const me = players?.find((player) => player.username === profile.username);
      const rival = players?.find((player) => player.username !== profile.username);
      if (me?.color) setIsWhite(me.color === "white");
      if (rival?.username) {
        setOpponentName(rival.username);
        setOpponentMeta({ username: rival.username, realUser: true });
      }
      setLaunchCountdown(5);
      setStatus(`Sala ${roomId} lista. Iniciando partida...`);
    });

    onlineSocket.on("roomError", ({ message }) => {
      setSearching(false);
      setLaunchCountdown(0);
      setStatus(message || "No se pudo completar la accion online.");
    });

    onlineSocket.on("roomClosed", ({ reason }) => {
      setSearching(false);
      setLaunchCountdown(0);
      setMatchActive(false);
      setRoomCode("");
      setOpponentMeta(null);
      setStatus(reason || "La sala se cerro.");
    });

    onlineSocket.on("tournamentCreated", (room) => {
      setTournamentLobby(room);
      setRoomCode(room.roomId);
      setStatus(`Torneo creado. Codigo ${room.roomId}`);
      setSearching(false);
      setLaunchCountdown(0);
    });

    onlineSocket.on("tournamentLobbyUpdated", (room) => {
      setTournamentLobby(room);
      setRoomCode(room.roomId);
    });

    onlineSocket.on("tournamentStarted", (room) => {
      setTournamentLobby(room);
      setStatus(`Torneo ${room.roomId} iniciado.`);
    });

    onlineSocket.on("tournamentMatchReady", ({ roomId, opponent, isWhite: nextWhite }) => {
      setMatchActive(true);
      setRoomCode(roomId);
      setOpponentName(opponent || "Rival de torneo");
      setOpponentMeta({ username: opponent || "Rival de torneo", realUser: true, tournament: true });
      setIsWhite(Boolean(nextWhite));
      setStatus(`Torneo en curso contra ${opponent || "Rival de torneo"}.`);
    });

    onlineSocket.on("tournamentBye", ({ message }) => {
      setStatus(message || "Pasaste de ronda por bye.");
    });

    onlineSocket.on("tournamentMatchComplete", ({ roomId, winner }) => {
      setStatus(`Partida del torneo terminada en ${roomId}. Ganador: ${winner}.`);
    });

    return () => onlineSocket.disconnect();
  }, [profile.username]);

  useEffect(() => () => {
    if (returnTimerRef.current) {
      window.clearTimeout(returnTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!searching) return undefined;

    if (searchCountdown <= 0) {
      const rival = GLOBAL_BOTS[Math.floor(Math.random() * GLOBAL_BOTS.length)];
      setOpponentName(rival.username);
      setOpponentMeta(rival);
      setSearching(false);
      setStatus(`No habia usuarios reales. Entraste con ${rival.username}.`);
      setLaunchCountdown(5);
      return undefined;
    }

    const timer = window.setTimeout(() => setSearchCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [searching, searchCountdown]);

  useEffect(() => {
    if (launchCountdown <= 0) return undefined;

    const timer = window.setTimeout(() => {
      if (launchCountdown === 1) {
        setMatchActive(true);
        setStatus("Partida iniciada.");
      }
      setLaunchCountdown((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [launchCountdown]);

  useEffect(() => {
    if (!profile.userId) return undefined;

    setLoadingLeaderboard(true);
    fetch(`${SOCKET_URL}/api/user/leaderboard`)
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (ok && Array.isArray(data.ranking)) {
          setLeaderboard(data.ranking);
          return;
        }
        setLeaderboard([]);
      })
      .catch(() => setLeaderboard([]))
      .finally(() => setLoadingLeaderboard(false));

    setLoadingSocial(true);
    fetch(`${SOCKET_URL}/api/user/social/${profile.userId}`)
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          setRecentOpponents(data.recentOpponents || []);
          setFavoriteOpponents(data.favoriteOpponents || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSocial(false));

    return undefined;
  }, [profile.userId, profile.username]);

  useEffect(() => {
    if (profile.userId) return;
    setLeaderboard(buildFallbackRanking(profile));
    setLoadingLeaderboard(false);
    setLoadingSocial(false);
    return undefined;
  }, [profile.userId, profile]);

  function refreshLeaderboard() {
    fetch(`${SOCKET_URL}/api/user/leaderboard`)
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (ok && Array.isArray(data.ranking)) setLeaderboard(data.ranking);
      })
      .catch(() => {});
  }

  function refreshSocial() {
    if (!profile.userId) return Promise.resolve();
    return fetch(`${SOCKET_URL}/api/user/social/${profile.userId}`)
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          setRecentOpponents(data.recentOpponents || []);
          setFavoriteOpponents(data.favoriteOpponents || []);
        }
      })
      .catch(() => {});
  }

  function refreshOnlineLists() {
    refreshLeaderboard();
    refreshSocial();
  }

  function startSearch() {
    setOnlineMode("duel");
    setSearching(true);
    setSearchCountdown(10);
    setLaunchCountdown(0);
    setMatchActive(false);
    setRoomCode("");
    setJoinCode("");
    setOpponentMeta(null);
    setStatus("Emparejando jugadores...");
    setIsWhite(Math.random() > 0.5);
  }

  function createDuelRoom() {
    const code = `CM-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!socket) return;
    setOnlineMode("duel");
    setMatchActive(false);
    socket.emit("createRoom", { roomId: code, player: profile.username });
    setSearching(false);
    setLaunchCountdown(0);
    setOpponentMeta(null);
    setStatus(`Creando sala ${code}...`);
    setIsWhite(true);
  }

  function joinDuelRoom() {
    if (!joinCode.trim() || !socket) return;
    const normalizedCode = joinCode.trim().toUpperCase();
    setOnlineMode("duel");
    setMatchActive(false);
    setRoomCode(normalizedCode);
    setOpponentName("Rival de sala");
    setOpponentMeta({ username: "Rival de sala", realUser: true });
    socket.emit("joinRoom", { roomId: normalizedCode, player: profile.username });
    setStatus(`Uniendote a la sala ${normalizedCode}...`);
    setSearching(false);
    setLaunchCountdown(0);
    setIsWhite(false);
  }

  function createTournamentRoom() {
    const code = `TM-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!socket) return;
    setOnlineMode("tournament");
    setMatchActive(false);
    socket.emit("createTournamentRoom", { roomId: code, player: profile.username, maxPlayers: clampTournamentSize(tournamentSize) });
    setStatus(`Creando torneo ${code}...`);
    setMatchActive(false);
    setOpponentMeta(null);
    setJoinCode(code);
  }

  function joinTournamentRoom() {
    if (!joinCode.trim() || !socket) return;
    const normalizedCode = joinCode.trim().toUpperCase();
    setOnlineMode("tournament");
    setMatchActive(false);
    setRoomCode(normalizedCode);
    socket.emit("joinTournamentRoom", { roomId: normalizedCode, player: profile.username });
    setStatus(`Uniendote al torneo ${normalizedCode}...`);
    setSearching(false);
    setLaunchCountdown(0);
  }

  function startTournament() {
    if (!socket || !tournamentLobby) return;
    socket.emit("startTournament", { roomId: tournamentLobby.roomId });
  }

  function toggleFavorite(username) {
    if (!profile.userId || !username) return;
    fetch(`${SOCKET_URL}/api/user/favorite-opponent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: profile.userId, opponent: username })
    })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (ok) setFavoriteOpponents(data.favoriteOpponents || []);
      })
      .catch(() => {});
  }

  function inviteQuickPlay(username) {
    const code = `CM-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!socket) return;
    setOnlineMode("duel");
    setRoomCode(code);
    setJoinCode(code);
    setStatus(`Sala creada para jugar rapido con ${username}. Comparte el codigo ${code}.`);
    socket.emit("createRoom", { roomId: code, player: profile.username });
  }

  function leaveMatchToMenu() {
    if (returnTimerRef.current) {
      window.clearTimeout(returnTimerRef.current);
      returnTimerRef.current = null;
    }
    setMatchActive(false);
    setRoomCode("");
    setJoinCode("");
    setTournamentLobby(null);
    setOnlineMode("duel");
    setStatus("Partida finalizada. Volviste al inicio.");
    onReturnHome();
  }

  const favoriteNames = new Set(favoriteOpponents.map((item) => item.username));
  const recentOnlyOpponents = recentOpponents.filter((entry) => !favoriteNames.has(entry.username));
  const rankingRows = ranking.map((entry) => ({
    ...entry,
    isSelf: entry.username === profile.username
  }));

  return (
    <main className="screen online-lobby-screen">
      {!matchActive ? (
        <>
          <BackButton onBack={onBack} />

          <div className="screen-head">
            <span className="screen-kicker">Partidas en vivo</span>
            <h2 className="section-title">Online</h2>
            <p className="screen-lead">Salas privadas, torneo online y acceso rapido a rivales frecuentes.</p>
          </div>

          <div className="segmented-control">
            <button className={onlineMode === "duel" ? "active" : ""} onClick={() => setOnlineMode("duel")}>Duelo</button>
            <button className={onlineMode === "tournament" ? "active" : ""} onClick={() => setOnlineMode("tournament")}>Torneo</button>
            <button className={onlineMode === "social" ? "active" : ""} onClick={() => setOnlineMode("social")}>Frecuentes</button>
          </div>

          {onlineMode !== "social" ? (
            <section className="online-panel section-card">
              <div className="online-headline">
                <strong>{status}</strong>
                <div className="online-status-meta">
                  <span className="status-chip">
                    {onlineMode === "tournament"
                      ? tournamentLobby
                        ? `${tournamentPlayers.length}/${tournamentLobby.maxPlayers} jugadores`
                        : "Torneo sin crear"
                      : searching
                        ? `Espera maxima ${searchCountdown}s`
                        : roomCode
                          ? "Sala activa"
                          : "Sin sala activa"}
                  </span>
                  {roomCode ? <span className="room-code-pill">{roomCode}</span> : null}
                </div>
              </div>

              {onlineMode === "duel" ? (
                <>
                  <div className="online-cta-row">
                    <button className="play-launch premium-button success" onClick={startSearch}>Buscar partida</button>
                    <button className="premium-button light" onClick={createDuelRoom}>Crear sala</button>
                  </div>

                  <div className="join-room-box">
                    <div className="join-row">
                      <input
                        placeholder="Ingresa codigo de sala"
                        value={joinCode}
                        onChange={(event) => setJoinCode(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") joinDuelRoom();
                        }}
                      />
                      <button className="premium-button alt join-submit" onClick={joinDuelRoom}>Unirse</button>
                    </div>
                    <small>Comparte el codigo exacto para entrar a una sala privada.</small>
                  </div>

                  {launchCountdown > 0 ? <div className="matchmaking-banner">Emparejando. La partida inicia en {launchCountdown}</div> : null}
                  {!searching && roomCode && !launchCountdown ? <div className="private-room-banner">Esperando rival. Cuando entre otro usuario la partida arrancara sola.</div> : null}
                </>
              ) : (
                <>
                  <div className="online-cta-row tournament-actions">
                    <button className="play-launch premium-button success" onClick={createTournamentRoom}>
                      <Trophy size={16} />
                      Crear torneo
                    </button>
                    <button className="premium-button light" onClick={joinTournamentRoom}>Unirse</button>
                  </div>

                  <div className="tournament-config">
                    <label>
                      Jugadores
                      <input
                        type="number"
                        min="3"
                        max="16"
                        value={tournamentSize}
                        onChange={(event) => setTournamentSize(clampTournamentSize(event.target.value))}
                      />
                    </label>
                    <small>El torneo admite entre 3 y 16 personas.</small>
                  </div>

                  <div className="tournament-roster">
                    <div className="tournament-roster-head">
                      <strong>Jugadores del torneo</strong>
                      <button className="premium-button alt" onClick={startTournament} disabled={!tournamentLobby || !tournamentHost || tournamentPlayers.length < 3}>
                        Iniciar torneo
                      </button>
                    </div>
                    <div className="tournament-player-list">
                      {(tournamentPlayers.length ? tournamentPlayers : [{ username: "Aun no hay jugadores", color: "host" }]).map((player) => (
                        <div className="tournament-player" key={`${player.username}-${player.color}`}>
                          <AvatarMark avatar="king" />
                          <span>{player.username}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {tournamentLobby ? <div className="private-room-banner">Codigo del torneo: {tournamentLobby.roomId}</div> : null}
                </>
              )}
            </section>
          ) : null}

          {onlineMode === "social" ? (
            <section className="social-panel section-card">
              <div className="daily-head">
                <strong>Jugadores frecuentes</strong>
                <span>Acceso rapido a rivales con los que ya jugaste.</span>
              </div>

              {loadingSocial ? (
                <div className="empty-review">
                  <strong>Cargando contactos...</strong>
                </div>
              ) : (
                <div className="social-grid">
                  {favoriteOpponents.length ? favoriteOpponents.map((entry) => (
                    <article className="social-card favorite" key={entry.username}>
                      <div>
                        <strong>{entry.username}</strong>
                        <small>Favorito para jugar rapido</small>
                      </div>
                      <div className="social-actions">
                        <button className="premium-button success" onClick={() => inviteQuickPlay(entry.username)}>Invitar</button>
                        <button className="premium-button light" onClick={() => toggleFavorite(entry.username)}>Quitar</button>
                      </div>
                    </article>
                  )) : null}

                  {recentOnlyOpponents.map((entry) => (
                    <article className="social-card" key={entry.username}>
                      <div>
                        <strong>{entry.username}</strong>
                        <div className="social-record">
                          <span>{entry.matches} PJ</span>
                          <span>{entry.wins || 0}G</span>
                          <span>{entry.losses || 0}P</span>
                          <span>{entry.draws || 0}E</span>
                        </div>
                      </div>
                      <div className="social-actions">
                        <button className="premium-button success" onClick={() => inviteQuickPlay(entry.username)}>Invitar</button>
                        <button className="premium-button light" onClick={() => toggleFavorite(entry.username)}>
                          <Star size={14} />
                          {favoriteNames.has(entry.username) ? "Favorito" : "Guardar"}
                        </button>
                      </div>
                    </article>
                  ))}

                  {!favoriteOpponents.length && !recentOpponents.length ? (
                    <div className="empty-review">
                      <UserRound size={24} />
                      <strong>No hay rivales frecuentes todavia.</strong>
                      <p>Juega algunas salas privadas y despues podras guardarlos para entrar mas rapido.</p>
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          ) : null}

          <section className="ranking-panel section-card">
            <div className="daily-head">
              <strong>Ranking global</strong>
              <span>{loadingLeaderboard ? "Cargando ranking..." : `${rankingRows.length} jugadores activos en la tabla global`}</span>
            </div>

            <div className="ranking-top3">
              {rankingRows.slice(0, 3).map((entry, index) => (
                <article className={`ranking-podium place-${index + 1}`} key={`podium-${entry.username}`}>
                  <span className="podium-place">#{index + 1}</span>
                  <strong>{entry.username}</strong>
                  <small>Nivel {entry.level}</small>
                  <em>{entry.score} pts</em>
                </article>
              ))}
            </div>

            <div className="list ranking-scroll">
              {rankingRows.map((entry, index) => (
                <article className="row-card ranking-row" key={`${entry.username}-${index}`}>
                  <div className={`badge rank-badge rank-${Math.min(index + 1, 4)}`}>
                    <Users size={16} />
                  </div>
                  <div className="ranking-main">
                    <div className="ranking-name-row">
                      <strong>
                        #{index + 1} {entry.username}
                        {entry.isSelf ? <span className="self-tag">Usted</span> : null}
                      </strong>
                      <span className="rank-pill">Nivel {entry.level}</span>
                    </div>
                    <small>{entry.league || "Bronce III"}</small>
                  </div>
                  <em className="ranking-score">{entry.score} pts</em>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <ChessBoard
          mode={opponentMeta?.realUser ? "online" : "ai"}
          socket={opponentMeta?.realUser ? socket : null}
          roomId={roomCode}
          isWhite={isWhite}
          aiStrength={3}
          playerName={profile.username}
          opponentName={opponentName}
          modeLabel={onlineMode === "tournament" ? "Torneo" : "Online"}
          ownedMoves={ownedMoves}
          rewardCoins={220}
          onDoubleReward={() => onDoubleReward(220)}
          onMatchComplete={(winner, detail) => {
            const saveMatch = onRecordMatch({
              mode: onlineMode === "tournament" ? "Online" : "Online",
              opponent: opponentMeta?.username || opponentName,
              result: winner === (isWhite ? "white" : "black") ? "win" : winner === "draw" ? "draw" : "loss",
              summary: detail?.summary || "Partida online finalizada.",
              rewardVideoBonus: detail?.videoBonus || 0
            });
            Promise.resolve(saveMatch).finally(() => {
              window.setTimeout(refreshOnlineLists, 300);
            });
            returnTimerRef.current = window.setTimeout(() => {
              leaveMatchToMenu();
            }, 5000);
          }}
          onExitToMenu={leaveMatchToMenu}
        />
      )}
    </main>
  );
}
