-- Esquema SQLite para el sistema de reservas de pádel.
-- Ver specs/001-reserva-canchas-padel/data-model.md para el detalle de cada
-- entidad y regla de negocio.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  registered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  court_id INTEGER NOT NULL REFERENCES courts(id),
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('activa', 'cancelada', 'completada')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Principio II (NON-NEGOTIABLE): a lo sumo una reserva "activa" por cancha +
-- fecha + bloque horario. Es un índice único PARCIAL: no restringe filas
-- 'cancelada'/'completada', por lo que el historial puede acumular varias
-- reservas pasadas sobre el mismo bloque sin violar la restricción.
CREATE UNIQUE INDEX IF NOT EXISTS ux_reservations_active_block
  ON reservations(court_id, date, start_time)
  WHERE status = 'activa';

-- Acelera la búsqueda de "¿tiene el usuario una reserva activa?" (FR-015)
-- y la consulta de "mis reservas" (FR-016).
CREATE INDEX IF NOT EXISTS ix_reservations_user ON reservations(user_id, status);
