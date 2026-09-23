import { randomUUID } from "node:crypto";
import { connectDB } from "./db";

const modelRegistry = new Map();

const clone = (value) => value == null ? value : structuredClone(value);

function reviveDates(value) {
  if (Array.isArray(value)) return value.map(reviveDates);
  if (!value || typeof value !== "object") return value;

  for (const [key, child] of Object.entries(value)) {
    if (
      typeof child === "string" &&
      /(?:At|Date|Expiry|date)$/.test(key) &&
      /^\d{4}-\d{2}-\d{2}T/.test(child)
    ) {
      value[key] = new Date(child);
    } else {
      value[key] = reviveDates(child);
    }
  }
  return value;
}

function plain(value) {
  if (Array.isArray(value)) return value.map(plain);
  if (!value || typeof value !== "object") return value;
  if (value instanceof Date) return new Date(value);

  const result = {};
  for (const [key, child] of Object.entries(value)) result[key] = plain(child);
  return result;
}

function getPath(value, path) {
  return path.split(".").reduce((current, key) => {
    if (Array.isArray(current)) return current.map((item) => item?.[key]);
    return current?.[key];
  }, value);
}

function setPath(value, path, nextValue) {
  const keys = path.split(".");
  let current = value;
  keys.slice(0, -1).forEach((key) => {
    if (!current[key] || typeof current[key] !== "object") current[key] = {};
    current = current[key];
  });
  current[keys.at(-1)] = clone(nextValue);
}

function comparable(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const timestamp = Date.parse(value);
    if (!Number.isNaN(timestamp)) return timestamp;
  }
  return value?.toString?.() ?? value;
}

function equals(left, right) {
  if (Array.isArray(left)) return left.some((item) => equals(item, right));
  return comparable(left) === comparable(right);
}

function matchesCondition(value, condition) {
  if (condition instanceof RegExp) return condition.test(String(value ?? ""));
  if (!condition || typeof condition !== "object" || condition instanceof Date) {
    return equals(value, condition);
  }

  return Object.entries(condition).every(([operator, expected]) => {
    const left = comparable(value);
    const right = comparable(expected);
    if (operator === "$regex") {
      const flags = condition.$options || "";
      return new RegExp(expected, flags).test(String(value ?? ""));
    }
    if (operator === "$options") return true;
    if (operator === "$exists") return expected ? value !== undefined && value !== null : value == null;
    if (operator === "$ne") return !equals(value, expected);
    if (operator === "$in") return expected.some((item) => equals(value, item));
    if (operator === "$nin") return !expected.some((item) => equals(value, item));
    if (operator === "$gt") return left > right;
    if (operator === "$gte") return left >= right;
    if (operator === "$lt") return left < right;
    if (operator === "$lte") return left <= right;
    return matchesCondition(value?.[operator], expected);
  });
}

function matches(document, filter = {}) {
  return Object.entries(filter).every(([field, condition]) => {
    if (field === "$or") return condition.some((branch) => matches(document, branch));
    if (field === "$and") return condition.every((branch) => matches(document, branch));
    return matchesCondition(getPath(document, field), condition);
  });
}

function applyUpdate(document, update) {
  const operators = Object.keys(update).some((key) => key.startsWith("$"));
  const changes = operators ? update : { $set: update };

  for (const [operator, fields] of Object.entries(changes)) {
    if (operator === "$set") {
      for (const [path, value] of Object.entries(fields)) {
        if (value !== undefined) setPath(document, path, value);
      }
    } else if (operator === "$inc") {
      for (const [path, value] of Object.entries(fields)) {
        setPath(document, path, Number(getPath(document, path) || 0) + Number(value));
      }
    } else if (operator === "$addToSet") {
      for (const [path, value] of Object.entries(fields)) {
        const current = getPath(document, path) || [];
        if (!current.some((item) => equals(item, value))) current.push(clone(value));
        setPath(document, path, current);
      }
    } else if (operator === "$pull") {
      for (const [path, value] of Object.entries(fields)) {
        setPath(document, path, (getPath(document, path) || []).filter((item) => !equals(item, value)));
      }
    }
  }
  return document;
}

function pickFields(document, selection) {
  if (!selection) return document;
  const fields = typeof selection === "string" ? selection.split(/\s+/).filter(Boolean) : Object.keys(selection);
  const excludes = fields.filter((field) => field.startsWith("-")).map((field) => field.slice(1));

  if (excludes.length) {
    const result = plain(document);
    excludes.forEach((field) => {
      const keys = field.split(".");
      const parent = keys.slice(0, -1).reduce((current, key) => current?.[key], result);
      if (parent) delete parent[keys.at(-1)];
    });
    return result;
  }

  const result = { _id: document._id };
  fields.forEach((field) => {
    const value = getPath(document, field);
    if (value !== undefined) setPath(result, field, value);
  });
  return result;
}

