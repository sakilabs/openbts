import { Clock01Icon, Tick02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

export const SUBMISSION_STATUS = {
  pending: {
    icon: Clock01Icon,
    label: "pending",
    borderClass: "border-l-amber-500",
    bgClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    iconClass: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    badgeColor: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  },
  approved: {
    icon: Tick02Icon,
    label: "approved",
    borderClass: "border-l-emerald-500",
    bgClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    badgeColor: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  },
  rejected: {
    icon: Cancel01Icon,
    label: "rejected",
    borderClass: "border-l-red-500",
    bgClass: "bg-red-500/10 text-red-700 dark:text-red-400",
    iconClass: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
    badgeColor: "text-red-600 bg-red-500/10 border-red-500/20",
  },
} as const;

export const SUBMISSION_TYPE = {
  new: {
    label: "new",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20",
    dotClass: "bg-emerald-500",
  },
  update: {
    label: "update",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300 border-blue-200 dark:border-blue-500/20",
    dotClass: "bg-blue-500",
  },
  delete: {
    label: "delete",
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300 border-rose-200 dark:border-rose-500/20",
    dotClass: "bg-rose-500",
  },
} as const;
