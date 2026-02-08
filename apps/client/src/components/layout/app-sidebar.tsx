"use client";

import { useState } from "react";
import type * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddCircleIcon, AirportTowerIcon, ArrowRight01Icon, Login01Icon, Settings02Icon } from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import { NavMain } from "./nav-main";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { authClient } from "@/lib/auth-client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { APP_NAME } from "@/lib/api";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { NavUser } from "./nav-user";
import { useSettings } from "@/hooks/use-settings";

const navMainConfig = [
	{
		titleKey: "sections.stations",
		key: "stations",
		url: "#",
		icon: AirportTowerIcon,
		items: [
			{ titleKey: "items.mapView", url: "/" },
			{ titleKey: "items.database", url: "/stations" },
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { t } = useTranslation("nav");
	const [authDialogOpen, setAuthDialogOpen] = useState(false);
	const { data: session } = authClient.useSession();
	const { data: settings } = useSettings();

	const mapConfig = (config: typeof navMainConfig) =>
		config.map((section) => ({
			title: t(section.titleKey),
			key: section.key,
			url: section.url,
			icon: section.icon,
			items: section.items.map((item) => ({
				title: t(item.titleKey),
				url: item.url,
			})),
		}));

	const navItems = mapConfig(navMainConfig);
	const authNavItems = session?.user && settings?.submissionsEnabled ? mapConfig(authNavConfig) : [];

	const location = useLocation();
	const [settingsOpen, setSettingsOpen] = useState(location.pathname.startsWith("/account/") || location.pathname === "/preferences");

	const settingsSubItems = [
		{ title: t("items.preferences"), url: "/preferences" },
		...(session?.user ? [{ title: t("items.accountSettings"), url: "/account/settings" }] : []),
	];

	return (
		<Sidebar variant="inset" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" render={<Link to={{ pathname: "/" }} />}>
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
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
						<SidebarMenuItem>
							<SidebarMenuButton render={<Link to="/preferences" />} tooltip={t("sections.settings")}>
								<HugeiconsIcon icon={Settings02Icon} />
								<span>{t("sections.settings")}</span>
							</SidebarMenuButton>
							<CollapsibleTrigger render={<SidebarMenuAction className={cn("transition-transform duration-200", settingsOpen && "rotate-90")} />}>
								<HugeiconsIcon icon={ArrowRight01Icon} />
								<span className="sr-only">Toggle</span>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<SidebarMenuSub>
									{settingsSubItems.map((item) => (
										<SidebarMenuSubItem key={item.title}>
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
				</SidebarMenu>
			</SidebarFooter>
			<AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
		</Sidebar>
	);
}
