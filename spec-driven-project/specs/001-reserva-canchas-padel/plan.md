# Implementation Plan: Reserva de Canchas de Pádel

**Branch**: `001-reserva-canchas-padel` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-reserva-canchas-padel/spec.md`

## Summary

Aplicación web para que usuarios autenticados reserven bloques horarios de 1 hora en un catálogo fijo de 5 canchas de pádel, con prevención estricta de doble reserva (revalidación atómica antes de confirmar), una única reserva activa por usuario a nivel global, y un panel personal de gestión (futuras / historial con estado Completada o Cancelada). Enfoque técnico: SPA en React (TypeScript) consumiendo una API REST en Node.js/Express (TypeScript), con persistencia en SQLite (`better-sqlite3`), siguiendo el stack y la estructura de carpetas obligados por la constitución del proyecto.

## Technical Context

**Language/Version**: TypeScript 5.x sobre Node.js 20 LTS (backend) y React 18 (frontend)

**Primary Dependencies**: Express (backend API), `better-sqlite3` (acceso a datos), React + Tailwind CSS (frontend), `bcrypt` (hash de contraseñas), `express-session` o JWT firmado (gestión de sesión — ver research.md), `vitest`/`jest` + `supertest` (tests backend), `vitest` + `@testing-library/react` (tests frontend)

**Storage**: SQLite local, archivo `db/padel.db`, acceso mediante SQL puro vía `better-sqlite3` (sin ORM pesado, por Constitución §Stack Tecnológico)

**Testing**: Tests de contrato (API) e integración con `supertest` sobre Express; tests unitarios de lógica de disponibilidad/anti-colisión; tests de componentes React con Testing Library

**Target Platform**: Navegador web moderno (cliente) + servidor Node.js Linux (API), ejecución local/single-tenant

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Respuesta de API < 300ms p95 en operaciones de lectura (disponibilidad) y < 500ms p95 en confirmación de reserva, bajo carga de uso de un solo club (decenas de usuarios concurrentes, no miles) — *objetivo aspiracional, no verificado con ninguna tarea de medición o carga en tasks.md*

**Constraints**: Consistencia estricta anti-doble-reserva (Principio II, NON-NEGOTIABLE) mediante transacción atómica SQLite; sin dependencias externas de red (pagos, email/SMS); una única zona horaria del servidor

**Scale/Scope**: 5 canchas fijas, 15 bloques horarios/día/cancha (rango operativo 07:00–22:00), escala de un club individual (no multi-tenant); 3 historias de usuario (auth, exploración+reserva, gestión de mis reservas)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Notas |
|---|---|---|
| I. Catálogo Cerrado de Canchas (NON-NEGOTIABLE) | ✅ PASS | Las 5 canchas se modelan como filas fijas (seed), sin endpoint de creación/edición/borrado de canchas. Horarios siempre en formato 24h. |
| II. Prevención de Doble Reserva (NON-NEGOTIABLE) | ✅ PASS | La confirmación de reserva se implementa como una única transacción SQLite (`BEGIN IMMEDIATE` + `INSERT ... WHERE NOT EXISTS` con `UNIQUE(cancha_id, fecha, hora_inicio)` como restricción de respaldo) — ver research.md y data-model.md. |
| III. Autenticación Obligatoria | ✅ PASS | Todos los endpoints de disponibilidad detallada, creación y cancelación de reservas exigen sesión válida vía middleware de autenticación. |
| IV. Simplicidad Ante Todo (YAGNI) | ⚠ PARTIAL | Estructura plana `/frontend`, `/backend`, `/db`; sin capas hexagonal/clean; componentes funcionales + Hooks; sin patrones de diseño adicionales — todo eso cumple. Pero la enmienda v1.1.0 (2026-09-13) añadió: identificadores de código DEBEN estar en inglés, términos de dominio solo en mensajes/datos. El código ya implementado usa nombres en español (`crearReserva`, `cancelarReserva`, `canchaId`, `horaInicio`, `usuarios.ts`, `reservaService.ts`, etc.) y no cumple esta sub-regla todavía. Ver Complexity Tracking. |
| V. Manejo de Errores Semántico y Amigable | ✅ PASS | Contratos de API (`contracts/`) definen 400/401/403/404/409 explícitos; el frontend traduce cada código a mensaje amigable, nunca expone stack traces. |

**Resultado**: 1 violación documentada y justificada (Principio IV, sub-regla de idioma de identificadores) — ver Complexity Tracking. Las demás 4 principios pasan sin excepciones.

**Re-evaluación post-diseño (tras Fase 1)**: el diseño concreto en
`data-model.md` (índice único parcial `ux_reservas_bloque_activo` +
transacción `BEGIN IMMEDIATE`) y `contracts/api.md` (guard de autenticación
en todos los endpoints de reservas/disponibilidad, códigos 400/401/403/404/409
explícitos) confirma el cumplimiento de los 5 principios sin introducir
nuevas violaciones. Gate sigue en ✅ PASS.

**Re-evaluación tras enmienda de la constitución (v1.1.0, 2026-09-13)**: la
constitución se amplió con una regla nueva en el Principio IV (identificadores
de código en inglés). Esta re-ejecución de `/speckit-plan` no modifica código
ni renombra nada (fuera de su alcance); solo actualiza este gate para reflejar
honestamente que la implementación existente, ya convergida (`/speckit-converge`
reportó 0 gaps el 2026-09-13, antes de esta enmienda), no cumple la sub-regla
nueva. Se documenta como violación justificada en Complexity Tracking en vez de
bloquear el gate, porque bloquear no aporta valor sobre una feature ya
implementada y validada — el remedio es una tarea de refactor explícita, no
una repetición de este comando de planificación.

## Project Structure

### Documentation (this feature)

```text
specs/001-reserva-canchas-padel/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── api.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── db/               # apertura de conexión SQLite, migraciones/seed
│   ├── models/            # acceso a datos (queries SQL puras) para usuarios, canchas, reservas
│   ├── services/          # lógica de negocio: autenticación, disponibilidad, anti-colisión
│   ├── api/                # rutas Express (auth, canchas, reservas)
│   └── middleware/         # auth guard, manejo central de errores → códigos HTTP semánticos
└── tests/
    ├── contract/            # tests de contrato de cada endpoint
    ├── integration/         # flujos completos (registro→login→reserva→cancelación)
    └── unit/                # lógica de disponibilidad y validaciones puras

