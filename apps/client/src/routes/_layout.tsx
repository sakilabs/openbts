import { useEffect, type ReactNode } from "react";
import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { AirportTowerIcon } from "@hugeicons/core-free-icons";
import { APP_NAME } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { AuthGuard } from "@/components/auth/authGuard";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationsBell } from "@/features/notifications/components/NotificationsBell";
import { useAppBadge } from "@/features/notifications/useAppBadge";
import { useTwoFactorRedirect } from "@/hooks/useTwoFactorRedirect";
import { useWindowControlsOverlay } from "@/hooks/useWindowControlsOverlay";

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

const EMPTY_BREADCRUMBS: BreadcrumbSegment[] = [];

function AppLayout() {
  const matches = useMatches();
  const { t } = useTranslation();
  useAppBadge();
  useTwoFactorRedirect();

  const isWCO = useWindowControlsOverlay();

  const currentRoute = [...matches]
    .reverse()
    .find((match) => (match.staticData as RouteHandle)?.titleKey || (match.staticData as RouteHandle)?.title);
  const handle = currentRoute?.staticData as RouteHandle | undefined;

  const pageTitle = handle?.titleKey ? t(handle.titleKey, { ns: handle.i18nNamespace }) : (handle?.title ?? "");
  const breadcrumbs = handle?.breadcrumbs ?? EMPTY_BREADCRUMBS;

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
          <header
            className={cn("flex shrink-0 items-center gap-2 border-b bg-background", !isWCO && "h-12")}
            style={
              isWCO
                ? ({
                    height: "env(titlebar-area-height, 3rem)",
                    WebkitAppRegion: "drag",
                    appRegion: "drag",
                  } as React.CSSProperties)
                : undefined
            }
          >
            <div className="flex items-center gap-2 px-4 flex-1 min-w-0">
              {isWCO && (
                <Link
                  to="/"
                  className="flex items-center gap-2 mr-1 shrink-0"
                  style={{ WebkitAppRegion: "no-drag", appRegion: "no-drag" } as React.CSSProperties}
                >
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-6 items-center justify-center rounded-md">
                    <HugeiconsIcon icon={AirportTowerIcon} className="size-3.5" />
                  </div>
                  <span className="font-medium text-sm">{APP_NAME}</span>
                </Link>
              )}
              <span style={isWCO ? ({ WebkitAppRegion: "no-drag", appRegion: "no-drag" } as React.CSSProperties) : undefined}>
                <SidebarTrigger className="-ml-1" />
              </span>
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <Breadcrumb style={isWCO ? ({ WebkitAppRegion: "no-drag", appRegion: "no-drag" } as React.CSSProperties) : undefined}>
                <BreadcrumbList>
                  {!isWCO && (
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink render={<Link to="/" />}>{APP_NAME}</BreadcrumbLink>
                    </BreadcrumbItem>
                  )}
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
              <div
                id="header-actions"
                className="ml-auto flex items-center gap-2"
                style={
                  isWCO
                    ? ({
                        paddingRight: "calc(100vw - env(titlebar-area-x, 0px) - env(titlebar-area-width, 100vw))",
                        WebkitAppRegion: "no-drag",
                        appRegion: "no-drag",
                      } as React.CSSProperties)
                    : undefined
                }
              >
                <NotificationsBell />
              </div>
            </div>
          </header>
          <AnnouncementBanner />
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}

export const Route = createFileRoute("/_layout")({
  component: AppLayout,
});
