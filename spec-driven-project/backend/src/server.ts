import { getDb } from "./db/connection";
import { seedCanchas } from "./db/seed";
import { createApp } from "./api/app";

const PORT = Number(process.env.PORT ?? 3001);

// Bootstrap: aplica el schema (T007) e inserta el catálogo fijo de canchas
// (T008) antes de levantar el servidor HTTP.
getDb();
seedCanchas();

const app = createApp();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API de reservas de pádel escuchando en http://localhost:${PORT}`);
});
