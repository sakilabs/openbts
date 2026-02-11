import type { TFunction } from "i18next";

export function formatRelativeTime(dateString: string, t: TFunction): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);
	const diffWeeks = Math.floor(diffDays / 7);
	const diffMonths = Math.floor(diffDays / 30);
	const diffYears = Math.floor(diffDays / 365);

	if (diffYears > 0) return t("time.yearsAgo", { count: diffYears });
	if (diffMonths > 0) return t("time.monthsAgo", { count: diffMonths });
	if (diffWeeks > 0) return t("time.weeksAgo", { count: diffWeeks });
	if (diffDays > 0) return t("time.daysAgo", { count: diffDays });
	if (diffHours > 0) return t("time.hoursAgo", { count: diffHours });
	if (diffMinutes > 0) return t("time.minutesAgo", { count: diffMinutes });
	return t("time.justNow");
}

export function formatFullDate(dateString: string, locale: string): string {
	return new Date(dateString).toLocaleDateString(locale, {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function formatShortDate(dateString: string | null, locale: string): string {
	if (!dateString) return "-";
	return new Date(dateString).toLocaleDateString(locale, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}
