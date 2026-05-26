# Chess-Masters

Quiero que generes una primera versión funcional de un juego mobile/web llamado “Chess Masters”.

Stack:
- Frontend: HTML5 + CSS3 + JavaScript Vanilla
- Backend: Node.js + Express
- Base de datos: MongoDB Atlas

Conexión MongoDB:
mongodb+srv://Afmin:admin@cluster0.mwz8sqk.mongodb.net/?appName=Cluster0

OBJETIVO DEL JUEGO:
Crear un juego de ajedrez mobile-first donde jugadores principiantes puedan aprender tácticas y estrategias reales mediante tutoriales visuales, ayudas dinámicas, progresión, ligas y partidas online.

El diseño debe ser:
- extremadamente simple,
- optimizado para celulares,
- visualmente moderno,
- fácil de entender,
- rápido de cargar.

====================================================
ESTRUCTURA GENERAL DEL JUEGO
====================================================

El juego debe incluir:

1. Pantalla principal
2. FTUE (primeros 5 minutos)
3. Tutoriales interactivos
4. Partidas vs IA
5. Entrenamiento táctico
6. Sistema de ayudas visuales
7. Revisión post-partida
8. Partidas online básicas
9. Sistema de monedas y XP
10. Desbloqueo de maniobras
11. Perfil de jugador
12. Sistema de ligas/rangos
13. Misiones diarias
14. Mini juegos simples

====================================================
ESTILO VISUAL
====================================================

Diseño:
- UI estilo juego mobile moderno
- azul oscuro + dorado
- botones grandes
- bordes redondeados
- sombras suaves
- animaciones livianas

Inspiración:
- Chess.com
- Clash Royale
- Duolingo
- juegos mobile casuales modernos

Todo debe funcionar perfectamente en vertical (portrait mobile).

====================================================
FTUE — PRIMEROS 5 MINUTOS
====================================================

Al iniciar el juego:
- crear perfil rápido
- mostrar tablero simple
- enseñar movimiento del peón
- enseñar movimiento del caballo

Las casillas válidas deben iluminarse automáticamente.

Luego:
- presentar táctica “La Horquilla”
- pintar movimientos recomendados
- mostrar líneas/flechas
- explicar visualmente

Después:
- partida corta contra IA fácil
- el jugador debe aplicar la táctica
- al ganar:
  - recibe monedas
  - XP
  - desbloquea maniobra

El FTUE debe sentirse:
- rápido,
- satisfactorio,
- muy visual,
- sin mucho texto.

====================================================
PARTIDA CONTRA IA
====================================================

Crear sistema básico de ajedrez funcional:
- tablero interactivo
- piezas movibles
- validación de movimientos
- turnos
- jaque
- jaque mate

IA:
- dificultad fácil inicialmente
- movimientos básicos inteligentes
- priorizar capturas simples

Utilizar:
- chess.js
- stockfish.js (si es posible)

====================================================
AYUDAS VISUALES EN PARTIDA
====================================================

Agregar sistema de asistencia visual:

1. Casillas amarillas:
movimientos recomendados

2. Casillas rojas:
peligro o amenaza

3. Casillas verdes:
jugada maestra

4. Flechas:
mostrar táctica sugerida

5. Dashboard lateral:
explicar estrategia actual

Ejemplo:
“La Horquilla permite atacar dos piezas al mismo tiempo.”

====================================================
ENTRENAMIENTO TÁCTICO
====================================================

Modo entrenamiento:
- puzzles rápidos
- tácticas guiadas
- aprender:
  - horquilla
  - clavada
  - descubierto
  - mate pastor

Cada táctica:
- explicación visual
- ejemplo
- práctica interactiva
- recompensa al completar

====================================================
PARTIDAS ONLINE
====================================================

Implementar sistema online básico:

Backend:
- Socket.io

Características:
- matchmaking simple
- partidas 1v1
- sincronización de movimientos
- reloj simple

No hace falta ranking complejo todavía.

====================================================
REVISIÓN POST-PARTIDA
====================================================

Pantalla de análisis:
- lista de movimientos
- tablero interactivo
- flechas de jugadas
- comentarios automáticos

Ejemplo:
“Buena jugada.”
“Perdiste material.”
“Excelente táctica.”

====================================================
PROGRESIÓN
====================================================

Sistema de XP:
- subir niveles
- desbloquear tácticas
- desbloquear modos

Monedas:
- completar puzzles
- ganar partidas
- misiones diarias

====================================================
MISIÓNES Y RETENCIÓN
====================================================

Agregar:
- misión diaria
- recompensa diaria
- mini juegos

Mini juegos:
- resolver tácticas
- sobrevivir ataques
- carrera de peones

====================================================
BASE DE DATOS MONGODB
====================================================

Crear colecciones:

users
matches
puzzles
tactics
missions
inventory
stats

Guardar:
- nivel
- XP
- monedas
- tácticas desbloqueadas
- historial de partidas
- estadísticas

====================================================
ARQUITECTURA
====================================================

Separar:
- frontend
- backend
- lógica del tablero
- lógica online
- sistema de tutoriales

Usar estructura limpia y escalable.

====================================================
IMPORTANTE
====================================================

Prioridad máxima:
1. FTUE excelente
2. Mobile first
3. Visual claro
4. Aprendizaje divertido
5. Sistema de ayudas
6. Partida vs IA funcional

No crear algo complejo visualmente.
Debe sentirse:
- moderno,
- simple,
- adictivo,
- educativo.

====================================================
ENTREGAR
====================================================

Quiero:
- estructura completa del proyecto
- archivos organizados
- código funcional
- comentarios importantes
- instrucciones para correr localmente
- scripts npm
- conexión MongoDB funcionando
- backend y frontend integrados

Además:
- generar datos mock iniciales
- tácticas iniciales cargadas
- usuarios de prueba
- IA básica funcionando

La primera versión debe ser jugable.
