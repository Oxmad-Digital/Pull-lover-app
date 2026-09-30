import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const TABLES = [
  "customers",
  "newsletter_subscribers",
  "orders",
  "products",
  "promos",
  "reviews",
  "settings",
  "users",
];

const UNIQUE_INDEXES = [
  ["customers", "email"],
  ["newsletter_subscribers", "email"],
  ["products", "slug"],
  ["promos", "code"],
  ["users", "email"],
];

export function getClient() {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL n'est pas définie pour Neon PostgreSQL");
  }

  if (!globalThis.__pullLoverPostgres) {
    const query = neon(DATABASE_URL);
    const sql = (strings, ...values) => {
      if (typeof strings === "string") {
        if (!/^[a-z_][a-z0-9_]*$/i.test(strings)) throw new Error("Identifiant SQL invalide");
        return { identifier: strings };
      }

      let text = strings[0];
      const parameters = [];
      values.forEach((value, index) => {
        if (value?.identifier) {
          text += `"${value.identifier}"`;
        } else if (value?.literal) {
          text += `'${value.literal}'`;
        } else {
          parameters.push(value?.jsonValue ?? value);
          text += `$${parameters.length}`;
        }
        text += strings[index + 1];
      });
      return query.query(text, parameters);
    };
    // Requête déjà paramétrée ($1, $2…), construite par postgres-model / sql-filter
    sql.query = (text, parameters = []) => query.query(text, parameters);
    sql.json = (value) => ({ jsonValue: JSON.stringify(value) });
    sql.literal = (value) => {
      if (!/^[a-z_][a-z0-9_]*$/i.test(value)) throw new Error("Littéral SQL invalide");
      return { literal: value };
    };
    sql.end = async () => {};
    globalThis.__pullLoverPostgres = sql;
  }

  return globalThis.__pullLoverPostgres;
}

// Index uniques ajoutés après coup : leur création ne doit pas bloquer la migration si
// des doublons existent déjà en base (ils sont alors signalés dans les logs).
const OPTIONAL_UNIQUE_INDEXES = [
  ["orders", "stripePaymentId"],
];

// Index de lecture, alignés sur les expressions générées par sql-filter.mjs
const LOOKUP_INDEXES = [
  ["orders_created_at_idx", "orders", "(created_at)"],
  ["orders_status_idx", "orders", "((data->>'status'))"],
  ["orders_customer_email_idx", "orders", "(lower(data #>> '{customer,email}'))"],
  ["reviews_product_id_idx", "reviews", "((data->>'productId'))"],
  ["customers_created_at_idx", "customers", "(created_at)"],
];

/** Crée tables et index manquants. Lancé par `npm run migrate`, jamais pendant une requête. */
export async function initializeSchema(sql = getClient()) {
  for (const table of TABLES) {
    await sql`
      CREATE TABLE IF NOT EXISTS ${sql(table)} (
        id uuid PRIMARY KEY,
        data jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;
  }

  for (const [table, field] of UNIQUE_INDEXES) {
    const indexName = `${table}_${field}_unique_idx`;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS ${sql(indexName)}
      ON ${sql(table)} ((lower(data->>${sql.literal(field)})))
      WHERE data ? ${sql.literal(field)}
    `;
  }

  for (const [table, field] of OPTIONAL_UNIQUE_INDEXES) {
    const indexName = `${table}_${field}_unique_idx`;
    try {
      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS ${sql(indexName)}
        ON ${sql(table)} ((data->>${sql.literal(field)}))
        WHERE data->>${sql.literal(field)} IS NOT NULL
      `;
    } catch (error) {
      console.error(`⚠️ Index unique ${indexName} non créé (doublons existants ?) :`, error.message);
    }
  }

  // Expressions fixes définies ci-dessus (aucune entrée utilisateur)
  for (const [indexName, table, expression] of LOOKUP_INDEXES) {
    await sql.query(`CREATE INDEX IF NOT EXISTS "${indexName}" ON "${table}" ${expression}`);
  }

  // Catégories retirées du site : table et champ produit supprimés
  await sql.query(`DROP TABLE IF EXISTS categories`);
  await sql.query(`UPDATE products SET data = data - 'category' WHERE data ? 'category'`);

  // Compteurs de limitation de débit (voir rateLimit.js)
  await sql.query(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      key text PRIMARY KEY,
      count integer NOT NULL,
      reset_at timestamptz NOT NULL
    )
  `);

  // Mesure d'audience (voir app/api/track) : une ligne par page vue, sans IP ni cookie
  await sql.query(`
    CREATE TABLE IF NOT EXISTS page_views (
      id uuid PRIMARY KEY,
      day date NOT NULL,
      path text NOT NULL,
      referrer text NOT NULL DEFAULT '',
      device_type text NOT NULL DEFAULT 'desktop',
      country text NOT NULL DEFAULT '',
      visitor_hash text NOT NULL,
      duration_ms integer,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await sql.query(`CREATE INDEX IF NOT EXISTS "page_views_day_idx" ON "page_views" (day)`);
}

// Le schéma est créé par `npm run migrate` : plus de DDL au démarrage à froid.
export async function connectDB() {
  return getClient();
}

export function isValidId(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
