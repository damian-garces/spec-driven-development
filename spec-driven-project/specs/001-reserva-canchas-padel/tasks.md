---

description: "Task list template for feature implementation"
---

# Tasks: Reserva de Canchas de Pádel

**Input**: Design documents from `/specs/001-reserva-canchas-padel/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: No solicitados explícitamente en spec.md (no se pide TDD ni suite de tests); por lo tanto esta lista NO incluye tareas de escritura de tests, en línea con el Principio IV (Simplicidad Ante Todo / YAGNI) y "Cero Código Sombra" de la constitución. La validación funcional se hace ejecutando los escenarios de `quickstart.md`.

**Organization**: Las tareas están agrupadas por historia de usuario (US1, US2, US3) para permitir implementación y prueba independiente de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece (US1, US2, US3)
- Cada tarea incluye la ruta de archivo exacta

## Path Conventions

Aplicación web (Opción 2 de plan.md): `backend/src/`, `frontend/src/`, `db/` en la raíz del repositorio.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización del proyecto y estructura base

- [X] T001 Create root project structure per plan.md: `backend/`, `frontend/`, `db/` directories at repository root
- [X] T002 [P] Initialize backend TypeScript/Express project in `backend/package.json` and `backend/tsconfig.json` with dependencies `express`, `better-sqlite3`, `bcrypt`, `express-session`, plus their `@types/*` dev dependencies
- [X] T003 [P] Initialize frontend React + TypeScript project (Vite scaffold) in `frontend/package.json`, `frontend/tsconfig.json`, `frontend/vite.config.ts`, with Tailwind CSS configured in `frontend/tailwind.config.js` and `frontend/postcss.config.js`
- [X] T004 [P] Configure ESLint + Prettier for the backend in `backend/.eslintrc.cjs` and `backend/.prettierrc`, enforcing `camelCase` for functions/variables and `PascalCase` for interfaces/types per the constitution's Principio IV
- [X] T005 [P] Configure ESLint + Prettier for the frontend in `frontend/.eslintrc.cjs` and `frontend/.prettierrc`, enforcing the same naming conventions and functional-components-only rule (no class components)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura núcleo que TODAS las historias de usuario necesitan

**⚠️ CRITICAL**: Ninguna historia de usuario puede comenzar hasta que esta fase esté completa

- [X] T006 Create SQLite schema in `backend/src/db/schema.sql` with tables `usuarios` (`id` PK, `correo TEXT UNIQUE NOT NULL`, `password_hash TEXT NOT NULL`, `fecha_registro TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`), `canchas` (`id` PK, `nombre TEXT UNIQUE NOT NULL`), and `reservas` (`id` PK, `usuario_id INTEGER NOT NULL REFERENCES usuarios(id)`, `cancha_id INTEGER NOT NULL REFERENCES canchas(id)`, `fecha TEXT NOT NULL`, `hora_inicio TEXT NOT NULL`, `hora_fin TEXT NOT NULL`, `estado TEXT NOT NULL CHECK(estado IN ('activa','cancelada','completada'))`, `creada_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`), plus the partial unique index `CREATE UNIQUE INDEX ux_reservas_bloque_activo ON reservas(cancha_id, fecha, hora_inicio) WHERE estado = 'activa'` exactly as specified in data-model.md
- [X] T007 Create DB connection + schema bootstrap module in `backend/src/db/connection.ts` that opens `db/padel.db` via `better-sqlite3` and applies `schema.sql` on startup if tables don't exist
- [X] T008 Create idempotent seed script in `backend/src/db/seed.ts` that inserts the 5 fixed canchas ("Cancha Laureles", "Cancha El Poblado", "Cancha Belén", "Cancha Robledo", "Cancha Envigado") only if the `canchas` table is empty, per Principio I (catálogo cerrado e inmutable, sin endpoint de creación) — depends on T006, T007
- [X] T009 [P] Implement central error-handling middleware in `backend/src/middleware/errorHandler.ts` that maps thrown errors to semantic HTTP codes (400/401/403/404/409) and a `{ "error": "<mensaje amigable>" }` JSON body, never leaking stack traces, per Principio V
- [X] T010 [P] Implement session middleware configuration (`express-session` with an HTTP-only cookie) in `backend/src/middleware/session.ts` per the decision in research.md §1
- [X] T011 [P] Implement auth guard middleware `requireAuth` in `backend/src/middleware/auth.ts` that returns `401 Unauthorized` with `{ "error": "No hay sesión activa." }` when there is no active session, per Principio III
- [X] T012 Create Express app entrypoint in `backend/src/api/app.ts` wiring JSON body parsing, the session middleware (T010), and the error handler (T009) as the last middleware — depends on T009, T010, T011
- [X] T013 Create backend server bootstrap in `backend/src/server.ts` that runs the schema bootstrap (T007) and seed (T008) on startup, then starts the Express app (T012) listening on a configurable port — depends on T007, T008, T012
- [X] T014 [P] Create frontend API client service in `frontend/src/services/apiClient.ts`: a `fetch` wrapper sending `credentials: "include"` (to carry the session cookie) and normalizing JSON error bodies from the backend
- [X] T015 [P] Create frontend app shell and router in `frontend/src/App.tsx` with placeholder routes for `Login`, `Registro`, `Canchas`, `DetalleCancha`, and `MisReservas` pages
- [X] T016 [P] Configure Tailwind base styles and layout in `frontend/src/index.css` and `frontend/src/main.tsx`

**Checkpoint**: Fundación lista — la implementación de historias de usuario puede comenzar

---

## Phase 3: User Story 1 - Registro e Inicio de Sesión (Priority: P1) 🎯 MVP

**Goal**: Un visitante puede registrarse con correo/contraseña e iniciar sesión; solo usuarios con sesión activa pueden acceder a disponibilidad completa y creación de reservas.

**Independent Test**: Registrar una cuenta nueva, cerrar sesión, volver a iniciar sesión con las mismas credenciales; verificar que un visitante sin sesión no puede acceder a la disponibilidad completa ni a la creación de reservas.

### Implementation for User Story 1

- [X] T017 [P] [US1] Create usuario data-access module in `backend/src/models/usuarios.ts` with `insertUsuario(correo, passwordHash)` and `findUsuarioByCorreo(correo)`, normalizing `correo` to lowercase before every insert/comparison and relying on the `UNIQUE NOT NULL` constraint on `usuarios.correo` from data-model.md
- [X] T018 [US1] Implement auth service in `backend/src/services/authService.ts`: `registrar(correo, password)` validates email format and a minimum password length, hashes the password with `bcrypt`, and rejects an already-registered `correo` with a friendly conflict (FR-002); `iniciarSesion(correo, password)` compares via `bcrypt` and rejects wrong credentials (FR-003) — depends on T017
- [X] T019 [US1] Implement `POST /api/auth/registro` route in `backend/src/api/authRoutes.ts` returning `201` on success, `400` on invalid input, `409 { "error": "El correo ya está en uso." }` on duplicate email, per contracts/api.md — depends on T018
- [X] T020 [US1] Implement `POST /api/auth/login` route in `backend/src/api/authRoutes.ts` establishing the session cookie on success (`200`) or returning `401 { "error": "Correo o contraseña incorrectos." }`, per contracts/api.md — depends on T018, T010
- [X] T021 [US1] Implement `POST /api/auth/logout` route in `backend/src/api/authRoutes.ts` destroying the active session (`200 { "ok": true }`) or `401` if there was none, per contracts/api.md — depends on T020
- [X] T022 [US1] Implement `GET /api/auth/me` route in `backend/src/api/authRoutes.ts` returning the session user (`200`) or `401 { "error": "No hay sesión activa." }`, per contracts/api.md — depends on T020
- [X] T023 [US1] Wire `authRoutes` into the Express app in `backend/src/api/app.ts` — depends on T019, T020, T021, T022, T012
- [X] T024 [P] [US1] Create Registro page in `frontend/src/pages/Registro.tsx` calling `POST /api/auth/registro` and showing the friendly error on `400`/`409` — depends on T014, T019
- [X] T025 [P] [US1] Create Login page in `frontend/src/pages/Login.tsx` calling `POST /api/auth/login` and showing the friendly error on `401` — depends on T014, T020
- [X] T026 [P] [US1] Create session/auth React context and hook in `frontend/src/services/authContext.tsx` exposing the current user (via `GET /api/auth/me`), a `login`/`logout` action, and a loading state — depends on T014, T022
- [X] T027 [US1] Implement a `RequireAuth` route-guard component in `frontend/src/components/RequireAuth.tsx` that redirects an unauthenticated visitor to `Login` when trying to reach the disponibilidad or reservas routes (FR-004) — depends on T026
- [X] T028 [US1] Wire the Registro/Login pages, the `authContext` provider, and the `RequireAuth` guard into `frontend/src/App.tsx` router — depends on T024, T025, T026, T027, T015

**Checkpoint**: En este punto, la Historia de Usuario 1 debe ser completamente funcional y probable de forma independiente

---

## Phase 4: User Story 2 - Consultar Disponibilidad y Reservar una Cancha (Priority: P1)

**Goal**: Un usuario autenticado elige una de las 5 canchas y una fecha, ve la grilla de 15 bloques horarios (07:00–22:00, disponible/reservado), y confirma una reserva sobre un bloque libre, con revalidación atómica anti-colisión y límite de una reserva activa global.

**Independent Test**: Con un usuario autenticado y datos de prueba, seleccionar cancha y fecha, confirmar que los bloques ocupados se muestran como "Reservados" y los libres como "Disponibles", y completar una reserva sobre un bloque libre; verificar rechazo ante colisión y ante una segunda reserva activa.

### Implementation for User Story 2

- [X] T029 [P] [US2] Create canchas data-access module in `backend/src/models/canchas.ts` with `listCanchas()` and `findCanchaById(id)`, reading the fixed catalog seeded in T008
- [X] T030 [P] [US2] Create reservas data-access module in `backend/src/models/reservas.ts` with `findBloquesReservados(canchaId, fecha)`, `findReservaActivaByUsuario(usuarioId)`, `insertReservaAtomic(usuarioId, canchaId, fecha, horaInicio, horaFin)` (wrapped in a `BEGIN IMMEDIATE` transaction per research.md §3), and `findReservaById(id)`, relying on the `ux_reservas_bloque_activo` partial unique index from data-model.md as the DB-level backstop
- [X] T031 [P] [US2] Update the shared `BLOQUES_DIA` constant in `backend/src/services/horarios.ts` to the 15 operational start times (`07:00`…`21:00`, rango operativo 07:00–22:00 per the 2026-09-13 clarification) and rebuild the disponibilidad service in `backend/src/services/disponibilidadService.ts` so it builds a 15-block grid (`07:00`→`22:00`, one entry per operational hour, no wraparound past `21:00`) marking each block `"disponible"` or `"reservado"` for a given cancha + fecha (FR-008) — depends on T029, T030 — *superseded/extended by Phase 7 (T053-T056, FR-021): the full 15-block grid described here only applies to future dates*
- [X] T032 [US2] Re-verify reserva service in `backend/src/services/reservaService.ts`: `crearReserva(usuarioId, canchaId, fecha, horaInicio)` validates the block is one of the 15 aligned hourly slots within the 07:00–22:00 operational range (via the updated `BLOQUES_DIA`/`esHoraInicioValida` from T031, FR-008, FR-013) and not in the past (FR-014), then — inside the same transaction — revalidates availability and the user's active-reservation limit before inserting (FR-010, FR-011, FR-015), translating a collision into `409 { "error": "Este horario ya no está disponible." }` and an existing active reservation into `409 { "error": "Ya tienes una reserva activa. Cancélala antes de crear una nueva." }`; confirm a request for `horaInicio: "23:00"` or `"03:00"` is rejected with `400` — depends on T030, T031
- [X] T033 [US2] Implement `GET /api/canchas` route (no auth required) in `backend/src/api/canchasRoutes.ts` returning the 5 canchas in fixed order, per contracts/api.md — depends on T029
- [X] T034 [US2] Implement `GET /api/canchas/:id/disponibilidad` route in `backend/src/api/canchasRoutes.ts`, protected by `requireAuth` (T011), returning `400`/`401`/`404` per contracts/api.md — depends on T031, T033, T011 — *superseded/extended by Phase 7 (T053-T056, FR-021): the response filters past blocks when `fecha` is today*
- [X] T035 [US2] Implement `POST /api/reservas` route in `backend/src/api/reservasRoutes.ts`, protected by `requireAuth` (T011), returning `201`/`400`/`401`/`404`/`409` per contracts/api.md — depends on T032, T011
- [X] T036 [US2] Wire `canchasRoutes` and `reservasRoutes` into the Express app in `backend/src/api/app.ts` — depends on T034, T035, T023
- [X] T037 [P] [US2] Create Canchas listing page in `frontend/src/pages/Canchas.tsx` calling `GET /api/canchas` (accessible without session, FR-006) — depends on T014, T033
- [X] T038 [US2] Re-verify the date-picker + schedule grid component in `frontend/src/components/GrillaHorarios.tsx` renders correctly for the 15-block (07:00–22:00) grid returned after T031 — it already maps generically over the `bloques` prop, so confirm the layout still reads well with 15 items instead of 24 and adjust the `grid-cols-*` classes if needed — depends on T014, T034, T031 — *superseded/extended by Phase 7 (T053-T056, FR-021): the grid may render fewer than 15 blocks, or an empty state, when `fecha` is today*
- [X] T039 [US2] Create DetalleCancha page in `frontend/src/pages/DetalleCancha.tsx` combining date selection, `GrillaHorarios`, and the reservation-confirmation flow, showing the friendly `409` messages (bloque no disponible / ya tiene reserva activa) — depends on T037, T038, T035, T027
- [X] T040 [US2] Wire the Canchas and DetalleCancha pages into `frontend/src/App.tsx` router, protecting `DetalleCancha` with `RequireAuth` — depends on T039, T028

**Checkpoint**: En este punto, las Historias de Usuario 1 y 2 deben funcionar de forma independiente

---

## Phase 5: User Story 3 - Gestionar Mis Reservas (Priority: P2)

**Goal**: Un usuario autenticado consulta su panel de reservas futuras e historial (pasadas y canceladas), y puede cancelar una reserva futura.

**Independent Test**: Con un usuario que ya tiene una reserva futura y una pasada (datos de prueba), abrir "Mis Reservas", verificar ambas listas con cancha/fecha/hora/estado, y cancelar la reserva futura.

### Implementation for User Story 3

- [X] T041 [US3] Extend the reservas data-access module in `backend/src/models/reservas.ts` with `findReservasByUsuario(usuarioId)`, separating `futuras` from `historial` and deriving the effective `"completada"` state when `fecha` + `hora_fin` is in the past for a still-`"activa"` row, per the state machine in data-model.md — depends on T030
- [X] T042 [US3] Implement the "mis reservas" read in `backend/src/services/reservaService.ts` building the `{ futuras, historial }` response shape from contracts/api.md, each item including cancha nombre/fecha/hora/estado — depends on T041
- [X] T043 [US3] Implement cancellation logic in `backend/src/services/reservaService.ts`: `cancelarReserva(usuarioId, reservaId)` returns `403` if the reservation does not belong to `usuarioId` (Edge Case del spec), `409 { "error": "No se puede cancelar una reserva que ya pasó." }` if its effective state is already `"completada"` (FR-018), otherwise sets `estado = 'cancelada'`, immediately freeing the block for other users (FR-019) — depends on T030
- [X] T044 [US3] Implement `GET /api/reservas/mias` route in `backend/src/api/reservasRoutes.ts`, protected by `requireAuth` (T011), per contracts/api.md — depends on T042, T011
- [X] T045 [US3] Implement `DELETE /api/reservas/:id` route in `backend/src/api/reservasRoutes.ts`, protected by `requireAuth` (T011), returning `200`/`401`/`403`/`404`/`409` per contracts/api.md — depends on T043, T011
- [X] T046 [US3] Register the two new routes on the already-wired `reservasRoutes` router in `backend/src/api/app.ts` — depends on T044, T045, T036
- [X] T047 [P] [US3] Create MisReservas page in `frontend/src/pages/MisReservas.tsx` calling `GET /api/reservas/mias` and rendering the "futuras" and "historial" lists separately, each item showing cancha/fecha/hora/estado — depends on T014, T044
- [X] T048 [US3] Add a cancellation action with an explicit confirmation step to `frontend/src/pages/MisReservas.tsx`, calling `DELETE /api/reservas/:id` and refreshing both lists on success (FR-017) — depends on T047, T045
- [X] T049 [US3] Wire the MisReservas page into `frontend/src/App.tsx` router, protected by `RequireAuth` — depends on T048, T028

**Checkpoint**: Todas las historias de usuario deben estar funcionalmente completas de forma independiente

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras que afectan a varias historias de usuario

- [X] T050 [P] Complete the friendly error-message mapping in `frontend/src/services/apiClient.ts` for every documented status code (400/401/403/404/409) so the UI never shows a raw error or stack trace (Principio V)
- [X] T051 [P] Document backend/frontend setup and run commands in `Readme.md`, matching the "Puesta en marcha" steps of `specs/001-reserva-canchas-padel/quickstart.md`
- [X] T052 Re-execute the three end-to-end scenarios in `specs/001-reserva-canchas-padel/quickstart.md` manually against the running app — including Escenario 1's updated 15-block/07:00–22:00 expectation and Escenario 2's new step 8 (rejecting `horaInicio: "23:00"`) — and fix any discrepancy found — depends on T031, T032, T038

---

## Phase 7: Ajuste US2 — Grilla de hoy con bloques pasados filtrados (FR-021)

**Purpose**: Fases 1-6 ya estaban completas cuando el spec se amplió (aclaración 2026-09-13) con FR-021: la grilla de disponibilidad de **hoy** debe excluir los bloques cuya `horaInicio` ya transcurrió (arreglo de longitud variable), mientras que las fechas futuras siguen devolviendo los 15 bloques completos. `research.md` §5, `data-model.md` y `contracts/api.md` ya documentan esta decisión; esta fase la implementa. Es un incremento sobre US2, no una historia nueva.

**Independent Test**: Con sesión activa, consultar `GET /api/canchas/:id/disponibilidad` para hoy a media tarde y confirmar menos de 15 bloques (ninguno anterior a la hora actual); repetir con una fecha futura y confirmar los 15 bloques completos; consultar hoy después de las 21:00 y confirmar `bloques: []` sin error.

- [X] T053 [US2] Add `esFechaPasada(fecha: string, ahora?: Date): boolean` helper to `backend/src/services/horarios.ts`, comparing the `YYYY-MM-DD` `fecha` string against today's date (same string-comparison approach as research.md §4) and returning `true` when `fecha` is strictly before today
- [X] T054 [US2] Update `obtenerDisponibilidad` in `backend/src/services/disponibilidadService.ts` (depends on T053): throw `AppError(400, "La fecha indicada ya pasó.")` when `esFechaPasada(fecha)` is true (contracts/api.md), and filter the returned `bloques` array to drop entries where the existing `bloqueYaPaso(fecha, horaInicio)` helper from `horarios.ts` returns `true` (FR-021) — a future `fecha` keeps all 15 blocks (none have passed yet) while today's `fecha` keeps only the blocks from the current hour onward, possibly ending up `[]` once the last operational block has passed
- [X] T055 [P] [US2] Update `GrillaHorarios.tsx` in `frontend/src/components/GrillaHorarios.tsx` to render a friendly empty-state message (e.g. "No quedan horarios disponibles hoy.") when `bloques` is `[]`, instead of an empty grid with no explanation (FR-021) — depends on T054
- [X] T056 [US2] Manually validate Escenario 2b of `specs/001-reserva-canchas-padel/quickstart.md` (grilla de hoy con bloques pasados filtrados) against the running app: a same-day query mid-afternoon returns fewer than 15 blocks with none before the current hour, a future-date query still returns all 15, and a same-day query after 21:00 returns `bloques: []` without error — depends on T054, T055

**Checkpoint**: US2 cumple FR-021 sin afectar el comportamiento ya validado para fechas futuras

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — puede iniciar de inmediato
- **Foundational (Phase 2)**: Depende de Setup — BLOQUEA todas las historias de usuario
- **User Stories (Phase 3-5)**: Todas dependen de que Foundational esté completa
  - US1 (P1) no depende de otra historia
  - US2 (P1) depende funcionalmente de que exista una sesión (US1) para probarse end-to-end, pero su código de disponibilidad/reserva es un módulo separado
  - US3 (P2) depende de que existan reservas (US2) para tener datos que gestionar, y de sesión (US1)
- **Polish (Phase 6)**: Depende de que las historias deseadas estén completas
- **Ajuste FR-021 (Phase 7)**: Depende de que Phase 4 (US2) esté completa; extiende `disponibilidadService.ts`/`GrillaHorarios.tsx` ya construidos, no bloquea ni es bloqueada por Phase 5/6

### User Story Dependencies

- **User Story 1 (P1)**: Puede iniciar después de Foundational (Phase 2) — sin dependencias de otras historias
- **User Story 2 (P1)**: Puede iniciar después de Foundational; su backend (T029-T036) es independiente de US1, pero probarla end-to-end requiere una sesión activa (creada por US1)
- **User Story 3 (P2)**: Puede iniciar después de Foundational; su backend (T041-T046) reutiliza el módulo de reservas de US2 (T030) y su UI depende de la ruta protegida (T027/T028 de US1)

### Within Each User Story

- Modelos de datos antes que servicios
- Servicios antes que endpoints
- Endpoints backend antes que las páginas frontend que los consumen
- Historia completa antes de pasar a la siguiente prioridad

### Parallel Opportunities

- Todas las tareas [P] de Setup pueden ejecutarse en paralelo
- Todas las tareas [P] de Foundational pueden ejecutarse en paralelo entre sí
- Dentro de US1: T017 (modelo) es paralelo a otras tareas de Setup/Foundational restantes; T024/T025/T026 (páginas y contexto, archivos distintos) son paralelas entre sí
- Dentro de US2: T029/T030 (modelos, archivos distintos) son paralelos; T031 (servicios + `horarios.ts`) debe completarse antes de T032 y T038, ya que ambos re-verifican su comportamiento contra el nuevo rango de 15 bloques que T031 introduce en `BLOQUES_DIA`
- Distintos miembros de un equipo podrían tomar US1, US2 (backend) y US3 (backend) en paralelo tras Foundational, aunque las pruebas end-to-end de US2/US3 requieran que US1 esté disponible

---

## Parallel Example: User Story 2 (backend)

```bash
# Lanzar juntos los módulos de datos de US2 (archivos distintos):
Task: "Create canchas data-access module in backend/src/models/canchas.ts"
Task: "Create reservas data-access module in backend/src/models/reservas.ts"

# Una vez completos los modelos, actualizar primero el rango operativo compartido y el servicio de disponibilidad:
Task: "Update BLOQUES_DIA in backend/src/services/horarios.ts and rebuild backend/src/services/disponibilidadService.ts for the 15-block range"

# Solo después, re-verificar en paralelo los consumidores de BLOQUES_DIA (archivos distintos):
Task: "Re-verify reserva service in backend/src/services/reservaService.ts"
Task: "Re-verify GrillaHorarios in frontend/src/components/GrillaHorarios.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloquea todas las historias)
3. Completar Phase 3: User Story 1 (registro/login)
4. Completar Phase 4: User Story 2 (disponibilidad + reserva) — juntas, US1+US2 forman el producto mínimo utilizable descrito en spec.md ("sin esta historia no existe producto utilizable")
5. **DETENER y VALIDAR**: ejecutar los Escenarios 1 y 2 de `quickstart.md` de forma independiente
6. Desplegar/demostrar si está listo

### Incremental Delivery

1. Setup + Foundational → fundación lista
2. Agregar US1 → validar registro/login de forma aislada
3. Agregar US2 → validar disponibilidad + reserva + anti-colisión (Escenario 2 de quickstart.md) → MVP completo
4. Agregar US3 → validar panel "Mis Reservas" y cancelación (Escenario 3 de quickstart.md)
5. Fase de Polish → validación completa de los 3 escenarios de quickstart.md

### Parallel Team Strategy

Con varios desarrolladores:

1. El equipo completa Setup + Foundational en conjunto
2. Una vez lista la fundación:
   - Desarrollador A: backend + frontend de US1
   - Desarrollador B: backend de US2 (T029-T036), en paralelo, ya que no depende del código de US1
   - Desarrollador C: espera a que T030 (modelo de reservas) esté listo para avanzar en el backend de US3 (T041-T046)
3. La integración final de cada historia en el router (T028, T040, T049) se sincroniza al terminar cada una

---

## Notes

- [P] tareas = archivos distintos, sin dependencias pendientes entre ellas
- [Story] etiqueta cada tarea con su historia de usuario para trazabilidad
- Cada historia de usuario debe ser completable y probable de forma independiente
- Confirmar contra `quickstart.md` al cerrar cada historia
- Hacer commit tras cada tarea o grupo lógico de tareas
- Detenerse en cada checkpoint para validar la historia de forma independiente
- Evitar: tareas vagas, conflictos de archivo simultáneos, dependencias cruzadas entre historias que rompan su independencia
