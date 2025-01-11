import { version } from "./package.json";

export default defineNuxtConfig({
	app: {
		head: {
			htmlAttrs: {
				lang: "en",
			},
			title: "bts finder",
			meta: [
				{ charset: "utf-8" },
				{ name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" },
				{
					hid: "robots",
					property: "robots",
					content: "none, noindex, nofollow",
				},
				{
					hid: "description",
					name: "description",
					content: "BTS Finder",
				},
			],
			link: [
				{ rel: "icon", type: "image/png", sizes: "16x16", href: "/assets/favicons/favicon-16x16.png" },
				{ rel: "icon", type: "image/png", sizes: "32x32", href: "/assets/favicons/favicon-32x32.png" },
				{ rel: "mask-icon", color: "#111827", href: "/assets/favicons/safari-pinned-tab.svg" },
				{ prefetch: "true", rel: "preconnect", href: "https://openstreetmap.org" },
				{ prefetch: "true", rel: "preconnect", href: "https://c.tile.openstreetmap.org" },
				{ prefetch: "true", rel: "preconnect", href: "https://b.tile.openstreetmap.org" },
				{ prefetch: "true", rel: "preconnect", href: "https://a.tile.openstreetmap.org" },
			],
		},
	},
	build: {
		transpile: ["vue-sonner"],
	},
	dayjs: {
		locales: ["pl"],
		plugins: ["relativeTime", "utc", "timezone", "localizedFormat"],
		defaultLocale: "pl",
		defaultTimezone: "Europe/Warsaw",
	},
	modules: ["@nuxt/image", "@vite-pwa/nuxt", "@nuxtjs/leaflet", "@vueuse/nuxt", "@nuxt/ui", "dayjs-nuxt", "@nuxtjs/device"],
	pwa: {
		registerType: "autoUpdate",
		manifest: {
			name: "BTS Finder",
			short_name: "BTS Finder",
			description: "BTS Finder",
			icons: [
				{
					src: "/assets/favicons/android-chrome-192x192.png",
					sizes: "192x192",
					type: "image/png",
					purpose: "any",
				},
				{
					src: "/assets/favicons/android-chrome-512x512.png",
					sizes: "512x512",
					type: "image/png",
					purpose: "maskable",
				},
			],
			display: "standalone",
			theme_color: "#10B981",
		},
		injectRegister: "auto",
		devOptions: {
			enabled: true,
			type: "module",
		},
		strategies: "generateSW",
		workbox: {
			globPatterns: ["**/*.{js,css}"],
			globIgnores: ["**/node_modules/**/*", "sw.js", "workbox-*.js"],
			navigateFallback: null,
		},
	},
	leaflet: {
		markerCluster: true,
	},
	icon: {
		clientBundle: {
			icons: [
				"heroicons:bars-3",
				"heroicons:chevron-right-20-solid",
				"heroicons:check-circle",
				"heroicons:pencil-square-16-solid",
				"heroicons:plus-circle-16-solid",
				"flowbite:arrow-up-right-from-square-outline",
				"carbon:logo-google",
				"raphael:apple",
				"heroicons:trash-20-solid",
				"heroicons:user-16-solid",
				"heroicons:document-plus-20-solid",
				"heroicons:x-mark-20-solid",
				"heroicons:x-mark-16-solid",
				"heroicons:home-16-solid",
				"lucide:arrow-right",
				"lucide:chevron-right",
				"lucide:x",
			],
			scan: true,
		},
	},
	runtimeConfig: {
		public: {
			// Populate prod API URL
			BASE_API_URL: process.env.NODE_ENV !== "production" ? "http://localhost:3030/api/v1" : "",
			WEBSITE_VERSION: version,
			USE_BOUNDARIES_MAP: true,
		},
	},
	typescript: {
		strict: true,
	},
	srcDir: "app/",
	ssr: false,
	vite: {
		server: {
			watch: {
				usePolling: true,
			},
		},
		optimizeDeps: {
			include: ["leaflet"],
		},
	},
	future: {
		compatibilityVersion: 4,
	},
	compatibilityDate: "2024-12-17",
});
