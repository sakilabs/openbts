import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config();
export default defineConfig({
	dialect: "postgresql",
	schema: "./drizzle/schemas/schema.ts",
	out: "./drizzle/migrate",
	dbCredentials: {
		url: process.env.DATABASE_URL as string,
	},
});
