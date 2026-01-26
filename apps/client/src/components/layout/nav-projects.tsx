"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Folder01Icon, MoreHorizontalIcon, Share01Icon, Delete02Icon } from "@hugeicons/core-free-icons";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Link } from "react-router";

export function NavProjects({
	projects,
}: {
	projects: {
		name: string;
		url: string;
		icon: IconSvgElement;
	}[];
}) {
	const { isMobile } = useSidebar();

	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>Projects</SidebarGroupLabel>
			<SidebarMenu>
				{projects.map((item) => (
					<SidebarMenuItem key={item.name}>
						<SidebarMenuButton render={<Link to={{ pathname: item.url }} />}>
							<HugeiconsIcon icon={item.icon} />
							<span>{item.name}</span>
						</SidebarMenuButton>
						<DropdownMenu>
							<DropdownMenuTrigger render={<SidebarMenuAction showOnHover />}>
								<HugeiconsIcon icon={MoreHorizontalIcon} />
								<span className="sr-only">More</span>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-48" side={isMobile ? "bottom" : "right"} align={isMobile ? "end" : "start"}>
								<DropdownMenuItem>
									<HugeiconsIcon icon={Folder01Icon} className="text-muted-foreground" />
									<span>View Project</span>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<HugeiconsIcon icon={Share01Icon} className="text-muted-foreground" />
									<span>Share Project</span>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem>
									<HugeiconsIcon icon={Delete02Icon} className="text-muted-foreground" />
									<span>Delete Project</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				))}
				<SidebarMenuItem>
					<SidebarMenuButton>
						<HugeiconsIcon icon={MoreHorizontalIcon} />
						<span>More</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	);
}
