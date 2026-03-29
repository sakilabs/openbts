import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { createRootRoute, HeadContent, Outlet, Link as RouterLink, useNavigate } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { BackendStatusProvider } from "@/components/backend-status";
import { Toaster } from "@/components/ui/sonner";
import { ReloadPrompt } from "@/components/reload-prompt";
import { authClient } from "@/lib/authClient";
import { queryClient } from "@/lib/queryClient";
import i18n from "@/i18n/config";
import { plPLAuthLocalization } from "@/i18n/authLocalization";
import "@/index.css";

type AuthLinkProps = { href: string; className?: string; children: ReactNode };
type AppProvidersProps = { children: ReactNode };

function AuthLink({ href, ...props }: AuthLinkProps) {
  return <RouterLink to={href} {...props} />;
}

function AppProviders({ children }: AppProvidersProps) {
  const navigate = useNavigate();
  const { i18n: i18nInstance } = useTranslation();
  const localization = i18nInstance.language === "pl-PL" ? plPLAuthLocalization : undefined;

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={(path) => navigate({ to: path })}
      replace={(path) => navigate({ to: path, replace: true })}
      basePath="/account"
      Link={AuthLink}
      onSessionChange={() => queryClient.invalidateQueries()}
      social={{
        providers: ["github", "google"],
      }}
      passkey
      twoFactor={["totp"]}
      localization={localization}
    >
      <ErrorBoundary>{children}</ErrorBoundary>
      <Toaster />
      <ReloadPrompt />
    </AuthUIProvider>
  );
}

function RootComponent() {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="ui-theme">
          <BackendStatusProvider queryClient={queryClient}>
            <AppProviders>
              <HeadContent />
              <Outlet />
            </AppProviders>
          </BackendStatusProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  head: () => {
    const adClient = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
    return {
      scripts: adClient
        ? [
            {
              children: `window.googlefc=window.googlefc||{};window.googlefc.controlledMessagingFunction=function(m){m.proceed(false);}`,
            },
            {
              src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`,
              async: true,
              crossOrigin: "anonymous" as const,
            },
          ]
        : [],
    };
  },
});
