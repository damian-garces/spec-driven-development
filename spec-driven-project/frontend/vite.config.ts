import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuración mínima: el frontend consume la API backend en http://localhost:3001
// (ver frontend/src/services/apiClient.ts). En desarrollo se proxean las
// peticiones /api hacia el backend para evitar problemas de CORS/cookies.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
