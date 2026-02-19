import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, AlertCircleIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { createFileRoute } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { fetchImportStatus, startImport, type ImportStep, type StepStatus, type JobState } from "@/features/admin/uke-import/api";
import { i18n } from "@/i18n";

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function StepTimer({ startedAt, finishedAt }: { startedAt?: string; finishedAt?: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt || finishedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt, finishedAt]);

  if (!startedAt) return null;

  const start = new Date(startedAt).getTime();
  const end = finishedAt ? new Date(finishedAt).getTime() : now;
  const elapsed = Math.max(0, end - start);

  return <span className="text-xs text-muted-foreground tabular-nums">{formatDuration(elapsed)}</span>;
}

function StepStatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "running":
      return <Spinner className="size-4" />;
    case "success":
      return <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-green-500" />;
    case "error":
      return <HugeiconsIcon icon={Cancel01Icon} className="size-4 text-destructive" />;
    case "skipped":
      return <span className="text-muted-foreground text-sm">—</span>;
    default:
      return <span className="size-4 inline-flex items-center justify-center text-muted-foreground">○</span>;
  }
}

function JobStateIndicator({ state }: { state: JobState }) {
  switch (state) {
    case "running":
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-500">
          <Spinner className="size-3.5" />
        </span>
      );
    case "success":
      return <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-green-500" />;
    case "error":
      return <HugeiconsIcon icon={AlertCircleIcon} className="size-4 text-destructive" />;
    default:
      return <span className="size-4 inline-flex items-center justify-center text-muted-foreground">○</span>;
  }
}

function UkeImportPage() {
  const { t } = useTranslation(["admin", "common"]);
  const queryClient = useQueryClient();

  const [importStations, setImportStations] = useState(true);
  const [importRadiolines, setImportRadiolines] = useState(true);
  const [importPermits, setImportPermits] = useState(true);

  const { data: status } = useQuery({
    queryKey: ["uke-import-status"],
    queryFn: fetchImportStatus,
    refetchInterval: (query) => (query.state.data?.state === "running" ? 2000 : false),
  });

  const startMutation = useMutation({
    mutationFn: startImport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["uke-import-status"] }),
  });

  const isRunning = status?.state === "running";

  return (
    <div className="flex-1 flex flex-col p-3 gap-3 min-h-0 overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("ukeImport.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("ukeImport.subtitle")}</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="grid gap-4 pb-8 max-w-4xl">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold leading-none mb-4">{t("ukeImport.title")}</h3>
            <div className="space-y-3">
              <label htmlFor="import-stations" className="flex items-center gap-2 cursor-pointer">
                <Checkbox id="import-stations" checked={importStations} onCheckedChange={(val) => setImportStations(!!val)} disabled={isRunning} />
                <span className="text-sm">{t("ukeImport.importStations")}</span>
              </label>
              <label htmlFor="import-radiolines" className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  id="import-radiolines"
                  checked={importRadiolines}
                  onCheckedChange={(val) => setImportRadiolines(!!val)}
                  disabled={isRunning}
                />
                <span className="text-sm">{t("ukeImport.importRadiolines")}</span>
              </label>
              <label htmlFor="import-permits" className="flex items-center gap-2 cursor-pointer">
                <Checkbox id="import-permits" checked={importPermits} onCheckedChange={(val) => setImportPermits(!!val)} disabled={isRunning} />
                <span className="text-sm">{t("ukeImport.importPermits")}</span>
              </label>
            </div>
            <div className="mt-4">
              <Button
                onClick={() => startMutation.mutate({ importStations, importRadiolines, importPermits })}
                disabled={isRunning || startMutation.isPending}
              >
                {startMutation.isPending ? <Spinner className="size-4 mr-2" /> : null}
                {isRunning ? t("ukeImport.alreadyRunning") : t("ukeImport.startImport")}
              </Button>
            </div>
          </div>

          {status && (
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <JobStateIndicator state={status.state} />
                <h3 className="text-sm font-semibold leading-none">{t(`ukeImport.status.${status.state}`)}</h3>
              </div>

              {status.startedAt && (
                <p className="text-xs text-muted-foreground mb-1">
                  {t("ukeImport.startedAt")}:{" "}
                  {new Date(status.startedAt).toLocaleDateString(i18n.language, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
              {status.finishedAt && (
                <p className="text-xs text-muted-foreground mb-1">
                  {t("ukeImport.finishedAt")}:{" "}
                  {new Date(status.finishedAt).toLocaleDateString(i18n.language, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}

              {status.state === "error" && status.error && (
                <div className="mt-2 mb-3 rounded-md bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-sm text-destructive">{status.error}</p>
                </div>
              )}

              {status.steps.length > 0 && (
                <div className="mt-3 space-y-2">
                  {status.steps.map((step: ImportStep) => (
                    <div
                      key={step.key}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                        step.status === "running" && "bg-blue-500/5",
                        step.status === "error" && "bg-destructive/5",
                        step.status === "success" && "bg-green-500/5",
                      )}
                    >
                      <StepStatusIcon status={step.status} />
                      <span className="flex-1">{t(`ukeImport.steps.${step.key}`)}</span>
                      <StepTimer startedAt={step.startedAt} finishedAt={step.finishedAt} />
                      <span className="text-xs text-muted-foreground">{t(`ukeImport.stepStatus.${step.status}`)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_layout/admin/uke-import")({
  component: UkeImportPage,
  staticData: {
    titleKey: "breadcrumbs.ukeImport",
    i18nNamespace: "admin",
    breadcrumbs: [{ titleKey: "breadcrumbs.admin", path: "/admin/stations", i18nNamespace: "admin" }],
  },
});
