export const slideroverProps = () => {
	return useState<{ open: boolean; props: Record<string, unknown> }>("slideroverProps", () => {
		return { open: false, props: {} };
	});
};
