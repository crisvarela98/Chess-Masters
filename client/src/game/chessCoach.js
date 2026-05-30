export function getCoachAdvice(game, lastMove) {
  if (game.isCheck()) return "Defende tu rey: estas en jaque.";

  const captures = game.moves({ verbose: true }).filter((move) => move.captured);
  if (captures.length > 0) return "Podes ganar material con una captura.";

  if (lastMove?.san?.includes("+")) return "Excelente presion: pusiste al rey en jaque.";

  const knightFork = game
    .moves({ verbose: true })
    .find((move) => move.piece === "n" && ["d5", "e5", "d4", "e4", "f7", "c7"].includes(move.to));
  if (knightFork) return "Intenta aplicar La Horquilla con tu caballo.";

  return "Mejora una pieza y controla el centro.";
}

export function pickAiMove(game) {
  const moves = game.moves({ verbose: true });
  const captures = moves.filter((move) => move.captured);
  const pool = captures.length ? captures : moves;
  return pool[Math.floor(Math.random() * pool.length)];
}
