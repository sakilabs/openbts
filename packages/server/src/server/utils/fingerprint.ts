import type { FastifyRequest } from "fastify";

interface BrowserProperties {
	userAgent: string;
	language: string;
	platform: string;
	screenResolution: string;
	timezone: string;
	acceptHeaders: string;
}

export function generateFingerprint(req: FastifyRequest): string | null {
	const headers = req.headers;

	const getHeaderValue = (value: string | string[] | undefined): string => {
		if (Array.isArray(value)) return value.join(",");
		return value || "unknown";
	};

	const properties: BrowserProperties = {
		userAgent: getHeaderValue(headers["user-agent"]),
		language: getHeaderValue(headers["accept-language"]),
		platform: getHeaderValue(headers["sec-ch-ua-platform"]),
		screenResolution:
			headers["sec-ch-viewport-height"] && headers["sec-ch-viewport-width"]
				? `${getHeaderValue(headers["sec-ch-viewport-width"])}x${getHeaderValue(headers["sec-ch-viewport-height"])}`
				: "unknown",
		timezone: getHeaderValue(headers["sec-ch-timezone"]),
		acceptHeaders: getHeaderValue(headers.accept),
	};

	const unknownCount = Object.values(properties).filter((val) => val === "unknown").length;
	const requiredProperties = ["userAgent", "acceptHeaders"];
	const hasRequiredProperties = requiredProperties.every((prop) => properties[prop as keyof BrowserProperties] !== "unknown");

	if (unknownCount > 3 || !hasRequiredProperties) return null;

	const fingerprintString = Object.values(properties).join("|");

	let hash = 0;
	for (let i = 0; i < fingerprintString.length; i++) {
		const char = fingerprintString.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}

	const ip = req.ip || "unknown";
	const combinedHash = `${hash}-${ip}`;

	return combinedHash;
}
