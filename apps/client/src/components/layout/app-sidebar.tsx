"use client";

import type * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AirportTowerIcon, AddCircleIcon } from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";

import { NavMain } from "./nav-main";
// import { NavProjects } from "./nav-projects";
// import { NavSecondary } from "./nav-secondary";
// import { NavUser } from "./nav-user";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Link } from "react-router";

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
	// {
	// 	titleKey: "sections.contribute",
	// 	key: "contribute",
	// 	url: "#",
	// 	icon: AddCircleIcon,
	// 	items: [{ titleKey: "items.submitStation", url: "/submissions" }],
	// },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { t } = useTranslation("nav");

	const navItems = navMainConfig.map((section) => ({
		title: t(section.titleKey),
		key: section.key,
		url: section.url,
		icon: section.icon,
		items: section.items.map((item) => ({
			title: t(item.titleKey),
			url: item.url,
		})),
	}));

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
								<span className="truncate font-medium">OpenBTS</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navItems} groupLabel={t("groups.platform")} />
				{/* <NavProjects projects={data.projects} /> */}
				{/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<ThemeToggle />
					</SidebarMenuItem>
					<SidebarMenuItem>
						<LanguageSwitcher />
					</SidebarMenuItem>
				</SidebarMenu>
				{/* <NavUser user={user} /> */}
			</SidebarFooter>
		</Sidebar>
	);
}
