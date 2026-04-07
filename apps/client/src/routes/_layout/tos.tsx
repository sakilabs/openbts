import { createFileRoute } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { APP_NAME } from "@/lib/api";

const markdownClasses =
  "space-y-4 text-sm text-muted-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:pt-4 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_ul]:space-y-2 [&_p]:leading-relaxed [&_a]:text-primary [&_a]:underline [&_a:hover]:opacity-80 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_strong]:text-foreground";

const REMARK_PLUGINS = [remarkGfm];

const content = `Korzystając z serwisu ${APP_NAME}, akceptujesz poniższe warunki.

## 1. Przeznaczenie serwisu

Serwis ${APP_NAME} udostępniany jest w celach informacyjnych i edukacyjnych. Użytkownicy mogą przeglądać dane o stacjach bazowych, korzystać z mapy oraz publicznego API w celach niekomercyjnych. Zabronione jest automatyczne zbieranie danych (scraping) lub nadmierne obciążanie API w sposób pogarszający jakość usługi.

## 2. Dokładność danych

Dane udostępniane przez ${APP_NAME} są gromadzone przez wolontariuszy oraz z publicznie dostępnych źródeł (np. z Urzędu Komunikacji Elektronicznej lub [SI2PEM](https://si2pem.gov.pl)). Nie gwarantujemy kompletności, dokładności ani aktualności danych. Serwis ${APP_NAME} nie jest w żaden sposób powiązany z operatorami sieci komórkowych.

## 3. Konta użytkowników

Niektóre funkcje wymagają rejestracji. Użytkownik jest odpowiedzialny za bezpieczeństwo danych logowania do swojego konta. Zastrzegamy sobie prawo do zawieszenia kont naruszających niniejszy regulamin.

Korzystanie z serwisu ${APP_NAME} jest dozwolone wyłącznie dla osób, które ukończyły **18 lat**. Osoby niepełnoletnie nie są uprawnione do korzystania z serwisu, zakładania kont ani przesyłania jakichkolwiek treści.

Użytkownik może w dowolnym momencie usunąć swoje konto poprzez ustawienia konta. Usunięcie konta skutkuje trwałym usunięciem wszystkich powiązanych danych osobowych z serwisu.

## 4. Treści użytkowników

Przesyłając dane o stacjach, zdjęcia lub inne treści, użytkownik udziela serwisowi ${APP_NAME} niewyłącznej, nieodpłatnej licencji na wykorzystanie, wyświetlanie i dystrybucję tych danych w ramach serwisu.

Jeżeli przesyłane zdjęcie nie jest własnym tworem użytkownika i pochodzi z zewnętrznego źródła, użytkownik jest zobowiązany do:

- samodzielnego zweryfikowania, czy dane zdjęcie może być legalnie dystrybuowane (np. czy jest objęte odpowiednią licencją Creative Commons lub inną licencją zezwalającą na redystrybucję),
- podania źródła zdjęcia przy jego przesyłaniu (np. URL strony, nazwa autora lub nazwa licencji).

Serwis ${APP_NAME} nie ponosi odpowiedzialności za naruszenia praw autorskich wynikające z przesłania przez użytkownika treści, do których dystrybucji nie posiadał on uprawnień. Zastrzegamy sobie prawo do usunięcia treści naruszających prawa autorskie osób trzecich.

## 5. Prywatność i RODO

Zbieramy wyłącznie dane niezbędne do działania serwisu. Dane konta nie są udostępniane podmiotom trzecim. Korzystamy z plików cookies wyłącznie w celu utrzymania sesji użytkownika. Preferencje użytkownika przechowywane są lokalnie w przeglądarce (localStorage).

Administratorem danych osobowych jest **[PLACEHOLDER: nazwa/imię i nazwisko operatora serwisu]**. Użytkownikowi przysługuje prawo do:

- wglądu w swoje dane osobowe,
- ich korekty lub uzupełnienia,
- usunięcia danych (patrz: sekcja 3 - usuwanie konta),
- wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (UODO).

## 6. Zakaz działań szkodliwych

Zabrania się podejmowania działań mogących zakłócić lub uszkodzić działanie serwisu, w szczególności:

- prób nieautoryzowanego dostępu do systemów lub danych innych użytkowników,
- ataków typu DoS/DDoS lub innych działań przeciążających infrastrukturę serwisu,
- obchodzenia zabezpieczeń, mechanizmów uwierzytelniania lub limitów dostępu,
- przesyłania złośliwego oprogramowania lub treści mogących zaszkodzić innym użytkownikom.

Naruszenie powyższych zasad skutkuje natychmiastowym zablokowaniem konta oraz może wiązać się z odpowiedzialnością prawną.

## 7. API

Publiczne API jest dostępne do użytku w ramach rozsądnych limitów. Zastrzegamy sobie prawo do ograniczenia dostępu w przypadku nadużyć. Integracje komercyjne wymagają wcześniejszego uzgodnienia.

- Każdy użytkownik może posiadać maksymalnie **jeden klucz API**. Klucze API podlegają oddzielnym limitom zapytań (rate limit) niż standardowe konto użytkownika.
- Nowy klucz API można wygenerować nie częściej niż **raz na 7 dni**.
- W przypadku potrzeby wyższych limitów zapytań, prosimy o kontakt z administracją serwisu.
- Klucz API **nie powinien być ujawniany publicznie** (np. w kodzie frontendowym lub repozytoriach). Należy ukryć go za własnym backendem/proxy - każdy, kto posiada klucz, może z niego korzystać.
- Korzystając z klucza API w aplikacji zewnętrznej, należy przesyłać nazwę aplikacji (oraz najlepiej dane kontaktowe) w nagłówku \`User-Agent\`, np.: \`openbts/1.0.0 (dev@ririxi.dev)\`

## 8. Ograniczenie odpowiedzialności

${APP_NAME} udostępniany jest w stanie "takim, jaki jest", bez jakichkolwiek gwarancji. Nie ponosimy odpowiedzialności za decyzje podjęte na podstawie danych z serwisu.

## 9. Zmiany regulaminu

Zastrzegamy sobie prawo do zmiany niniejszego regulaminu. O istotnych zmianach użytkownicy zostaną poinformowani za pośrednictwem serwisu. Dalsze korzystanie z serwisu po wprowadzeniu zmian oznacza ich akceptację.

## 10. Prawo właściwe

Niniejszy regulamin podlega prawu polskiemu. Wszelkie spory wynikające z korzystania z serwisu będą rozstrzygane przez sąd właściwy dla siedziby operatora serwisu.

## 11. Kontakt

W sprawach dotyczących serwisu, regulaminu lub danych osobowych można kontaktować się z administracją pod adresem: **[PLACEHOLDER: adres e-mail]**

## 12. Licencja

Kod źródłowy ${APP_NAME} jest udostępniony na licencji [GPL-3.0](https://github.com/sakilabs/openbts/blob/main/LICENSE).`;

function TosPage() {
  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar p-4">
      <div className="max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold">Regulamin</h1>
        <article className={markdownClasses}>
          <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>{content}</ReactMarkdown>
        </article>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/_layout/tos")({
  component: TosPage,
  staticData: {
    title: "Regulamin",
  },
});
