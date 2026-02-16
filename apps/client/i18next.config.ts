import { defineConfig } from "i18next-cli";

export default defineConfig({
  locales: ["en-US", "pl-PL"],
  extract: {
    input: "src/**/*.{js,jsx,ts,tsx}",
    output: "src\\i18n\\locales\\{{language}}\\{{namespace}}.json",
  },
});
