import { getOperatorColor } from "@/lib/operator-utils";

const PIE_IMAGE_SIZE = 32;
const PIE_FILL_RADIUS = 12;
const PIE_STROKE_RADIUS = 14;
const PIE_STROKE_WIDTH = 4;

export function createPieChartImage(segments: { value: number; color: string }[]): ImageData | null {
	const canvas = document.createElement("canvas");
	canvas.width = PIE_IMAGE_SIZE;
	canvas.height = PIE_IMAGE_SIZE;

	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) return null;

	const center = PIE_IMAGE_SIZE / 2;
	const total = segments.reduce((sum, seg) => sum + seg.value, 0) || 1;

	let startAngle = -Math.PI / 2;
	for (const { value, color } of segments) {
		const endAngle = startAngle + (value / total) * Math.PI * 2;
		ctx.beginPath();
		ctx.moveTo(center, center);
		ctx.arc(center, center, PIE_FILL_RADIUS + 0.5, startAngle, endAngle);
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.fill();
		startAngle = endAngle;
	}

	ctx.beginPath();
	ctx.arc(center, center, PIE_STROKE_RADIUS, 0, Math.PI * 2);
	ctx.strokeStyle = "#fff";
	ctx.lineWidth = PIE_STROKE_WIDTH;
	ctx.stroke();

	return ctx.getImageData(0, 0, PIE_IMAGE_SIZE, PIE_IMAGE_SIZE);
}

function parseOperators(operatorsJson: string | undefined): number[] {
	try {
		return JSON.parse(operatorsJson || "[]");
	} catch {
		return [];
	}
}

function createOperatorSegments(operators: number[]) {
	return operators.map((mnc) => ({
		value: 1,
		color: getOperatorColor(mnc),
	}));
}

export function syncPieImages(map: maplibregl.Map, features: GeoJSON.Feature[], addedImages: Set<string>): void {
	for (const feature of features) {
		const pieImageId = feature.properties?.pieImageId;
		if (!pieImageId || addedImages.has(pieImageId)) continue;

		const operators = parseOperators(feature.properties?.operators);

		if (map.hasImage(pieImageId)) {
			addedImages.add(pieImageId);
			continue;
		}

		const segments = createOperatorSegments(operators);
		const imageData = createPieChartImage(segments);

		if (imageData) {
			map.addImage(pieImageId, imageData);
			addedImages.add(pieImageId);
		}
	}
}
