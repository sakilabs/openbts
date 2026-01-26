import { lazy, Suspense } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MapLoadingSkeleton } from "@/features/map/components/map-loading-skeleton";

const MapView = lazy(() => import("@/features/map/components/map-view"));

export default function Page() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className="overflow-hidden">
				<header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background">
					<div className="flex items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1" />
						<Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem className="hidden md:block">
									<BreadcrumbLink href="#">OpenBTS</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator className="hidden md:block" />
								<BreadcrumbItem>
									<BreadcrumbPage>Stations Map</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					</div>
				</header>
				<div className="flex-1">
					<Suspense fallback={<MapLoadingSkeleton />}>
						<MapView />
					</Suspense>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
