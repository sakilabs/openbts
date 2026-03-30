import { HugeiconsIcon } from "@hugeicons/react";
import { Logout02Icon, Settings02Icon } from "@hugeicons/core-free-icons";
import { ElipsisIcon } from "@/components/ui/elipsis-icon";
import { Link } from "@tanstack/react-router";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveAvatarUrl } from "@/lib/format";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { authClient } from "@/lib/authClient";
import { useTranslation } from "react-i18next";

export function NavUser({ data: session }: { data: ReturnType<typeof authClient.useSession>["data"] }) {
  const { isMobile } = useSidebar();
  const { t } = useTranslation("nav");

  if (!session || !session.user) return null;

  const { user } = session;

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground" />}
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={resolveAvatarUrl(user.image)} className="rounded-lg" />
            <AvatarFallback className="rounded-lg">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">@{user.username}</span>
          </div>
          <ElipsisIcon className="ml-auto size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-(--anchor-width) min-w-48 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
          <DropdownMenuGroup>
            <DropdownMenuItem render={<Link to="/account/settings" />}>
              <HugeiconsIcon icon={Settings02Icon} className="size-4" />
              {t("items.accountSettings")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      window.location.href = "/";
                    },
                  },
                });
              }}
            >
              <HugeiconsIcon icon={Logout02Icon} className="size-4" />
              {t("user.logout")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
