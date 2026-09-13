# Data Model: Reserva de Canchas de Pádel

**Feature**: `001-reserva-canchas-padel` | **Date**: 2026-09-12

Basado en las "Key Entities" del spec (spec.md) y en las decisiones de
research.md. Motor: SQLite (`db/padel.db`), acceso vía SQL puro
(`better-sqlite3`), sin ORM.

## Entidades

### Usuario (`usuarios`)

Persona registrada en el sistema (FR-001 a FR-005).

| Campo | Tipo | Restricciones | Notas |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | |
| `correo` | TEXT | `UNIQUE NOT NULL` | Normalizado a minúsculas antes de insertar/comparar (FR-002) |
| `password_hash` | TEXT | `NOT NULL` | Hash bcrypt, nunca se expone en respuestas de API |
| `fecha_registro` | TEXT | `NOT NULL` | ISO `YYYY-MM-DD HH:MM:SS`, default `CURRENT_TIMESTAMP` |

**Validaciones de negocio**:
- Formato de correo válido (regex básica) antes de intentar el insert.
- Contraseña con longitud mínima razonable (ej. 8 caracteres) validada en el servicio, no en el esquema.
- Un usuario tiene como máximo una reserva en estado `activa` a la vez (regla global, no derivable del esquema de `usuarios`; se aplica en el servicio de reservas — ver más abajo).

### Cancha (`canchas`)

Catálogo cerrado e inmutable de 5 espacios (Principio I, NON-NEGOTIABLE).

| Campo | Tipo | Restricciones | Notas |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | |
| `nombre` | TEXT | `UNIQUE NOT NULL` | Uno de: "Cancha Laureles", "Cancha El Poblado", "Cancha Belén", "Cancha Robledo", "Cancha Envigado" |

**Poblamiento**: las 5 filas se insertan una única vez mediante script de
seed ejecutado al inicializar `db/padel.db`. No existe endpoint de API para
crear, editar o eliminar canchas (Principio I).

### Reserva (`reservas`)

Ocupación de una cancha por un usuario en un bloque horario de 1 hora
(FR-006 a FR-019).

| Campo | Tipo | Restricciones | Notas |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | |
| `usuario_id` | INTEGER | `NOT NULL REFERENCES usuarios(id)` | |
| `cancha_id` | INTEGER | `NOT NULL REFERENCES canchas(id)` | |
| `fecha` | TEXT | `NOT NULL` | Formato `YYYY-MM-DD` |
| `hora_inicio` | TEXT | `NOT NULL` | Formato `HH:00`, 24h, uno de los 15 bloques operativos del día (`07:00` a `21:00`, rango 07:00–22:00) |
| `hora_fin` | TEXT | `NOT NULL` | Siempre `hora_inicio + 1h`; almacenado por conveniencia de lectura, no editable independientemente |
| `estado` | TEXT | `NOT NULL CHECK(estado IN ('activa','cancelada','completada'))` | Ver máquina de estados abajo |
| `creada_en` | TEXT | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |

**Restricciones de esquema clave**:

```sql
CREATE UNIQUE INDEX ux_reservas_bloque_activo
  ON reservas(cancha_id, fecha, hora_inicio)
  WHERE estado = 'activa';
```

Este índice único parcial es el respaldo de base de datos del Principio II
(Prevención de Doble Reserva): solo puede existir una reserva `activa` por
cancha+fecha+bloque horario, sin importar cuántas reservas `cancelada` o
`completada` existan históricamente para ese mismo bloque.

