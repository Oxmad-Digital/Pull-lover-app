// app/lib/sql-filter.mjs
// Traduit les filtres « façon Mongo » de postgres-model en clauses SQL sur la colonne jsonb `data`.
//
// Règle d'or : chaque clause produite est une condition NÉCESSAIRE du filtre (jamais plus stricte),
// car postgres-model réapplique toujours le filtre JS sur les lignes lues. Ce qui ne se traduit pas
// est simplement laissé au filtre JS, et `complete` passe à false : le WHERE ne suffit alors plus
// pour déléguer LIMIT / OFFSET / count(*) à PostgreSQL.

const FIELD = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLUMNS = { createdAt: "created_at", updatedAt: "updated_at" };
const RANGE = { $gt: ">", $gte: ">=", $lt: "<", $lte: "<=" };
const NUMERIC = "'^-?[0-9]+(\\.[0-9]+)?$'";

// Valeurs comparées en texte comme le fait le filtre JS (`toString`). Les chaînes au format ISO
// sont exclues : le filtre JS les compare comme des dates, pas comme du texte.
const isTextScalar = (value) =>
  (typeof value === "string" && !ISO_DATE.test(value)) ||
  (typeof value === "number" && Number.isFinite(value)) ||
  typeof value === "boolean";

const isDateLike = (value) =>
  (value instanceof Date && !Number.isNaN(value.getTime())) ||
  (typeof value === "string" && ISO_DATE.test(value) && !Number.isNaN(Date.parse(value)));

