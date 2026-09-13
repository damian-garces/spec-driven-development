# API Contract: Reserva de Canchas de Pádel

**Feature**: `001-reserva-canchas-padel` | **Date**: 2026-09-12

API REST servida por el backend Express. Todas las respuestas son JSON.
Errores siguen el Principio V (Manejo de Errores Semántico y Amigable):
código HTTP semántico + cuerpo `{ "error": "<mensaje amigable>" }`, nunca
stack traces. Los nombres de rutas y campos JSON están en inglés (Principio
IV, enmienda v1.1.0); el texto de los mensajes de error y los valores de
estado (`activa`/`cancelada`/`completada`, `disponible`/`reservado`) y los
nombres de canchas se mantienen en español, por ser contenido de datos, no
identificadores.

Convención de códigos usados en este contrato:

- `400` — solicitud inválida (formato, campos faltantes, bloque no alineado, fecha/hora pasada)
- `401` — sin sesión activa
- `403` — sesión activa pero intenta acceder/modificar un recurso de otro usuario
- `404` — recurso no encontrado (cancha o reserva inexistente)
- `409` — conflicto de reserva (bloque ya no disponible, o ya tiene una reserva activa)

## Autenticación

### `POST /api/auth/register`

Crea una cuenta nueva (FR-001, FR-002).

**Request body**:
```json
{ "email": "persona@example.com", "password": "una-contraseña-segura" }
```

**Responses**:
- `201 Created` → `{ "id": 1, "email": "persona@example.com" }`
- `400 Bad Request` → correo con formato inválido o contraseña demasiado corta
- `409 Conflict` → `{ "error": "El correo ya está en uso." }` (correo ya registrado)

### `POST /api/auth/login`

Inicia sesión (FR-003). Establece cookie de sesión HTTP-only.

**Request body**:
```json
{ "email": "persona@example.com", "password": "una-contraseña-segura" }
```

**Responses**:
- `200 OK` → `{ "id": 1, "email": "persona@example.com" }` + `Set-Cookie` de sesión
- `401 Unauthorized` → `{ "error": "Correo o contraseña incorrectos." }`

### `POST /api/auth/logout`

Cierra la sesión activa (FR-003). Requiere sesión activa.

**Responses**:
- `200 OK` → `{ "ok": true }`
- `401 Unauthorized` → sin sesión previa

### `GET /api/auth/me`

Devuelve el usuario de la sesión activa, si existe (soporte de UI para saber si hay sesión).

**Responses**:
- `200 OK` → `{ "id": 1, "email": "persona@example.com" }`
- `401 Unauthorized` → `{ "error": "No hay sesión activa." }`

## Canchas

### `GET /api/courts`

Lista estática de las 5 canchas (FR-006). **No requiere autenticación** —
un visitante puede ver el listado, pero no la disponibilidad detallada
(Assumptions del spec).

**Responses**:
- `200 OK` → `[{ "id": 1, "name": "Cancha Laureles" }, ...]` (5 elementos, orden fijo)

### `GET /api/courts/:id/availability?date=YYYY-MM-DD`

Grilla de bloques horarios, cubriendo el rango operativo de 07:00 a 22:00,
para una cancha y fecha (FR-007, FR-008). **Requiere autenticación** (FR-004:
disponibilidad completa solo para usuarios con sesión activa).

**Responses**:
- `200 OK` →
  ```json
  {
    "courtId": 1,
    "date": "2026-09-15",
    "blocks": [
      { "startTime": "07:00", "endTime": "08:00", "status": "disponible" },
      { "startTime": "14:00", "endTime": "15:00", "status": "reservado" }
    ]
  }
  ```
  Longitud de `blocks` (FR-021):
  - `date` **futura** respecto a hoy → siempre 15 elementos, uno por cada
    hora operativa, orden `07:00`→`21:00` (los bloques entre `22:00` y
    `06:00` no forman parte de la respuesta — FR-008).
  - `date` **igual a hoy** (fecha actual del servidor) → arreglo de longitud
    variable: solo los bloques cuya `startTime` sea igual o posterior a la
    hora actual del servidor, en el mismo orden; si ya transcurrió el último
    bloque operativo (ej. después de las 21:00), `blocks` es `[]` (grilla
    vacía, sin error).
- `400 Bad Request` →
  - `date` ausente o con formato inválido → `{ "error": "La fecha indicada no es válida." }`
  - `date` anterior a hoy (fecha pasada) → `{ "error": "La fecha indicada ya pasó." }`
- `401 Unauthorized` → sin sesión activa
- `404 Not Found` → `courtId` inexistente

## Reservas

### `POST /api/reservations`

Confirma una reserva sobre un bloque horario (FR-009 a FR-015). Requiere
autenticación. Ejecuta revalidación atómica anti-colisión (Principio II) y
rechaza si el usuario ya tiene una reserva activa (FR-015).

**Request body**:
```json
{ "courtId": 1, "date": "2026-09-15", "startTime": "14:00" }
```

**Responses**:
- `201 Created` →
  ```json
  {
    "id": 42,
    "courtId": 1,
    "courtName": "Cancha Laureles",
    "date": "2026-09-15",
    "startTime": "14:00",
    "endTime": "15:00",
    "status": "activa"
  }
  ```
- `400 Bad Request` — `{ "error": "El bloque horario seleccionado no es válido." }` (no alineado a la hora, fuera del rango operativo 07:00–22:00, o `date`/`startTime` ya transcurrida — FR-008, FR-013, FR-014)
- `401 Unauthorized` — sin sesión activa
- `404 Not Found` — `courtId` inexistente
- `409 Conflict` — dos variantes, mismo código, mensaje distinto:
  - `{ "error": "Este horario ya no está disponible." }` (otro usuario lo reservó primero — FR-011)
  - `{ "error": "Ya tienes una reserva activa. Cancélala antes de crear una nueva." }` (FR-015)

### `GET /api/reservations/mine`

Panel "Mis Reservas": futuras + historial (pasadas y canceladas) del usuario
de la sesión activa (FR-016). Requiere autenticación. Nunca devuelve
reservas de otros usuarios (FR-005, SC-005).

**Responses**:
- `200 OK` →
  ```json
  {
    "upcoming": [
      { "id": 42, "courtName": "Cancha Laureles", "date": "2026-09-15", "startTime": "14:00", "endTime": "15:00", "status": "activa" }
    ],
    "history": [
      { "id": 30, "courtName": "Cancha Belén", "date": "2026-09-01", "startTime": "10:00", "endTime": "11:00", "status": "completada" },
      { "id": 25, "courtName": "Cancha Robledo", "date": "2026-08-20", "startTime": "09:00", "endTime": "10:00", "status": "cancelada" }
    ]
  }
  ```
- `401 Unauthorized` — sin sesión activa

### `DELETE /api/reservations/:id`

Cancela una reserva futura propia (FR-017 a FR-019). Requiere autenticación
y confirmación explícita ya resuelta en el cliente antes de llamar a este
endpoint (el backend no re-pregunta, solo ejecuta).

**Responses**:
- `200 OK` → `{ "id": 42, "status": "cancelada" }`
- `401 Unauthorized` — sin sesión activa
- `403 Forbidden` — `{ "error": "No puedes modificar una reserva de otro usuario." }` (la reserva no pertenece al usuario de la sesión — Edge Case del spec)
- `404 Not Found` — id de reserva inexistente
- `409 Conflict` — `{ "error": "No se puede cancelar una reserva que ya pasó." }` (FR-018: la reserva ya está en estado efectivo `completada`)
