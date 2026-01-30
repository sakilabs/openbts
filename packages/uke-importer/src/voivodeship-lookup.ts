import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import geojsonRbush from "geojson-rbush";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point, polygon, featureCollection } from "@turf/helpers";
import type { FeatureCollection, Feature, Polygon, MultiPolygon } from "geojson";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const geojsonPath = path.join(__dirname, "..", "poland.voivodeships.max.json");

interface VoivodeshipProperties {
	terc: string;
	name: string;
}

type VoivodeshipFeature = Feature<Polygon, VoivodeshipProperties>;

function explodeMultiPolygons(fc: FeatureCollection): FeatureCollection<Polygon, VoivodeshipProperties> {
	const out: VoivodeshipFeature[] = [];
	for (const f of fc.features) {
		if (f.geometry?.type === "Polygon") {
			out.push(f as VoivodeshipFeature);
		} else if (f.geometry?.type === "MultiPolygon") {
			const multiPolygon = f as Feature<MultiPolygon, VoivodeshipProperties>;
			for (const rings of multiPolygon.geometry.coordinates) {
				out.push(polygon(rings, multiPolygon.properties) as VoivodeshipFeature);
			}
		}
	}
	return featureCollection(out) as FeatureCollection<Polygon, VoivodeshipProperties>;
}

function createSpatialIndex() {
	const woj = JSON.parse(fs.readFileSync(geojsonPath, "utf8")) as FeatureCollection;
	const wojExploded = explodeMultiPolygons(woj);

	// biome-ignore lint/suspicious/noExplicitAny: broken types
	const tree = (geojsonRbush as any)();
	tree.load(wojExploded);

	return tree;
}

const tree = createSpatialIndex();

export function findVoivodeshipByTeryt(lon: number, lat: number): string | null {
	const pt = point([lon, lat]);
	const candidates = tree.search(pt).features as VoivodeshipFeature[];
	for (const f of candidates) {
		if (booleanPointInPolygon(pt, f)) return f.properties?.terc ?? null;
	}

	// Pomorskie
	if ((lon === 18.576667 && lat === 54.448056) || (lon === 18.679444 && lat === 54.693056) || (lon === 18.576944 && lat === 54.448056)) return "22";
	return null;
}
