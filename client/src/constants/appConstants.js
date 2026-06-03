import { Home, ShoppingBag } from "lucide-react";

export const FTUE_KEY = "cm_ftue_done_v2";
export const PROFILE_KEY = "cm_profile_v2";
export const STORY_KEY = "cm_story_progress_v2";
export const TRAINING_KEY = "cm_training_owned_v2";
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
export const SOCKET_URL = API_URL;
export const SPLASH_MS = 3500;
export const boardFiles = ["a", "b", "c", "d", "e", "f", "g", "h"];
export const pieceTypeClass = { p: "pawn", r: "rook", n: "knight", b: "bishop", q: "queen", k: "king" };
export const nav = [
  ["home", "Inicio", Home],
  ["shop", "Tienda", ShoppingBag]
];

export const avatarOptions = [
  { id: "king", name: "Rey clasico", glyph: "K", tone: "gold" },
  { id: "queen", name: "Reina tactica", glyph: "Q", tone: "violet" },
  { id: "knight", name: "Caballo blitz", glyph: "N", tone: "blue" },
  { id: "rook", name: "Torre de hierro", glyph: "R", tone: "green" },
  { id: "bishop", name: "Alfil preciso", glyph: "B", tone: "ember" },
  { id: "pawn", name: "Peon valiente", glyph: "P", tone: "ice" }
];

export const ftueMatchSteps = [
  {
    title: "Paso 1 - Mueve el peon",
    text: "Abre el centro con e4 para ganar espacio y mirar al rey rival.",
    player: { from: "e2", to: "e4" },
    ai: { from: "e7", to: "e5" },
    success: "Bien. Ya mandas en el centro."
  },
  {
    title: "Paso 2 - Desarrolla el caballo",
    text: "Saca el caballo a c3. Las piezas tienen que entrar rapido a la accion.",
    player: { from: "b1", to: "c3" },
    ai: { from: "b8", to: "c6" },
    success: "Perfecto. El caballo ya apoya el ataque."
  },
  {
    title: "Paso 3 - Apunta con el alfil",
    text: "Lleva el alfil a c4 para mirar el flanco del rey negro.",
    player: { from: "f1", to: "c4" },
    ai: { from: "d7", to: "d6" },
    success: "Muy bien. Alfil activado y diagonal abierta."
  },
  {
    title: "Paso 4 - Trae la reina",
    text: "La reina entra por h5. Ahora la amenaza ya se siente.",
    player: { from: "d1", to: "h5" },
    ai: { from: "g8", to: "f6" },
    success: "Listo. Las piezas coordinan y el rey rival empieza a sufrir."
  },
  {
    title: "Paso 5 - Jaque ganador",
    text: "Juega Qxe5+ para dar jaque, ganar peon y quedar claramente mejor.",
    player: { from: "h5", to: "e5" },
    ai: null,
    success: "Ganaste la secuencia. Lograste jaque, material y la iniciativa."
  }
];

export const gameTips = [
  "En Online puedes crear una sala y compartir el codigo para jugar con otra persona.",
  "Si no encuentras rival rapido, el online te empareja para que no te quedes esperando.",
  "En Tienda puedes comprar movimientos de ayuda con monedas o diamantes.",
  "Los anuncios recompensados te dan monedas o diamantes con un toque rapido.",
  "Las recompensas diarias cambian cada 24 horas dentro del menu Recompensas.",
  "Historia y Online suman experiencia, monedas y partidas al historial.",
  "Si compras ayudas, luego las ves durante la partida en el panel de movimientos.",
  "Cuando terminas una partida buena, mirar un video puede duplicar tu premio."
];
