import type { ReactNode } from "react";
import { createRootRoute, Outlet, Link as RouterLink, useNavigate } from "@tanstack/react-router";
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
import "@/index.css";

type AuthLinkProps = { href: string; className?: string; children: ReactNode };
type AppProvidersProps = { children: ReactNode };

function AuthLink({ href, ...props }: AuthLinkProps) {
  return <RouterLink to={href} {...props} />;
}

function AppProviders({ children }: AppProvidersProps) {
  const navigate = useNavigate();

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
});
