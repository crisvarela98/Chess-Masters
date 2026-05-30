# Chess-Masters

CHESS MASTERS es un videojuego mobile/web para aprender ajedrez con progresion, recompensas, tacticas guiadas, misiones, torneos y partidas online.

## Stack

- Frontend: React + Vite, CSS moderno mobile-first, chess.js.
- Backend: Node.js, Express, Socket.io, MongoDB Atlas, Mongoose.
- Online: salas simples para 2 jugadores por Socket.io.

## Como correr en VSCode

1. `npm install`
2. `npm run install-all`
3. Copia `server/.env.example` a `server/.env` y completa `MONGODB_URI`.
4. `npm run seed`
5. `npm run dev`

El cliente abre en `http://localhost:5173` y el backend en `http://localhost:4000`.

## Scripts

- `npm run dev`: corre frontend y backend juntos.
- `npm run server`: corre solo el backend.
- `npm run client`: corre solo el frontend.
- `npm run seed`: carga usuario demo, tacticas, misiones y torneos.

## Estado de esta version

Primera version funcional con home visual, tablero jugable vs IA simple, FTUE, entrenamiento tactico, progresion basica, pantallas de historia, torneos, misiones, minijuegos, tienda, perfil, revision post-partida y backend REST/Socket.io.
