import type { AuthLocalization } from "@daveyplate/better-auth-ui";

export const plPLAuthLocalization: Partial<AuthLocalization> = {
  // Profile
  NAME: "Nazwa",
  NAME_DESCRIPTION: "Wpisz swoje pełne imię i nazwisko lub nazwę wyświetlaną.",
  NAME_INSTRUCTIONS: "Maksymalnie 32 znaki.",
  NAME_PLACEHOLDER: "Nazwa",
  EMAIL: "E-mail",
  EMAIL_DESCRIPTION: "Wpisz adres e-mail, którego chcesz używać do logowania.",
  EMAIL_INSTRUCTIONS: "Wpisz poprawny adres e-mail.",
  EMAIL_PLACEHOLDER: "twoj@email.pl",
  EMAIL_IS_THE_SAME: "Adres e-mail jest taki sam",
  EMAIL_VERIFY_CHANGE: "Sprawdź skrzynkę pocztową, aby potwierdzić zmianę.",

  // Actions
  SAVE: "Zapisz",
  CANCEL: "Anuluj",
  DELETE: "Usuń",
  REMOVE: "Usuń",
  ADD: "Dodaj",
  LINK: "Połącz",
  UNLINK: "Odłącz",
  CONTINUE: "Kontynuuj",
  DONE: "Gotowe",
  REVOKE: "Unieważnij",
  SIGN_OUT: "Wyloguj",
  UNKNOWN: "Nieznane",
  UPDATED_SUCCESSFULLY: "Zaktualizowano pomyślnie",

  // Providers
  PROVIDERS: "Połączone konta",
  PROVIDERS_DESCRIPTION: "Połącz konto z usługą zewnętrzną.",

  // Passkeys
  PASSKEYS: "Klucze dostępu",
  PASSKEYS_DESCRIPTION: "Zarządzaj kluczami dostępu dla bezpiecznego logowania.",
  PASSKEYS_INSTRUCTIONS: "Uzyskaj dostęp do konta bez hasła.",
  ADD_PASSKEY: "Dodaj klucz dostępu",
  PASSKEY: "Klucz dostępu",

  // Sessions
  SESSIONS: "Sesje",
  SESSIONS_DESCRIPTION: "Zarządzaj aktywnymi sesjami i unieważniaj dostęp.",
  CURRENT_SESSION: "Bieżąca sesja",

  // Two-Factor
  TWO_FACTOR: "Weryfikacja dwuetapowa",
  TWO_FACTOR_CARD_DESCRIPTION: "Dodaj dodatkową warstwę ochrony do swojego konta.",
  ENABLE_TWO_FACTOR: "Włącz weryfikację dwuetapową",
  DISABLE_TWO_FACTOR: "Wyłącz weryfikację dwuetapową",
  TWO_FACTOR_ENABLE_INSTRUCTIONS: "Wpisz swoje hasło, aby włączyć weryfikację dwuetapową.",
  TWO_FACTOR_DISABLE_INSTRUCTIONS: "Wpisz swoje hasło, aby wyłączyć weryfikację dwuetapową.",
  TWO_FACTOR_ENABLED: "Weryfikacja dwuetapowa została włączona",
  TWO_FACTOR_DISABLED: "Weryfikacja dwuetapowa została wyłączona",
  TWO_FACTOR_TOTP_LABEL: "Zeskanuj kod QR w aplikacji uwierzytelniającej",
  TWO_FACTOR_ACTION: "Zweryfikuj kod",
  TWO_FACTOR_DESCRIPTION: "Wpisz jednorazowe hasło, aby kontynuować",
  TWO_FACTOR_PROMPT: "Weryfikacja dwuetapowa",

  // Backup codes
  BACKUP_CODES: "Kody zapasowe",
  BACKUP_CODES_DESCRIPTION: "Zapisz te kody w bezpiecznym miejscu. Możesz ich użyć, jeśli stracisz dostęp do aplikacji uwierzytelniającej.",
  COPY_ALL_CODES: "Skopiuj wszystkie kody",
  COPY_TO_CLIPBOARD: "Kopiuj do schowka",
  COPIED_TO_CLIPBOARD: "Skopiowano do schowka",
  BACKUP_CODE: "Kod zapasowy",
  BACKUP_CODE_PLACEHOLDER: "Kod zapasowy",
  BACKUP_CODE_REQUIRED: "Kod zapasowy jest wymagany",

  // Delete Account
  DELETE_ACCOUNT: "Usuń konto",
  DELETE_ACCOUNT_DESCRIPTION: "Trwale usuń swoje konto i całą powiązaną zawartość. Tej operacji nie można cofnąć.",
  DELETE_ACCOUNT_INSTRUCTIONS: "Potwierdź usunięcie konta. Tej operacji nie można cofnąć.",
  DELETE_ACCOUNT_SUCCESS: "Twoje konto zostało usunięte.",
  DELETE_ACCOUNT_VERIFY: "Sprawdź skrzynkę pocztową, aby potwierdzić usunięcie konta.",

  // Password
  CHANGE_PASSWORD: "Zmień hasło",
  CHANGE_PASSWORD_DESCRIPTION: "Wpisz aktualne hasło i ustaw nowe.",
  CHANGE_PASSWORD_INSTRUCTIONS: "Minimum 8 znaków.",
  CHANGE_PASSWORD_SUCCESS: "Hasło zostało zmienione.",
  CURRENT_PASSWORD: "Aktualne hasło",
  CURRENT_PASSWORD_PLACEHOLDER: "Aktualne hasło",
  NEW_PASSWORD: "Nowe hasło",
  NEW_PASSWORD_PLACEHOLDER: "Nowe hasło",
  NEW_PASSWORD_REQUIRED: "Nowe hasło jest wymagane",
  CONFIRM_PASSWORD: "Potwierdź hasło",
  CONFIRM_PASSWORD_PLACEHOLDER: "Potwierdź hasło",
  CONFIRM_PASSWORD_REQUIRED: "Potwierdzenie hasła jest wymagane",
  PASSWORD: "Hasło",
  PASSWORD_PLACEHOLDER: "Hasło",
  PASSWORD_REQUIRED: "Hasło jest wymagane",
  PASSWORDS_DO_NOT_MATCH: "Hasła nie są zgodne",
  SET_PASSWORD: "Ustaw hasło",
  SET_PASSWORD_DESCRIPTION: "Kliknij przycisk, aby otrzymać e-mail z instrukcją ustawienia hasła.",

  // Generic validation
  IS_REQUIRED: "jest wymagane",
  IS_INVALID: "jest nieprawidłowe",
  IS_THE_SAME: "jest takie samo",
  REQUEST_FAILED: "Żądanie nie powiodło się",

  // Error codes
  INVALID_EMAIL_OR_PASSWORD: "Nieprawidłowy e-mail lub hasło",
  INVALID_PASSWORD: "Nieprawidłowe hasło",
  INVALID_EMAIL: "Nieprawidłowy adres e-mail",
  INVALID_CODE: "Nieprawidłowy kod",
  INVALID_OTP: "Nieprawidłowy kod jednorazowy",
  INVALID_BACKUP_CODE: "Nieprawidłowy kod zapasowy",
  TOO_MANY_ATTEMPTS: "Zbyt wiele prób. Spróbuj ponownie później.",
  SESSION_EXPIRED: "Sesja wygasła. Zaloguj się ponownie.",
  USER_NOT_FOUND: "Nie znaleziono użytkownika",
  USER_ALREADY_EXISTS: "Użytkownik o tym adresie e-mail już istnieje",
  EMAIL_VERIFICATION_REQUIRED: "Wymagana weryfikacja adresu e-mail",
  SOCIAL_ACCOUNT_ALREADY_LINKED: "To konto zewnętrzne jest już połączone",
  FAILED_TO_UNLINK_LAST_ACCOUNT: "Nie można odłączyć ostatniego konta logowania",
  PASSKEY_NOT_FOUND: "Nie znaleziono klucza dostępu",
  TWO_FACTOR_NOT_ENABLED: "Weryfikacja dwuetapowa nie jest włączona",
  TOTP_NOT_ENABLED: "TOTP nie jest włączone",
};
