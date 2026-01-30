import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function toggleValue<T>(values: T[], value: T): T[] {
	return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}
