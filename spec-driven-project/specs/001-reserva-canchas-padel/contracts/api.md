# API Contract: Reserva de Canchas de Pádel

**Feature**: `001-reserva-canchas-padel` | **Date**: 2026-09-12

API REST servida por el backend Express. Todas las respuestas son JSON.
Errores siguen el Principio V (Manejo de Errores Semántico y Amigable):
código HTTP semántico + cuerpo `{ "error": "<mensaje amigable>" }`, nunca
stack traces.

Convención de códigos usados en este contrato:

- `400` — solicitud inválida (formato, campos faltantes, bloque no alineado, fecha/hora pasada)
- `401` — sin sesión activa
- `403` — sesión activa pero intenta acceder/modificar un recurso de otro usuario
- `404` — recurso no encontrado (cancha o reserva inexistente)
- `409` — conflicto de reserva (bloque ya no disponible, o ya tiene una reserva activa)

## Autenticación

### `POST /api/auth/registro`

Crea una cuenta nueva (FR-001, FR-002).

**Request body**:
```json
{ "correo": "persona@example.com", "password": "una-contraseña-segura" }
```

**Responses**:
- `201 Created` → `{ "id": 1, "correo": "persona@example.com" }`
- `400 Bad Request` → correo con formato inválido o contraseña demasiado corta
- `409 Conflict` → `{ "error": "El correo ya está en uso." }` (correo ya registrado)

### `POST /api/auth/login`

Inicia sesión (FR-003). Establece cookie de sesión HTTP-only.

**Request body**:
```json
{ "correo": "persona@example.com", "password": "una-contraseña-segura" }
```

**Responses**:
- `200 OK` → `{ "id": 1, "correo": "persona@example.com" }` + `Set-Cookie` de sesión
- `401 Unauthorized` → `{ "error": "Correo o contraseña incorrectos." }`

### `POST /api/auth/logout`

Cierra la sesión activa (FR-003). Requiere sesión activa.

**Responses**:
- `200 OK` → `{ "ok": true }`
- `401 Unauthorized` → sin sesión previa

### `GET /api/auth/me`

Devuelve el usuario de la sesión activa, si existe (soporte de UI para saber si hay sesión).

**Responses**:
- `200 OK` → `{ "id": 1, "correo": "persona@example.com" }`
- `401 Unauthorized` → `{ "error": "No hay sesión activa." }`

## Canchas

### `GET /api/canchas`

Lista estática de las 5 canchas (FR-006). **No requiere autenticación** —
un visitante puede ver el listado, pero no la disponibilidad detallada
(Assumptions del spec).

**Responses**:
- `200 OK` → `[{ "id": 1, "nombre": "Cancha Laureles" }, ...]` (5 elementos, orden fijo)

### `GET /api/canchas/:id/disponibilidad?fecha=YYYY-MM-DD`

Grilla de 24 bloques horarios para una cancha y fecha (FR-007, FR-008).
**Requiere autenticación** (FR-004: disponibilidad completa solo para
usuarios con sesión activa).

**Responses**:
- `200 OK` →
  ```json
  {
    "canchaId": 1,
    "fecha": "2026-09-15",
    "bloques": [
      { "horaInicio": "00:00", "horaFin": "01:00", "estado": "disponible" },
      { "horaInicio": "14:00", "horaFin": "15:00", "estado": "reservado" }
    ]
  }
  ```
  (siempre 24 elementos en `bloques`, uno por cada hora del día, orden `00:00`→`23:00`)
- `400 Bad Request` → `fecha` ausente o con formato inválido
- `401 Unauthorized` → sin sesión activa
- `404 Not Found` → `canchaId` inexistente

## Reservas

### `POST /api/reservas`

Confirma una reserva sobre un bloque horario (FR-009 a FR-015). Requiere
autenticación. Ejecuta revalidación atómica anti-colisión (Principio II) y
rechaza si el usuario ya tiene una reserva activa (FR-015).

**Request body**:
```json
{ "canchaId": 1, "fecha": "2026-09-15", "horaInicio": "14:00" }
```

**Responses**:
- `201 Created` →
  ```json
  {
    "id": 42,
    "canchaId": 1,
    "canchaNombre": "Cancha Laureles",
    "fecha": "2026-09-15",
    "horaInicio": "14:00",
    "horaFin": "15:00",
    "estado": "activa"
  }
  ```
- `400 Bad Request` — `{ "error": "El bloque horario seleccionado no es válido." }` (no alineado a la hora, o `fecha`/`horaInicio` ya transcurrida — FR-013, FR-014)
- `401 Unauthorized` — sin sesión activa
- `404 Not Found` — `canchaId` inexistente
- `409 Conflict` — dos variantes, mismo código, mensaje distinto:
  - `{ "error": "Este horario ya no está disponible." }` (otro usuario lo reservó primero — FR-011)
  - `{ "error": "Ya tienes una reserva activa. Cancélala antes de crear una nueva." }` (FR-015)

### `GET /api/reservas/mias`

Panel "Mis Reservas": futuras + historial (pasadas y canceladas) del usuario
de la sesión activa (FR-016). Requiere autenticación. Nunca devuelve
reservas de otros usuarios (FR-005, SC-005).

**Responses**:
- `200 OK` →
  ```json
  {
    "futuras": [
      { "id": 42, "canchaNombre": "Cancha Laureles", "fecha": "2026-09-15", "horaInicio": "14:00", "horaFin": "15:00", "estado": "activa" }
    ],
    "historial": [
      { "id": 30, "canchaNombre": "Cancha Belén", "fecha": "2026-09-01", "horaInicio": "10:00", "horaFin": "11:00", "estado": "completada" },
      { "id": 25, "canchaNombre": "Cancha Robledo", "fecha": "2026-08-20", "horaInicio": "09:00", "horaFin": "10:00", "estado": "cancelada" }
    ]
  }
  ```
- `401 Unauthorized` — sin sesión activa

### `DELETE /api/reservas/:id`

Cancela una reserva futura propia (FR-017 a FR-019). Requiere autenticación
y confirmación explícita ya resuelta en el cliente antes de llamar a este
endpoint (el backend no re-pregunta, solo ejecuta).

**Responses**:
- `200 OK` → `{ "id": 42, "estado": "cancelada" }`
- `401 Unauthorized` — sin sesión activa
- `403 Forbidden` — `{ "error": "No puedes modificar una reserva de otro usuario." }` (la reserva no pertenece al usuario de la sesión — Edge Case del spec)
- `404 Not Found` — id de reserva inexistente
- `409 Conflict` — `{ "error": "No se puede cancelar una reserva que ya pasó." }` (FR-018: la reserva ya está en estado efectivo `completada`)
