import { lazy, memo, Suspense, useState, useEffect, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { TaskDaily01Icon, Add01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { authClient } from "@/lib/authClient";
import { fetchUserLists } from "@/features/lists/api";
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
import { cn } from "@/lib/utils";

const NAV_STORAGE_KEY = "nav-collapsed-state";

const CreateListDialog = lazy(() => import("@/features/lists/components/createListDialog").then((m) => ({ default: m.CreateListDialog })));

export const NavLists = memo(function NavLists() {
  const { t } = useTranslation(["nav", "lists"]);
  const location = useLocation();
  const [open, setOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(NAV_STORAGE_KEY);
      return stored ? ((JSON.parse(stored) as Record<string, boolean>)["lists"] ?? false) : false;
    } catch {
      return false;
    }
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(NAV_STORAGE_KEY);
      const parsed = stored ? (JSON.parse(stored) as Record<string, boolean>) : {};
      localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify({ ...parsed, lists: open }));
    } catch {}
  }, [open]);

  const { data: session } = authClient.useSession();

  const { data } = useQuery({
    queryKey: ["user-lists", { limit: 5 }],
    queryFn: () => fetchUserLists(5, 1),
  });

  const lists = useMemo(() => data?.data.filter((l) => l.createdBy.uuid === session?.user?.id) ?? [], [data, session?.user?.id]);

  return (
    <SidebarGroup>
      <SidebarMenu>
        <Collapsible open={open} onOpenChange={setOpen}>
          <SidebarMenuItem>
            <CollapsibleTrigger render={<SidebarMenuButton tooltip={t("nav:sections.lists")} className="pr-7" />}>
              <HugeiconsIcon icon={TaskDaily01Icon} />
              <span>{t("nav:sections.lists")}</span>
              <HugeiconsIcon icon={ArrowRight01Icon} className={cn("ml-auto size-4 transition-transform duration-200", open && "rotate-90")} />
            </CollapsibleTrigger>
            <SidebarMenuAction
              showOnHover
              onClick={(e) => {
                e.stopPropagation();
                setDialogOpen(true);
              }}
            >
              <HugeiconsIcon icon={Add01Icon} />
            </SidebarMenuAction>
            <CollapsibleContent>
              <SidebarMenuSub>
                {lists.map((list) => (
                  <SidebarMenuSubItem key={list.uuid}>
                    <SidebarMenuSubButton
                      render={<Link to="/lists/$uuid" params={{ uuid: list.uuid }} />}
                      isActive={location.pathname === `/lists/${list.uuid}`}
                    >
                      <span className="truncate">{list.name}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton render={<Link to="/lists" />} isActive={location.pathname === "/lists"}>
                    <span>{t("nav:items.viewAllLists")}</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} className="ml-auto size-3.5" />
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>

      {dialogOpen && (
        <Suspense>
          <CreateListDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </Suspense>
      )}
    </SidebarGroup>
  );
});
