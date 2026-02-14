import { useEffect, type ReactNode } from "react";
import { Link, Outlet, useMatches } from "react-router";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@/lib/api";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AuthGuard } from "@/components/auth/authGuard";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export interface BreadcrumbSegment {
	titleKey: string;
	i18nNamespace?: string;
	path?: string;
}

export interface RouteHandle {
	titleKey?: string;
	i18nNamespace?: string;
	title?: string;
	breadcrumbs?: BreadcrumbSegment[];
	headerContent?: ReactNode;
	mainClassName?: string;
	/** Roles allowed to access this route (used by admin layout guard). */
	allowedRoles?: string[];
}

export default function AppLayout() {
	const matches = useMatches();
	const { t } = useTranslation();

	const currentRoute = [...matches].reverse().find((match) => (match.handle as RouteHandle)?.titleKey || (match.handle as RouteHandle)?.title);
	const handle = currentRoute?.handle as RouteHandle | undefined;

	const pageTitle = handle?.titleKey ? t(handle.titleKey, { ns: handle.i18nNamespace }) : (handle?.title ?? "");
	const breadcrumbs = handle?.breadcrumbs ?? [];

	useEffect(() => {
		const titleParts: string[] = [];

		titleParts.push(APP_NAME);

		for (const segment of breadcrumbs) {
			titleParts.push(t(segment.titleKey, { ns: segment.i18nNamespace }));
		}

		if (pageTitle) titleParts.push(pageTitle);

		document.title = titleParts.join(" · ");
	}, [pageTitle, breadcrumbs, t]);

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
										<BreadcrumbLink render={<Link to="/" />}>{APP_NAME}</BreadcrumbLink>
									</BreadcrumbItem>
									{breadcrumbs.map((segment) => (
										<span key={segment.titleKey} className="hidden md:contents">
											<BreadcrumbSeparator />
											<BreadcrumbItem>
												{segment.path ? (
													<BreadcrumbLink render={<Link to={segment.path} />}>{t(segment.titleKey, { ns: segment.i18nNamespace })}</BreadcrumbLink>
												) : (
													<BreadcrumbPage>{t(segment.titleKey, { ns: segment.i18nNamespace })}</BreadcrumbPage>
												)}
											</BreadcrumbItem>
										</span>
									))}
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
