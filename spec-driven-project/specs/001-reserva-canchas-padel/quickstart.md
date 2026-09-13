# Quickstart: Reserva de Canchas de Pádel

**Feature**: `001-reserva-canchas-padel` | **Date**: 2026-09-12

Guía de validación end-to-end de las 3 historias de usuario del spec. Usa los
endpoints de [contracts/api.md](./contracts/api.md) y el modelo de
[data-model.md](./data-model.md).

## Prerrequisitos

- Node.js 20 LTS instalado.
- Dependencias instaladas en `backend/` y `frontend/` (`npm install` en cada uno).
- Archivo `db/padel.db` inicializado con el seed de las 5 canchas (script de
  seed del backend; ver `backend/src/db/`).

## Puesta en marcha

```bash
# Backend (API en, por ejemplo, http://localhost:3001)
cd backend && npm run dev

# Frontend (SPA en, por ejemplo, http://localhost:5173)
cd frontend && npm run dev
```

## Escenario 1 — Registro e inicio de sesión (US1, P1)

1. `POST /api/auth/register` con un correo nuevo y contraseña → esperar `201`.
2. Repetir el mismo `POST /api/auth/register` con el mismo correo → esperar
   `409` con mensaje "El correo ya está en uso." (FR-002).
3. `POST /api/auth/login` con las credenciales del paso 1 → esperar `200` y
   cookie de sesión establecida.
4. Sin cookie de sesión, `GET /api/courts/1/availability?date=<mañana>` →
   esperar `401` (FR-004).
5. Con la cookie del paso 3, repetir la llamada del paso 4 → esperar `200`
   con 15 bloques, del rango 07:00 a 22:00.

**Resultado esperado**: cuenta creada, sesión concedida, acceso a
disponibilidad completa condicionado a sesión activa. Corresponde a
Acceptance Scenarios 1-4 de US1.

## Escenario 2 — Consultar disponibilidad y reservar (US2, P1)

1. Con sesión activa (Escenario 1), elegir una cancha (`GET /api/courts`) y
   una fecha futura.
2. `GET /api/courts/:id/availability?date=<fecha>` → confirmar que todos
   los bloques aparecen como `disponible` (base de datos limpia).
3. `POST /api/reservations` con `{ courtId, date, startTime: "14:00" }` →
   esperar `201` y `status: "activa"`.
4. Repetir el `GET` de disponibilidad del paso 2 → el bloque `14:00` ahora
   debe aparecer como `reservado`.
5. Con un **segundo** usuario (otra sesión), intentar `POST /api/reservations`
   sobre el mismo `courtId`+`date`+`startTime: "14:00"` → esperar `409`
   "Este horario ya no está disponible." (FR-011, anti-colisión).
6. Con el primer usuario (que ya tiene una reserva activa del paso 3),
   intentar `POST /api/reservations` sobre otro bloque distinto → esperar `409`
   "Ya tienes una reserva activa..." (FR-015).
7. Intentar `POST /api/reservations` con una `date`/`startTime` ya pasada →
   esperar `400` (FR-014).
8. Intentar `POST /api/reservations` con `startTime: "23:00"` (fuera del rango
   operativo 07:00–22:00) → esperar `400` (FR-008, FR-013).

**Resultado esperado**: reserva creada solo cuando el bloque está libre, está
dentro del rango operativo, y el usuario no tiene otra activa; ninguna doble
reserva sobre el mismo bloque (SC-003). Corresponde a Acceptance Scenarios
1-5 de US2.

## Escenario 2b — Grilla de hoy con bloques pasados filtrados (US2, FR-021)

1. Con sesión activa, `GET /api/courts/:id/availability?date=<hoy>` un
   momento después de que haya pasado al menos un bloque operativo (por
   ejemplo, a las 14:00) → esperar `200` con `blocks` de **longitud menor a
   15**: ningún elemento con `startTime` anterior a la hora actual (ej. no
   debe aparecer `07:00`, `08:00`, …, `13:00`).
2. Repetir la misma llamada con una `date` futura → esperar los 15 bloques
   completos, sin filtrado (confirma que el filtro solo aplica a hoy).
3. Repetir la llamada de disponibilidad de hoy después de las 21:00 (último
   bloque operativo ya transcurrido) → esperar `200` con `blocks: []`
   (grilla vacía, no un error).

**Resultado esperado**: la grilla de hoy nunca ofrece bloques cuya hora de
inicio ya pasó, incluso consultando directamente el endpoint sin pasar por
la UI; las fechas futuras no se ven afectadas. Corresponde al Acceptance
Scenario 6 de US2 y al Edge Case de "disponibilidad de hoy tras el último
bloque operativo".

## Escenario 3 — Gestionar Mis Reservas (US3, P2)

1. Con el usuario del Escenario 2 (tiene 1 reserva activa), llamar
   `GET /api/reservations/mine` → esperar la reserva del paso 3 del Escenario 2
   en la lista `upcoming`, y `history` vacío o con reservas previas.
2. `DELETE /api/reservations/:id` sobre esa reserva, confirmando el `id` devuelto
   por el paso 3 del Escenario 2 → esperar `200` y `status: "cancelada"`.
3. Repetir `GET /api/reservations/mine` → la reserva ya no aparece en `upcoming`,
   sí aparece en `history` con `status: "cancelada"` y su fecha/hora
   original (FR-019).
4. Repetir el paso 6 del Escenario 2 (crear una nueva reserva en otro bloque)
   → ahora debe permitirse (`201`), porque el usuario quedó sin reserva
   activa tras la cancelación.
5. Con un `id` de reserva que pertenece a **otro** usuario, intentar
   `DELETE /api/reservations/:id` → esperar `403` (aislamiento entre usuarios,
   SC-005).
6. Sobre una reserva cuya `date`+`endTime` ya transcurrió (estado efectivo
   `completada`), intentar `DELETE /api/reservations/:id` → esperar `409`
   "No se puede cancelar una reserva que ya pasó." (FR-018).

**Resultado esperado**: el panel separa correctamente futuras e historial,
la cancelación libera el bloque y se conserva en el historial, y ningún
usuario puede ver o modificar reservas ajenas. Corresponde a Acceptance
Scenarios 1-4 de US3.

## Notas de validación transversal

- Todas las respuestas de error deben ser JSON `{ "error": "<mensaje amigable>" }`
  con el código HTTP correspondiente — nunca un stack trace (Principio V).
- El catálogo de canchas (`GET /api/courts`) debe devolver siempre las
  mismas 5 canchas fijas, sin variar entre ejecuciones (Principio I).