function evalExpression(expression, document) {
  if (typeof expression === "string" && expression.startsWith("$")) {
    return getPath(document, expression.slice(1));
  }
  if (!expression || typeof expression !== "object" || expression instanceof Date) return expression;
  if (Array.isArray(expression)) return expression.map((item) => evalExpression(item, document));
  if ("$year" in expression) return new Date(evalExpression(expression.$year, document)).getFullYear();
  if ("$month" in expression) return new Date(evalExpression(expression.$month, document)).getMonth() + 1;
  if ("$dayOfMonth" in expression) return new Date(evalExpression(expression.$dayOfMonth, document)).getDate();
  if ("$ifNull" in expression) {
    const [value, fallback] = expression.$ifNull.map((item) => evalExpression(item, document));
    return value ?? fallback;
  }
  if ("$multiply" in expression) {
    return expression.$multiply.reduce((total, item) => total * Number(evalExpression(item, document) || 0), 1);
  }
  return Object.fromEntries(Object.entries(expression).map(([key, value]) => [key, evalExpression(value, document)]));
}

function stableKey(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  return JSON.stringify(value, Object.keys(value).sort());
}

async function runPipeline(input, pipeline) {
  let rows = input.map(plain);
  for (const stage of pipeline) {
    if (stage.$match) rows = rows.filter((row) => matches(row, stage.$match));
    else if (stage.$sort) {
      const fields = Object.entries(stage.$sort);
      rows.sort((a, b) => {
        for (const [field, direction] of fields) {
          const left = comparable(getPath(a, field));
          const right = comparable(getPath(b, field));
          if (left < right) return -1 * direction;
          if (left > right) return 1 * direction;
        }
        return 0;
      });
    } else if (stage.$skip != null) rows = rows.slice(stage.$skip);
    else if (stage.$limit != null) rows = rows.slice(0, stage.$limit);
    else if (stage.$count) rows = [{ [stage.$count]: rows.length }];
    else if (stage.$facet) {
      const result = {};
      for (const [key, nested] of Object.entries(stage.$facet)) result[key] = await runPipeline(rows, nested);
      rows = [result];
    } else if (stage.$unwind) {
      const path = String(stage.$unwind).replace(/^\$/, "");
      rows = rows.flatMap((row) => (getPath(row, path) || []).map((item) => {
        const next = plain(row);
        setPath(next, path, item);
        return next;
      }));
    } else if (stage.$group) {
      const groups = new Map();
      for (const row of rows) {
        const id = evalExpression(stage.$group._id, row);
        const key = stableKey(id);
        if (!groups.has(key)) groups.set(key, { _id: id });
        const group = groups.get(key);
        for (const [field, accumulator] of Object.entries(stage.$group)) {
          if (field === "_id") continue;
          if (accumulator.$sum !== undefined) {
            group[field] = Number(group[field] || 0) + Number(evalExpression(accumulator.$sum, row) || 0);
          } else if (accumulator.$first !== undefined && !(field in group)) {
            group[field] = evalExpression(accumulator.$first, row);
          }
        }
      }
      rows = [...groups.values()];
    } else if (stage.$lookup) {
      const related = modelRegistry.get(stage.$lookup.from);
      const foreignRows = related ? await related.find().lean() : [];
      rows = rows.map((row) => ({
        ...row,
        [stage.$lookup.as]: foreignRows.filter((foreign) =>
          equals(getPath(foreign, stage.$lookup.foreignField), getPath(row, stage.$lookup.localField))
        ),
      }));
    } else if (stage.$project) {
      rows = rows.map((row) => {
        const projected = {};
        for (const [field, expression] of Object.entries(stage.$project)) {
          if (expression === 0) continue;
          projected[field] = expression === 1 ? getPath(row, field) : evalExpression(expression, row);
        }
        return projected;
      });
    }
  }
  return rows;
}

class Query {
  constructor(model, filter, single = false) {
    this.model = model;
    this.filter = filter || {};
    this.single = single;
    this.sortSpec = null;
    this.skipCount = 0;
    this.limitCount = null;
    this.selection = null;
    this.populateSpecs = [];
    this.asPlain = false;
  }

  sort(spec) { this.sortSpec = spec; return this; }
  skip(count) { this.skipCount = count; return this; }
  limit(count) { this.limitCount = count; return this; }
  select(spec) { this.selection = spec; return this; }
  populate(path, select) { this.populateSpecs.push(typeof path === "string" ? { path, select } : path); return this; }
  lean() { this.asPlain = true; return this; }
  exec() { return this.execute(); }

  async execute() {
    let rows = (await this.model._all()).filter((row) => matches(row, this.filter));
    if (this.sortSpec) rows = await runPipeline(rows, [{ $sort: this.sortSpec }]);
    if (this.skipCount) rows = rows.slice(this.skipCount);
    if (this.limitCount != null) rows = rows.slice(0, this.limitCount);
    if (this.single) rows = rows.slice(0, 1);

    for (const spec of this.populateSpecs) rows = await this.model.populate(rows, spec);
    if (this.selection) rows = rows.map((row) => pickFields(row, this.selection));
    if (this.asPlain) rows = rows.map(plain);
    return this.single ? rows[0] || null : rows;
  }

