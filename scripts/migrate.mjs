// Crée les tables et index PostgreSQL manquants (idempotent).
// Usage : npm run migrate   (lit DATABASE_URL depuis .env.local)
import { initializeSchema } from "../app/lib/db.js";

try {
  await initializeSchema();
  console.log("✅ Schéma à jour");
} catch (error) {
  console.error("❌ Migration échouée :", error.message);
  process.exitCode = 1;
}
