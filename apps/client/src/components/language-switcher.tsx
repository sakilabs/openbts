import { useTranslation } from "react-i18next";
import { PL, US } from "country-flag-icons/react/3x2";

import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { supportedLanguages, type SupportedLanguage } from "@/i18n/config";

const flagComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  US,
  PL,
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentUserLang = localStorage.getItem("i18nextLng") || i18n.language;

  const currentLanguage = supportedLanguages.find((lang) => lang.code === currentUserLang);
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
        <DropdownMenuRadioGroup value={currentUserLang}>
          {supportedLanguages.map((lang) => {
            const Flag = flagComponents[lang.countryCode];
            return (
              <DropdownMenuRadioItem key={lang.code} value={lang.code} onClick={() => handleLanguageChange(lang.code)}>
                {Flag && <Flag className="h-4 w-5 rounded-sm" />}
                <span>{lang.nativeName}</span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
