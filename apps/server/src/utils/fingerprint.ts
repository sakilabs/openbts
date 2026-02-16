import { createHash } from "node:crypto";

import type { FastifyRequest } from "fastify";

interface BrowserProperties {
  userAgent: string;
  language: string;
  platform: string;
  acceptHeaders: string;
  acceptEncoding: string;
  secChUa: string;
  dnt: string;
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
    acceptHeaders: getHeaderValue(headers.accept),
    acceptEncoding: getHeaderValue(headers["accept-encoding"]),
    secChUa: getHeaderValue(headers["sec-ch-ua"]),
    dnt: getHeaderValue(headers.dnt),
  };

  if (properties.userAgent === "unknown" || properties.acceptHeaders === "unknown") return null;

  const knownCount = Object.values(properties).filter((val) => val !== "unknown").length;
  if (knownCount < 3) return null;

  const browserFingerprint = Object.values(properties).join("|");
  const ipSubnet = getIpSubnet(req.ip);
  const combined = `${browserFingerprint}:${ipSubnet}`;

  return createHash("sha256").update(combined).digest("hex").substring(0, 12);
}

function getIpSubnet(ip: string | undefined): string {
  if (!ip || ip === "unknown") return "unknown";

  try {
    // IPv4: Use /24 subnet (first 3 octets) to group nearby IPs
    if (ip.includes(".")) {
      const parts = ip.split(".");
      if (parts.length === 4 && parts[0] && parts[1] && parts[2]) return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }

    // IPv6: Use first 64 bits (4 groups)
    if (ip.includes(":")) {
      const groups = ip.split(":");
      if (groups.length >= 4) return `${groups[0]}:${groups[1]}:${groups[2]}:${groups[3]}::`;
    }

    return "unknown";
  } catch {
    return "unknown";
  }
}
