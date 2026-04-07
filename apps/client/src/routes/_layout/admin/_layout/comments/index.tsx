import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import type { LightboxPhoto } from "@/components/lightbox";
import { Lightbox } from "@/components/lightbox";
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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CommentsDataTable } from "@/features/admin/comments/components/commentsDataTable";
import type { AdminComment } from "@/features/admin/comments/types";
import { UserPickerPopover } from "@/features/admin/users/components/UserPickerPopover";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useTablePagination } from "@/hooks/useTablePageSize";
import { API_BASE, fetchJson, showApiError } from "@/lib/api";

const EMPTY_COMMENTS: AdminComment[] = [];
const TABLE_PAGINATION_CONFIG = { rowHeight: 64, headerHeight: 40, paginationHeight: 45 };

function AdminCommentsPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const queryClient = useQueryClient();

  const { containerRef, pagination, setPagination, pageSizeOptions } = useTablePagination(TABLE_PAGINATION_CONFIG);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "id">("createdAt");
  const [sort, setSort] = useState<"asc" | "desc">("desc");

  const [selectedAuthorIds, setSelectedAuthorIds] = useState<string[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<AdminComment | null>(null);
  const [editTarget, setEditTarget] = useState<AdminComment | null>(null);
  const [editContent, setEditContent] = useState("");

  const [lightboxComment, setLightboxComment] = useState<AdminComment | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-comments", pagination.pageIndex, pagination.pageSize, debouncedSearch, statusFilter, sortBy, sort, selectedAuthorIds],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: String(pagination.pageSize),
        offset: String(pagination.pageIndex * pagination.pageSize),
        sortBy,
        sort,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (selectedAuthorIds.length > 0) params.set("author_ids", selectedAuthorIds.join(","));
      return fetchJson<{ data: AdminComment[]; totalCount: number }>(`${API_BASE}/comments?${params}`).then(
        (res) => res ?? { data: [], totalCount: 0 },
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (comment: AdminComment) => {
      const response = await fetch(`${API_BASE}/stations/${comment.station_id}/comments/${comment.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast.success(t("comments.deleteSuccess"));
      void queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      setDeleteTarget(null);
    },
    onError: showApiError,
  });

  const approveMutation = useMutation({
    mutationFn: async (comment: AdminComment) => {
      const response = await fetch(`${API_BASE}/stations/${comment.station_id}/comments/${comment.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve: true }),
      });
      if (!response.ok) throw new Error("Failed to approve");
    },
    onSuccess: () => {
      toast.success(t("comments.approveSuccess"));
      void queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
    },
    onError: showApiError,
  });

  const editMutation = useMutation({
    mutationFn: async ({ comment, content }: { comment: AdminComment; content: string }) => {
      const response = await fetch(`${API_BASE}/stations/${comment.station_id}/comments/${comment.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error("Failed to update");
    },
    onSuccess: () => {
      toast.success(t("comments.editSuccess"));
      void queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      setEditTarget(null);
    },
    onError: showApiError,
  });

  const handleEdit = useCallback((comment: AdminComment) => {
    setEditTarget(comment);
    setEditContent(comment.content);
  }, []);

  const handleDelete = useCallback((comment: AdminComment) => {
    setDeleteTarget(comment);
  }, []);

  const handleOpenLightbox = useCallback((comment: AdminComment, index: number) => {
    setLightboxComment(comment);
    setLightboxIndex(index);
  }, []);

  const lightboxPhotos = useMemo<LightboxPhoto[]>(
    () =>
      (lightboxComment?.attachments ?? []).map((att) => ({
        attachment_uuid: att.uuid,
        note: null,
        createdAt: lightboxComment?.createdAt ?? "",
        author: lightboxComment?.author
          ? {
              uuid: lightboxComment.author.id,
              username: lightboxComment.author.username ?? lightboxComment.author.name,
              name: lightboxComment.author.name,
            }
          : null,
      })),
    [lightboxComment],
  );

  const handleCloseLightbox = useCallback(() => setLightboxIndex(null), []);
  const handlePrevLightbox = useCallback(() => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i)), []);
  const handleNextLightbox = useCallback(
    () => setLightboxIndex((i) => (i !== null && i < lightboxPhotos.length - 1 ? i + 1 : i)),
    [lightboxPhotos.length],
  );

  const handleSort = useCallback(
    (col: "createdAt" | "id") => {
      setSortBy(col);
      setSort((prev) => (sortBy === col ? (prev === "desc" ? "asc" : "desc") : "desc"));
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    },
    [sortBy, setPagination],
  );

  return (
    <>
      <div className="flex-1 flex flex-col p-3 gap-3 min-h-0 overflow-hidden">
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{t("comments.filters.labelStatus")}</label>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as typeof statusFilter);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="min-w-40">
                <SelectItem value="all">{t("comments.filters.allStatuses")}</SelectItem>
                <SelectItem value="pending">{t("comments.filters.pending")}</SelectItem>
                <SelectItem value="approved">{t("comments.filters.approved")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <UserPickerPopover
            selectedUserIds={selectedAuthorIds}
            onSelectionChange={(ids) => {
              setSelectedAuthorIds(ids);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
          <div className="relative max-w-sm">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t("common:placeholder.search")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              className="pl-8"
            />
          </div>
        </div>
        <CommentsDataTable
          data={data?.data ?? EMPTY_COMMENTS}
          isLoading={isLoading}
          total={data?.totalCount ?? 0}
          containerRef={containerRef}
          pagination={pagination}
          setPagination={setPagination}
          pageSizeOptions={pageSizeOptions}
          sortBy={sortBy}
          sort={sort}
          onSort={handleSort}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onApprove={approveMutation.mutate}
          onOpenLightbox={handleOpenLightbox}
        />
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("comments.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("comments.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common:actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              disabled={deleteMutation.isPending}
            >
              {t("common:actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("comments.editTitle")}</DialogTitle>
          </DialogHeader>
          <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-h-32 resize-none" maxLength={10000} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              {t("common:actions.cancel")}
            </Button>
            <Button
              onClick={() => editTarget && editMutation.mutate({ comment: editTarget, content: editContent })}
              disabled={editMutation.isPending || !editContent.trim()}
            >
              {tCommon("actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Lightbox photos={lightboxPhotos} index={lightboxIndex} onClose={handleCloseLightbox} onPrev={handlePrevLightbox} onNext={handleNextLightbox} />
    </>
  );
}

export const Route = createFileRoute("/_layout/admin/_layout/comments/")({
  component: AdminCommentsPage,
  staticData: {
    titleKey: "breadcrumbs.comments",
    i18nNamespace: "admin",
    breadcrumbs: [{ titleKey: "breadcrumbs.admin", i18nNamespace: "admin" }],
    allowedRoles: ["admin", "editor"],
  },
});
