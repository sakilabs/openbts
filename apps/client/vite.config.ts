import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";

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
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    tailwindcss(),
    {
      name: "react-scan",
      transformIndexHtml: {
        order: "pre",
        handler: (_, ctx) =>
          ctx.server
            ? [{ tag: "script", attrs: { src: "//unpkg.com/react-scan/dist/auto.global.js", crossorigin: "anonymous" }, injectTo: "head" }]
            : [],
      },
    },
    VitePWA({
      registerType: "prompt",
      manifest: {
        name: "OpenBTS",
        short_name: "OpenBTS",
        description: "Map and data explorer for BT stations",
        theme_color: "#0c0c0c",
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,woff2,png,svg}"],
      },
      pwaAssets: { disabled: false, config: true },
    }),
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
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "maplibre",
              test: /node_modules[\\/]maplibre-gl/,
              priority: 30,
            },
            {
              name: "react-vendor",
              test: /node_modules[\\/](react|react-dom|scheduler)\//,
              priority: 25,
            },
            {
              name: "router-vendor",
              test: /node_modules[\\/]@tanstack[\\/](react-router|router)/,
              priority: 20,
            },
            {
              name: "ui-vendor",
              test: /node_modules[\\/](@base-ui|@hugeicons|@floating-ui)/,
              priority: 15,
            },
            {
              name: "tanstack-vendor",
              test: /node_modules[\\/]@tanstack[\\/](react-query|react-table|react-form|react-virtual|query-core|table-core|form-core|virtual-core)/,
              priority: 13,
            },
            {
              name: "auth-vendor",
              test: /node_modules[\\/](better-auth|@daveyplate)/,
              priority: 12,
              entriesAware: true,
            },
            {
              name: "i18n-vendor",
              test: /node_modules[\\/](i18next|react-i18next)/,
              priority: 11,
            },
            {
              name: "vendor",
              test: /node_modules/,
              priority: 10,
              entriesAware: true,
            },
          ],
        },
      },
    },
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
