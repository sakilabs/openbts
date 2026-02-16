import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { LanguageSquareIcon } from "@hugeicons/core-free-icons";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { supportedLanguages, type SupportedLanguage } from "@/i18n/config";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const currentLanguage = supportedLanguages.find((lang) => lang.code === i18n.language);

  const handleLanguageChange = (code: SupportedLanguage) => {
    i18n.changeLanguage(code);
    localStorage.setItem("i18nextLng", code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<SidebarMenuButton />}>
        <HugeiconsIcon icon={LanguageSquareIcon} className="size-4" />
        <span>{currentLanguage?.nativeName ?? "Language"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={i18n.language === lang.code ? "bg-accent" : ""}
          >
            <span className="size-4 text-center text-xs font-medium">{lang.code.slice(0, 2).toUpperCase()}</span>
            <span>{lang.nativeName}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
