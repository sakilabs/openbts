import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import type { DialogRootChangeEventDetails } from "@base-ui/react/dialog";

interface AuthDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	forced?: boolean;
}

const BLOCKED_REASONS = new Set(["escape-key", "close-press", "outside-press", "focus-out"]);

function SignInForm({ onSuccess, onSwitchView }: { onSuccess: () => void; onSwitchView: () => void }) {
	const { t } = useTranslation("auth");
	const [error, setError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			setError(null);

			const { error: signInError } = await authClient.signIn.email({
				email: value.email,
				password: value.password,
			});

			if (signInError) {
				setError(signInError.message ?? "An unexpected error occurred");
				return;
			}

			toast.success(t("signIn.success"));
			onSuccess();
		},
	});

	return (
		<>
			<DialogHeader>
				<DialogTitle>{t("signIn.title")}</DialogTitle>
				<DialogDescription>{t("signIn.description")}</DialogDescription>
			</DialogHeader>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4 mt-4"
			>
				<form.Field name="email">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor="sign-in-email">{t("signIn.email")}</Label>
							<Input
								id="sign-in-email"
								type="email"
								placeholder={t("signIn.emailPlaceholder")}
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
								required
								disabled={form.state.isSubmitting}
								autoComplete="email"
							/>
						</div>
					)}
				</form.Field>
				<form.Field name="password">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor="sign-in-password">{t("signIn.password")}</Label>
							<Input
								id="sign-in-password"
								type="password"
								placeholder={t("signIn.passwordPlaceholder")}
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
								required
								disabled={form.state.isSubmitting}
								autoComplete="current-password"
							/>
						</div>
					)}
				</form.Field>
				{error && <p className="text-sm text-destructive">{error}</p>}
				<form.Subscribe selector={(s) => s.isSubmitting}>
					{(isSubmitting) => (
						<Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<Spinner />
									{t("signIn.submitting")}
								</>
							) : (
								t("signIn.submit")
							)}
						</Button>
					)}
				</form.Subscribe>
				<p className="text-center text-sm text-muted-foreground">
					{t("signIn.noAccount")}{" "}
					<button type="button" className="text-primary underline-offset-4 hover:underline font-medium" onClick={onSwitchView}>
						{t("signIn.signUpLink")}
					</button>
				</p>
			</form>
		</>
	);
}

function SignUpForm({ onSuccess, onSwitchView }: { onSuccess: () => void; onSwitchView: () => void }) {
	const { t } = useTranslation("auth");
	const [error, setError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { name: "", username: "", email: "", password: "" },
		onSubmit: async ({ value }) => {
			setError(null);

			const { error: signUpError } = await authClient.signUp.email({
				email: value.email,
				password: value.password,
				name: value.name,
				username: value.username,
			});

			if (signUpError) {
				setError(signUpError.message ?? "An unexpected error occurred");
				return;
			}

			toast.success(t("signUp.success"));
			onSuccess();
		},
	});

	return (
		<>
			<DialogHeader>
				<DialogTitle>{t("signUp.title")}</DialogTitle>
				<DialogDescription>{t("signUp.description")}</DialogDescription>
			</DialogHeader>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4 mt-4"
			>
				<form.Field name="name">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor="sign-up-name">{t("signUp.name")}</Label>
							<Input
								id="sign-up-name"
								type="text"
								placeholder={t("signUp.namePlaceholder")}
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
								required
								disabled={form.state.isSubmitting}
								autoComplete="name"
							/>
						</div>
					)}
				</form.Field>
				<form.Field name="username">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor="sign-up-username">{t("signUp.username")}</Label>
							<Input
								id="sign-up-username"
								type="text"
								placeholder={t("signUp.usernamePlaceholder")}
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
								required
								disabled={form.state.isSubmitting}
								autoComplete="username"
							/>
						</div>
					)}
				</form.Field>
				<form.Field name="email">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor="sign-up-email">{t("signUp.email")}</Label>
							<Input
								id="sign-up-email"
								type="email"
								placeholder={t("signUp.emailPlaceholder")}
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
								required
								disabled={form.state.isSubmitting}
								autoComplete="email"
							/>
						</div>
					)}
				</form.Field>
				<form.Field name="password">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor="sign-up-password">{t("signUp.password")}</Label>
							<Input
								id="sign-up-password"
								type="password"
								placeholder={t("signUp.passwordPlaceholder")}
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
								required
								disabled={form.state.isSubmitting}
								autoComplete="new-password"
							/>
						</div>
					)}
				</form.Field>
				{error && <p className="text-sm text-destructive">{error}</p>}
				<form.Subscribe selector={(s) => s.isSubmitting}>
					{(isSubmitting) => (
						<Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<Spinner />
									{t("signUp.submitting")}
								</>
							) : (
								t("signUp.submit")
							)}
						</Button>
					)}
				</form.Subscribe>
				<p className="text-center text-sm text-muted-foreground">
					{t("signUp.hasAccount")}{" "}
					<button type="button" className="text-primary underline-offset-4 hover:underline font-medium" onClick={onSwitchView}>
						{t("signUp.signInLink")}
					</button>
				</p>
			</form>
		</>
	);
}

export function AuthDialog({ open, onOpenChange, forced = false }: AuthDialogProps) {
	const [view, setView] = useState<"signIn" | "signUp">("signIn");

	function handleOpenChange(nextOpen: boolean, details: DialogRootChangeEventDetails) {
		if (forced && !nextOpen && BLOCKED_REASONS.has(details.reason)) return;
		onOpenChange(nextOpen);

		if (!nextOpen) setView("signIn");
	}

	function handleSuccess() {
		onOpenChange(false);
		setView("signIn");
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange} modal>
			<DialogContent showCloseButton={!forced} className="max-w-sm sm:max-w-md">
				{view === "signIn" ? (
					<SignInForm onSuccess={handleSuccess} onSwitchView={() => setView("signUp")} />
				) : (
					<SignUpForm onSuccess={handleSuccess} onSwitchView={() => setView("signIn")} />
				)}
			</DialogContent>
		</Dialog>
	);
}
