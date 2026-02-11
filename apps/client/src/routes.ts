import { type RouteConfig, route, layout, index } from "@react-router/dev/routes";

export default [
	layout("routes/_layout.tsx", [
		index("routes/_index.tsx"),
		route("stations", "routes/stations.tsx"),
		route("clf-export", "routes/clf-export.tsx"),
		route("account/settings", "routes/account/settings.tsx"),
		route("account/submissions", "routes/account/submissions.tsx"),
		route("preferences", "routes/preferences.tsx"),
		route("submission", "routes/submission.tsx"),
		layout("routes/admin/_layout.tsx", [
			route("admin/users", "routes/admin/users/index.tsx"),
			route("admin/users/:id", "routes/admin/users/[id].tsx"),
			route("admin/stations", "routes/admin/stations/index.tsx"),
			route("admin/stations/:id", "routes/admin/stations/[id].tsx"),
			route("admin/locations", "routes/admin/locations/index.tsx"),
			route("admin/locations/:id", "routes/admin/locations/[id].tsx"),
			route("admin/submissions", "routes/admin/submissions/index.tsx"),
			route("admin/submissions/:id", "routes/admin/submissions/[id].tsx"),
			route("admin/settings", "routes/admin/settings.tsx"),
		]),
	]),
] satisfies RouteConfig;
