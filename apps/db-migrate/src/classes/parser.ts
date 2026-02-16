import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import pkg from "node-sql-parser";
import ora from "ora";
const { Parser } = pkg;

export interface ParsedInsert {
  table: string;
  columns: string[];
  values: (string | number | null)[][];
}

export interface SQLParserOptions {
  database?: "MySQL" | "PostgresQL" | "MariaDB" | "SQLite" | "Hive" | "N1QL" | "PLSQL" | "SparkSQL" | "tsql";
  log?: (level: "debug" | "info" | "warn" | "error", message: string, meta?: unknown) => void;
}

type AnyAst = Record<string, unknown>;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function asArray<T>(v: T | T[] | null | undefined): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}
function get<T = unknown>(o: Record<string, unknown>, key: string): T | undefined {
  return o[key] as T | undefined;
}
function hasKey<T extends string>(o: unknown, key: T): o is Record<T, unknown> {
  return isRecord(o) && key in o;
}

function defaultLog(level: "debug" | "info" | "warn" | "error", message: string, meta?: unknown) {
  if (level === "debug") return;
  if (meta !== undefined) {
    console[level === "error" ? "error" : level](message, meta);
  } else {
    console[level === "error" ? "error" : level](message);
  }
}

export class SQLParser {
  private parser: InstanceType<typeof Parser>;
  private log: NonNullable<SQLParserOptions["log"]>;
  private db: NonNullable<SQLParserOptions["database"]>;
  private progressIncrement?: (n: number) => void;

  constructor(options: SQLParserOptions = {}) {
    this.parser = new Parser();
    this.log = options.log ?? defaultLog;
    this.db = options.database ?? "MySQL";
  }

  parseSQLFile(filePath: string): ParsedInsert[] {
    const content = readFileSync(filePath, "utf-8");
    return this.parseSQLContent(content, path.basename(filePath));
  }

  parseSQLContent(content: string, filename?: string): ParsedInsert[] {
    const normalized = content.replace(/\r\n/g, "\n");
    if (!normalized.trim()) return [];

    const startedAt = Date.now();
    let processed = 0;
    const label = filename || "SQL";
    let spinner: ReturnType<typeof ora> | null = null;
    spinner = ora({
      text: `${label}: Parsing the file for INSERT statements...`,
      spinner: "dots",
    }).start();
    this.progressIncrement = (n: number) => {
      processed += n;
    };

    const results = this.parseAllStatementsWithParser(normalized, filename);

    if (spinner) {
      const elapsedMs = Date.now() - startedAt;
      const seconds = (elapsedMs / 1000).toFixed(elapsedMs < 10000 ? 2 : 0);
      spinner.succeed(`${label}: Parsed ${processed} values in ${seconds}s`);
    }
    this.progressIncrement = undefined;

    return results;
  }

