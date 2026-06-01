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
4. Copia `client/.env.example` a `client/.env` y completa `VITE_GOOGLE_CLIENT_ID`.
5. En Google Cloud, agrega este origen autorizado para tu cliente web OAuth: `http://localhost:5173`.
6. `npm run seed`
7. `npm start`

El cliente abre en `http://localhost:5173` y el backend en `http://localhost:4000`.

## Scripts

- `npm start`: corre frontend y backend juntos.
- `npm run dev`: alias de `npm start`.
- `npm run server`: corre solo el backend.
- `npm run client`: corre solo el frontend.
- `npm run seed`: carga usuario demo, tacticas, misiones y torneos.

## Estado de esta version

Version actual con experiencia mobile vertical, FTUE de primer inicio con registro, modo historia por torneos (5 partidas), entrenamiento por movimientos comprables, mini juego de monedas, modo online por salas Socket.io, tienda y revision.

## Login Gmail (Google)

- Frontend usa Google Identity Services.
- Backend valida el `credential` con `google-auth-library` en `/api/auth/google`.
- Variable requerida en backend: `GOOGLE_CLIENT_ID`.
- Variable requerida en frontend: `VITE_GOOGLE_CLIENT_ID`.

## Registro por mail y correo de bienvenida

- Registro por email/clave: `POST /api/auth/register`.
- Si MongoDB esta conectado, guarda usuario en coleccion `users`.
- Si configuras SMTP en backend (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`), se envia mail de felicitacion al registrarse (Google o mail).
