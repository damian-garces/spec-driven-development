import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Courts from "./pages/Courts";
import CourtDetail from "./pages/CourtDetail";
import MyReservations from "./pages/MyReservations";
import RequireAuth from "./components/RequireAuth";

// Rutas de la aplicación. /courts es pública (FR-006: un visitante puede
// ver el listado estático), pero el detalle de una cancha (disponibilidad +
// reserva) y el panel "Mis Reservas" exigen sesión activa (FR-004).
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/courts" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/courts" element={<Courts />} />
      <Route
        path="/courts/:id"
        element={
          <RequireAuth>
            <CourtDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/my-reservations"
        element={
          <RequireAuth>
            <MyReservations />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
