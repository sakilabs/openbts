export default defineAppConfig({
	ui: {
		colors: {
			primary: "sky",
			secondary: "indigo",
			success: "green",
			info: "blue",
			warning: "yellow",
			error: "red",
			neutral: "slate",
		},
		card: {
			slots: {
				header: "p-4",
				body: "p-4",
				footer: "p-4",
			},
		},
		textarea: {
			slots: {
				base: [
					"resize-none w-full rounded-[calc(var(--ui-radius)*1.5)] border-0 placeholder-[--ui-text-dimmed] focus:outline-none disabled:cursor-not-allowed disabled:opacity-75",
					"transition-colors",
				],
			},
			variants: {
				size: {
					md: {
						base: "px-2.5 py-1.5 pb-6 text-sm gap-1.5",
					},
				},
			},
		},
	},
});
