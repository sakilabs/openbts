import { lazy, Suspense, useMemo, useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useVirtualizer } from "@tanstack/react-virtual";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Share08Icon,
  Delete02Icon,
  MoreHorizontalCircle01Icon,
  Globe02Icon,
  SecurityLockIcon,
  AirportTowerIcon,
  SignalFull02Icon,
  Calendar03Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";

import { authClient } from "@/lib/authClient";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useUserLists } from "@/features/lists/hooks/useUserLists";
import { deleteList, updateList } from "@/features/lists/api";
import type { UserListSummary } from "@/features/lists/api";

const CreateListDialog = lazy(() => import("./createListDialog").then((m) => ({ default: m.CreateListDialog })));

const ESTIMATED_CARD_HEIGHT = 112;

export function ListsPageContent() {
  const { t } = useTranslation(["lists", "common"]);
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useUserLists();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<UserListSummary | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const lists = useMemo<UserListSummary[]>(
    () => data?.pages.flatMap((p) => p.data).filter((l) => l.createdBy.uuid === session?.user?.id) ?? [],
    [data, session?.user?.id],
  );

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: lists.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_CARD_HEIGHT,
    overscan: 5,
    gap: 12,
  });

  const items = virtualizer.getVirtualItems();

  const handleScroll = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const lastItem = items[items.length - 1];
    if (!lastItem) return;
    if (lastItem.index >= lists.length - 1) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, items, lists.length, fetchNextPage]);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const deleteMutation = useMutation({
    mutationFn: deleteList,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user-lists"] });
      toast.success(t("lists:deleted"));
      setDeleteTarget(null);
    },
  });

  const togglePublicMutation = useMutation({
    mutationFn: ({ uuid, is_public }: { uuid: string; is_public: boolean }) => updateList(uuid, { is_public }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user-lists"] });
      toast.success(t("lists:updated"));
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ uuid, name, description }: { uuid: string; name: string; description?: string }) => updateList(uuid, { name, description }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user-lists"] });
      toast.success(t("lists:updated"));
      setEditTarget(null);
    },
  });

  function openEdit(list: UserListSummary) {
    setEditName(list.name);
    setEditDescription(list.description ?? "");
    setEditTarget(list);
  }

  function handleRename() {
    if (!editTarget || !editName.trim()) return;
    renameMutation.mutate({
      uuid: editTarget.uuid,
      name: editName.trim(),
      description: editDescription.trim() || undefined,
    });
  }

  function handleShare(list: UserListSummary) {
    const url = `${window.location.origin}/lists/${list.uuid}`;
    void navigator.clipboard.writeText(url).then(() => toast.success(t("lists:copied")));
  }

  const [headerActions] = useState(() => document.getElementById("header-actions"));

  function renderContent() {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Spinner className="size-6" />
        </div>
      );
    }
    if (lists.length === 0) {
      return (
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">{t("lists:empty")}</p>
          </CardContent>
        </Card>
      );
    }
    return (
      <div ref={parentRef} className="flex-1 overflow-y-auto">
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: "100%",
            position: "relative",
          }}
        >
          {items.map((virtualItem) => {
            const list = lists[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <Card size="sm">
                  <CardContent className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{list.name}</p>
                        {list.description && <p className="text-muted-foreground text-xs line-clamp-2">{list.description}</p>}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}>
                          <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(list)}>
                            <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
                            {t("lists:rename")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare(list)}>
                            <HugeiconsIcon icon={Share08Icon} strokeWidth={2} />
                            {t("common:actions.share")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              togglePublicMutation.mutate({
                                uuid: list.uuid,
                                is_public: !list.is_public,
                              })
                            }
                          >
                            <HugeiconsIcon icon={list.is_public ? SecurityLockIcon : Globe02Icon} strokeWidth={2} />
                            {list.is_public ? t("lists:togglePrivate") : t("lists:togglePublic")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(list.uuid)}>
                            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                            {t("common:actions.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <HugeiconsIcon icon={AirportTowerIcon} className="size-3" />
                        {t("lists:stationCount", { count: list.stationCount })}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <HugeiconsIcon icon={SignalFull02Icon} className="size-3" />
                        {t("lists:radiolineCount", { count: list.radiolineCount })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1",
                          list.is_public ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                        )}
                      >
                        <HugeiconsIcon icon={list.is_public ? Globe02Icon : SecurityLockIcon} className="size-3" />
                        {list.is_public ? t("lists:public") : t("lists:private")}
                      </span>
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <HugeiconsIcon icon={Calendar03Icon} className="size-3" />
                        {new Date(list.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Spinner className="size-4" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl flex flex-col h-full">
      {headerActions &&
        createPortal(
          <Button onClick={() => setCreateOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
            {t("lists:create")}
          </Button>,
          headerActions,
        )}

      {renderContent()}

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("lists:editList")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-list-name">{t("lists:name")}</Label>
              <Input
                id="edit-list-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-list-description">{t("lists:description")}</Label>
              <Input
                id="edit-list-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder={t("common:placeholder.optional")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleRename} disabled={!editName.trim() || renameMutation.isPending}>
              {renameMutation.isPending ? <Spinner /> : t("common:actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("lists:deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("lists:deleteConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common:actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Spinner /> : t("common:actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {createOpen ? (
        <Suspense>
          <CreateListDialog open={createOpen} onOpenChange={setCreateOpen} />
        </Suspense>
      ) : null}
    </div>
  );
}
