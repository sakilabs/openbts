import { desc } from "drizzle-orm";
import { ukeImportMetadata } from "@openbts/drizzle";
import { db } from "@openbts/drizzle/db";

type ImportType = "stations" | "radiolines" | "stations_permits" | "permits";

export async function isDataUpToDate(importType: ImportType, fileLinks: Array<{ href: string; text: string }>): Promise<boolean> {
	const fileList = JSON.stringify(fileLinks.map((l) => l.href).sort());
	const latestImport = await db.query.ukeImportMetadata.findFirst({
		where: (t, { eq, and }) => and(eq(t.import_type, importType), eq(t.status, "success")),
		orderBy: [desc(ukeImportMetadata.last_import_date)],
	});

	if (!latestImport) return false;
	return latestImport.file_list === fileList;
}

export async function recordImportMetadata(
	importType: ImportType,
	fileLinks: Array<{ href: string; text: string }>,
	status: "success" | "failed",
): Promise<void> {
	const fileList = JSON.stringify(fileLinks.map((l) => l.href).sort());
	await db.insert(ukeImportMetadata).values({
		import_type: importType,
		file_list: fileList,
		status,
	});
}
