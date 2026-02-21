import { useMemo, useState, type ComponentProps } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AddCircleIcon,
  AirportTowerIcon,
  ArrowRight01Icon,
  GitBranchIcon,
  Login01Icon,
  Settings02Icon,
  SecurityLockIcon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import { NavMain } from "./nav-main";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AuthDialog } from "@/components/auth/authDialog";
import { authClient } from "@/lib/authClient";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { APP_NAME } from "@/lib/api";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { NavUser } from "./nav-user";
import { useSettings } from "@/hooks/useSettings";

const navMainConfig = [
  {
    titleKey: "sections.stations",
    key: "stations",
    url: "#",
    icon: AirportTowerIcon,
    items: [
      { titleKey: "items.mapView", url: "/" },
      { titleKey: "items.database", url: "/stations" },
      { titleKey: "items.statistics", url: "/statistics" },
      { titleKey: "items.deletedEntries", url: "/deleted-entries" },
      { titleKey: "items.clfExport", url: "/clf-export" },
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
      { titleKey: "items.submitStation", url: "/submission" },
      { titleKey: "items.mySubmissions", url: "/account/submissions" },
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
      { titleKey: "items.users", url: "/admin/users" },
      { titleKey: "items.stations", url: "/admin/stations" },
      { titleKey: "items.locations", url: "/admin/locations" },
      { titleKey: "items.submissions", url: "/admin/submissions" },
      { titleKey: "items.ukePermits", url: "/admin/uke-permits" },
      { titleKey: "items.ukeImport", url: "/admin/uke-import" },
      { titleKey: "items.auditLogs", url: "/admin/audit-logs" },
      { titleKey: "items.settings", url: "/admin/settings" },
    ],
  },
];

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation("nav");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const { data: settings } = useSettings();

  const mapConfig = useMemo(
    () => (config: typeof navMainConfig) =>
      config.map((section) => ({
        title: t(section.titleKey),
        key: section.key,
        url: section.url,
        icon: section.icon,
        items: section.items.map((item) => ({
          title: t(item.titleKey),
          url: item.url,
        })),
      })),
    [t],
  );

  const navItems = useMemo(() => mapConfig(navMainConfig), [mapConfig]);
  const showAuth = !!(session?.user && settings?.submissionsEnabled);
  const authNavItems = useMemo(() => (showAuth ? mapConfig(authNavConfig) : []), [mapConfig, showAuth]);
  const userRole = session?.user?.role as string | undefined;
  const isAdmin = userRole === "admin" || userRole === "editor" || userRole === "moderator";
  const adminNavItems = useMemo(() => (isAdmin ? mapConfig(adminNavConfig) : []), [mapConfig, isAdmin]);

  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(location.pathname === "/preferences");

  const settingsSubItems = [{ title: t("items.preferences"), url: "/preferences" }];

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/" />}>
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <HugeiconsIcon icon={AirportTowerIcon} className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{APP_NAME}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        {authNavItems.length > 0 && <NavMain items={authNavItems} />}
        {adminNavItems.length > 0 && <NavMain items={adminNavItems} />}
        <SidebarMenuItem>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuButton render={<Link to="/changelog" />} isActive={location.pathname === "/changelog"}>
                <span>{t("items.changelog")}</span>
              </SidebarMenuButton>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarMenuItem>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <SidebarMenuItem>
              <CollapsibleTrigger render={<SidebarMenuButton tooltip={t("sections.settings")} />}>
                <HugeiconsIcon icon={Settings02Icon} />
                <span>{t("sections.settings")}</span>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  className={cn("ml-auto size-4 transition-transform duration-200", settingsOpen && "rotate-90")}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {settingsSubItems.map((item) => (
                    <SidebarMenuSubItem key={item.url}>
                      <SidebarMenuSubButton render={<Link to={item.url} />} isActive={location.pathname === item.url}>
                        <span>{item.title}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <LanguageSwitcher />
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
          {(import.meta.env.VITE_GIT_COMMIT || import.meta.env.VITE_APP_VERSION) && (
            <div
              className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-muted-foreground"
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
        </SidebarMenu>
      </SidebarFooter>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </Sidebar>
  );
}
