import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Canchas from "./pages/Canchas";
import DetalleCancha from "./pages/DetalleCancha";
import MisReservas from "./pages/MisReservas";
import RequireAuth from "./components/RequireAuth";

// Rutas de la aplicación. /canchas es pública (FR-006: un visitante puede
// ver el listado estático), pero el detalle de una cancha (disponibilidad +
// reserva) y el panel "Mis Reservas" exigen sesión activa (FR-004).
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/canchas" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/canchas" element={<Canchas />} />
      <Route
        path="/canchas/:id"
        element={
          <RequireAuth>
            <DetalleCancha />
          </RequireAuth>
        }
      />
      <Route
        path="/mis-reservas"
        element={
          <RequireAuth>
            <MisReservas />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