  parseDirectory(dirPath: string): Map<string, ParsedInsert[]> {
    const results = new Map<string, ParsedInsert[]>();
    try {
      const files = readdirSync(dirPath).filter((f) => f.toLowerCase().endsWith(".sql"));
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const tableName = path.basename(file, ".sql");
        const parsed = this.parseSQLFile(filePath);
        results.set(tableName, parsed);
        this.log("info", `${file}: ${parsed.length} INSERT statements parsed`);
      }
    } catch (error) {
      this.log("error", "Error reading directory", error);
    }
    return results;
  }

  private parseAllStatementsWithParser(content: string, filename?: string): ParsedInsert[] {
    try {
      const ast = this.parser.astify(content, { database: this.db }) as unknown as AnyAst | AnyAst[];
      const stmts = asArray(ast);
      const inserts: ParsedInsert[] = [];

      for (const stmt of stmts) {
        const type = get<string>(stmt, "type");
        if (type === "insert") {
          const parsed = this.extractInsert(stmt);
          if (parsed) inserts.push(parsed);
        } else if (type === "block" && Array.isArray(get(stmt, "stmt"))) {
          const innerStmts = get<AnyAst[]>(stmt, "stmt");
          if (Array.isArray(innerStmts)) {
            for (const inner of innerStmts) {
              if (get<string>(inner, "type") === "insert") {
                const parsed = this.extractInsert(inner);
                if (parsed) inserts.push(parsed);
              }
            }
          }
        }
      }

      return inserts;
    } catch (error) {
      this.log("warn", `Parser failed for ${filename || "content"}`, error);
      return [];
    }
  }

  private extractInsert(insertAst: AnyAst): ParsedInsert | null {
    const tableName = this.extractTableName(insertAst);
    if (!tableName) return null;

    const columns = this.extractColumns(insertAst);
    const values = this.extractValues(insertAst);

    return { table: tableName, columns, values };
  }

  private extractTableName(insertAst: AnyAst): string | null {
    const t = get<unknown>(insertAst, "table");
    if (!t) return null;

    if (Array.isArray(t)) {
      const first = t[0];
      if (isRecord(first) && typeof get<string>(first, "table") === "string") {
        return get<string>(first, "table")!;
      }
      if (typeof first === "string") return first;
      return null;
    }

    if (isRecord(t)) {
      const tbl = get<string>(t, "table");
      if (typeof tbl === "string") return tbl;
      return null;
    }

    if (typeof t === "string") return t;
    return null;
  }

  private extractColumns(insertAst: AnyAst): string[] {
    const out: string[] = [];
    const cols = get<unknown>(insertAst, "columns");
    if (!Array.isArray(cols)) return out;

    for (const col of cols) {
      if (typeof col === "string") {
        out.push(col);
      } else if (isRecord(col)) {
        const c1 = get<string>(col, "column");
        if (typeof c1 === "string") {
          out.push(c1);
          continue;
        }
        const expr = get<unknown>(col, "expr");
        if (isRecord(expr)) {
          const c2 = get<string>(expr, "column");
          if (typeof c2 === "string") out.push(c2);
        }
      }
    }
    return out;
  }

  private extractValues(insertAst: AnyAst): (string | number | null)[][] {
    const out: (string | number | null)[][] = [];

    const root = get<unknown>(insertAst as Record<string, unknown>, "values");

    function isExprList(node: unknown): node is Record<string, unknown> {
      return isRecord(node) && get<string>(node, "type") === "expr_list" && Array.isArray(get(node, "value"));
    }

    function collectRowNodes(node: unknown): unknown[] {
      if (!node) return [];
      if (isExprList(node)) {
        const children = get<unknown[]>(node, "value") ?? [];
        const hasNested = children.some((c) => isExprList(c));
        if (!hasNested) return [node];
        let acc: unknown[] = [];
        for (const child of children) acc = acc.concat(collectRowNodes(child));
        return acc;
      }
      if (Array.isArray(node)) {
        let acc: unknown[] = [];
        for (const item of node) acc = acc.concat(collectRowNodes(item));
        return acc;
      }
      if (isRecord(node)) {
        const v1 = get<unknown>(node, "values");
        const v2 = get<unknown>(node, "value");
        return [...collectRowNodes(v1), ...collectRowNodes(v2)];
      }
      return [];
    }

    const rows = collectRowNodes(root);
    for (const rowNode of rows) {
      out.push(this.extractRowValues(rowNode));
      this.progressIncrement?.(1);
    }
    return out;
  }

  private extractRowValues(rowNode: unknown): (string | number | null)[] {
    const row: (string | number | null)[] = [];

    const array = Array.isArray(rowNode) ? rowNode : isRecord(rowNode) ? (get<unknown[]>(rowNode, "value") ?? []) : [];

    for (const expr of array) {
      row.push(this.extractScalar(expr));
    }
    return row;
  }

  private extractScalar(expr: unknown): string | number | null {
    if (!expr) return null;

    if (!isRecord(expr)) {
      if (typeof expr === "string" || typeof expr === "number") return expr;
      return expr ? String(expr) : null;
    }

    const type = get<string>(expr, "type");
    const rawVal = get<unknown>(expr, "value");

    if (type === "null") return null;
    if (type === "number") {
      const n = Number(rawVal);
      return Number.isNaN(n) ? null : n;
    }
    if (type === "bool" || type === "boolean") {
      if (typeof rawVal === "boolean") return rawVal ? 1 : 0;
      if (typeof rawVal === "string") return rawVal.toLowerCase() === "true" || rawVal === "1" ? 1 : 0;
      if (typeof rawVal === "number") return rawVal ? 1 : 0;
      return null;
    }
    if (
      type === "string" ||
      type === "single_quote_string" ||
      type === "double_quote_string" ||
      type === "backticks_quote_string" ||
      type === "regex_string" ||
      type === "hex_string" ||
      type === "full_hex_string" ||
      type === "natural_string" ||
      type === "bit_string" ||
      type === "var_string"
    )
      return String(rawVal ?? "");
    if (type === "date" || type === "datetime" || type === "time" || type === "timestamp") return String(rawVal ?? "");
    if (type === "star") return "*";
    if (type === "param" || type === "origin") return String(rawVal ?? "");
    if (type === "default") return null;
    if (type === "unary_expr" && hasKey(expr, "operator") && hasKey(expr, "expr")) {
      const op = String(expr.operator);
      const val = this.extractScalar(expr.expr);
      if (typeof val === "number" && op === "-") return -val;
      if (typeof val === "number" && op === "+") return +val;
      return val;
    }
    if (type === "function" || type === "binary_expr" || type === "expr_list" || type === "column_ref") {
      const name = get(expr, "name");
      const column = get(expr, "column");
      return String(rawVal ?? name ?? column ?? "");
    }

    return String(rawVal ?? "");
  }
}

export const sqlParser = new SQLParser();
