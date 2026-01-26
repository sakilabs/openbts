"use client";

import type * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AirportTowerIcon } from "@hugeicons/core-free-icons";

import { NavMain } from "./nav-main";
// import { NavProjects } from "./nav-projects";
// import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Link } from "react-router";

const data = {
	user: {
		name: "test",
		email: "test",
		avatar: "/avatars/shadcn.jpg",
	},
	navMain: [
		{
			title: "Stations",
			url: "#",
			icon: AirportTowerIcon,
			isActive: true,
			items: [
				{
					title: "Map View",
					url: "/",
				},
				{
					title: "Database",
					url: "/stations",
				},
			],
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
				<NavMain items={data.navMain} />
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
				<NavUser user={data.user} />
			</SidebarFooter>
		</Sidebar>
	);
}
