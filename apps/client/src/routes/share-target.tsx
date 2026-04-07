import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

function extractCoords(input: string): { lat: number; lng: number } | null {
  // Google Maps: https://www.google.com/maps?q=52.123,21.456
  //              https://maps.google.com/@52.123,21.456,15z
  const googleAt = input.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (googleAt) return { lat: Number.parseFloat(googleAt[1]!), lng: Number.parseFloat(googleAt[2]!) };

  const googleQ = input.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (googleQ) return { lat: Number.parseFloat(googleQ[1]!), lng: Number.parseFloat(googleQ[2]!) };

  // Apple Maps/generic: ?ll=52.123,21.456
  const ll = input.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (ll) return { lat: Number.parseFloat(ll[1]!), lng: Number.parseFloat(ll[2]!) };

  // Our share hash: #map=16/52.123/21.456
  const hash = input.match(/#map=\d+\/([-\d.]+)\/([-\d.]+)/);
  if (hash) return { lat: Number.parseFloat(hash[1]!), lng: Number.parseFloat(hash[2]!) };

  // Plain coordinates: "52.123, 21.456" or "52.123 21.456"
  const plain = input.match(/(-?\d{1,3}\.\d{3,})[,\s]+(-?\d{1,3}\.\d{3,})/);
  if (plain) {
    const lat = Number.parseFloat(plain[1]!);
    const lng = Number.parseFloat(plain[2]!);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
  }

  return null;
}

function ShareTargetPage() {
  const navigate = useNavigate();
  const { title: _title, text, url } = Route.useSearch();

  useEffect(() => {
    const candidate = [url, text].filter(Boolean).join(" ");
    const coords = extractCoords(candidate);

    if (coords) {
      void navigate({
        to: "/",
        hash: `map=16/${coords.lat}/${coords.lng}`,
        replace: true,
      });
    } else void navigate({ to: "/", replace: true });
  }, [navigate, text, url]);

  return null;
}

export const Route = createFileRoute("/share-target")({
  component: ShareTargetPage,
  validateSearch: (search: Record<string, unknown>) => ({
    title: search.title as string | undefined,
    text: search.text as string | undefined,
    url: search.url as string | undefined,
  }),
});
