import React, { useMemo, useState, type ComponentProps } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  AddCircleIcon,
  AirportTowerIcon,
  AnalyticsUpIcon,
  DatabaseIcon,
  Delete02Icon,
  Download04Icon,
  FileAttachmentIcon,
  FileSearchIcon,
  GitBranchIcon,
  InformationCircleIcon,
  LegalDocument01Icon,
  Login01Icon,
  Location01Icon,
  Mail01Icon,
  MapsIcon,
  Note01Icon,
  SentIcon,
  Settings02Icon,
  SecurityLockIcon,
  TaskDaily01Icon,
  Upload04Icon,
  UserGroupIcon,
  FileBracesIcon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import { NavMain } from "./nav-main";
import { NavLists } from "./nav-lists";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AuthDialog } from "@/components/auth/authDialog";
import { authClient } from "@/lib/authClient";
import { APP_NAME } from "@/lib/api";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { NavUser } from "./nav-user";
import { GoogleAd } from "@/components/ui/google-ad";
import { useSettings } from "@/hooks/useSettings";
import { useWindowControlsOverlay } from "@/hooks/useWindowControlsOverlay";

const navMainConfig = [
  {
    titleKey: "sections.stations",
    key: "stations",
    url: "#",
    icon: AirportTowerIcon,
    items: [
      { titleKey: "items.mapView", url: "/", icon: MapsIcon },
      { titleKey: "items.database", url: "/stations", icon: DatabaseIcon },
      { titleKey: "items.statistics", url: "/statistics", icon: AnalyticsUpIcon },
      { titleKey: "items.deletedEntries", url: "/deleted-entries", icon: Delete02Icon },
      { titleKey: "items.clfExport", url: "/clf-export", icon: Download04Icon },
      { titleKey: "items.analyzer", url: "/analyzer", icon: FileSearchIcon },
    ],
  },
];

const authNavConfig = [
  {
    titleKey: "sections.contribute",
    key: "contribute",
    url: "#",
    icon: AddCircleIcon,
    items: [
      { titleKey: "items.submitStation", url: "/submission", icon: AddCircleIcon },
      { titleKey: "items.mySubmissions", url: "/account/submissions", icon: SentIcon },
    ],
  },
];

const infoNavConfig = [
  {
    titleKey: "sections.info",
    key: "info",
    url: "#",
    icon: InformationCircleIcon,
    items: [
      { titleKey: "items.about", url: "/about", icon: InformationCircleIcon },
      { titleKey: "items.contact", url: "/contact", icon: Mail01Icon },
      { titleKey: "items.tos", url: "/tos", icon: LegalDocument01Icon },
      { titleKey: "items.apiDocs", url: "#", href: "/api/v1/docs", icon: FileBracesIcon },
    ],
  },
];

const adminNavConfig = [
  {
    titleKey: "sections.admin",
    key: "admin",
    url: "#",
    icon: SecurityLockIcon,
    items: [
      { titleKey: "items.users", url: "/admin/users", allowedRoles: ["admin"], icon: UserGroupIcon },
      { titleKey: "items.stations", url: "/admin/stations", allowedRoles: ["admin", "editor"], icon: AirportTowerIcon },
      { titleKey: "items.locations", url: "/admin/locations", allowedRoles: ["admin", "editor"], icon: Location01Icon },
      { titleKey: "items.submissions", url: "/admin/submissions", allowedRoles: ["admin", "editor"], icon: SentIcon },
      { titleKey: "items.ukePermits", url: "/admin/uke-permits", allowedRoles: ["admin", "editor"], icon: FileAttachmentIcon },
      { titleKey: "items.ukeImport", url: "/admin/uke-import", allowedRoles: ["admin"], icon: Upload04Icon },
      { titleKey: "items.lists", url: "/admin/lists", allowedRoles: ["admin"], icon: TaskDaily01Icon, requiresSetting: "enableUserLists" as const },
      { titleKey: "items.auditLogs", url: "/admin/audit-logs", allowedRoles: ["admin"], icon: Note01Icon },
      { titleKey: "items.settings", url: "/admin/settings", allowedRoles: ["admin"], icon: Settings02Icon },
    ],
  },
];

type NavConfigItem = { titleKey: string; url: string; href?: string; icon: IconSvgElement };
type NavConfigSection = { titleKey: string; key: string; url: string; icon: IconSvgElement; items: NavConfigItem[] };

