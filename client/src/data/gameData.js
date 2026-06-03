export const player = {
  username: "Jugador",
  avatar: "king",
  level: 1,
  xp: 0,
  xpToNextLevel: 500,
  coins: 5000,
  diamonds: 15,
  league: "Bronce III",
  stats: { matches: 0, wins: 0, streak: 0, totalPlaySeconds: 0, lastSessionSeconds: 0, totalSessions: 0 },
  tacticsUnlocked: 1,
  claimedLevelRewards: [],
  recentMatches: []
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
  ["Consejo defensivo", "La IA te marca como salvar una pieza bajo ataque.", "moves", 1200, 0],
  ["Sacrificio maestro", "Sugerencia para entregar material y mejorar posicion.", "moves", 2100, 0],
  ["Final limpio", "Ayuda de IA para simplificar hacia un final favorable.", "moves", 2800, 0],
  ["Ataque descubierto", "Activa una idea agresiva y abre lineas tacticas.", "moves", 3400, 0],
  ["Rescate del rey", "La IA te propone una defensa urgente cuando estas apretado.", "moves", 3900, 0],
  ["Set marmol", "Piezas mas elegantes y contrastadas.", "visual", 0, 18],
  ["Tablero obsidiana", "Tablero premium con textura sobria.", "visual", 0, 14],
  ["Set marfil real", "Fichas premium con acabado suave.", "visual", 0, 22],
  ["Tablero torneo", "Look limpio y profesional para competir.", "visual", 0, 20],
  ["Paquete 5.000 monedas", "Monedas para progresar mas rapido.", "currency", "$1.99", 5000],
  ["Paquete 12.000 monedas", "Una bolsa grande para tienda y ayudas.", "currency", "$3.99", 12000],
  ["Paquete 30.000 monedas", "Reserva fuerte para progresar sin freno.", "currency", "$7.99", 30000],
  ["Paquete 15 diamantes", "Diamantes para mejoras visuales y ayudas.", "currency", "$2.99", 15],
  ["Paquete 40 diamantes", "Mas diamantes para skins y apoyos premium.", "currency", "$5.99", 40],
  ["Paquete elite", "25.000 monedas y 35 diamantes juntos.", "currency", "$8.99", "25000 + 35"]
];

export const storyTournaments = [
  {
    id: "aprendiz",
    name: "Torneo de Aprendiz",
    unlockLevel: 1,
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
    unlockLevel: 3,
    matches: [
      { id: 1, level: "Super facil", ai: 1 },
      { id: 2, level: "Facil", ai: 2 },
      { id: 3, level: "Normal", ai: 3 },
      { id: 4, level: "Dificil", ai: 4 },
      { id: 5, level: "Complicado", ai: 5 }
    ]
  },
  {
    id: "regional",
    name: "Copa Regional",
    unlockLevel: 5,
    matches: [
      { id: 1, level: "Facil", ai: 2 },
      { id: 2, level: "Normal", ai: 3 },
      { id: 3, level: "Normal", ai: 4 },
      { id: 4, level: "Dificil", ai: 5 },
      { id: 5, level: "Complicado", ai: 6 }
    ]
  },
  {
    id: "metropolitano",
    name: "Abierto Metropolitano",
    unlockLevel: 7,
    matches: [
      { id: 1, level: "Normal", ai: 3 },
      { id: 2, level: "Normal", ai: 4 },
      { id: 3, level: "Dificil", ai: 5 },
      { id: 4, level: "Dificil", ai: 6 },
      { id: 5, level: "Muy dificil", ai: 7 }
    ]
  },
  {
    id: "nacional",
    name: "Campeonato Nacional",
    unlockLevel: 9,
    matches: [
      { id: 1, level: "Normal", ai: 4 },
      { id: 2, level: "Dificil", ai: 5 },
      { id: 3, level: "Dificil", ai: 6 },
      { id: 4, level: "Muy dificil", ai: 7 },
      { id: 5, level: "Elite", ai: 8 }
    ]
  },
  {
    id: "continental",
    name: "Copa Continental",
    unlockLevel: 12,
    matches: [
      { id: 1, level: "Dificil", ai: 5 },
      { id: 2, level: "Dificil", ai: 6 },
      { id: 3, level: "Muy dificil", ai: 7 },
      { id: 4, level: "Elite", ai: 8 },
      { id: 5, level: "Elite", ai: 9 }
    ]
  },
  {
    id: "maestros",
    name: "Liga de Maestros",
    unlockLevel: 15,
    matches: [
      { id: 1, level: "Muy dificil", ai: 6 },
      { id: 2, level: "Muy dificil", ai: 7 },
      { id: 3, level: "Elite", ai: 8 },
      { id: 4, level: "Elite", ai: 9 },
      { id: 5, level: "Gran maestro", ai: 10 }
    ]
  },
  {
    id: "corona",
    name: "Torneo de la Corona",
    unlockLevel: 18,
    matches: [
      { id: 1, level: "Elite", ai: 7 },
      { id: 2, level: "Elite", ai: 8 },
      { id: 3, level: "Gran maestro", ai: 9 },
      { id: 4, level: "Gran maestro", ai: 10 },
      { id: 5, level: "Legendario", ai: 11 }
    ]
  }
];
