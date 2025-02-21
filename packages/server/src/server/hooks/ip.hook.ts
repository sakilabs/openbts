import type { FastifyReply, FastifyRequest } from "fastify";

const IP_HEADERS = [
	"x-client-ip",
	"x-forwarded-for",
	"cf-connecting-ip",
	"fastly-client-ip",
	"x-real-ip",
	"x-cluster-client-ip",
	"x-forwarded",
	"forwarded-for",
	"forwarded",
	"x-appengine-user-ip",
	"true-client-ip",
] as const;

function getFirstIp(value: string): string {
	const ips = value.split(",");
	return ips[0]?.trim() || "";
}

function isValidIp(ip: string): boolean {
	const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
	const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
	if (!ip || typeof ip !== "string") return false;

	if (ipv4Regex.test(ip)) {
		const parts = ip.split(".");
		return parts.every((part) => {
			const num = Number.parseInt(part, 10);
			return num >= 0 && num <= 255;
		});
	}

	if (ipv6Regex.test(ip)) return true;

	return false;
}

export function ipHook(req: FastifyRequest, _: FastifyReply, done: () => void) {
	if (req.ip && isValidIp(req.ip)) {
		done();
		return;
	}

	for (const header of IP_HEADERS) {
		const value = req.headers[header];
		if (value && typeof value === "string") {
			const ip = getFirstIp(value);
			if (isValidIp(ip)) {
				Object.defineProperty(req, "ip", {
					value: ip,
				});
				break;
			}
		}
	}

	if (!req.ip && req.socket?.remoteAddress) {
		const ip = req.socket.remoteAddress.replace(/^::ffff:/, "");
		if (isValidIp(ip)) {
			Object.defineProperty(req, "ip", {
				value: ip,
			});
		}
	}

	done();
}
