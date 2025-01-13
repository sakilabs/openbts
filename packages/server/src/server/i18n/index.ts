import { translations } from "@btsfinder/translations";

import type { FastifyRequest } from "fastify";

interface Translations {
	[key: string]: string | { [key: string]: string };
}

class I18n {
	private translations: { [locale: string]: Translations } = {};
	private defaultLocale = "en";

	constructor(defaultLocale = "en") {
		this.defaultLocale = defaultLocale;
	}

	async loadTranslationFiles(): Promise<void> {
		this.translations = translations;
	}

	t(key: string, locale?: string): string {
		const targetLocale = locale || this.defaultLocale;
		const trans = this.translations[targetLocale] || this.translations[this.defaultLocale] || {};

		return this.getNestedValue(trans, key) || key;
	}

	private getNestedValue(obj: Translations, path: string): string {
		return (path.split(".").reduce((curr: Translations | string | undefined, key: string) => (curr as Translations)?.[key], obj) as string) || "";
	}
}

export const i18n = new I18n();

export const getRequestLanguage = (req: FastifyRequest): string => {
	const acceptLanguage = req.headers["accept-language"];
	if (!acceptLanguage) return "en";

	const preferredLanguage = acceptLanguage.split(",")?.[0]?.trim().split("-")[0] ?? "en";
	return preferredLanguage;
};
