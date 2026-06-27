import { Add01Icon, ArrowRight01Icon, StarIcon, TaskDaily01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { Suspense, lazy, memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { fetchUserLists, type UserListSummary } from "@/features/lists/api";
import { useFavoriteLists } from "@/hooks/useFavoriteLists";
import { authClient } from "@/lib/authClient";
import { cn } from "@/lib/utils";

const NAV_STORAGE_KEY = "nav-collapsed-state";
const SIDEBAR_LIST_FETCH_LIMIT = 10;
const SIDEBAR_RECENT_LIST_LIMIT = 5;

function readNavState(): boolean {
  try {
    const stored = localStorage.getItem(NAV_STORAGE_KEY);
    if (!stored) return false;
    return (JSON.parse(stored) as Record<string, boolean>)["lists"] ?? false;
  } catch {
    return false;
  }
}

function saveNavState(open: boolean) {
  try {
    const stored = localStorage.getItem(NAV_STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as Record<string, boolean>) : {};
    localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify({ ...parsed, lists: open }));
  } catch {}
}

const CreateListDialog = lazy(() => import("@/features/lists/components/createListDialog").then((m) => ({ default: m.CreateListDialog })));

export const NavLists = memo(function NavLists() {
  const { t } = useTranslation(["nav", "lists"]);
  const location = useLocation();
  const [open, setOpen] = useState(readNavState);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    saveNavState(open);
  }, [open]);

  const { data: session } = authClient.useSession();
  const { canFavorite, favoriteSet, favoriteUuids, isFavorite, toggleFavorite } = useFavoriteLists();

  const { data } = useQuery({
    queryKey: ["user-lists", { limit: SIDEBAR_LIST_FETCH_LIMIT }],
    queryFn: () => fetchUserLists(SIDEBAR_LIST_FETCH_LIMIT, 1),
  });

  const lists = useMemo<UserListSummary[]>(() => {
    const ownedLists = data?.data.filter((list) => list.createdBy.uuid === session?.user?.id) ?? [];
    if (ownedLists.length === 0) return [];

    const listByUuid = new Map(ownedLists.map((list) => [list.uuid, list]));
    const favoriteLists = favoriteUuids.reduce<UserListSummary[]>((acc, uuid) => {
      const list = listByUuid.get(uuid);
      if (list !== undefined) acc.push(list);
      return acc;
    }, []);
    const recentLists = ownedLists.filter((list) => !favoriteSet.has(list.uuid)).slice(0, Math.max(0, SIDEBAR_RECENT_LIST_LIMIT - favoriteLists.length));

    return [...favoriteLists, ...recentLists];
  }, [data?.data, favoriteSet, favoriteUuids, session?.user?.id]);

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger render={<SidebarMenuButton tooltip={t("nav:sections.lists")} className="pr-7" />}>
              <HugeiconsIcon icon={TaskDaily01Icon} />
              <span>{t("nav:sections.lists")}</span>
              <HugeiconsIcon icon={ArrowRight01Icon} className={cn("ml-auto size-4 transition-transform duration-200", open && "rotate-90")} />
            </CollapsibleTrigger>
            <SidebarMenuAction
              showOnHover
              aria-label={t("lists:create")}
              onClick={(e) => {
                e.stopPropagation();
                setDialogOpen(true);
              }}
            >
              <HugeiconsIcon icon={Add01Icon} />
            </SidebarMenuAction>
            <CollapsibleContent>
              <SidebarMenuSub>
                {lists.map((list: UserListSummary) => {
                  const favorite = isFavorite(list.uuid);
                  const favoriteLabel = favorite ? t("lists:removeFavorite") : t("lists:addFavorite");

                  return (
                    <SidebarMenuSubItem key={list.uuid}>
                      <SidebarMenuSubButton
                        render={<Link to="/lists/$uuid" params={{ uuid: list.uuid }} />}
                        isActive={location.pathname === `/lists/${list.uuid}`}
                        className={canFavorite ? "pr-7" : undefined}
                      >
                        <span className="truncate">{list.name}</span>
                      </SidebarMenuSubButton>
                      {canFavorite ? (
                        <button
                          type="button"
                          aria-label={favoriteLabel}
                          aria-pressed={favorite}
                          title={favoriteLabel}
                          className={cn(
                            "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-1 right-1 flex size-5 items-center justify-center rounded-md p-0 opacity-0 outline-hidden transition group-focus-within/menu-sub-item:opacity-100 group-hover/menu-sub-item:opacity-100 focus-visible:ring-2 [&>svg]:size-3.5",
                            favorite && "text-amber-500 opacity-100 hover:text-amber-500 [&_*]:fill-current",
                          )}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            toggleFavorite(list.uuid);
                          }}
                        >
                          <HugeiconsIcon icon={StarIcon} />
                        </button>
                      ) : null}
                    </SidebarMenuSubItem>
                  );
                })}
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton render={<Link to="/lists" />} isActive={location.pathname === "/lists"}>
                    <span>{t("nav:items.viewAllLists")}</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} className="ml-auto size-3.5" />
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarMenuItem>
      </SidebarMenu>

      {dialogOpen && (
        <Suspense>
          <CreateListDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </Suspense>
      )}
    </SidebarGroup>
  );
});
