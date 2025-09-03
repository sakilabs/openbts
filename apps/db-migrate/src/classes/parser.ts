import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import pkg from "node-sql-parser";
const { Parser } = pkg;

export interface ParsedInsert {
	table: string;
	columns: string[];
	values: (string | number | null)[][];
}

export interface SQLParserOptions {
	database?: "MySQL" | "PostgresQL" | "MariaDB" | "SQLite" | "Hive" | "N1QL" | "PLSQL" | "SparkSQL" | "tsql";
	log?: (level: "debug" | "info" | "warn" | "error", message: string, meta?: unknown) => void;
	enableRegexFallback?: boolean;
}

type AnyAst = Record<string, unknown>;

// Narrowing helpers
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

function cleanSqlContent(raw: string): string {
	return raw
		.replace(/--.*$/gm, "")
		.replace(/\/\*[\s\S]*?\*\//g, "")
		.replace(/\r\n/g, "\n")
		.trim();
}
function ensureSemicolon(sql: string): string {
	const trimmed = sql.trim();
	return trimmed.endsWith(";") ? trimmed : `${trimmed};`;
}

export class SQLParser {
	private parser: InstanceType<typeof Parser>;
	private log: NonNullable<SQLParserOptions["log"]>;
	private db: NonNullable<SQLParserOptions["database"]>;
	private enableRegexFallback: boolean;

	constructor(options: SQLParserOptions = {}) {
		this.parser = new Parser();
		this.log = options.log ?? defaultLog;
		this.db = options.database ?? "MySQL";
		this.enableRegexFallback = options.enableRegexFallback ?? true;
	}

	parseSQLFile(filePath: string): ParsedInsert[] {
		const content = readFileSync(filePath, "utf-8");
		return this.parseSQLContent(content, path.basename(filePath));
	}

	parseSQLContent(content: string, filename?: string): ParsedInsert[] {
		const cleanContent = cleanSqlContent(content);
		if (!cleanContent) return [];

		const parsedByParser = this.parseAllStatementsWithParser(cleanContent, filename);
		if (parsedByParser.length) return parsedByParser;

		if (!this.enableRegexFallback) return [];

		this.log("info", `${filename || "Content"}: falling back to regex for INSERT extraction`);
		const insertRegex = /\binsert\s+into\b[\s\S]*?(?:;|$)/gi;
		const matches = cleanContent.match(insertRegex) ?? [];

		const results: ParsedInsert[] = [];
		for (const match of matches) {
			const parsed = this.parseInsertAstSafely(match, filename);
			if (parsed) results.push(parsed);
		}

		if (results.length === 0) {
			const statements = cleanContent
				.split(";")
				.map((s) => s.trim())
				.filter(Boolean);
			for (const stmt of statements) {
				if (/^insert\s+/i.test(stmt)) {
					const parsed = this.parseInsertAstSafely(ensureSemicolon(stmt), filename);
					if (parsed) results.push(parsed);
				}
			}
		}

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

	private parseInsertAstSafely(statement: string, filename?: string): ParsedInsert | null {
		try {
			const normalized = statement
				.replace(/`/g, "")
				.replace(/\bIF\s+NOT\s+EXISTS\b/gi, "")
				.replace(/\)\s*ENGINE\b[\s\S]*?;/gi, ")")
				.replace(/\)\s*CHARSET\b[\s\S]*?;/gi, ")")
				.trim();
			const cleanStatement = ensureSemicolon(normalized.replace(/\s+/g, " "));
			const ast = this.parser.astify(cleanStatement, { database: this.db }) as unknown as AnyAst | AnyAst[];
			const first = Array.isArray(ast) ? ast[0] : ast;
			if (!first || get<string>(first, "type") !== "insert") return null;
			return this.extractInsert(first);
		} catch (error) {
			this.log("warn", `Failed to parse INSERT in ${filename || "content"}`, error);
			return null;
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
		let values: unknown = [];
		if (isRecord(insertAst.values)) values = get<unknown>(insertAst.values as Record<string, unknown>, "values");
		if (!Array.isArray(values)) return out;

		for (const rowNode of values) {
			out.push(this.extractRowValues(rowNode));
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

		if (type === "null") return null;

		if (type === "number") {
			const raw = get<unknown>(expr, "value");
			const n = Number(raw);
			return Number.isNaN(n) ? null : n;
		}

		if (type === "string" || type === "single_quote_string" || type === "double_quote_string") {
			return String(get(expr, "value") ?? "");
		}

		if (type === "bool" || type === "boolean") {
			const v = get<unknown>(expr, "value");
			if (typeof v === "boolean") return v ? 1 : 0;
			if (typeof v === "string") return v.toLowerCase() === "true" ? 1 : 0;
			return null;
		}

		if (type === "date" || type === "time" || type === "timestamp") {
			return String(get(expr, "value") ?? "");
		}

		if (type === "unary_expr" && hasKey(expr, "operator") && hasKey(expr, "expr")) {
			const op = String(expr.operator);
			const val = this.extractScalar(expr.expr);
			if (typeof val === "number" && op === "-") return -val;
			if (typeof val === "number" && op === "+") return +val;
			return val;
		}

		if (type === "function" || type === "binary_expr" || type === "expr_list" || type === "column_ref") {
			const val = get(expr, "value");
			const name = get(expr, "name");
			const column = get(expr, "column");
			return String(val ?? name ?? column ?? "");
		}

		if (type === "default") return null;

		return String(get(expr, "value") ?? "");
	}
}

export const sqlParser = new SQLParser();
