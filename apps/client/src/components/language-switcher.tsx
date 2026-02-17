import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { PL, US } from "country-flag-icons/react/3x2";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { supportedLanguages, type SupportedLanguage } from "@/i18n/config";

const flagComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  US,
  PL,
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const currentLanguage = supportedLanguages.find((lang) => lang.code === i18n.language);
  const FlagComponent = currentLanguage ? flagComponents[currentLanguage.countryCode] : null;

  const handleLanguageChange = (code: SupportedLanguage) => {
    i18n.changeLanguage(code);
    localStorage.setItem("i18nextLng", code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<SidebarMenuButton />}>
        {FlagComponent && <FlagComponent className="h-4 w-5 rounded-sm" />}
        <span className="text-sm font-semibold">{currentLanguage?.nativeName}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {supportedLanguages.map((lang) => {
          const Flag = flagComponents[lang.countryCode];
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={i18n.language === lang.code ? "bg-accent" : ""}
            >
              {Flag && <Flag className="h-4 w-5 rounded-sm" />}
              <span>{lang.nativeName}</span>
              {i18n.language === lang.code && <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 ml-auto" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
