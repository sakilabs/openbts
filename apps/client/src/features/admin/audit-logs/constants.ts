export interface AuditLogUser {
  id: string;
  name: string;
  image: string | null;
  displayUsername: string | null;
}

export interface AuditLogEntry {
  id: number;
  action: string;
  table_name: string;
  record_id: number | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  source: string | null;
  ip_address: string | null;
  user_agent: string | null;
  invoked_by: string | null;
  createdAt: string;
  user: AuditLogUser | null;
}

export const ACTION_STYLES: Record<string, { badgeClass: string; dotClass: string }> = {
  create: { badgeClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", dotClass: "bg-emerald-400" },
  update: { badgeClass: "bg-amber-500/10 border-amber-500/20 text-amber-400", dotClass: "bg-amber-400" },
  delete: { badgeClass: "bg-red-500/10 border-red-500/20 text-red-400", dotClass: "bg-red-400" },
  approve: { badgeClass: "bg-sky-500/10 border-sky-500/20 text-sky-400", dotClass: "bg-sky-400" },
  reject: { badgeClass: "bg-orange-500/10 border-orange-500/20 text-orange-400", dotClass: "bg-orange-400" },
  cleanup: { badgeClass: "bg-purple-500/10 border-purple-500/20 text-purple-400", dotClass: "bg-purple-400" },
  start: { badgeClass: "bg-violet-500/10 border-violet-500/20 text-violet-400", dotClass: "bg-violet-400" },
};

export function getActionStyle(action: string) {
  const operation = action.split(".").pop() ?? "";
  return ACTION_STYLES[operation] ?? { badgeClass: "bg-muted/50 border-border text-muted-foreground", dotClass: "bg-muted-foreground" };
}

export const TABLE_LABELS: Record<string, string> = {
  stations: "Stations",
  cells: "Cells",
  locations: "Locations",
  operators: "Operators",
  bands: "Bands",
  regions: "Regions",
  submissions: "Submissions",
  settings: "Settings",
  station_comments: "Comments",
  user_lists: "User Lists",
  uke_import: "UKE Import",
};

export const TABLE_OPTIONS = Object.keys(TABLE_LABELS);

export const ACTION_GROUPS: { label: string; actions: string[] }[] = [
  { label: "Stations", actions: ["stations.create", "stations.update", "stations.delete"] },
  { label: "Cells", actions: ["cells.create", "cells.update", "cells.delete"] },
  { label: "Locations", actions: ["locations.create", "locations.update", "locations.delete"] },
  { label: "Operators", actions: ["operators.create", "operators.update", "operators.delete"] },
  { label: "Bands", actions: ["bands.create", "bands.update", "bands.delete"] },
  { label: "Regions", actions: ["regions.create", "regions.update", "regions.delete"] },
  {
    label: "Submissions",
    actions: ["submissions.create", "submissions.update", "submissions.delete", "submissions.approve", "submissions.reject", "submissions.cleanup"],
  },
  { label: "Settings", actions: ["settings.update"] },
  { label: "Comments", actions: ["station_comments.create", "station_comments.delete"] },
  { label: "User Lists", actions: ["user_lists.create", "user_lists.update", "user_lists.delete"] },
  { label: "UKE Import", actions: ["uke_import.start"] },
];
