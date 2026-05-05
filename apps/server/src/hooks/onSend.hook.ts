import type { FastifyReply, FastifyRequest, RequestPayload } from "fastify";

export async function OnSendHook(req: FastifyRequest, res: FastifyReply, payload: RequestPayload) {
  const duration = process.hrtime.bigint() - req?.requestStartTime;

  res.header("x-response-time", `${(Number(duration) / 1e6).toFixed(3)} ms`);
  const protoType = res.routeOptions.config.proto;
  if (protoType && req.headers.accept === "application/x-protobuf" && typeof payload === "string") {
    const encoded = protoType.encode(JSON.parse(payload)).finish();
    res.header("Content-Type", "application/x-protobuf");
    return encoded;
  }

  return payload;
}
