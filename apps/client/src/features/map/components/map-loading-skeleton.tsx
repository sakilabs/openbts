import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";

export function MapLoadingSkeleton() {
	const { t } = useTranslation("map");

	return (
		<div className="relative h-full w-full bg-muted/30 overflow-hidden">
			<div className="absolute inset-0 opacity-[0.03]">
				<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
					<title>Map grid background</title>
					<defs>
						<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
							<path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#grid)" />
				</svg>
			</div>

			<div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-105 z-10">
				<div className="bg-background/80 backdrop-blur-sm border rounded-2xl shadow-lg p-3">
					<div className="flex items-center gap-3">
						<div className="size-5 rounded bg-muted animate-pulse" />
						<div className="flex-1 h-5 rounded-full bg-muted animate-pulse" />
						<div className="w-px h-6 bg-border" />
						<div className="w-20 h-8 rounded-xl bg-muted animate-pulse" />
					</div>
				</div>
			</div>

			<div className="absolute top-4 left-4 z-10 hidden md:block">
				<div className="bg-background/80 backdrop-blur-sm border rounded-xl shadow-lg overflow-hidden">
					<div className="flex items-center">
						<div className="px-3 py-2 flex items-center gap-2.5 border-r">
							<div className="size-2 rounded-full bg-muted animate-pulse" />
							<div className="w-16 h-5 rounded bg-muted animate-pulse" />
						</div>
						<div className="px-2.5 py-2">
							<div className="w-20 h-4 rounded bg-muted animate-pulse" />
						</div>
					</div>
				</div>
			</div>

			<div className="absolute bottom-4 left-4 z-10">
				<div className="bg-background/80 backdrop-blur-sm border rounded-xl shadow-lg overflow-hidden">
					<div className="md:hidden px-3 py-2 border-b bg-muted/30 flex items-center gap-3">
						<div className="size-1.5 rounded-full bg-muted animate-pulse" />
						<div className="flex flex-col gap-1">
							<div className="flex items-center gap-1.5">
								<div className="w-10 h-4 rounded bg-muted animate-pulse" />
								<div className="w-14 h-2 rounded bg-muted animate-pulse" />
							</div>
							<div className="flex items-center gap-1.5">
								<div className="w-6 h-2 rounded bg-muted animate-pulse" />
								<div className="w-8 h-2 rounded bg-muted animate-pulse" />
							</div>
						</div>
					</div>

					<div className="p-3">
						<div className="w-20 h-3 rounded bg-muted animate-pulse mb-2" />
						<div className="space-y-1.5">
							{[1, 2, 3, 4].map((i) => (
								<div key={i} className="flex items-center gap-2.5 px-1 py-0.5">
									<div className="size-2.5 rounded-full bg-muted animate-pulse" />
									<div className="w-14 h-3 rounded bg-muted animate-pulse" />
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			<div className="absolute bottom-10 right-2 z-10 hidden md:block">
				<div className="bg-background/80 backdrop-blur-sm border rounded-md shadow-lg overflow-hidden">
					<div className="size-8 border-b flex items-center justify-center">
						<div className="size-4 rounded bg-muted animate-pulse" />
					</div>
					<div className="size-8 flex items-center justify-center">
						<div className="size-4 rounded bg-muted animate-pulse" />
					</div>
				</div>
			</div>

			<div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
				<div className="relative">
					<div className="size-16 flex items-center justify-center">
						<HugeiconsIcon icon={Loading03Icon} className="size-8 text-primary animate-spin" />
					</div>
				</div>
				<div className="bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border">
					<p className="text-sm font-medium text-muted-foreground">{t("loading.loadingMap")}</p>
				</div>
			</div>

			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				{[
					{ x: "20%", y: "30%", delay: "0ms" },
					{ x: "45%", y: "25%", delay: "150ms" },
					{ x: "70%", y: "40%", delay: "300ms" },
					{ x: "30%", y: "60%", delay: "450ms" },
					{ x: "55%", y: "55%", delay: "600ms" },
					{ x: "80%", y: "70%", delay: "750ms" },
					{ x: "15%", y: "75%", delay: "900ms" },
					{ x: "60%", y: "80%", delay: "1050ms" },
				].map((dot) => (
					<div
						key={`${dot.x}-${dot.y}`}
						className="absolute size-3 rounded-full bg-muted animate-pulse"
						style={{
							left: dot.x,
							top: dot.y,
							animationDelay: dot.delay,
						}}
					/>
				))}
			</div>
		</div>
	);
}
