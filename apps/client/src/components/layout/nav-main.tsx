"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Link } from "react-router";

export function NavMain({
	items,
}: {
	items: {
		title: string;
		url: string;
		icon: IconSvgElement;
		isActive?: boolean;
		items?: {
			title: string;
			url: string;
		}[];
	}[];
}) {
	return (
		<SidebarGroup>
			<SidebarGroupLabel>Platform</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<Collapsible key={item.title} defaultOpen={item.isActive}>
						<SidebarMenuItem>
							<SidebarMenuButton render={<Link to={{ pathname: item.url }} />} tooltip={item.title}>
								<HugeiconsIcon icon={item.icon} />
								<span>{item.title}</span>
							</SidebarMenuButton>
							{item.items?.length ? (
								<>
									<CollapsibleTrigger render={<SidebarMenuAction className="data-[state=open]:rotate-90" />}>
										<HugeiconsIcon icon={ArrowRight01Icon} />
										<span className="sr-only">Toggle</span>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub>
											{item.items?.map((subItem) => (
												<SidebarMenuSubItem key={subItem.title}>
													<SidebarMenuSubButton render={<Link to={{ pathname: subItem.url }} />}>
														<span>{subItem.title}</span>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
											))}
										</SidebarMenuSub>
									</CollapsibleContent>
								</>
							) : null}
						</SidebarMenuItem>
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
