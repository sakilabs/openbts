import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import QRCodeStyling from "qr-code-styling";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  FingerPrintIcon,
  LockIcon,
  InformationCircleIcon,
  Copy01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/authClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";
import { Timeline, TimelineIndicator, TimelineItem, TimelineSeparator, TimelineTitle } from "@/components/reui/timeline";

type TwoFactorSearch = {
  totpURI?: string;
};

type Step = "init" | "scan" | "verify" | "success";

function StyledQRCode({ value }: { value: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [qrCode] = useState(
    () =>
      new QRCodeStyling({
        width: 220,
        height: 220,
        type: "svg",
        data: value,
        dotsOptions: { type: "rounded", color: "#000000" },
        cornersSquareOptions: { type: "extra-rounded", color: "#000000" },
        cornersDotOptions: { color: "#000000" },
        backgroundOptions: { color: "#ffffff" },
        qrOptions: { errorCorrectionLevel: "M" },
      }),
  );

  useEffect(() => {
    if (ref.current) qrCode.append(ref.current);
  }, [qrCode]);

  useEffect(() => {
    qrCode.update({ data: value });
  }, [qrCode, value]);

  return <div ref={ref} />;
}

function normalizeTotpURI(uri: string): string {
  return uri.replace(/^otpauth:\/([^/])/, "otpauth://$1");
}

function extractSecret(totpURI: string): string {
  try {
    return new URL(normalizeTotpURI(totpURI)).searchParams.get("secret") ?? "";
  } catch {
    return "";
  }
}

const STEPS: { id: Step; labelKey: string; titleKey: string }[] = [
  { id: "init", labelKey: "common:actions.confirm", titleKey: "twoFactor.titles.enableTwoFactor" },
  { id: "scan", labelKey: "twoFactor.steps.scan", titleKey: "twoFactor.titles.scanQrCode" },
  { id: "verify", labelKey: "twoFactor.steps.verify", titleKey: "twoFactor.titles.verifyYourApp" },
  { id: "success", labelKey: "twoFactor.steps.done", titleKey: "twoFactor.titles.allSet" },
];

function getStepIndex(step: Step): number {
  return STEPS.findIndex((s) => s.id === step);
}

function getStepMeta(step: Step): (typeof STEPS)[number] {
  return STEPS[getStepIndex(step)];
}

function StepIndicator({ current }: { current: Step }) {
  const { t } = useTranslation(["settings", "common"]);
  const currentIdx = getStepIndex(current);

  return (
    <div className="shrink-0 w-110">
      <Timeline orientation="horizontal" value={currentIdx + 1}>
        {STEPS.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isActive = idx === currentIdx;
          return (
            <TimelineItem key={step.id} step={idx + 1}>
              <TimelineIndicator
                className={cn(
                  "size-6 flex items-center justify-center text-[11px] font-semibold transition-all",
                  isDone || isActive ? "bg-primary border-primary text-primary-foreground" : "bg-muted text-muted-foreground border-border",
                  isActive && "ring-4 ring-primary/20",
                )}
              >
                {isDone ? <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" /> : idx + 1}
              </TimelineIndicator>
              <TimelineSeparator />
              <TimelineTitle className={cn("text-[11px] font-medium", isActive ? "text-foreground font-semibold" : "text-muted-foreground")}>
                {t(step.labelKey)}
              </TimelineTitle>
            </TimelineItem>
          );
        })}
      </Timeline>
    </div>
  );
}

