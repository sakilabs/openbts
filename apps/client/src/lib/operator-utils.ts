export const getOperatorColor = (mnc: number): string => {
	switch (mnc) {
		case 26002:
			return "#E20074"; // T-Mobile - Magenta
		case 26003:
			return "#FF7900"; // Orange
		case 26001:
			return "#00B140"; // Plus - Green
		case 26006:
			return "#8B00FF"; // Play - Purple
		default:
			return "#3b82f6"; // blue
	}
};
