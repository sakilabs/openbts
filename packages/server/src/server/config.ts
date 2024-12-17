import debug from "debug";
import "dotenv/config";

export const logger: debug.Debugger = debug("sakilabs/btsfinder:server"),
	port = Number(process.env.PORT) || 3030,
	allowed_users = [4, 5];
