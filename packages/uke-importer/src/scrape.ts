import * as cheerio from "cheerio";
import { absolutize } from "./utils.js";

async function fetchHtml(targetUrl: string): Promise<string> {
	const res = await fetch(targetUrl);
	return await res.text();
}

export async function scrapeXlsxLinks(listUrl: string): Promise<{ href: string; text: string }[]> {
	const html = await fetchHtml(listUrl);
	const $ = cheerio.load(html);
	const out: { href: string; text: string }[] = [];
	$("ul.files li .part a").each((_, el) => {
		const href = $(el).attr("href") || "";
		const text = $(el).text().trim();
		if (!href.toLowerCase().endsWith(".xlsx")) return;
		out.push({ href: absolutize(listUrl, href), text });
	});
	return out;
}