**Regla "una reserva activa por usuario" (FR-015, global)**: no se modela con
una restricción UNIQUE de esquema (una tabla no puede expresar "a lo sumo una
fila activa por usuario" fácilmente junto con la unicidad por bloque), se
aplica en el servicio de reservas dentro de la misma transacción: antes de
insertar, se verifica `SELECT 1 FROM reservas WHERE usuario_id = ? AND estado = 'activa'`.
Si existe alguna, se rechaza con `409`.

### Máquina de estados de `Reserva`

```
        crear reserva
             │
             ▼
         [activa] ──── cancelar (antes de hora_inicio) ───▶ [cancelada]
             │
       transcurre hora_fin
       sin cancelar
             │
             ▼
        [completada]
```

- `activa`: reserva futura, no cancelada. Cuenta para el límite de "una
  reserva activa por usuario" (FR-015).
- `cancelada`: el usuario canceló antes de `hora_inicio` (FR-017). Permanece
  visible en el historial con su fecha/hora original (FR-019).
- `completada`: el bloque horario ya transcurrió sin cancelación. Esta
  transición es derivada (no hay un job en segundo plano): se calcula al
  consultar el panel "Mis Reservas", comparando `fecha`+`hora_fin` contra el
  instante actual del servidor (ver Edge Case del spec: "el reloj hace que
  una reserva futura pase a ser pasada"). No se permite cancelar una reserva
  cuyo estado derivado ya es `completada` (FR-018).

**Nota de implementación**: `estado` se persiste solo con los valores
`activa`/`cancelada` escritos explícitamente por transiciones de usuario; la
transición a `completada` es una proyección de lectura (`estado = 'activa' AND fecha+hora_fin < ahora → mostrar como 'completada'`), no una escritura
programada, para evitar la complejidad de un scheduler (Principio IV).

## Relaciones

- Un `Usuario` tiene 0..N `Reserva` (histórico), pero a lo sumo 1 con estado
  efectivo `activa` en cualquier momento.
- Una `Cancha` tiene 0..N `Reserva` a lo largo del tiempo.
- Una `Reserva` pertenece exactamente a 1 `Usuario` y 1 `Cancha`.

## Validaciones derivadas de los requisitos funcionales

| Regla | Origen | Dónde se aplica |
|---|---|---|
| Correo único | FR-002 | `UNIQUE` en `usuarios.correo` + chequeo previo amigable |
| Solo bloques de 1h alineados dentro del rango operativo (`HH:00`–`HH+1:00`, 07:00–22:00) | FR-008, FR-013 | Validación de servicio: `hora_inicio` ∈ conjunto de 15 valores válidos (`07:00`…`21:00`) |
| Sin reservas en fecha/hora pasada | FR-014 | Validación de servicio comparando contra `now()` del servidor antes de insertar |
| No más de una reserva activa por bloque | FR-012 | Índice único parcial `ux_reservas_bloque_activo` |
| No más de una reserva activa por usuario (global) | FR-015 | Chequeo de servicio dentro de la transacción |
| Cancelación solo de reservas futuras | FR-018 | Validación de servicio: `estado='activa' AND ahora < fecha+hora_inicio` |
| Un usuario solo ve/gestiona sus propias reservas | FR-005 | Todas las queries de "Mis Reservas" filtran por `usuario_id` de la sesión activa |
| Grilla de hoy excluye bloques con `hora_inicio` ya transcurrida (longitud variable); fechas futuras siempre devuelven 15 bloques | FR-021 | Filtro en memoria en `disponibilidadService`, no en el esquema — ver research.md §5 |

## Vista de solo lectura: Grilla de Disponibilidad

La grilla que arma `GET /api/canchas/:id/disponibilidad` (contracts/api.md)
no es una entidad persistida: se calcula en cada consulta a partir de
`canchas` + `reservas` (estado `activa`) para la `cancha_id`+`fecha` pedidos,
más la hora actual del servidor cuando `fecha` es hoy.

1. Partir de los 15 bloques operativos fijos (`07:00`…`21:00`).
2. Marcar cada bloque `"reservado"` si existe una fila en `reservas` con
   `estado='activa'` para esa `cancha_id`+`fecha`+`hora_inicio`; de lo
   contrario `"disponible"`.
3. Si `fecha === hoy`, descartar (sin marcar, sin sustituir) los bloques
   cuya `hora_inicio < horaActual` (FR-021); el resultado puede tener entre 0
   y 15 elementos. Si `fecha` es futura, no se descarta ningún bloque.
