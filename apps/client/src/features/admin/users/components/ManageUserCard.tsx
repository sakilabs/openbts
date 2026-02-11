import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SecurityLockIcon } from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/authClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { AdminUser } from "@/features/admin/users/types";
import { SectionHeader } from "./common";

const ROLES = ["user", "editor", "moderator", "admin"] as const;

export function ManageUserCard({ user }: { user: AdminUser }) {
	const queryClient = useQueryClient();
	const [editName, setEditName] = useState("");
	const [newPassword, setNewPassword] = useState("");

	const invalidateAll = () => queryClient.invalidateQueries({ queryKey: ["admin"] });

	const setRoleMutation = useMutation({
		mutationFn: async (newRole: string) => {
			const result = await authClient.admin.setRole({ userId: user.id, role: newRole as "user" | "admin" });
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
			const result = await authClient.admin.updateUser({ userId: user.id, data: { name: editName.trim() } });
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
			const result = await authClient.admin.setUserPassword({ userId: user.id, newPassword });
			if (result.error) throw result.error;
		},
		onSuccess: () => {
			toast.success("Password updated successfully");
			setNewPassword("");
		},
		onError: () => toast.error("Failed to set password"),
	});

	return (
		<section>
			<SectionHeader icon={SecurityLockIcon} title="Manage User" description="Update user details, role, and password" />
			<Card>
				<CardContent className="space-y-6">
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
	);
}