/** Une regex n'est traduite que si c'est une recherche littérale (sortie d'escapeRegex). */
function literalPattern(pattern) {
  if (typeof pattern !== "string") return null;
  const anchored = pattern.startsWith("^") && pattern.endsWith("$") && pattern.length >= 2;
  const body = anchored ? pattern.slice(1, -1) : pattern;
  const text = body.replace(/\\(.)/g, "$1");
  if (text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") !== body) return null;
  if (!anchored && (pattern.startsWith("^") || pattern.endsWith("$"))) return null;
  return { anchored, text };
}

const likeEscape = (text) => text.replace(/[\\%_]/g, "\\$&");

function traversesArray(defaults, segments) {
  let current = defaults;
  for (const segment of segments) {
    current = current?.[segment];
    if (Array.isArray(current)) return true;
  }
  return false;
}

/**
 * @param {object} filter  filtre postgres-model
 * @param {{ defaults?: object, lowerIndexed?: string[] }} options
 *   defaults     : les champs tableaux déclarés ne sont jamais traduits (le filtre JS les « déplie »)
 *   lowerIndexed : champs couverts par un index unique sur lower(data->>champ)
 * @returns {{ clauses: string[], params: unknown[], complete: boolean }}
 */
export function buildWhere(filter = {}, { defaults = {}, lowerIndexed = [] } = {}) {
  const params = [];
  const bind = (value) => { params.push(value); return `$${params.length}`; };

  function idCondition(condition) {
    if (typeof condition === "string") return UUID.test(condition) ? `id = ${bind(condition)}::uuid` : "FALSE";
    if (condition && typeof condition === "object" && !(condition instanceof Date)) {
      const ops = Object.keys(condition);
      if (ops.length === 1 && ops[0] === "$in" && Array.isArray(condition.$in) && condition.$in.every((v) => typeof v === "string")) {
        return `id = ANY(${bind(condition.$in.filter((v) => UUID.test(v)))}::uuid[])`;
      }
      if (ops.length === 1 && ops[0] === "$ne" && typeof condition.$ne === "string") {
        return UUID.test(condition.$ne) ? `id <> ${bind(condition.$ne)}::uuid` : "TRUE";
      }
    }
    return null;
  }

  function columnCondition(column, condition) {
    if (isDateLike(condition)) return [`${column} = ${bind(new Date(condition))}`];
    if (!condition || typeof condition !== "object" || condition instanceof Date) return null;
    const clauses = [];
    for (const [op, value] of Object.entries(condition)) {
      if (!RANGE[op] || !isDateLike(value)) return null;
      clauses.push(`${column} ${RANGE[op]} ${bind(new Date(value))}`);
    }
    return clauses;
  }

  // Retourne { clauses, complete } pour un champ jsonb
  function fieldCondition(segments, condition) {
    const field = segments.length === 1 ? `data->>'${segments[0]}'` : `data #>> '{${segments.join(",")}}'`;

    if (isTextScalar(condition)) {
      const value = String(condition);
      if (segments.length === 1 && lowerIndexed.includes(segments[0])) {
        // lower() + « ? » permettent d'utiliser l'index unique partiel ; l'égalité stricte reste exacte
        const placeholder = bind(value);
        return {
          clauses: [`data ? '${segments[0]}'`, `lower(${field}) = lower(${placeholder})`, `${field} = ${placeholder}`],
          complete: true,
        };
      }
      return { clauses: [`${field} = ${bind(value)}`], complete: true };
    }
    if (!condition || typeof condition !== "object" || condition instanceof Date || condition instanceof RegExp) {
      return { clauses: [], complete: false };
    }

    const clauses = [];
    let complete = true;
    for (const [op, value] of Object.entries(condition)) {
      if (op === "$options") continue;
      if (op === "$in" && Array.isArray(value) && value.every(isTextScalar)) {
        clauses.push(`${field} = ANY(${bind(value.map(String))}::text[])`);
      } else if (op === "$ne" && isTextScalar(value)) {
        clauses.push(`${field} IS DISTINCT FROM ${bind(String(value))}`);
      } else if (op === "$exists" && typeof value === "boolean") {
        clauses.push(`${field} IS ${value ? "NOT " : ""}NULL`);
      } else if (RANGE[op] && typeof value === "number" && Number.isFinite(value)) {
        clauses.push(`(CASE WHEN ${field} ~ ${NUMERIC} THEN (${field})::numeric END) ${RANGE[op]} ${bind(value)}`);
      } else if (op === "$regex" && ["", "i"].includes(condition.$options || "") && literalPattern(value)) {
        const { anchored, text } = literalPattern(value);
        const insensitive = condition.$options === "i";
        if (anchored) {
          clauses.push(insensitive ? `lower(${field}) = lower(${bind(text)})` : `${field} = ${bind(text)}`);
        } else {
          clauses.push(`${field} ${insensitive ? "ILIKE" : "LIKE"} ${bind(`%${likeEscape(text)}%`)}`);
        }
      } else {
        complete = false;
      }
    }
    return { clauses, complete };
  }

  function translate(node) {
    const clauses = [];
    let complete = true;

    for (const [key, condition] of Object.entries(node || {})) {
      if (key === "$and" && Array.isArray(condition)) {
        for (const branch of condition) {
          const result = translate(branch);
          clauses.push(...result.clauses);
          complete &&= result.complete;
        }
        continue;
      }
      if (key === "$or" && Array.isArray(condition)) {
        const branches = condition.map(translate);
        // Une branche sans clause équivaut à TRUE : le $or entier ne filtre alors plus rien en SQL
        if (branches.length && branches.every((branch) => branch.clauses.length)) {
          clauses.push(`(${branches.map((branch) => `(${branch.clauses.join(" AND ")})`).join(" OR ")})`);
          complete &&= branches.every((branch) => branch.complete);
        } else {
          complete = false;
        }
        continue;
      }
      if (key === "_id") {
        const clause = idCondition(condition);
        if (clause) clauses.push(clause); else complete = false;
        continue;
      }
      if (COLUMNS[key]) {
        const result = columnCondition(COLUMNS[key], condition);
        if (result) clauses.push(...result); else complete = false;
        continue;
      }

      const segments = key.split(".");
      if (!segments.every((segment) => FIELD.test(segment)) || traversesArray(defaults, segments)) {
        complete = false;
        continue;
      }
      const result = fieldCondition(segments, condition);
      clauses.push(...result.clauses);
      complete &&= result.complete;
    }

    return { clauses, complete };
  }

  const { clauses, complete } = translate(filter);
  return { clauses, params, complete };
}

/** ORDER BY SQL si le tri ne porte que sur des colonnes (createdAt, updatedAt, _id), sinon null. */
export function buildOrderBy(sortSpec) {
  if (!sortSpec) return null;
  const parts = [];
  for (const [field, direction] of Object.entries(sortSpec)) {
    const column = field === "_id" ? "id" : COLUMNS[field];
    if (!column || ![1, -1].includes(direction)) return null;
    parts.push(`${column} ${direction === -1 ? "DESC" : "ASC"}`);
  }
  if (!parts.some((part) => part.startsWith("id "))) parts.push("id ASC");
  return parts.join(", ");
}
