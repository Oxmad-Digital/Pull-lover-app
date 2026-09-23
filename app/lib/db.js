import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const TABLES = [
  "categories",
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
  ["categories", "name"],
  ["customers", "email"],
  ["newsletter_subscribers", "email"],
  ["products", "slug"],
  ["promos", "code"],
  ["users", "email"],
];

function getClient() {
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

async function initializeSchema(sql) {
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
}

export async function connectDB() {
  const sql = getClient();

  if (!globalThis.__pullLoverSchemaPromise) {
    globalThis.__pullLoverSchemaPromise = initializeSchema(sql).catch((error) => {
      globalThis.__pullLoverSchemaPromise = null;
      throw error;
    });
  }

  await globalThis.__pullLoverSchemaPromise;
  return sql;
}

export function isValidId(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value);
}
