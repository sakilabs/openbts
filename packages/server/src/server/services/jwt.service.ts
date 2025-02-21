import { createSigner, createVerifier } from "fast-jwt";

import type { TokenPayload } from "../interfaces/auth.interface.js";

export class JWTService {
	private static instance: JWTService;
	private accessSigner;
	private accessVerifier;
	private refreshSigner;
	private refreshVerifier;

	private constructor() {
		this.accessSigner = createSigner({
			key: process.env.JWT_SECRET,
			expiresIn: "1d",
		});

		this.accessVerifier = createVerifier({
			key: process.env.JWT_SECRET,
			cache: true,
		});

		this.refreshSigner = createSigner({
			key: process.env.JWT_REFRESH_SECRET,
			expiresIn: "7d",
		});

		this.refreshVerifier = createVerifier({
			key: process.env.JWT_REFRESH_SECRET,
			cache: true,
		});
	}

	public static getInstance(): JWTService {
		if (!JWTService.instance) {
			JWTService.instance = new JWTService();
		}
		return JWTService.instance;
	}

	public async signAccessToken(payload: TokenPayload): Promise<string> {
		return this.accessSigner(payload);
	}

	public async verifyAccessToken(token: string): Promise<TokenPayload> {
		return this.accessVerifier(token);
	}

	public async signRefreshToken(payload: TokenPayload): Promise<string> {
		return this.refreshSigner(payload);
	}

	public async verifyRefreshToken(token: string): Promise<TokenPayload> {
		return this.refreshVerifier(token);
	}
}
