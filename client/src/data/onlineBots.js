const botNames = [
  "RayoMate",
  "LunaGambito",
  "TorreFirme",
  "PeonBravo",
  "AlfilRojo",
  "CaballoSur",
  "ReinaNorte",
  "MateCriollo",
  "BlitzPampa",
  "RocaFinal",
  "Vector64",
  "JaqueDelta",
  "Muralla8",
  "CazadorF7",
  "TempoGhost",
  "NodoMate",
  "RivalSigma",
  "BunkerChess",
  "AtlasKnight",
  "PuntaDeLanza",
  "SectorH8",
  "PulseFork",
  "RitmoTactico",
  "LineaCentral",
  "RaptorBoard",
  "MareaBlitz",
  "AjedrezX",
  "ReyAurora"
];

export const GLOBAL_BOTS = Array.from({ length: 28 }, (_, index) => ({
  username: botNames[index],
  level: 3 + (index % 12),
  onlineSeconds: 600 + index * 93,
  matchSeconds: 120 + (index % 8) * 28,
  score: 5200 + index * 420
}));
