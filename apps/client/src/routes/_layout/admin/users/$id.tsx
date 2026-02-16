import { useState, type ReactNode } from "react";
import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, SecurityLockIcon, Alert02Icon, ComputerIcon } from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/authClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { AdminUser, Session } from "@/features/admin/users/types";

const ROLES = ["user", "editor", "moderator", "admin"] as const;

const BAN_DURATIONS = [
	{ label: "1 day", value: 60 * 60 * 24 },
	{ label: "7 days", value: 60 * 60 * 24 * 7 },
	{ label: "30 days", value: 60 * 60 * 24 * 30 },
	{ label: "Permanent", value: 0 },
] as const;

function SectionHeader({ icon, title, description }: { icon: typeof UserIcon; title: string; description?: string }) {
	return (
		<div className="flex items-start gap-3 mb-4">
			<div className="flex items-center justify-center size-9 rounded-lg bg-muted text-muted-foreground shrink-0 mt-0.5">
				<HugeiconsIcon icon={icon} className="size-4.5" />
			</div>
			<div className="min-w-0">
				<h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h2>
				{description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
			</div>
		</div>
	);
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2">
			<span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{label}</span>
			<span className="text-sm">{children}</span>
		</div>
	);
}

function AdminUserDetailPage() {
	const { id: userId } = Route.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [editName, setEditName] = useState("");
	const [newPassword, setNewPassword] = useState("");

	const [banDialogOpen, setBanDialogOpen] = useState(false);
	const [banReason, setBanReason] = useState("");
	const [banDuration, setBanDuration] = useState<number>(0);

	const { data: userData, isLoading } = useQuery({
		queryKey: ["admin", "user", userId],
		queryFn: async () => {
			const result = await authClient.admin.listUsers({
				query: {
					filterField: "id",
					filterValue: userId,
					filterOperator: "eq",
					limit: 1,
				},
			});
			if (result.error) throw result.error;
			return result.data?.users?.[0] as unknown as AdminUser | undefined;
		},
		enabled: !!userId,
	});

	const { data: sessions } = useQuery({
		queryKey: ["admin", "user-sessions", userId],
		queryFn: async () => {
			const result = await authClient.admin.listUserSessions({ userId: userId });
			if (result.error) throw result.error;
			return (result.data as unknown as { sessions: Session[] }).sessions;
		},
		enabled: !!userId,
	});

	const invalidateAll = () => queryClient.invalidateQueries({ queryKey: ["admin"] });

	const setRoleMutation = useMutation({
		mutationFn: async (newRole: string) => {
			if (!userId) throw new Error("User ID is missing");
			const result = await authClient.admin.setRole({ userId, role: newRole as "user" | "admin" });
			if (result.error) throw result.error;
		},
		onSuccess: () => {
			toast.success("Role updated successfully");
			invalidateAll();
		},
		onError: () => toast.error("Failed to update role"),
	});

	const updateNameMutation = useMutation({
		mutationFn: async () => {
			if (!userId) throw new Error("User ID is missing");
			const result = await authClient.admin.updateUser({ userId, data: { name: editName.trim() } });
			if (result.error) throw result.error;
		},
		onSuccess: () => {
			toast.success("Name updated successfully");
			setEditName("");
			invalidateAll();
		},
		onError: () => toast.error("Failed to update name"),
	});

	const setPasswordMutation = useMutation({
		mutationFn: async () => {
			if (!userId) throw new Error("User ID is missing");
			const result = await authClient.admin.setUserPassword({ userId, newPassword });
			if (result.error) throw result.error;
		},
		onSuccess: () => {
			toast.success("Password updated successfully");
			setNewPassword("");
		},
		onError: () => toast.error("Failed to set password"),
	});

	const banMutation = useMutation({
		mutationFn: async () => {
			if (!userId) throw new Error("User ID is missing");
			const result = await authClient.admin.banUser({
				userId,
				...(banReason ? { banReason } : {}),
				...(banDuration > 0 ? { banExpiresIn: banDuration } : {}),
			});
			if (result.error) throw result.error;
		},
		onSuccess: () => {
			toast.success("User banned successfully");
			setBanDialogOpen(false);
			setBanReason("");
			setBanDuration(0);
			invalidateAll();
		},
		onError: () => toast.error("Failed to ban user"),
	});

	const unbanMutation = useMutation({
		mutationFn: async () => {
			if (!userId) throw new Error("User ID is missing");
			const result = await authClient.admin.unbanUser({ userId });
			if (result.error) throw result.error;
		},
		onSuccess: () => {
			toast.success("User unbanned successfully");
			invalidateAll();
		},
		onError: () => toast.error("Failed to unban user"),
	});

	const deleteMutation = useMutation({
		mutationFn: async () => {
			if (!userId) throw new Error("User ID is missing");
			const result = await authClient.admin.removeUser({ userId });
			if (result.error) throw result.error;
		},
		onSuccess: () => {
			toast.success("User deleted successfully");
			navigate({ to: "/admin/users" });
		},
		onError: () => toast.error("Failed to delete user"),
	});

	const revokeSessionMutation = useMutation({
		mutationFn: async (sessionToken: string) => {
			const result = await authClient.admin.revokeUserSession({ sessionToken });
			if (result.error) throw result.error;
		},
		onSuccess: () => {
			toast.success("Session revoked");
			invalidateAll();
		},
		onError: () => toast.error("Failed to revoke session"),
	});

	const revokeAllMutation = useMutation({
		mutationFn: async () => {
			if (!userId) throw new Error("User ID is missing");
			const result = await authClient.admin.revokeUserSessions({ userId });
			if (result.error) throw result.error;
		},
		onSuccess: () => {
			toast.success("All sessions revoked");
			invalidateAll();
		},
		onError: () => toast.error("Failed to revoke sessions"),
	});

	if (!userId) return <Navigate to="/admin/users" replace />;

	if (isLoading) {
		return (
			<div className="flex-1 overflow-y-auto">
				<div className="p-4 space-y-4">
					<div className="flex items-center gap-4">
						<Skeleton className="size-16 rounded-full" />
						<div className="space-y-2">
							<Skeleton className="h-6 w-48" />
							<Skeleton className="h-4 w-32" />
						</div>
					</div>
					<Skeleton className="h-48 w-full rounded-xl" />
					<Skeleton className="h-48 w-full rounded-xl" />
				</div>
			</div>
		);
	}

	if (!userData) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<div className="text-center space-y-4">
					<p className="text-muted-foreground">User not found</p>
					<Button variant="outline" onClick={() => navigate({ to: "/admin/users" })}>
						Back to Users
					</Button>
				</div>
			</div>
		);
	}

	const user = userData;

	return (
		<div className="flex-1 overflow-y-auto">
			<div className="p-4 space-y-4">
				<div className="flex items-center gap-4">
					<Avatar size="lg">
						{user.image && <AvatarImage src={user.image} />}
						<AvatarFallback>{user.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2 flex-wrap">
							<h1 className="text-xl font-bold tracking-tight">{user.name}</h1>
							<Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role ?? "user"}</Badge>
							{user.banned && <Badge variant="destructive">Banned</Badge>}
						</div>
						<p className="text-sm text-muted-foreground">{user.email}</p>
					</div>
				</div>

				<section>
					<SectionHeader icon={UserIcon} title="User Information" description="Basic details about this user" />
					<Card>
						<CardContent className="divide-y">
							<InfoRow label="Name">{user.name}</InfoRow>
							<InfoRow label="Email">{user.email}</InfoRow>
							{user.username && <InfoRow label="Username">@{user.username}</InfoRow>}
							<InfoRow label="Role">{user.role ?? "user"}</InfoRow>
							<InfoRow label="Created">{new Date(user.createdAt).toLocaleString()}</InfoRow>
							{user.banned && (
								<>
									<InfoRow label="Ban Status">
										<Badge variant="destructive">Banned</Badge>
									</InfoRow>
									{user.banReason && <InfoRow label="Ban Reason">{user.banReason}</InfoRow>}
									{user.banExpires && <InfoRow label="Ban Expires">{new Date(user.banExpires).toLocaleString()}</InfoRow>}
								</>
							)}
						</CardContent>
					</Card>
				</section>

				<section>
					<SectionHeader icon={SecurityLockIcon} title="Manage User" description="Update user details, role, and password" />
					<Card>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label>Role</Label>
								<div className="flex items-center gap-2">
									<Select value={user.role ?? "user"} onValueChange={(v) => setRoleMutation.mutate(v as string)} disabled={setRoleMutation.isPending}>
										<SelectTrigger className="w-48">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{ROLES.map((role) => (
												<SelectItem key={role} value={role}>
													{role.charAt(0).toUpperCase() + role.slice(1)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{setRoleMutation.isPending && <Spinner />}
								</div>
							</div>

							<div className="space-y-2">
								<Label>Update Name</Label>
								<div className="flex items-center gap-2">
									<Input placeholder={user.name} value={editName} onChange={(e) => setEditName(e.target.value)} className="max-w-xs" />
									<Button onClick={() => updateNameMutation.mutate()} disabled={updateNameMutation.isPending || !editName.trim()}>
										{updateNameMutation.isPending ? <Spinner /> : "Update"}
									</Button>
								</div>
							</div>

							<div className="space-y-2">
								<Label>Set Password</Label>
								<div className="flex items-center gap-2">
									<Input
										type="password"
										placeholder="New password"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										className="max-w-xs"
									/>
									<Button onClick={() => setPasswordMutation.mutate()} disabled={setPasswordMutation.isPending || !newPassword}>
										{setPasswordMutation.isPending ? <Spinner /> : "Set Password"}
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</section>

				<section>
					<SectionHeader icon={ComputerIcon} title="Sessions" description="Active sessions for this user" />
					<Card>
						<CardContent>
							{sessions && sessions.length > 0 ? (
								<div className="space-y-3">
									<div className="flex justify-end">
										<Button variant="destructive" size="sm" onClick={() => revokeAllMutation.mutate()} disabled={revokeAllMutation.isPending}>
											{revokeAllMutation.isPending ? <Spinner /> : "Revoke All"}
										</Button>
									</div>
									<div className="divide-y">
										{sessions.map((session) => (
											<div key={session.id} className="flex items-center justify-between py-3 gap-4">
												<div className="min-w-0 flex-1">
													<div className="text-sm font-mono truncate">{session.token.slice(0, 20)}...</div>
													<div className="text-xs text-muted-foreground">
														Created {new Date(session.createdAt).toLocaleString()}
														{session.ipAddress && ` · ${session.ipAddress}`}
													</div>
												</div>
												<Button
													variant="outline"
													size="sm"
													onClick={() => revokeSessionMutation.mutate(session.token)}
													disabled={revokeSessionMutation.isPending && revokeSessionMutation.variables === session.token}
												>
													{revokeSessionMutation.isPending && revokeSessionMutation.variables === session.token ? <Spinner /> : "Revoke"}
												</Button>
											</div>
										))}
									</div>
								</div>
							) : (
								<p className="text-sm text-muted-foreground py-4 text-center">No active sessions</p>
							)}
						</CardContent>
					</Card>
				</section>

				<section className="pb-6">
					<SectionHeader icon={Alert02Icon} title="Danger Zone" description="Irreversible and destructive actions" />
					<Card>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between gap-4 py-2">
								<div>
									<p className="text-sm font-medium">{user.banned ? "Unban User" : "Ban User"}</p>
									<p className="text-xs text-muted-foreground">
										{user.banned ? "Allow this user to sign in again" : "Prevent this user from signing in"}
									</p>
								</div>
								{user.banned ? (
									<Button variant="outline" onClick={() => unbanMutation.mutate()} disabled={unbanMutation.isPending}>
										{unbanMutation.isPending ? <Spinner /> : "Unban"}
									</Button>
								) : (
									<Button variant="destructive" onClick={() => setBanDialogOpen(true)}>
										Ban User
									</Button>
								)}
							</div>

							<div className="flex items-center justify-between gap-4 py-2">
								<div>
									<p className="text-sm font-medium">Delete User</p>
									<p className="text-xs text-muted-foreground">Permanently remove this user and all their data</p>
								</div>
								<AlertDialog>
									<AlertDialogTrigger render={<Button variant="destructive" />}>Delete User</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Delete {user.name}?</AlertDialogTitle>
											<AlertDialogDescription>
												This action cannot be undone. This will permanently delete the user account and all associated data.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancel</AlertDialogCancel>
											<AlertDialogAction variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
												{deleteMutation.isPending ? <Spinner /> : "Delete"}
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						</CardContent>
					</Card>
				</section>
			</div>

			<Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Ban {user.name}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Reason (optional)</Label>
							<Input placeholder="e.g. Spamming" value={banReason} onChange={(e) => setBanReason(e.target.value)} />
						</div>
						<div className="space-y-2">
							<Label>Duration</Label>
							<Select value={banDuration} onValueChange={(v) => setBanDuration(Number(v))}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{BAN_DURATIONS.map((d) => (
										<SelectItem key={d.value} value={d.value}>
											{d.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setBanDialogOpen(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={() => banMutation.mutate()} disabled={banMutation.isPending}>
							{banMutation.isPending ? <Spinner /> : "Ban User"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export const Route = createFileRoute("/_layout/admin/users/$id")({
	component: AdminUserDetailPage,
	staticData: {
		titleKey: "breadcrumbs.userDetail",
		i18nNamespace: "admin",
		breadcrumbs: [
			{ titleKey: "breadcrumbs.admin", path: "/admin/users", i18nNamespace: "admin" },
			{ titleKey: "breadcrumbs.users", path: "/admin/users", i18nNamespace: "admin" },
		],
	},
});