frontend/
├── src/
│   ├── components/        # ScheduleGrid, etc.
│   ├── pages/               # Login, Register, Courts, CourtDetail, MyReservations
│   └── services/            # cliente HTTP hacia la API backend
└── tests/
    ├── integration/
    └── unit/

db/
└── padel.db                # archivo SQLite (generado; catálogo de canchas via seed)
```

**Structure Decision**: Aplicación web de dos proyectos (`frontend`, `backend`) más carpeta `db/` para el archivo SQLite, tal como exige la Constitución (estructura plana obligatoria, sin capas `/domain`, `/application`, `/infrastructure`). Esto corresponde a la Opción 2 (Web application) de las estructuras estándar, con `db/` añadida explícitamente por mandato constitucional del Stack Tecnológico.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| Principio IV (enmienda v1.1.0): identificadores de código deben estar en inglés; el código de esta feature usa nombres en español (`crearReserva`, `cancelarReserva`, `obtenerDisponibilidad`, `canchaId`, `horaInicio`, `usuarios.ts`, `canchas.ts`, `reservas.ts`, `horarios.ts`, `authService.ts`→interno en español, etc.) | La feature ya estaba implementada y convergida (0 gaps reportados por `/speckit-converge`) antes de que esta regla se añadiera a la constitución el 2026-09-13; no existía cuando se escribió el código. | Renombrar ahora en esta misma ejecución de `/speckit-plan` está fuera de su alcance (este comando no edita código) y mezclaría una re-planificación de gate con un refactor extenso de docenas de identificadores en todo el stack — más arriesgado que tratarlo como una tarea explícita, revisable y probada por separado (ver Next Actions en el reporte de este comando). |
