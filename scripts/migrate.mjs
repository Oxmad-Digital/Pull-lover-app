// Crée les tables et index PostgreSQL manquants (idempotent).
// Usage : npm run migrate   (lit DATABASE_URL depuis .env.local)
import { setDefaultAutoSelectFamily } from "node:net";
import { initializeSchema } from "../app/lib/db.js";

// Même correctif qu'instrumentation.ts (qui ne s'applique qu'à Next) : l'hôte Neon annonce de
// l'IPv6 que la machine ne sait pas router, et la course IPv4/IPv6 échoue en « fetch failed ».
setDefaultAutoSelectFamily(false);

try {
  await initializeSchema();
  console.log("✅ Schéma à jour");
} catch (error) {
  console.error("❌ Migration échouée :", error.message);
  process.exitCode = 1;
}
