import { useState, useEffect, useCallback, type ReactNode, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShieldUserIcon,
  Message01Icon,
  SentIcon,
  Cancel01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { createFileRoute } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { fetchSettings, patchSettings, type RuntimeSettings, type SettingsPatch } from "@/features/admin/settings/api";

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
        checked ? "bg-primary" : "bg-muted",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-background shadow-md transform transition-transform",
          checked ? "translate-x-4.5" : "translate-x-1",
        )}
      />
    </button>
  );
}

function TagInput({
  tags,
  onChange,
  placeholder,
  disabled = false,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) {
        onChange([...tags, input.trim()]);
      }
      setInput("");
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5 p-2 rounded-md border bg-background min-h-9.5",
        !disabled && "border-input hover:border-muted-foreground/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20",
        disabled && "opacity-60",
      )}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full border border-primary/20"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-primary/70 hover:text-primary rounded-full hover:bg-primary/10 p-0.5 transition-colors"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
            </button>
          )}
        </span>
      ))}
      <Input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ""}
        disabled={disabled}
        className="flex-1 min-w-25 border-0 p-0 h-auto text-xs focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/70"
      />
    </div>
  );
}

function SettingsCard({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-md bg-muted text-muted-foreground">{icon}</div>
        <div>
          <h3 className="text-sm font-semibold leading-none">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function AdminSettingsPage() {
  const { t } = useTranslation(["admin", "common"]);
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const [formData, setFormData] = useState<RuntimeSettings>({
    enforceAuthForAllRoutes: false,
    allowedUnauthenticatedRoutes: [],
    disabledRoutes: [],
    enableStationComments: false,
    submissionsEnabled: true,
  });

  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: fetchSettings,
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
      setHasChanges(false);
    }
  }, [settings]);

  useEffect(() => {
    if (settings) {
      const changed =
        formData.enforceAuthForAllRoutes !== settings.enforceAuthForAllRoutes ||
        formData.enableStationComments !== settings.enableStationComments ||
        formData.submissionsEnabled !== settings.submissionsEnabled ||
        JSON.stringify(formData.allowedUnauthenticatedRoutes) !== JSON.stringify(settings.allowedUnauthenticatedRoutes) ||
        JSON.stringify(formData.disabledRoutes) !== JSON.stringify(settings.disabledRoutes);
      setHasChanges(changed);
    }
  }, [formData, settings]);

  const mutation = useMutation({
    mutationFn: patchSettings,
    onSuccess: (newSettings) => {
      queryClient.setQueryData(["admin-settings"], newSettings);
      setHasChanges(false);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    },
  });

  const handleSave = useCallback(() => {
    const patch: SettingsPatch = {};
    if (settings) {
      if (formData.enforceAuthForAllRoutes !== settings.enforceAuthForAllRoutes) {
        patch.enforceAuthForAllRoutes = formData.enforceAuthForAllRoutes;
      }
      if (formData.enableStationComments !== settings.enableStationComments) {
        patch.enableStationComments = formData.enableStationComments;
      }
      if (formData.submissionsEnabled !== settings.submissionsEnabled) {
        patch.submissionsEnabled = formData.submissionsEnabled;
      }
      if (JSON.stringify(formData.allowedUnauthenticatedRoutes) !== JSON.stringify(settings.allowedUnauthenticatedRoutes)) {
        patch.allowedUnauthenticatedRoutes = formData.allowedUnauthenticatedRoutes;
      }
      if (JSON.stringify(formData.disabledRoutes) !== JSON.stringify(settings.disabledRoutes)) {
        patch.disabledRoutes = formData.disabledRoutes;
      }
    }
    mutation.mutate(patch);
  }, [formData, settings, mutation]);

  const handleReset = useCallback(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner className="size-8 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">{t("common:actions.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md px-6">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <HugeiconsIcon icon={AlertCircleIcon} className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t("common:error.title")}</h3>
          <p className="text-muted-foreground text-sm mb-4">{t("common:error.description")}</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-settings"] })} variant="outline">
            {t("common:error.tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-3 gap-3 min-h-0 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("settings.subtitle")}</p>
        </div>

        {showSaveSuccess ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
            <span className="text-sm font-medium">{t("common:actions.saved")}</span>
          </div>
        ) : hasChanges ? (
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              {t("common:actions.revert", "Reset")}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? <Spinner className="size-4 mr-2" /> : <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 mr-2" />}
              {t("common:actions.saveChanges")}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid gap-4 pb-8 max-w-4xl">
          <SettingsCard
            icon={<HugeiconsIcon icon={ShieldUserIcon} className="size-4" />}
            title={t("settings.authentication")}
            description={t("settings.authenticationDesc")}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="text-sm font-medium">{t("settings.enforceAuth")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("settings.enforceAuthDesc")}</p>
                </div>
                <Toggle
                  checked={formData.enforceAuthForAllRoutes}
                  onChange={(checked) => setFormData((prev: RuntimeSettings) => ({ ...prev, enforceAuthForAllRoutes: checked }))}
                />
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">{t("settings.allowedRoutes")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("settings.allowedRoutesDesc")}</p>
                </div>
                <TagInput
                  tags={formData.allowedUnauthenticatedRoutes}
                  onChange={(tags) => setFormData((prev: RuntimeSettings) => ({ ...prev, allowedUnauthenticatedRoutes: tags }))}
                  placeholder="e.g., /api/v1/public"
                />
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">{t("settings.disabledRoutes")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("settings.disabledRoutesDesc")}</p>
                </div>
                <TagInput
                  tags={formData.disabledRoutes}
                  onChange={(tags) => setFormData((prev: RuntimeSettings) => ({ ...prev, disabledRoutes: tags }))}
                  placeholder="e.g., /api/v1/admin"
                />
              </div>
            </div>
          </SettingsCard>

          <div className="grid md:grid-cols-2 gap-4">
            <SettingsCard
              icon={<HugeiconsIcon icon={Message01Icon} className="size-4" />}
              title={t("settings.comments")}
              description={t("settings.commentsDesc")}
            >
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-sm font-medium">{t("settings.enableComments")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formData.enableStationComments ? t("settings.commentsEnabled") : t("settings.commentsDisabled")}
                  </p>
                </div>
                <Toggle
                  checked={formData.enableStationComments}
                  onChange={(checked) => setFormData((prev: RuntimeSettings) => ({ ...prev, enableStationComments: checked }))}
                />
              </div>
            </SettingsCard>

            <SettingsCard
              icon={<HugeiconsIcon icon={SentIcon} className="size-4" />}
              title={t("settings.submissions")}
              description={t("settings.submissionsDesc")}
            >
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-sm font-medium">{t("settings.enableSubmissions")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formData.submissionsEnabled ? t("settings.submissionsEnabled") : t("settings.submissionsDisabled")}
                  </p>
                </div>
                <Toggle
                  checked={formData.submissionsEnabled}
                  onChange={(checked) => setFormData((prev: RuntimeSettings) => ({ ...prev, submissionsEnabled: checked }))}
                />
              </div>
            </SettingsCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_layout/admin/settings")({
  component: AdminSettingsPage,
  staticData: {
    titleKey: "breadcrumbs.settings",
    i18nNamespace: "admin",
    breadcrumbs: [{ titleKey: "breadcrumbs.admin", path: "/admin/stations", i18nNamespace: "admin" }],
  },
});
