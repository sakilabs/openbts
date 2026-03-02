import { Logger, AxiomJSTransport, ConsoleTransport } from "@axiomhq/logging";
import { Axiom } from "@axiomhq/js";

import type { Transport } from "@axiomhq/logging";

function serializeError(err: unknown): { name: string; message: string; stack?: string; cause?: unknown } {
  if (err instanceof Error) {
    const anyErr = err as unknown as { cause?: unknown };
    const serialized: { name: string; message: string; stack?: string; cause?: unknown } = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
    if (anyErr.cause !== undefined) {
      serialized.cause =
        anyErr.cause instanceof Error
          ? serializeError(anyErr.cause)
          : typeof anyErr.cause === "object" && anyErr.cause !== null
            ? JSON.stringify(anyErr.cause)
            : String(anyErr.cause as string | number | boolean);
    }
    return serialized;
  }
  return { name: "UnknownError", message: String(err) };
}

const axiomToken = process.env.AXIOM_TOKEN;
const axiomDataset = process.env.AXIOM_DATASET || "openbts";

const transports: [Transport, ...Transport[]] = [new ConsoleTransport({ prettyPrint: true })];

if (axiomToken) {
  const axiom = new Axiom({ token: axiomToken });
  transports.push(
    new AxiomJSTransport({
      axiom,
      dataset: axiomDataset,
    }),
  );
}

export const logger = new Logger({ transports });

export function installProcessErrorHandlers(): void {
  process.on("uncaughtException", (error: Error) => {
    logger.error("uncaught_exception", {
      ...serializeError(error),
    });
  });

  process.on("unhandledRejection", (reason: unknown) => {
    const serialized = serializeError(reason);
    logger.error("unhandled_rejection", serialized);
  });

  process.on("warning", (warning: Error) => {
    logger.warn("process_warning", serializeError(warning));
  });
}

export { serializeError };
