import { createFileRoute } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownClasses =
  "space-y-4 text-sm text-muted-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:pt-4 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_ul]:space-y-2 [&_p]:leading-relaxed [&_a]:text-primary [&_a]:underline [&_a:hover]:opacity-80 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_strong]:text-foreground";

const REMARK_PLUGINS = [remarkGfm];

const content = `Witamy w trzeciej generacji serwisu BTSearch. Serwis został zaprojektowany i napisany od zera, dzięki zaangażowaniu społeczności open source, a w szczególności użytkowniczki @ririxi. Tym samym objęła ona funkcję opiekuna technicznego serwisu BTSearch.

Poniżej lista najważniejszych zmian i nowości w serwisie BTSearch v3. Lista jest aktualna na dzień premiery, tj. 4 kwietnia 2026 roku. Kolejne nowości, zmiany i usprawnienia publikowane będą w ["Historii zmian"](https://btsearch.pl/changelog) (changelog).

## Widok główny serwisu

- Nowy silnik ładowania danych i wyświetlania lokalizacji na mapie, dzięki któremu wyświetlanie nawet 1000 lokalizacji jednocześnie nie stanowi problemu.
- Usprawniona funkcja filtrowania i wyszukiwania danych na mapie oraz w bazie, pozwalająca wyszukiwać dane geograficzne, a także konkretne dane o stacjach oraz pozwoleniach UKE (np. numer stacji, numer pozwolenia, numer decyzji, konkretne parametry CID/LAC/pasmo itp.).
- Filtrowanie wyświetlania nowości w bazie danych z opcją zawężania zakresu dat 1-30 dni.
- 6 stylów map do wyboru, w tym m.in. OpenStreetMap czy Google Satellite.
- Nowa warstwa wyświetlania radiolinii na podstawie danych UKE, wraz z wyszukiwarką ich operatorów. Po kliknięciu w przebieg radiolinii widoczny panel ze szczegółowymi informacjami.
- Opcja wyświetlania azymutów poszczególnych sektorów stacji bazowych na podstawie danych UKE (funkcja działa po wybraniu UKE jako źródła danych).
- Warstwa "Heatmap", która wizualizuje poziom zagęszczenia lokalizacji w danym obszarze.
- Możliwość dodawania i wyświetlania fotografii oraz komentarzy do lokalizacji stacji bazowych.
- Nowy widok szczegółowych statystyk o zgromadzonych danych BTSearch oraz UKE.
- Nowe narzędzie analizatora logów, pozwalający wgrywać i analizować dane z logów wygenerowanych przez aplikacje NetMonster i / lub NetMonitor (parizene).
- Znacząco usprawniona funkcja eksportu danych do formatu CLF/NTM (eksport całej bazy nawet w ciągu kilku sekund).

## Ogólne usprawnienia interfejsu użytkownika

- Obszerny panel preferencji, pozwalający dostosować interfejs do indywidualnych potrzeb użytkownika. Ustawione preferencje są zapamiętywane per przeglądarka / urządzenie.
- Opcja wyboru motywu jasnego, ciemnego lub zgodnego z ustawieniami narzuconymi przez system operacyjny urządzenia (domyślnie: motyw jasny).
- Opcja wyboru języka interfejsu: polski lub angielski.
- Funkcja szybkiego przełączania źródła danych (BTSearch / UKE) poprzez kliknięcie w panel pokazujący aktualną liczbę wyświetlanych lokalizacji.
- Opcja wyświetlania skróconych danych o lokalizacji na mapie po najechaniu kursorem na lokalizację.
- Rozbudowany panel szczegółów stacji bazowej, zawierający m.in. funkcje szybkiego kopiowania do schowka wybranych danych (np. współrzędne GPS, numer stacji itp.), udostępniania poprzez systemowe mechanizmy udostępniania danych (np. "Wyślij do...") czy wyszukiwania informacji o danej stacji zgłoszonych w serwisie rządowym SI2PEM.
- Opcja włączenia powiadomień "push" o aktualizacji danych UKE lub działaniach związanych ze zgłoszeniem zmian w bazie (np. powiadomienie o akceptacji / odrzuceniu zgłoszenia).
- Wyświetlanie bieżącej pozycji GPS użytkownika serwisu w postaci pulsującej kropki.

## Sprytne skróty klawiszowe

- Kliknij prawym przyciskiem myszki na dowolnej lokalizacji (lub w dowolnym punkcie mapy, jeśli ta opcja została włączona w preferencjach), aby zmierzyć odległość z punktu A do B.
- W trakcie pomiaru klawiszem "C" włącz / wyłącz okrąg pomiaru promienia.
- Zachowaj bieżący pomiar klawiszem "Spacja".
- Zakończ pomiar i wyczyść wcześniej zachowane pomiary klawiszem "Esc".
- Za pomocą klawisza "F" otwórz / zamknij panel filtrowania danych na mapie.

## Rejestracja użytkowników i edycja danych w bazie BTSearch

- Możliwość rejestracji konta użytkownika, które umożliwia m.in. zgłoszenia nowości lub zmian danych o stacjach bazowych.
- Opcja wygodnego logowania poprzez zewnętrzne konto Google lub GitHub.
- Możliwość logowania poprzez passkey i włączenia autoryzacji dwuetapowej (2FA).
- Rozbudowany panel edycji danych, umożliwiający m.in. tworzenie nowych lokalizacji i stacji bazowych, "przypinanie" stacji do pozwoleń UKE, definiowanie technologii / pasm radiowych, pojedynczych komórek, czy dodawanie zdjęć.
- Zgłoszenia zmian w bazie przez użytkowników są przekazywane do akceptacji przez moderatorów.
- Możliwość tworzenia max 10 indywidualnych list stacji bazowych / radiolinii / pozwoleń UKE przez użytkowników. Listy mogą być prywatne lub udostępniane publicznie.
- Funkcja otrzymywania powiadomień "push" o statusie zgłoszenia zmiany (akceptacja / odrzucenie).

## Aplikacja mobilna PWA

- Interfejs BTSearch v3 jest responsywny i działa sprawnie w mobilnych przeglądarkach współczesnych smartfonów. Serwis może działać także jako niezależna aplikacja typu PWA (Progressive Web App).
- Aby zainstalować BTSearch v3 jako aplikację typu PWA, otwórz stronę [btsearch.pl](http://btsearch.pl) w przeglądarce telefonu. Następnie znajdź w opcjach przeglądarki funkcję "Dodaj do ekranu głównego" (lub podobnie). Wówczas serwis zostanie dodany do pamięci smartfonu jako niezależna aplikacja.
- Aplikacja PWA jest uruchamiana z osobnej ikonki z ekranu głównego lub zasobnika aplikacji, tak jak każda inna aplikacja zainstalowana np. poprzez Google Play lub Apple Appstore.
- Aplikacja PWA może wyświetlać powiadomienia systemowe, np. o aktualizacjach danych z wykazu UKE czy o statusie zgłoszonych zmian w bazie.

## Interfejs API

- Publiczny interfejs API dla programistów, który pozwala na dostęp do danych BTSearch przez aplikacje zewnętrzne.
- Opcja samodzielnego tworzenia klucza API w ustawieniach konta użytkownika.
- Rate-limit API wynoszący 60 zapytań (requestów) na minutę.

## Inne

- Mechanizm importujący nowe dane UKE w momencie ich opublikowania.
- [Historia zmian](https://btsearch.pl/changelog) (changelog) dokumentująca szczegółową listę zmian wdrożonych w serwisie.
- Nowa lokalizacja otwartego repozytorium z kodem źródłowym aplikacji: [https://github.com/btsearch/btsearch](https://github.com/btsearch/btsearch)

Masz pomysł na nową funkcję lub usprawnienie BTSearch? Zauważyłeś/-aś błąd w aplikacji? Zgłoś go tutaj: [https://github.com/btsearch/btsearch/issues](https://github.com/btsearch/btsearch/issues) lub wyślij maila [do zespołu](https://btsearch.pl/contact).

Alternatywnie zachęcamy do wspólnego rozwoju aplikacji, której kod źródłowy jest otwarty i dostępny w repozytorium GitHub: [https://github.com/btsearch/btsearch](https://github.com/btsearch/btsearch)

[Zespół BTSearch](https://btsearch.pl/contact)`;

function ReleaseNotesPage() {
  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar p-4">
      <div className="max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold">BTSearch v3 - co nowego?</h1>
        <article className={markdownClasses}>
          <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>{content}</ReactMarkdown>
        </article>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/_layout/release-v3")({
  component: ReleaseNotesPage,
  staticData: {
    title: "Release notes v3",
  },
});
