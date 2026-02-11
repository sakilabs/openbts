export function getHardwareLeaseOperator(stationId: string): string | null {
	if (stationId.startsWith("T-")) return "T-Mobile";
	if (stationId.startsWith("O-")) return "Orange";
	return null;
}
