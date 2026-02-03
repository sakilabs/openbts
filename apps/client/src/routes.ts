import { type RouteConfig, route, layout, index } from "@react-router/dev/routes";

export default [
	layout("routes/_layout.tsx", [
		index("routes/_index.tsx"),
		route("stations", "routes/stations.tsx"),
		route("clf-export", "routes/clf-export.tsx"),
		// route("submissions", "routes/submissions.tsx"),
	]),
] satisfies RouteConfig;
