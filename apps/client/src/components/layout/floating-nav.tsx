import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ComputerIcon,
  Login01Icon,
  Logout02Icon,
  Moon02Icon,
  MoreHorizontalCircle01Icon,
  Settings02Icon,
  Sun03Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useLocation } from "@tanstack/react-router";
import { PL, US } from "country-flag-icons/react/3x2";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { type ComponentType, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { AuthDialog } from "@/components/auth/authDialog";
import { useTheme } from "@/components/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NotificationsBell } from "@/features/notifications/components/NotificationsBell";
import { useIsMobile } from "@/hooks/useMobile";
import { useSettings } from "@/hooks/useSettings";
import { type SupportedLanguage, supportedLanguages } from "@/i18n/config";
import { authClient } from "@/lib/authClient";
import { resolveAvatarUrl } from "@/lib/format";
import {
  type TranslatedNavItem,
  type TranslatedNavSection,
  adminNavConfig,
  authNavConfig,
  getActiveNavItemUrl,
  getActiveNavSection,
  infoNavConfig,
  listsNavConfig,
  navMainConfig,
  translateAdminNav,
  translateNav,
} from "@/lib/navConfig";
import { cn } from "@/lib/utils";

const ACTION_TARGET_ID = "floating-nav-actions";
const HIDDEN_STORAGE_KEY = "floating-nav-hidden";
const FLUID_TRANSITION = { type: "spring", stiffness: 520, damping: 44, mass: 0.8 } as const;
const PRIMARY_SURFACE_LAYOUT_ID = "floating-nav-primary-surface";
const SUBNAV_SURFACE_LAYOUT_ID = "floating-nav-subnav-surface";
const SUBNAV_OPEN_DELAY_MS = 120;
const flagComponents: Record<string, ComponentType<{ className?: string }>> = { US, PL };
type FloatingTransition = typeof FLUID_TRANSITION | { duration: number };
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function readHiddenState() {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(HIDDEN_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeHiddenState(hidden: boolean) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(HIDDEN_STORAGE_KEY, String(hidden));
  } catch {
    return;
  }
}

function FloatingNavLink({
  active,
  indicatorId,
  item,
  onNavigate,
  transition,
}: {
  active: boolean;
  indicatorId: string;
  item: TranslatedNavItem;
  onNavigate?: () => void;
  transition: FloatingTransition;
}) {
  const className = cn(
    "relative inline-flex h-8 min-w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-[0.8125rem] font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
    active ? "z-10 px-2.5 text-primary-foreground" : "z-0 w-8 px-0 text-muted-foreground hover:bg-muted hover:text-foreground",
  );
  const content = (
    <>
      {active ? (
        <motion.span
          layoutId={indicatorId}
          initial={false}
          transition={transition}
          className="pointer-events-none absolute inset-0 z-0 rounded-full bg-primary"
        />
      ) : null}
      <span className="relative z-20 inline-flex items-center justify-center gap-1.5">
        <HugeiconsIcon icon={item.icon} className="size-4 shrink-0" />
        {active ? <span className="whitespace-nowrap">{item.title}</span> : null}
        {!active ? <span className="sr-only">{item.title}</span> : null}
      </span>
    </>
  );

  if (item.href) {
    return (
      <motion.div layout transition={transition} className="shrink-0">
        <Tooltip>
          <TooltipTrigger render={<a href={item.href} target="_blank" rel="noopener noreferrer" className={className} onClick={onNavigate} />}>
            {content}
          </TooltipTrigger>
          <TooltipContent>{item.title}</TooltipContent>
        </Tooltip>
      </motion.div>
    );
  }

  return (
    <motion.div layout transition={transition} className="shrink-0">
      <Tooltip>
        <TooltipTrigger render={<Link to={item.url} className={className} onClick={onNavigate} />}>{content}</TooltipTrigger>
        <TooltipContent>{item.title}</TooltipContent>
      </Tooltip>
    </motion.div>
  );
}

function DesktopSubnavRail({
  reduceMotion,
  section,
  transition,
}: {
  reduceMotion: boolean;
  section: TranslatedNavSection | null;
  transition: FloatingTransition;
}) {
  const location = useLocation();
  const activeItemUrl = section ? getActiveNavItemUrl([section], location.pathname) : null;

  return (
    <AnimatePresence mode="popLayout">
      {section && section.items.length > 0 ? (
        <motion.div
          key={section.key}
          layout
          layoutId={SUBNAV_SURFACE_LAYOUT_ID}
          initial={reduceMotion ? { opacity: 1 } : { filter: "blur(2px)", opacity: 0, y: 38, scale: 0.96 }}
          animate={reduceMotion ? { opacity: 1 } : { filter: "blur(0px)", opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { filter: "blur(2px)", opacity: 0, y: 38, scale: 0.96 }}
          transition={transition}
          style={{ transformOrigin: "bottom center" }}
          className="pointer-events-auto hidden max-w-[calc(100vw-1rem)] items-center overflow-hidden rounded-full border bg-background p-0.5 shadow-sm md:flex"
          aria-label={section.title}
        >
          <motion.div layout transition={transition} className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
            <LayoutGroup id={`floating-subnav-${section.key}`}>
              {section.items.map((item) => (
                <FloatingNavLink
                  key={item.href ?? item.url}
                  item={item}
                  active={!item.href && item.url === activeItemUrl}
                  indicatorId={`floating-subnav-active-${section.key}`}
                  transition={transition}
                />
              ))}
            </LayoutGroup>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function FloatingSubnavAnchor({ transition }: { transition: FloatingTransition }) {
  return (
    <motion.span
      aria-hidden
      layoutId={SUBNAV_SURFACE_LAYOUT_ID}
      transition={transition}
      className="pointer-events-none absolute left-[calc(50%-1rem)] top-[calc(50%-1rem)] z-0 size-8 rounded-full border border-transparent bg-transparent opacity-0"
    />
  );
}

function FloatingPrimarySurface({ className, transition }: { className?: string; transition: FloatingTransition }) {
  return (
    <motion.span
      aria-hidden
      layoutId={PRIMARY_SURFACE_LAYOUT_ID}
      transition={transition}
      className={cn("pointer-events-none absolute inset-0 z-0 border bg-background shadow-sm", className)}
    />
  );
}

function FloatingActionSlot({ label, placement, transition }: { label: string; placement: "main" | "rail"; transition: FloatingTransition }) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [hasVisibleActions, setHasVisibleActions] = useState(false);
  const actionSlotTransition: FloatingTransition = hasVisibleActions ? transition : { duration: 0 };

  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const target = targetRef.current;
    if (!target) return;

    let frame = 0;

    const readVisibleActions = () => {
      const visible = Array.from(target.children).some((child) => {
        if (!(child instanceof HTMLElement)) return true;

        const rect = child.getBoundingClientRect();
        const style = window.getComputedStyle(child);
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0.5 && rect.height > 0.5;
      });

      setHasVisibleActions(visible);
    };

    const updateFromResize = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(readVisibleActions);
    };

    readVisibleActions();

    const mutationObserver = new window.MutationObserver(readVisibleActions);
    mutationObserver.observe(target, {
      attributeFilter: ["aria-hidden", "class", "data-state", "hidden", "style"],
      attributes: true,
      childList: true,
      subtree: true,
    });

    const resizeObserver = window.ResizeObserver === undefined ? null : new window.ResizeObserver(updateFromResize);
    resizeObserver?.observe(target);
    window.addEventListener("resize", updateFromResize);

    return () => {
      window.cancelAnimationFrame(frame);
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateFromResize);
    };
  }, []);

  if (placement === "rail") {
    return (
      <motion.div
        layout
        transition={actionSlotTransition}
        style={{ transformOrigin: "bottom center" }}
        className={cn(
          "pointer-events-auto relative isolate z-20 flex max-w-[calc(100vw-1rem)] self-center items-center overflow-hidden rounded-full border bg-background p-1 shadow-sm",
          hasVisibleActions ? "mb-1 opacity-100" : "pointer-events-none h-0 border-transparent p-0 opacity-0 shadow-none",
        )}
        aria-label={label}
      >
        <motion.span
          aria-hidden
          layout
          transition={actionSlotTransition}
          className="pointer-events-none absolute inset-0 z-0 rounded-full bg-background"
        />
        <motion.div
          id={ACTION_TARGET_ID}
          ref={targetRef}
          layout
          transition={actionSlotTransition}
          className="relative z-10 flex max-w-[calc(100vw-1.5rem)] shrink-0 items-center gap-1 overflow-x-auto overflow-y-hidden [&_button]:h-8! [&_button]:min-h-8! [&_button]:min-w-0! [&_button]:rounded-full! [&_button]:px-2! [&_button]:text-xs! [&_button]:shadow-none!"
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      transition={actionSlotTransition}
      className="relative z-10 flex w-fit max-w-[min(36rem,52vw)] shrink-0 items-center overflow-x-auto"
      aria-label={label}
    >
      {hasVisibleActions ? (
        <motion.span aria-hidden layout transition={actionSlotTransition} className="mx-1 h-5 w-px shrink-0 bg-border/70" />
      ) : null}
      <motion.div
        id={ACTION_TARGET_ID}
        ref={targetRef}
        layout
        transition={actionSlotTransition}
        className="flex w-max shrink-0 items-center gap-1 py-0.5 [&_button]:h-6! [&_button]:min-h-6! [&_button]:min-w-0! [&_button]:rounded-full! [&_button]:px-2! [&_button]:text-xs! [&_button]:shadow-none!"
      />
    </motion.div>
  );
}

function MobileNavSheet({ onOpenChange, section }: { onOpenChange: (open: boolean) => void; section: TranslatedNavSection | null }) {
  const location = useLocation();
  const { t } = useTranslation("nav");
  const activeItemUrl = section ? getActiveNavItemUrl([section], location.pathname) : null;

  return (
    <Sheet open={section !== null} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80svh] gap-0 rounded-t-xl p-0" showCloseButton>
        <SheetHeader className="border-b">
          <SheetTitle>{section?.title ?? t("floating.mobileTitle")}</SheetTitle>
        </SheetHeader>
        <div className="grid gap-1 overflow-y-auto p-2">
          {section?.items.map((item) => (
            <MobileNavSheetItem
              key={item.href ?? item.url}
              item={item}
              active={!item.href && item.url === activeItemUrl}
              onNavigate={() => onOpenChange(false)}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileNavSheetItem({ active, item, onNavigate }: { active: boolean; item: TranslatedNavItem; onNavigate: () => void }) {
  const className = cn(
    "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
    active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
  );
  const content = (
    <>
      <HugeiconsIcon icon={item.icon} className="size-4 shrink-0" />
      <span className="truncate">{item.title}</span>
    </>
  );

  if (item.href) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className} onClick={onNavigate}>
        {content}
      </a>
    );
  }

  return (
    <Link to={item.url} className={className} onClick={onNavigate}>
      {content}
    </Link>
  );
}

function FloatingThemeControl() {
  const { setTheme, theme } = useTheme();
  const { t } = useTranslation("common");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label={t("theme.title")} />}>
        <HugeiconsIcon icon={Sun03Icon} className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <HugeiconsIcon icon={Moon02Icon} className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top">
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">
            <HugeiconsIcon icon={Sun03Icon} className="size-4" />
            <span>{t("theme.light")}</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <HugeiconsIcon icon={Moon02Icon} className="size-4" />
            <span>{t("theme.dark")}</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <HugeiconsIcon icon={ComputerIcon} className="size-4" />
            <span>{t("theme.system")}</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function normalizeLanguage(value: string): SupportedLanguage {
  return supportedLanguages.find((lang) => lang.code === value)?.code ?? "pl-PL";
}

function FloatingLanguageControl() {
  const { i18n } = useTranslation();
  const { data: session } = authClient.useSession();
  const storedLanguage = typeof window === "undefined" ? i18n.language : window.localStorage.getItem("i18nextLng") || i18n.language;
  const currentUserLang = normalizeLanguage(storedLanguage);
  const currentLanguage = supportedLanguages.find((lang) => lang.code === currentUserLang);
  const FlagComponent = currentLanguage ? flagComponents[currentLanguage.countryCode] : null;

  const handleLanguageChange = (code: SupportedLanguage) => {
    void i18n.changeLanguage(code);
    if (typeof window !== "undefined") window.localStorage.setItem("i18nextLng", code);
    if (session?.user) {
      const localeUpdate = { locale: code } as unknown as Parameters<typeof authClient.updateUser>[0];
      void authClient.updateUser(localeUpdate);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="shrink-0" aria-label={currentLanguage?.nativeName} />}>
        {FlagComponent ? <FlagComponent className="h-4 w-5 rounded-sm" /> : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top">
        <DropdownMenuRadioGroup value={currentUserLang}>
          {supportedLanguages.map((lang) => {
            const Flag = flagComponents[lang.countryCode];
            return (
              <DropdownMenuRadioItem key={lang.code} value={lang.code} onClick={() => handleLanguageChange(lang.code)}>
                {Flag ? <Flag className="h-4 w-5 rounded-sm" /> : null}
                <span>{lang.nativeName}</span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FloatingAccountCluster() {
  const { t } = useTranslation("nav");
  const { data: session } = authClient.useSession();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const user = session?.user;

  return (
    <div className="relative z-10 flex shrink-0 items-center gap-0.5">
      {user ? (
        <>
          <NotificationsBell className="rounded-full" />
          <FloatingThemeControl />
          <FloatingLanguageControl />
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full" aria-label={t("floating.account")} />}>
              <Avatar className="size-6 rounded-full">
                <AvatarImage src={resolveAvatarUrl(user.image)} />
                <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-56" side="top" align="end" sideOffset={8}>
              <div className="flex items-center gap-2 px-1.5 py-1.5">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={resolveAvatarUrl(user.image)} />
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-sm">
                  <p className="truncate font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {user.username ? (
                  <DropdownMenuItem render={<Link to="/users/$username" params={{ username: user.username }} />}>
                    <HugeiconsIcon icon={UserIcon} className="size-4" />
                    {t("items.myProfile")}
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem render={<Link to="/settings" search={{ tab: "account" }} />}>
                  <HugeiconsIcon icon={Settings02Icon} className="size-4" />
                  {t("items.accountSettings")}
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link to="/settings" search={{ tab: "preferences" }} />}>
                  <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="size-4" />
                  {t("items.preferences")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
        </>
      ) : (
        <>
          <FloatingThemeControl />
          <FloatingLanguageControl />
          <Button variant="outline" size="sm" className="h-8 rounded-full px-2.5" onClick={() => setAuthDialogOpen(true)}>
            <HugeiconsIcon icon={Login01Icon} className="size-4" />
            <span className="hidden sm:inline">{t("user.login")}</span>
          </Button>
          <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
        </>
      )}
    </div>
  );
}

function FloatingCategoryButton({
  active,
  expanded,
  isMobile,
  onClick,
  section,
  transition,
}: {
  active: boolean;
  expanded: boolean;
  isMobile: boolean;
  onClick: () => void;
  section: TranslatedNavSection;
  transition: FloatingTransition;
}) {
  const { t } = useTranslation("nav");
  const showLabel = active;

  return (
    <motion.div layout transition={transition} className="shrink-0">
      <Tooltip>
        <TooltipTrigger
          render={
            <motion.button
              layout
              type="button"
              aria-current={active ? "page" : undefined}
              aria-expanded={isMobile ? undefined : expanded}
              aria-label={t("floating.openSection", { section: section.title })}
              onClick={onClick}
              transition={transition}
              className={cn(
                "relative inline-flex h-11 min-w-11 shrink-0 items-center justify-center overflow-hidden rounded-full px-3.5 text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring md:h-8 md:min-w-8 md:text-[0.8125rem]",
                active
                  ? "z-10 text-primary-foreground md:px-2.5"
                  : expanded
                    ? "z-0 bg-muted text-foreground md:w-8 md:px-0"
                    : "z-0 text-muted-foreground hover:bg-muted hover:text-foreground md:w-8 md:px-0",
              )}
            />
          }
        >
          {active ? (
            <motion.span
              layoutId="floating-main-active"
              initial={false}
              transition={transition}
              className="pointer-events-none absolute inset-0 z-0 rounded-full bg-primary"
            />
          ) : null}
          <span className="relative z-20 inline-flex items-center justify-center gap-1.5">
            <HugeiconsIcon icon={section.icon} className="size-4 shrink-0" />
            {showLabel ? <span className="hidden whitespace-nowrap sm:inline-block">{section.title}</span> : null}
            {!showLabel ? <span className="sr-only">{section.title}</span> : null}
          </span>
        </TooltipTrigger>
        <TooltipContent>{section.title}</TooltipContent>
      </Tooltip>
    </motion.div>
  );
}

export function FloatingNav() {
  const { t } = useTranslation("nav");
  const location = useLocation();
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion() === true;
  const transition = reduceMotion ? { duration: 0 } : FLUID_TRANSITION;
  const { data: session } = authClient.useSession();
  const { data: settings } = useSettings();
  const [hidden, setHidden] = useState(readHiddenState);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [collapsedActiveKey, setCollapsedActiveKey] = useState<string | null>(null);
  const [mobileSectionKey, setMobileSectionKey] = useState<string | null>(null);
  const [subnavReady, setSubnavReady] = useState(true);
  const userRole = session?.user?.role as string | undefined;
  const isLoggedIn = session?.user !== undefined && session.user !== null;
  const showAuth = isLoggedIn && settings?.submissionsEnabled === true;
  const showLists = isLoggedIn && settings?.enableUserLists === true;

  useEffect(() => {
    if (hidden) {
      setSubnavReady(false);
      return;
    }

    if (reduceMotion) {
      setSubnavReady(true);
      return;
    }

    const timeoutId = window.setTimeout(() => setSubnavReady(true), SUBNAV_OPEN_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [hidden, reduceMotion]);

  useEffect(() => {
    setMobileSectionKey(null);
    setExpandedKey(null);
    setCollapsedActiveKey(null);
  }, [location.pathname]);

  const sections = useMemo(
    () => [
      ...translateNav(navMainConfig, t),
      ...(showAuth ? translateNav(authNavConfig, t) : []),
      ...(showLists ? translateNav(listsNavConfig, t) : []),
      ...translateAdminNav(adminNavConfig, t, userRole, settings),
      ...translateNav(infoNavConfig, t),
    ],
    [settings, showAuth, showLists, t, userRole],
  );
  const activeSection = useMemo(() => getActiveNavSection(sections, location.pathname), [sections, location.pathname]);
  const expandedSection = sections.find((section) => section.key === expandedKey) ?? null;
  const displayedSection = expandedSection ?? (activeSection?.key === collapsedActiveKey ? null : activeSection);
  const displayedSubnavSection = subnavReady ? displayedSection : null;
  const showDesktopSubnav = !isMobile && displayedSubnavSection !== null && displayedSubnavSection.items.length > 0;
  const mobileSection = sections.find((section) => section.key === mobileSectionKey) ?? null;

  return (
    <>
      <LayoutGroup id="floating-nav-shell">
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center px-2">
          <AnimatePresence initial={false} mode="popLayout">
            {hidden ? (
              <motion.button
                key="floating-nav-hidden"
                layout
                type="button"
                aria-label={t("floating.show")}
                onClick={() => {
                  writeHiddenState(false);
                  setHidden(false);
                }}
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
                transition={transition}
                className="pointer-events-auto relative flex h-5 w-28 items-center justify-center overflow-hidden rounded-t-xl text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <FloatingPrimarySurface transition={transition} className="rounded-t-xl border-b-0" />
                <HugeiconsIcon icon={ArrowUp01Icon} className="relative z-10 size-3.5" />
              </motion.button>
            ) : (
              <motion.div
                key="floating-nav-visible"
                layout
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                transition={transition}
                className="flex w-full flex-col items-center gap-0 md:gap-1"
                style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
              >
                {isMobile ? <FloatingActionSlot label={t("floating.actions")} placement="rail" transition={transition} /> : null}
                <DesktopSubnavRail reduceMotion={reduceMotion} section={showDesktopSubnav ? displayedSubnavSection : null} transition={transition} />
                <motion.nav
                  layout
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={transition}
                  aria-label={t("floating.label")}
                  className="pointer-events-auto relative isolate flex w-fit min-w-0 max-w-[calc(100vw-1rem)] items-center gap-0 rounded-full p-0.5"
                >
                  <FloatingPrimarySurface transition={transition} className="rounded-full" />
                  {displayedSection ? null : <FloatingSubnavAnchor transition={transition} />}
                  <LayoutGroup id="floating-main-nav">
                    <motion.div
                      layout
                      transition={transition}
                      className="relative z-10 isolate flex min-w-0 w-max max-w-full items-center gap-0.5 overflow-x-auto md:flex-1"
                    >
                      {sections.map((section) => {
                        const active = activeSection?.key === section.key;
                        const expanded = displayedSection?.key === section.key;
                        return (
                          <FloatingCategoryButton
                            key={section.key}
                            section={section}
                            active={active}
                            expanded={expanded}
                            isMobile={isMobile}
                            onClick={() => {
                              if (isMobile) {
                                setMobileSectionKey(section.key);
                                return;
                              }

                              if (displayedSection?.key === section.key) {
                                setExpandedKey(null);
                                setCollapsedActiveKey(activeSection?.key ?? null);
                                return;
                              }

                              if (section.key === activeSection?.key) {
                                setExpandedKey(null);
                                setCollapsedActiveKey(null);
                                return;
                              }

                              setCollapsedActiveKey(null);
                              setExpandedKey(section.key);
                            }}
                            transition={transition}
                          />
                        );
                      })}
                    </motion.div>
                  </LayoutGroup>
                  {!isMobile ? <FloatingActionSlot label={t("floating.actions")} placement="main" transition={transition} /> : null}
                  <div className="relative z-10 mx-0.5 hidden h-5 w-px bg-border sm:block" />
                  <FloatingAccountCluster />
                  <button
                    type="button"
                    aria-label={t("floating.hide")}
                    onClick={() => {
                      setSubnavReady(false);
                      writeHiddenState(true);
                      setHidden(true);
                    }}
                    className="relative z-10 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <HugeiconsIcon icon={ArrowDown01Icon} className="size-4" />
                  </button>
                </motion.nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </LayoutGroup>
      <MobileNavSheet section={mobileSection} onOpenChange={(open) => !open && setMobileSectionKey(null)} />
    </>
  );
}

export { ACTION_TARGET_ID as FLOATING_NAV_ACTION_TARGET_ID };
