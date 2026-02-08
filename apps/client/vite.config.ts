import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";

// const ReactCompilerConfig = {};

// https://vite.dev/config/
export default defineConfig({
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
