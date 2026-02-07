import { Link, Outlet, useMatches } from "react-router";
import { useTranslation } from "react-i18next";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export interface RouteHandle {
	titleKey?: string;
	i18nNamespace?: string;
	title?: string;
	headerContent?: React.ReactNode;
	mainClassName?: string;
}

export default function AppLayout() {
	const matches = useMatches();

	const currentRoute = [...matches].reverse().find((match) => (match.handle as RouteHandle)?.titleKey || (match.handle as RouteHandle)?.title);
	const handle = currentRoute?.handle as RouteHandle | undefined;

	const { t } = useTranslation(handle?.i18nNamespace);
	const pageTitle = handle?.titleKey ? t(handle.titleKey) : (handle?.title ?? "");

	return (
		<AuthGuard>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset className="overflow-hidden max-h-svh">
					<header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background">
						<div className="flex items-center gap-2 px-4 flex-1 min-w-0">
							<SidebarTrigger className="-ml-1" />
							<Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
							<Breadcrumb>
								<BreadcrumbList>
									<BreadcrumbItem className="hidden md:block">
										<BreadcrumbLink render={<Link to="/" />}>OpenBTS</BreadcrumbLink>
									</BreadcrumbItem>
									{pageTitle && (
										<>
											<BreadcrumbSeparator className="hidden md:block" />
											<BreadcrumbItem>
												<BreadcrumbPage>{pageTitle}</BreadcrumbPage>
											</BreadcrumbItem>
										</>
									)}
								</BreadcrumbList>
							</Breadcrumb>
							<div id="header-actions" className="ml-auto flex items-center gap-2" />
						</div>
					</header>
					<Outlet />
				</SidebarInset>
			</SidebarProvider>
		</AuthGuard>
	);
}
