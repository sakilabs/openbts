import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "@/lib/api";

function TosPage() {
  return (
    <main className="flex-1 overflow-y-auto p-4">
      <div className="max-w-4xl space-y-8">
        <section className="space-y-2">
          <h1 className="text-2xl font-bold">Regulamin</h1>
          <p className="text-sm text-muted-foreground">Korzystając z serwisu {APP_NAME}, akceptujesz poniższe warunki.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">1. Przeznaczenie serwisu</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Serwis {APP_NAME} udostępniany jest w celach informacyjnych i edukacyjnych. Użytkownicy mogą przeglądać dane o stacjach bazowych,
            korzystać z mapy oraz publicznego API w celach niekomercyjnych. Zabronione jest automatyczne zbieranie danych (scraping) lub nadmierne
            obciążanie API w sposób pogarszający jakość usługi.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">2. Dokładność danych</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Dane udostępniane przez {APP_NAME} są gromadzone przez wolontariuszy oraz z publicznie dostępnych źródeł (np. z Urzędu Komunikacji
            Elektronicznej lub{" "}
            <a href="https://si2pem.gov.pl" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-80">
              SI2PEM
            </a>
            ). Nie gwarantujemy kompletności, dokładności ani aktualności danych. Serwis {APP_NAME} nie jest w żaden sposób powiązany z operatorami
            sieci komórkowych.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">3. Konta użytkowników</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Niektóre funkcje wymagają rejestracji. Użytkownik jest odpowiedzialny za bezpieczeństwo danych logowania do swojego konta. Zastrzegamy
            sobie prawo do zawieszenia kont naruszających niniejszy regulamin.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">4. Treści użytkowników</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Przesyłając dane o stacjach, zdjęcia lub inne treści, użytkownik udziela serwisowi {APP_NAME} niewyłącznej, nieodpłatnej licencji na
            wykorzystanie, wyświetlanie i dystrybucję tych danych w ramach serwisu.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">5. Prywatność</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Zbieramy wyłącznie dane niezbędne do działania serwisu. Dane konta nie są udostępniane podmiotom trzecim. Korzystamy z plików cookies
            wyłącznie w celu utrzymania sesji użytkownika i preferencji.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">6. API</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Publiczne API jest dostępne do użytku w ramach rozsądnych limitów. Zastrzegamy sobie prawo do ograniczenia dostępu w przypadku nadużyć.
            Integracje komercyjne wymagają wcześniejszego uzgodnienia.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>
              Każdy użytkownik może posiadać maksymalnie <strong>jeden klucz API</strong>. Klucze API podlegają oddzielnym limitom zapytań (rate
              limit) niż standardowe konto użytkownika.
            </li>
            <li>
              Nowy klucz API można wygenerować nie częściej niż <strong>raz na 7 dni</strong>.
            </li>
            <li>W przypadku potrzeby wyższych limitów zapytań, prosimy o kontakt z administracją serwisu.</li>
            <li>
              Klucz API <strong>nie powinien być ujawniany publicznie</strong> (np. w kodzie frontendowym lub repozytoriach). Należy ukryć go za
              własnym backendem/proxy - każdy, kto posiada klucz, może z niego korzystać.
            </li>
            <li>
              Korzystając z klucza API w aplikacji zewnętrznej, należy przesyłać nazwę aplikacji (oraz najlepiej dane kontaktowe) w nagłówku{" "}
              <code className="rounded bg-muted px-1 py-0.5">User-Agent</code>, np.:{" "}
              <code className="rounded bg-muted px-1 py-0.5">openbts/1.0.0 (dev@ririxi.dev)</code>
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">7. Ograniczenie odpowiedzialności</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {APP_NAME} udostępniany jest w stanie &quot;takim, jaki jest&quot;, bez jakichkolwiek gwarancji. Nie ponosimy odpowiedzialności za decyzje
            podjęte na podstawie danych z serwisu.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">8. Zmiany regulaminu</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Zastrzegamy sobie prawo do zmiany niniejszego regulaminu. O istotnych zmianach użytkownicy zostaną poinformowani za pośrednictwem serwisu.
            Dalsze korzystanie z serwisu po wprowadzeniu zmian oznacza ich akceptację.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">9. Licencja</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Kod źródłowy {APP_NAME} jest udostępniony na licencji{" "}
            <a
              href="https://github.com/sakilabs/openbts/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:opacity-80"
            >
              GPL-3.0
            </a>
            .
          </p>
        </section>
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
