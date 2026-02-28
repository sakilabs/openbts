import type { ReactNode } from "react";
import { createRootRoute, Outlet, Link as RouterLink, useNavigate } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { BackendStatusProvider } from "@/components/backend-status";
import { Toaster } from "@/components/ui/sonner";
import { ReloadPrompt } from "@/components/reload-prompt";
import { BackendUnavailableError } from "@/lib/api";
import { authClient } from "@/lib/authClient";
import i18n from "@/i18n/config";
import "@/index.css";

function AuthLink({ href, ...props }: { href: string; className?: string; children: ReactNode }) {
  return <RouterLink to={href} {...props} />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof BackendUnavailableError) return false;
        return failureCount < 3;
      },
    },
  },
});

function AppProviders({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={(path) => navigate({ to: path })}
      replace={(path) => navigate({ to: path, replace: true })}
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
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
