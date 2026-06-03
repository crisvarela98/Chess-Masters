import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Users } from "lucide-react";
import ChessBoard from "../game/ChessBoard.jsx";
import { GLOBAL_BOTS } from "../data/onlineBots.js";
import { SOCKET_URL } from "../constants/appConstants.js";
import { BackButton } from "../components/AppChrome.jsx";

export default function OnlineScreen({ profile, onRecordMatch, ownedMoves, onDoubleReward, onReturnHome, onBack }) {
  const [socket, setSocket] = useState(null);
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
  const returnTimerRef = useRef(null);

  const realUsers = onlineUsers.filter((name) => name !== profile.username);
  const playerRankingScore = (profile.level * 1800) + profile.xp + ((profile.stats?.wins || 0) * 120) + Math.floor(profile.coins / 40);
  const ranking = useMemo(
    () =>
      [
        { username: profile.username, level: profile.level, score: playerRankingScore },
        ...GLOBAL_BOTS
      ].sort((a, b) => b.score - a.score).slice(0, 30),
    [playerRankingScore, profile.level, profile.username]
  );

  useEffect(() => {
    const onlineSocket = io(SOCKET_URL, { transports: ["websocket"] });
    setSocket(onlineSocket);

    onlineSocket.on("connect", () => {
      onlineSocket.emit("userOnline", { username: profile.username });
    });
    onlineSocket.on("userList", (users) => setOnlineUsers(users));
    function applyRoomReady(room) {
      const players = room.players || [];
      const me = players.find((player) => player.username === profile.username);
      const rival = players.find((player) => player.username !== profile.username);

      setRoomCode(room.roomId);
      setOpponentName(rival?.username || "Rival de sala");
      setOpponentMeta({ username: rival?.username || "Rival de sala", realUser: true });
      setIsWhite((me?.color || "white") === "white");
      setLaunchCountdown(5);
      setStatus(`Sala ${room.roomId} lista. Iniciando partida...`);
    }

    onlineSocket.on("roomCreated", ({ roomId }) => {
      setRoomCode(roomId);
      setJoinCode(roomId);
      setStatus(`Esperando rival... comparte este codigo: ${roomId}`);
      setSearching(false);
      setLaunchCountdown(0);
      setOpponentMeta(null);
      setIsWhite(true);
    });
    onlineSocket.on("joinedRoom", (room) => {
      setRoomCode(room.roomId);
      setStatus(`Te uniste a la sala ${room.roomId}. Esperando inicio...`);
    });
    onlineSocket.on("playerJoined", ({ player }) => {
      setOpponentName(player || "Rival de sala");
      setOpponentMeta({ username: player || "Rival de sala", realUser: true });
      setStatus("Tu rival ya entro a la sala. Preparando inicio...");
    });
    onlineSocket.on("roomReady", applyRoomReady);
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
      setStatus(`No habia salas disponibles. Juegas contra ${rival.username}.`);
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

  function startSearch() {
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

  function createRoom() {
    const code = `CM-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!socket) return;
    socket.emit("createRoom", { roomId: code, player: profile.username });
    setSearching(false);
    setLaunchCountdown(0);
    setOpponentMeta(null);
    setStatus(`Creando sala ${code}...`);
    setIsWhite(true);
  }

  function joinPrivateRoom() {
    if (!joinCode.trim() || !socket) return;
    const normalizedCode = joinCode.trim().toUpperCase();
    setRoomCode(normalizedCode);
    setOpponentName("Rival de sala");
    setOpponentMeta({ username: "Rival de sala", realUser: true });
    socket.emit("joinRoom", { roomId: normalizedCode, player: profile.username });
    setStatus(`Uniendote a la sala ${normalizedCode}...`);
    setSearching(false);
    setLaunchCountdown(0);
    setIsWhite(false);
  }

  function leaveMatchToMenu() {
    if (returnTimerRef.current) {
      window.clearTimeout(returnTimerRef.current);
      returnTimerRef.current = null;
    }
    setMatchActive(false);
    setRoomCode("");
    setJoinCode("");
    setStatus("Partida finalizada. Volviste al inicio.");
    onReturnHome();
  }

  return (
    <main className="screen online-lobby-screen">
      {!matchActive ? (
        <>
          <BackButton onBack={onBack} />

          <div className="screen-head">
            <span className="screen-kicker">Partidas en vivo</span>
            <h2 className="section-title">Online</h2>
            <p className="screen-lead">Busca una partida rapida o arma una sala privada para jugar con otra persona.</p>
          </div>

          <section className="online-panel section-card">
            <div className="online-headline">
              <strong>{status}</strong>
              <div className="online-status-meta">
                <span className="status-chip">
                  {searching ? `Espera maxima ${searchCountdown}s` : roomCode ? "Sala activa" : "Sin sala activa"}
                </span>
                {roomCode ? <span className="room-code-pill">{roomCode}</span> : null}
              </div>
            </div>

            <div className="online-cta-row">
              <button className="play-launch premium-button success" onClick={startSearch}>Buscar partida</button>
              <button className="premium-button light" onClick={createRoom}>Crear sala</button>
            </div>

            <div className="join-room-box">
              <div className="join-row">
                <input
                  placeholder="Ingresa codigo de sala"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") joinPrivateRoom();
                  }}
                />
                <button className="premium-button alt join-submit" onClick={joinPrivateRoom}>Unirse</button>
              </div>
              <small>Comparte el codigo exacto para entrar a una sala privada.</small>
            </div>

            {launchCountdown > 0 ? <div className="matchmaking-banner">Emparejando. La partida inicia en {launchCountdown}</div> : null}
            {!searching && roomCode && !launchCountdown ? <div className="private-room-banner">Esperando rival. Cuando entre otro usuario la partida arrancara sola.</div> : null}
          </section>

          <section className="ranking-panel section-card">
            <div className="daily-head">
              <strong>Ranking global</strong>
              <span>{ranking.length} jugadores activos en la tabla global</span>
            </div>

            <div className="ranking-top3">
              {ranking.slice(0, 3).map((entry, index) => (
                <article className={`ranking-podium place-${index + 1}`} key={`podium-${entry.username}`}>
                  <span className="podium-place">#{index + 1}</span>
                  <strong>{entry.username}</strong>
                  <small>Nivel {entry.level}</small>
                  <em>{entry.score} pts</em>
                </article>
              ))}
            </div>

            <div className="list">
              {ranking.map((entry, index) => (
                <article className="row-card ranking-row" key={`${entry.username}-${index}`}>
                  <div className={`badge rank-badge rank-${Math.min(index + 1, 4)}`}>
                    <Users size={16} />
                  </div>
                  <div className="ranking-main">
                    <div className="ranking-name-row">
                      <strong>
                        #{index + 1} {entry.username}
                        {entry.username === profile.username ? <span className="self-tag">Usted</span> : null}
                      </strong>
                      <span className="rank-pill">Nivel {entry.level}</span>
                    </div>
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
          roomId={opponentMeta?.realUser ? roomCode : ""}
          isWhite={isWhite}
          aiStrength={3}
          playerName={profile.username}
          opponentName={opponentName}
          modeLabel="Online"
          ownedMoves={ownedMoves}
          rewardCoins={220}
          onDoubleReward={() => onDoubleReward(220)}
          onMatchComplete={(winner, detail) => {
            onRecordMatch({
              mode: "Online",
              opponent: opponentMeta?.username || opponentName,
              result: winner === (isWhite ? "white" : "black") ? "win" : winner === "draw" ? "draw" : "loss",
              summary: detail?.summary || "Partida online finalizada.",
              rewardVideoBonus: detail?.videoBonus || 0
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
