export const player = {
  username: "Cristian",
  avatar: "C",
  level: 7,
  xp: 12450,
  xpToNextLevel: 16000,
  coins: 12450,
  diamonds: 330,
  league: "Bronce II",
  stats: { matches: 150, wins: 68, streak: 7 },
  tacticsUnlocked: 6
};

export const modes = [
  ["Modo historia", "5 partidas por torneo, dificultad progresiva.", "gold"],
  ["Online", "Crea o entra a salas para jugar con otros usuarios.", "blue"],
  ["Entrenamiento", "Prueba los movimientos desbloqueados con monedas o diamantes.", "green"],
  ["Mini juego", "Gana monedas rapido con una dinamica simple.", "violet"],
  ["Tienda", "Compra movimientos, cofres y mejoras.", "blue"]
];

export const tactics = [
  ["Horquilla", "Ataca dos piezas a la vez.", 1, 100, 1200, 6],
  ["Clavada", "Inmoviliza una pieza clave.", 2, 120, 1800, 10],
  ["Descubierto", "Libera una amenaza oculta.", 3, 140, 2600, 15],
  ["Mate Pastor", "Primer patron de ataque.", 4, 160, 3500, 20],
  ["Jaque doble", "Dos amenazas al rey.", 5, 190, 4700, 25],
  ["Desviacion", "Aparta al defensor.", 6, 220, 6200, 32]
];

export const storyNodes = [
  ["Club local", true, 3, "Ramon el mentor"],
  ["Torneo regional", true, 2, "Sofia tactica"],
  ["Campeonato nacional", true, 1, "Mateo Blitz"],
  ["Copa continental", false, 0, "El Invicto"],
  ["Liga mundial", false, 0, "GM Aurora"]
];

export const tournaments = [
  ["Copa Principiantes", "Bronce", "Termina en 1 dia", 100],
  ["Liga de Bronce", "Bronce", "Inscripcion abierta", 250],
  ["Copa de Plata", "Plata", "Proximamente", 500],
  ["Campeonato de Oro", "Oro", "Requiere nivel 8", 900],
  ["Gran Maestros", "Elite", "Solo top 1%", 2000]
];

export const missions = [
  ["Juega 1 partida", 1, 100, 50],
  ["Gana 1 partida", 1, 150, 100],
  ["Completa 1 historia", 1, 180, 110],
  ["Practica un movimiento", 1, 120, 80],
  ["Gana por jaque mate", 1, 200, 150]
];

export const miniGames = [
  ["Cofre veloz", "Toca la casilla dorada para ganar monedas al instante"]
];

export const shopItems = [
  ["Bolsa de monedas", "5.000 oro", "$1.99"],
  ["Caja de monedas", "15.000 oro", "$4.99"],
  ["Cofre de diamantes", "250 gemas", "$2.99"],
  ["Pack de movimientos", "Desbloquea tecnicas nuevas", "$6.99"],
  ["Tablero Neon", "Skin visual", "$0.99"]
];

export const storyTournaments = [
  {
    id: "aprendiz",
    name: "Torneo de Aprendiz",
    matches: [
      { id: 1, level: "Super facil", ai: 0 },
      { id: 2, level: "Facil", ai: 1 },
      { id: 3, level: "Normal", ai: 2 },
      { id: 4, level: "Dificil", ai: 3 },
      { id: 5, level: "Complicado", ai: 4 }
    ]
  },
  {
    id: "ascenso",
    name: "Torneo de Ascenso",
    matches: [
      { id: 1, level: "Super facil", ai: 1 },
      { id: 2, level: "Facil", ai: 2 },
      { id: 3, level: "Normal", ai: 3 },
      { id: 4, level: "Dificil", ai: 4 },
      { id: 5, level: "Complicado", ai: 5 }
    ]
  }
];
