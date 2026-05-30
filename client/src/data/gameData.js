export const player = {
  username: "Cristian",
  avatar: "C",
  level: 7,
  xp: 12450,
  coins: 12450,
  diamonds: 330,
  league: "Bronce II",
  stats: { matches: 150, wins: 68, streak: 7 },
  tacticsUnlocked: 6
};

export const modes = [
  ["Partida rapida", "Juega contra IA facil", "green"],
  ["Modo historia", "Conviertete en Gran Maestro", "gold"],
  ["Puzzles", "Entrena tu vision tactica", "violet"],
  ["Mini juegos", "Diversion y recompensas", "violet"],
  ["Entrenamiento", "Mejora tu nivel", "blue"],
  ["Partida amistosa", "Juega con amigos", "blue"]
];

export const tactics = [
  ["Horquilla", "Ataca dos piezas a la vez.", 1, 100],
  ["Clavada", "Inmoviliza una pieza clave.", 2, 120],
  ["Descubierto", "Libera una amenaza oculta.", 3, 140],
  ["Mate Pastor", "Primer patron de ataque.", 4, 160],
  ["Jaque doble", "Dos amenazas al rey.", 5, 190],
  ["Desviacion", "Aparta al defensor.", 6, 220]
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
  ["Resuelve 3 puzzles", 3, 100, 75],
  ["Aprende una maniobra", 1, 120, 80],
  ["Gana con jaque mate", 1, 200, 150]
];

export const miniGames = [
  ["Mate en 1", "Encuentra el golpe final"],
  ["Carrera de peones", "Corona antes que tu rival"],
  ["Defensa del rey", "Sobrevive bajo presion"],
  ["Blitz tactico", "Resuelve contra reloj"],
  ["Sobrevive", "Evita todas las trampas"]
];

export const shopItems = [
  ["Bolsa de monedas", "5.000 oro", "$1.99"],
  ["Caja de monedas", "15.000 oro", "$4.99"],
  ["Cofre de diamantes", "250 gemas", "$2.99"],
  ["Pase premium", "Misiones extra", "$6.99"],
  ["Tablero Neon", "Skin visual", "$0.99"]
];
