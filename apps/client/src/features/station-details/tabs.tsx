import {
	Note01Icon,
	RefreshIcon,
	SignalFull02Icon,
} from "@hugeicons/core-free-icons";

export type TabId = "specs" | "permits" | "comments";

export const TAB_OPTIONS = [
	{ id: "specs", label: "Specifications", icon: SignalFull02Icon },
	{ id: "permits", label: "UKE Permits", icon: Note01Icon },
	{ id: "comments", label: "Comments", icon: RefreshIcon },
] as const;
