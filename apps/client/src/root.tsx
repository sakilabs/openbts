import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, Link as RouterLink } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider, useTranslation } from "react-i18next";
import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/sonner";
import { authClient } from "@/lib/auth-client";
import i18n from "@/i18n/config";
import "./index.css";

function AuthLink({ href, ...props }: { href: string; className?: string; children: ReactNode }) {
	return <RouterLink to={href} {...props} />;
}

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 10, // 10 minutes
			refetchOnWindowFocus: false,
		},
	},
});

function LanguageAwareHtml({ children }: { children: ReactNode }) {
	const { i18n } = useTranslation();
	return (
		<html lang={i18n.language} suppressHydrationWarning>
			{children}
		</html>
	);
}

export function Layout({ children }: { children: ReactNode }) {
	return (
		<I18nextProvider i18n={i18n}>
			<LanguageAwareHtml>
				<head>
					<meta charSet="utf-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<Meta />
					<Links />
				</head>
				<body>
					<QueryClientProvider client={queryClient}>
						<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
							<AuthUIProvider authClient={authClient} Link={AuthLink} onSessionChange={() => queryClient.invalidateQueries()}>
								<ErrorBoundary>{children}</ErrorBoundary>
								<Toaster />
							</AuthUIProvider>
						</ThemeProvider>
					</QueryClientProvider>
					<ScrollRestoration />
					<Scripts />
				</body>
			</LanguageAwareHtml>
		</I18nextProvider>
	);
}

export function HydrateFallback() {
	return <div className="p-6">Loading...</div>;
}

export default function App() {
	return <Outlet />;
}