function InitStep({ onSuccess }: { onSuccess: (totpURI: string) => void }) {
  const { t } = useTranslation(["settings", "common"]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setError(null);
    setIsSubmitting(true);

    const { data, error: enableError } = await authClient.twoFactor.enable({ password });

    setIsSubmitting(false);

    if (enableError) {
      setError(enableError.message ?? t("twoFactor.init.errorEnable"));
      return;
    }

    if (!data?.totpURI) {
      setError(t("twoFactor.init.errorNoUri"));
      return;
    }

    onSuccess(data.totpURI);
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-sm space-y-5">
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold tracking-tight">{t("twoFactor.init.heading")}</h2>
          <p className="text-sm text-muted-foreground">{t("twoFactor.init.description")}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tf-password">{t("twoFactor.init.passwordLabel")}</Label>
            <Input
              id="tf-password"
              type="password"
              placeholder={t("twoFactor.init.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="current-password"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || !password}>
            {isSubmitting ? (
              <>
                <Spinner />
                {t("twoFactor.init.submitting")}
              </>
            ) : (
              t("twoFactor.init.continue")
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

function ScanStep({
  totpURI,
  issuer,
  digits,
  period,
  onNext,
}: {
  totpURI: string;
  issuer: string;
  digits: number;
  period: number;
  onNext: () => void;
}) {
  const { t } = useTranslation(["settings", "common"]);
  const secret = extractSecret(totpURI);
  const normalizedURI = normalizeTotpURI(totpURI);
  const [copied, setCopied] = useState(false);

  async function copySecret() {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const formattedSecret = secret.match(/.{1,4}/g)?.join(" ") ?? secret;

  return (
    <div className="flex flex-1 gap-6 min-h-0">
      <div className="flex-1 bg-card border rounded-2xl flex flex-col items-center justify-between py-12 px-10 gap-8">
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3.5 py-2 text-muted-foreground">
          <HugeiconsIcon icon={FingerPrintIcon} className="size-3.5 shrink-0" />
          <span className="text-xs font-medium">{t("twoFactor.scan.hint")}</span>
        </div>

        <div className="bg-white border-2 border-border rounded-2xl p-4 shadow-sm">
          <StyledQRCode value={normalizedURI} />
        </div>

        <div className="flex gap-2 flex-wrap justify-center">
          {["Google Authenticator", "Authy", "1Password"].map((app) => (
            <div key={app} className="px-3 py-1.5 bg-muted border rounded-lg text-xs text-muted-foreground font-medium">
              {app}
            </div>
          ))}
        </div>
      </div>

      <div className="w-100 shrink-0 flex flex-col gap-4">
        <div className="bg-card border rounded-2xl p-5 space-y-4">
          <p className="text-sm font-semibold text-foreground">{t("twoFactor.scan.manualSetup")}</p>

          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.7px] text-muted-foreground">{t("twoFactor.scan.secretKey")}</span>
            <div className="bg-muted/50 border rounded-xl px-3.5 py-3 flex items-center justify-between gap-3">
              <code className="font-mono text-[15px] tracking-[0.12em] text-foreground font-medium">{formattedSecret}</code>
              <button
                type="button"
                onClick={copySecret}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <HugeiconsIcon icon={Copy01Icon} className="size-3.5" />
                {copied ? t("common:actions.copied") : t("common:actions.copy")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: t("twoFactor.scan.issuer"), value: issuer },
              { label: t("twoFactor.scan.period"), value: `${period}s` },
              { label: t("twoFactor.scan.digits"), value: String(digits) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-muted/50 border rounded-xl py-2.5 flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.6px] text-muted-foreground">{label}</span>
                <span className="font-mono text-sm font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-4 flex gap-3.5 items-start">
          <div className="size-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={AlertCircleIcon} className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">{t("twoFactor.scan.backupCodesTitle")}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{t("twoFactor.scan.backupCodesDescription")}</p>
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={onNext}>
          {t("twoFactor.scan.continue")}
        </Button>

        <div className="flex items-start gap-2.5 rounded-xl bg-muted/50 border px-4 py-3.5">
          <HugeiconsIcon icon={InformationCircleIcon} className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">{t("twoFactor.scan.securityNote")}</p>
        </div>
      </div>
    </div>
  );
}

function VerifyStep({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation(["settings", "common"]);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleVerify(totpCode: string) {
    if (totpCode.length !== 6) return;
    setError(null);
    setIsSubmitting(true);

    const { error: verifyError } = await authClient.twoFactor.verifyTotp({
      code: totpCode,
      trustDevice: true,
    });

    setIsSubmitting(false);

    if (verifyError) {
      setError(verifyError.message ?? t("twoFactor.verify.errorInvalid"));
      setCode("");
      return;
    }

    onSuccess();
  }

  function handleCodeChange(value: string) {
    setCode(value);
    if (value.length === 6) void handleVerify(value);
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold tracking-tight">{t("twoFactor.verify.heading")}</h2>
          <p className="text-sm text-muted-foreground">{t("twoFactor.verify.description")}</p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <InputOTP maxLength={6} value={code} onChange={handleCodeChange} disabled={isSubmitting}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>
        <Button className="w-full" size="lg" disabled={isSubmitting || code.length !== 6} onClick={() => handleVerify(code)}>
          {isSubmitting ? (
            <>
              <Spinner />
              {t("twoFactor.verify.submitting")}
            </>
          ) : (
            t("twoFactor.verify.submit")
          )}
        </Button>
      </div>
    </div>
  );
}

function SuccessStep() {
  const { t } = useTranslation(["settings", "common"]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-5 max-w-sm text-center">
        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-8 text-primary" />
        </div>
        <div className="space-y-1.5">
          <p className="text-lg font-semibold">{t("twoFactor.success.heading")}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("twoFactor.success.description")}</p>
        </div>
        <Link to="/account/settings" className="w-full">
          <Button className="w-full" size="lg">
            {t("twoFactor.backToSettings")}
          </Button>
        </Link>
      </div>
    </div>
  );
}

function parseTotpMeta(uri: string): { issuer: string; digits: number; period: number } {
  try {
    const parsed = new URL(normalizeTotpURI(uri));
    const issuerFromQuery = parsed.searchParams.get("issuer") ?? "";
    const label = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    const issuerFromLabel = label.includes(":") ? label.split(":")[0] : "";
    return {
      issuer: issuerFromQuery || issuerFromLabel,
      digits: Number.parseInt(parsed.searchParams.get("digits") ?? "6", 10),
      period: Number.parseInt(parsed.searchParams.get("period") ?? "30", 10),
    };
  } catch {
    return { issuer: "", digits: 6, period: 30 };
  }
}

function TwoFactorPage() {
  const { t } = useTranslation(["settings", "common"]);
  const { data: session, isPending } = authClient.useSession();
  const { totpURI: urlTotpURI } = Route.useSearch();

  const [step, setStep] = useState<Step>(urlTotpURI ? "scan" : "init");
  const [totpURI, setTotpURI] = useState(urlTotpURI ? normalizeTotpURI(urlTotpURI) : "");

  const { issuer, digits, period } = parseTotpMeta(totpURI);

  if (isPending) return null;
  if (!session?.user || session.user.twoFactorEnabled) {
    return <Navigate to="/account/settings" replace />;
  }

  function handleInitSuccess(uri: string) {
    setTotpURI(uri);
    setStep("scan");
  }

  function handleVerifySuccess() {
    toast.success(t("twoFactor.success.enabled"));
    setStep("success");
  }

  const { titleKey, labelKey } = getStepMeta(step);

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-10 gap-7">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={LockIcon} className="size-4.5 text-primary" />
          </div>
          <div>
            <p className="text-[17px] font-bold tracking-tight leading-tight">{t(titleKey)}</p>
            {step !== "success" ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("twoFactor.stepProgress", { current: getStepIndex(step) + 1, total: STEPS.length, label: t(labelKey) })}
              </p>
            ) : null}
          </div>
        </div>

        {step !== "success" ? <StepIndicator current={step} /> : null}

        <Link to="/account/settings" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <HugeiconsIcon icon={ArrowLeftIcon} className="size-4" />
          {t("twoFactor.backToSettings")}
        </Link>
      </div>

      {step === "init" && <InitStep onSuccess={handleInitSuccess} />}
      {step === "scan" && <ScanStep totpURI={totpURI} issuer={issuer} digits={digits} period={period} onNext={() => setStep("verify")} />}
      {step === "verify" && <VerifyStep onSuccess={handleVerifySuccess} />}
      {step === "success" && <SuccessStep />}
    </div>
  );
}

export const Route = createFileRoute("/_layout/account/two-factor")({
  component: TwoFactorPage,
  validateSearch: (search: Record<string, unknown>): TwoFactorSearch => ({
    totpURI: search.totpURI as string | undefined,
  }),
  staticData: {
    title: "Two-Factor Authentication",
    breadcrumbs: [{ titleKey: "account.title", i18nNamespace: "settings", path: "/account/settings" }],
  },
});
