"use client";

import { useState, useEffect, useCallback } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { useLocation } from "react-router";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "nav-collapsed-state";

type NavItem = {
	title: string;
	key: string;
	url: string;
	icon: IconSvgElement;
	items?: {
		title: string;
		url: string;
	}[];
};

export function NavMain({ items }: { items: NavItem[] }) {
	const location = useLocation();

	const getInitialState = useCallback(() => {
		if (typeof window === "undefined") {
			return items.reduce<Record<string, boolean>>((acc, item) => {
				acc[item.key] = item.items?.some((sub) => sub.url === location.pathname) ?? false;
				return acc;
			}, {});
		}
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				return JSON.parse(stored) as Record<string, boolean>;
			}
		} catch {}
		return items.reduce<Record<string, boolean>>((acc, item) => {
			acc[item.key] = item.items?.some((sub) => sub.url === location.pathname) ?? false;
			return acc;
		}, {});
	}, [items, location.pathname]);

	const [openState, setOpenState] = useState<Record<string, boolean>>(getInitialState);

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(openState));
		} catch {}
	}, [openState]);

	const handleOpenChange = (key: string, open: boolean) => {
		setOpenState((prev) => ({ ...prev, [key]: open }));
	};

	return (
		<SidebarGroup>
			<SidebarMenu>
				{items.map((item) => (
					<Collapsible key={item.key} open={openState[item.key] ?? false} onOpenChange={(open) => handleOpenChange(item.key, open)}>
						<SidebarMenuItem>
							{item.items?.length ? (
								<>
									<CollapsibleTrigger render={<SidebarMenuButton tooltip={item.title} />}>
										<HugeiconsIcon icon={item.icon} />
										<span>{item.title}</span>
										<HugeiconsIcon
											icon={ArrowRight01Icon}
											className={cn("ml-auto size-4 transition-transform duration-200", openState[item.key] && "rotate-90")}
										/>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub>
											{item.items?.map((subItem) => (
												<SidebarMenuSubItem key={subItem.url}>
													<SidebarMenuSubButton render={<Link to={{ pathname: subItem.url }} />} isActive={location.pathname === subItem.url}>
														<span>{subItem.title}</span>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
											))}
										</SidebarMenuSub>
									</CollapsibleContent>
								</>
							) : (
								<SidebarMenuButton render={<Link to={{ pathname: item.url }} />} tooltip={item.title}>
									<HugeiconsIcon icon={item.icon} />
									<span>{item.title}</span>
								</SidebarMenuButton>
							)}
						</SidebarMenuItem>
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
