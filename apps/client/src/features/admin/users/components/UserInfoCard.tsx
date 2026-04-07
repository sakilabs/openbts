import { Cancel01Icon, CheckmarkCircle02Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AdminUser } from "@/features/admin/users/types";

import { InfoRow, SectionHeader } from "./common";

export function UserInfoCard({ user }: { user: AdminUser }) {
  return (
    <section>
      <SectionHeader icon={UserIcon} title="User Information" description="Basic details about this user" />
      <Card>
        <CardContent className="divide-y">
          <InfoRow label="Name">{user.name}</InfoRow>
          <InfoRow label="Email">{user.email}</InfoRow>
          <InfoRow label="Email Verified">
            {user.emailVerified ? (
              <span className="flex items-center gap-1 text-green-600">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
                Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                Not verified
              </span>
            )}
          </InfoRow>
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
