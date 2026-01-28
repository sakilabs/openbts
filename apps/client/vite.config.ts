import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import babel from "vite-plugin-babel";

const ReactCompilerConfig = {};

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
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
	build: {
		rollupOptions: {
			output: {
				// manualChunks: {
				// 	react: ["react", "react-dom", "react-router"],
				// 	tanstack: ["@tanstack/react-query", "@tanstack/react-table"],
				// 	icons: ["lucide-react", "@hugeicons/core-free-icons", "@hugeicons/react"],
				// },
			},
		},
	},
});
