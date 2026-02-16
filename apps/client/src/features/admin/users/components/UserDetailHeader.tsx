import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { AdminUser } from "@/features/admin/users/types";

export function UserDetailHeader({ user }: { user: AdminUser }) {
  return (
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
  );
}
