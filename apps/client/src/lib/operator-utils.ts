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
		case 26034:
			return "#990A33"; // NetWorkS! - Dark Red
		case 26015:
		case 26016:
		case 26017:
			return "#255CAA"; // Aero2 - Dark Blue
		default:
			return "#3b82f6"; // blue
	}
};
