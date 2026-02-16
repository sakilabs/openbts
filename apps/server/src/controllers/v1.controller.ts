import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { dlogger } from "../config.js";
import { logger } from "../utils/logger.js";

import type { RouteOptions } from "fastify";
import type { FastifyZodInstance } from "../interfaces/fastify.interface.js";

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((file) => (file.isDirectory() ? walk(join(dir, file.name)) : join(dir, file.name)));
}

export async function APIv1Controller(fastify: FastifyZodInstance) {
  const __dirname = fileURLToPath(new URL(".", import.meta.url));
  const routeFiles = walk(join(__dirname, "..", "routes", "v1"));
  const log = dlogger.extend("APIv1Controller");

  for (const file of routeFiles) {
    let route: RouteOptions;
    try {
      const module = await import(`file://${file}`).catch((err) => {
        log("Failed to import route file %s: %o", file, err);
        return null;
      });
      if (!module) continue;

      route = module.default;
      if (!route?.method || !route?.url) {
        log("Invalid route export in %s - missing method or url", file);
        continue;
      }

      log("Registering route: %o %s", route.method, route.url);
      fastify.route(route);
    } catch (error) {
      logger.error("Error registering route %s: %o", { file, error });
      log("Error registering route %s: %o", file, error);
    }
  }
}