  then(resolve, reject) { return this.execute().then(resolve, reject); }
  catch(reject) { return this.execute().catch(reject); }
}

export function createPostgresModel({ table, defaults = {}, normalize, references = {} }) {
  class Document {
    constructor(values) {
      Object.assign(this, reviveDates(values));
      Object.defineProperty(this, "__model", { value: Model, enumerable: false });
    }

    async save() {
      const saved = await this.__model._persist(this);
      Object.assign(this, saved);
      return this;
    }

    toObject() { return plain(this); }
    toJSON() { return plain(this); }
  }

  class Model {
    static table = table;
    static references = references;

    static async _all() {
      const sql = await connectDB();
      const rows = await sql`SELECT id, data, created_at, updated_at FROM ${sql(table)}`;
      return rows.map((row) => new Document({
        ...row.data,
        _id: row.id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }

    static async _persist(document, isNew = false) {
      const sql = await connectDB();
      const now = new Date();
      const values = normalize ? normalize(plain(document), isNew) : plain(document);
      const id = values._id || randomUUID();
      const createdAt = values.createdAt || now;
      delete values._id;
      delete values.createdAt;
      delete values.updatedAt;

      try {
        const [row] = await sql`
          INSERT INTO ${sql(table)} (id, data, created_at, updated_at)
          VALUES (${id}, ${sql.json(values)}, ${createdAt}, ${now})
          ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at
          RETURNING id, data, created_at, updated_at
        `;
        return new Document({ ...row.data, _id: row.id, createdAt: row.created_at, updatedAt: row.updated_at });
      } catch (error) {
        if (error.code === "23505") error.code = 11000;
        throw error;
      }
    }

    static find(filter = {}) { return new Query(Model, filter); }
    static findOne(filter = {}) { return new Query(Model, filter, true); }
    static findById(id) { return new Query(Model, { _id: id }, true); }

    static async create(values) {
      const initial = { ...clone(defaults), ...clone(values), _id: randomUUID(), createdAt: new Date() };
      return Model._persist(new Document(initial), true);
    }

    static async countDocuments(filter = {}) {
      return (await Model.find(filter).lean()).length;
    }

    static async findByIdAndUpdate(id, update) {
      const document = await Model.findById(id);
      if (!document) return null;
      applyUpdate(document, update);
      return document.save();
    }

    static async findOneAndUpdate(filter, update, options = {}) {
      let document = await Model.findOne(filter);
      if (!document && options.upsert) {
        const base = Object.fromEntries(Object.entries(filter).filter(([, value]) => !value || typeof value !== "object" || value instanceof Date));
        document = new Document({ ...clone(defaults), ...base, _id: randomUUID(), createdAt: new Date() });
      }
      if (!document) return null;
      applyUpdate(document, update);
      return document.save();
    }

    static async findByIdAndDelete(id) {
      const sql = await connectDB();
      const document = await Model.findById(id);
      if (!document) return null;
      await sql`DELETE FROM ${sql(table)} WHERE id = ${id}`;
      return document;
    }

    static async updateMany(filter, update) {
      const documents = await Model.find(filter);
      for (const document of documents) {
        applyUpdate(document, update);
        await document.save();
      }
      return { acknowledged: true, matchedCount: documents.length, modifiedCount: documents.length };
    }

    static async aggregate(pipeline) {
      return runPipeline(await Model._all(), pipeline);
    }

    static async populate(input, spec) {
      const rows = Array.isArray(input) ? input : [input];
      const path = typeof spec === "string" ? spec : spec.path;
      const selection = typeof spec === "object" ? spec.select : undefined;
      const related = modelRegistry.get(references[path]);
      if (!related) return input;

      const populated = [];
      for (const source of rows) {
        const row = source instanceof Document ? source : plain(source);
        if (path.includes(".")) {
          const [arrayField, nestedField] = path.split(".");
          row[arrayField] = await Promise.all((row[arrayField] || []).map(async (item) => {
            const relatedDocument = await related.findById(item[nestedField]).lean();
            return { ...item, [nestedField]: relatedDocument ? pickFields(relatedDocument, selection) : null };
          }));
        } else if (Array.isArray(row[path])) {
          row[path] = (await Promise.all(row[path].map((id) => related.findById(id).lean())))
            .filter(Boolean)
            .map((item) => pickFields(item, selection));
        } else if (row[path]) {
          const relatedDocument = await related.findById(row[path]).lean();
          row[path] = relatedDocument ? pickFields(relatedDocument, selection) : null;
        }
        populated.push(row);
      }
      return Array.isArray(input) ? populated : populated[0];
    }
  }

  modelRegistry.set(table, Model);
  return Model;
}
