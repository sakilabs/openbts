import { fromJson, toBinary } from "@bufbuild/protobuf";
import type { FastifyReply, FastifyRequest, RequestPayload } from "fastify";

export async function OnSendHook(req: FastifyRequest, res: FastifyReply, payload: RequestPayload) {
  const duration = process.hrtime.bigint() - req?.requestStartTime;

  res.header("x-response-time", `${(Number(duration) / 1e6).toFixed(3)} ms`);
  const protoSchema = res.routeOptions.config.proto;
  if (protoSchema && req.headers.accept === "application/x-protobuf" && typeof payload === "string" && res.statusCode < 400) {
    const encoded = toBinary(protoSchema, fromJson(protoSchema, JSON.parse(payload)));
    res.header("Content-Type", "application/x-protobuf");
    return Buffer.from(encoded);
  }
  return payload;
}
