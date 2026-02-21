import { SignalFull02Icon, Wifi01Icon, SmartPhone01Icon, FlashIcon, RadioIcon, AirdropIcon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export const RAT_ORDER = ["GSM", "UMTS", "LTE", "NR"] as const;

export type RatType = (typeof RAT_ORDER)[number];

export const RAT_ICONS: Record<string, IconSvgElement> = {
  GSM: SignalFull02Icon,
  UMTS: Wifi01Icon,
  LTE: SmartPhone01Icon,
  NR: FlashIcon,
  CDMA: RadioIcon,
  IOT: AirdropIcon,
  OTHER: SignalFull02Icon,
};

export const RAT_OPTIONS: { value: RatType; label: string; gen: string }[] = [
  { value: "GSM", label: "GSM", gen: "2G" },
  { value: "UMTS", label: "UMTS", gen: "3G" },
  { value: "LTE", label: "LTE", gen: "4G" },
  { value: "NR", label: "NR", gen: "5G" },
];

export const EXTENDED_RAT_OPTIONS: { value: string; label: string; gen: string }[] = [...RAT_OPTIONS, { value: "IOT", label: "IoT", gen: "NB" }];

export function getSharedDetailFields(rat: string): string[] {
  switch (rat) {
    case "GSM":
      return ["lac"];
    case "UMTS":
      return ["lac", "rnc"];
    case "LTE":
      return ["tac", "enbid"];
    case "NR":
      return ["nrtac", "gnbid"];
    default:
      return [];
  }
}

export function ratToGenLabel(rat: string): string {
  if (rat === "GSM") return "2G";
  if (rat === "UMTS") return "3G";
  if (rat === "LTE") return "4G";
  return "5G";
}
