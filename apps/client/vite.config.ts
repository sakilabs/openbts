import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";

function getGitCommit(): string {
	try {
		return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
	} catch {
		return "";
	}
}

function getAppVersion(): string {
	try {
		const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf8"));
		return (pkg.version as string) ?? "";
	} catch {
		return "";
	}
}

// const ReactCompilerConfig = {};

// https://vite.dev/config/
export default defineConfig({
	define: {
		"import.meta.env.VITE_APP_VERSION": JSON.stringify(getAppVersion()),
		"import.meta.env.VITE_GIT_COMMIT": JSON.stringify(getGitCommit()),
	},
	plugins: [
		reactRouter(),
		tailwindcss(),
		// babel({
		// 	apply: "build",
		// 	filter: /\.[jt]sx?$/,
		// 	babelConfig: {
		// 		presets: ["@babel/preset-typescript"],
		// 		plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
		// 	},
		// }),
	],
	optimizeDeps: {
		include: ["react", "react-dom", "react-i18next", "maplibre-gl", "@hugeicons/react"],
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
	server: {
		warmup: {
			clientFiles: ["./src/components/**/*.tsx", "./src/features/**/*.tsx"],
		},
	},
});
