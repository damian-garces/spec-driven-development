-- Esquema SQLite para el sistema de reservas de pádel.
-- Ver specs/001-reserva-canchas-padel/data-model.md para el detalle de cada
-- entidad y regla de negocio.

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  correo TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  fecha_registro TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS canchas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS reservas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  cancha_id INTEGER NOT NULL REFERENCES canchas(id),
  fecha TEXT NOT NULL,
  hora_inicio TEXT NOT NULL,
  hora_fin TEXT NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('activa', 'cancelada', 'completada')),
  creada_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Principio II (NON-NEGOTIABLE): a lo sumo una reserva "activa" por cancha +
-- fecha + bloque horario. Es un índice único PARCIAL: no restringe filas
-- 'cancelada'/'completada', por lo que el historial puede acumular varias
-- reservas pasadas sobre el mismo bloque sin violar la restricción.
CREATE UNIQUE INDEX IF NOT EXISTS ux_reservas_bloque_activo
  ON reservas(cancha_id, fecha, hora_inicio)
  WHERE estado = 'activa';

-- Acelera la búsqueda de "¿tiene el usuario una reserva activa?" (FR-015)
-- y la consulta de "mis reservas" (FR-016).
CREATE INDEX IF NOT EXISTS ix_reservas_usuario ON reservas(usuario_id, estado);