function translateNav(config: NavConfigSection[], t: (key: string) => string) {
  return config.map((section) => ({
    title: t(section.titleKey),
    key: section.key,
    url: section.url,
    icon: section.icon,
    items: section.items.map((item) => ({
      title: t(item.titleKey),
      url: item.url,
      href: item.href,
      icon: item.icon,
    })),
  }));
}

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation("nav");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const { data: session } = authClient.useSession();
  const { data: settings } = useSettings();
  const { visible: isWCO, isMacOS } = useWindowControlsOverlay();

  const navItems = useMemo(() => translateNav(navMainConfig, t), [t]);
  const infoNavItems = useMemo(() => translateNav(infoNavConfig, t), [t]);
  const showAuth = !!(session?.user && settings?.submissionsEnabled);
  const authNavItems = useMemo(() => (showAuth ? translateNav(authNavConfig, t) : []), [t, showAuth]);
  const userRole = session?.user?.role as string | undefined;
  const isAdmin = userRole === "admin" || userRole === "editor";
  const adminNavItems = useMemo(() => {
    if (!isAdmin || !userRole) return [];
    return adminNavConfig
      .map((section) => ({
        title: t(section.titleKey),
        key: section.key,
        url: section.url,
        icon: section.icon,
        items: section.items
          .filter((item) => item.allowedRoles.includes(userRole))
          .filter((item) => !item.requiresSetting || !!settings?.[item.requiresSetting])
          .map((item) => ({ title: t(item.titleKey), url: item.url, icon: item.icon })),
      }))
      .filter((section) => section.items.length > 0);
  }, [isAdmin, userRole, t, settings]);

  const location = useLocation();

  return (
    <Sidebar variant="inset" {...props}>
      {isWCO && isMacOS ? (
        <SidebarHeader style={{ height: "env(titlebar-area-height, 3rem)", WebkitAppRegion: "drag", appRegion: "drag" } as React.CSSProperties} />
      ) : !isWCO ? (
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" render={<Link to="/" />}>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                  {logoFailed ? (
                    <HugeiconsIcon icon={AirportTowerIcon} className="size-4" />
                  ) : (
                    <img src="/logo.webp" alt={APP_NAME} className="size-full object-contain" onError={() => setLogoFailed(true)} />
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{APP_NAME}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
      ) : null}
      <SidebarContent>
        <NavMain items={navItems} />
        {authNavItems.length > 0 && <NavMain items={authNavItems} />}
        {session?.user && settings?.enableUserLists && <NavLists />}
        {adminNavItems.length > 0 && <NavMain items={adminNavItems} />}
        <NavMain items={infoNavItems} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link to="/preferences" />} isActive={location.pathname === "/preferences"}>
              <HugeiconsIcon icon={Settings02Icon} />
              <span>{t("items.preferences")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="grid grid-cols-2 gap-1">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </SidebarMenuItem>
          {!session?.user && (
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" onClick={() => setAuthDialogOpen(true)} className="cursor-pointer">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <HugeiconsIcon icon={Login01Icon} className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{t("auth.signIn", "Sign In")}</span>
                  <span className="truncate text-xs text-muted-foreground">{t("auth.signInHint", "Access your account")}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          {session?.user && <NavUser data={session} />}
          <SidebarMenuItem>
            <GoogleAd adSlot="5258756297" adFormat="rectangle" className="w-full h-62.5" />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-1 text-[10px] text-muted-foreground">
              {(import.meta.env.VITE_GIT_COMMIT || import.meta.env.VITE_APP_VERSION) && (
                <div
                  className="flex items-center gap-1.5 min-w-0"
                  title={[import.meta.env.VITE_GIT_COMMIT, import.meta.env.VITE_APP_VERSION && `v${import.meta.env.VITE_APP_VERSION}`]
                    .filter(Boolean)
                    .join(" · ")}
                >
                  <HugeiconsIcon icon={GitBranchIcon} className="size-3 shrink-0" />
                  <span className="truncate">
                    {import.meta.env.VITE_GIT_COMMIT && (
                      <a
                        href={`https://github.com/sakilabs/openbts/commit/${import.meta.env.VITE_GIT_COMMIT}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-chart-1 hover:underline"
                      >
                        {import.meta.env.VITE_GIT_COMMIT}
                      </a>
                    )}
                    {import.meta.env.VITE_APP_VERSION && (
                      <span className="text-muted-foreground">
                        {import.meta.env.VITE_GIT_COMMIT ? " " : ""}(v{import.meta.env.VITE_APP_VERSION})
                      </span>
                    )}
                  </span>
                </div>
              )}
              <Link to="/changelog" className={cn("shrink-0 hover:underline p-2 -m-2", location.pathname === "/changelog" && "text-foreground")}>
                {t("items.changelog")}
              </Link>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </Sidebar>
  );
}
