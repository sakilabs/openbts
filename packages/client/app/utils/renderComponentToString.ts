import { type Component, Suspense, type Plugin as VuePlugin, createApp, h, nextTick } from "vue";

export const renderComponentToString = async <T extends Record<string, unknown>>(Component: Component, props: T, plugins: VuePlugin[] = []) => {
	return new Promise<{ app: ReturnType<typeof createApp>; container: HTMLElement }>((resolve, reject) => {
		const app = createApp({
			render: () =>
				h(Suspense, null, {
					default: () => h(Component, { ...props, onReady: handleReady }),
				}),
		});

		for (const plugin of plugins) {
			app.use(plugin);
		}

		const container = document.createElement("div");

		function handleReady() {
			nextTick(() => {
				try {
					resolve({ app, container });
				} catch (error) {
					reject(error);
				}
			});
		}

		app.mount(container);
	});
};
