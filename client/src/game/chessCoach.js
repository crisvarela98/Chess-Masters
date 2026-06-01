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

export function pickAiMove(game, strength = 2) {
  const moves = game.moves({ verbose: true });
  if (!moves.length) return null;

  const captures = moves.filter((move) => move.captured);
  const checks = moves.filter((move) => move.san.includes("+") || move.san.includes("#"));
  const center = moves.filter((move) => ["d4", "d5", "e4", "e5", "c4", "f4"].includes(move.to));
  const weighted = [];

  moves.forEach((move) => weighted.push(move));
  center.forEach((move) => weighted.push(move));
  captures.forEach((move) => weighted.push(move, move));
  checks.forEach((move) => weighted.push(move, move, move));

  if (strength <= 1) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  if (strength <= 3) {
    const pool = captures.length ? captures : weighted;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return weighted[Math.floor(Math.random() * weighted.length)];
}
