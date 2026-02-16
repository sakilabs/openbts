import { UserIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AdminUser } from "@/features/admin/users/types";
import { SectionHeader, InfoRow } from "./common";

export function UserInfoCard({ user }: { user: AdminUser }) {
  return (
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
  );
}
