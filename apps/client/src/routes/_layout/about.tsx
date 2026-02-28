import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "@/lib/api";
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/reui/timeline";

const historyEvents = [
  {
    date: "Marzec 2000",
    title: "Początki",
    content:
      "Pierwotna koncepcja stworzenia internetowej bazy danych o BTS-ach, początkowo głównie z regionu zachodniego (Zielona Góra i woj. lubuskie). W bardzo krótkim czasie z pomocą ochotników z różnych zakątków kraju koncepcja ewoluuje do statusu ogólnopolskiej wyszukiwarki - btsearch.org.",
  },
  {
    date: "Lipiec 2005",
    title: "Rozbudowa zespołu",
    content:
      "Do trzonu zespołu BTSearch dołącza Krzysztof Niemczyk, który zostaje odpowiedzialny za bieżące uzupełnianie bazy, a w chwili obecnej piastuje pieczę głównego administratora bazy danych i serwisu BTSearch.",
  },
  {
    date: "2006",
    title: "Start Galerii BTS",
    content: "Uruchomienie Galerii BTS umożliwiającej nadsyłanie zdjęć stacji bazowych w Polsce i nie tylko.",
  },
  {
    date: "Marzec 2006",
    title: "Nowy hosting",
    content: "Przeniesienie serwisu na nowe konto hostingowe dzięki uprzejmości portalu telekomunikacyjnego TELEPOLIS.PL.",
  },
  {
    date: "Styczeń 2007",
    title: "Rejestracja domeny",
    content: "Rejestracja domeny btsearch.pl.",
  },
  {
    date: "Wrzesień 2007",
    title: "Mapa pozwoleń UKE",
    content:
      "Pod adresem mapa.btsearch.pl startuje mapa pozwoleń radiowych wydanych przez Urząd Komunikacji Elektronicznej, która zyskuje sporą popularność wśród entuzjastów sieci komórkowych w Polsce.",
  },
  {
    date: "Listopad 2009",
    title: "Połączenie danych UKE i BTS",
    content:
      "Po długiej i mozolnej pracy polegającej na ręcznym skorelowaniu pozwoleń UKE z danymi z bazy BTSearch, mapa lokalizacji UKE wzbogaca się o funkcję wyświetlania lokalizacji stacji bazowych BTS zgromadzonych w bazie danych BTSearch.",
  },
  {
    date: "Listopad 2013",
    title: "BTSearch v2",
    content:
      'Uruchomienie serwisu BTSearch "v2" łączącego mapę lokalizacji BTS / UKE oraz bazę danych z wyszukiwarką stacji bazowych pod jednym dachem. Pierwsza gruntowna modernizacja serwisu od ponad 13 lat.',
  },
];

function AboutPage() {
  return (
    <main className="flex-1 overflow-y-auto p-4">
      <div className="max-w-4xl space-y-10">
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">O serwisie</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Serwis {APP_NAME} dedykowany jest w głównej mierze osobom pasjonującym się technologiami powiązanymi z sieciami komórkowymi, a w
            szczególności z warstwą radiową tychże sieci. Serwis, a zwłaszcza mapa lokalizacji, może stanowić także pożyteczne kompendium wiedzy dla
            wszystkich osób zainteresowanych lokalizacjami nadajników BTS w Polsce i potencjalną dostępnością usług w ich okolicach.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Pierwotnym założeniem serwisu było stworzenie uniwersalnej bazy danych oraz wyszukiwarki stacji bazowych sieci komórkowych w Polsce.
            Niemal wszystkie dane w bazie zostały zgromadzone wysiłkiem pasjonatów GSM-u z różnych zakątków Polski, którzy wyposażeni w odpowiedni
            sprzęt mozolnie gromadzą i dostarczają informacje o nadajnikach BTS w ich okolicach.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Historia</h2>
          <Timeline defaultValue={historyEvents.length}>
            {historyEvents.map((event, index) => (
              <TimelineItem key={event.date} step={index + 1}>
                <TimelineHeader>
                  <TimelineDate>{event.date}</TimelineDate>
                  <TimelineTitle>{event.title}</TimelineTitle>
                </TimelineHeader>
                <TimelineIndicator />
                <TimelineSeparator />
                <TimelineContent>{event.content}</TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Autorzy</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-1">
              <h3 className="font-medium text-sm">Krzysztof Niemczyk</h3>
              <p className="text-sm text-muted-foreground">
                Odpowiedzialny za utrzymywanie serwisu oraz bazy danych w należytym porządku, zagadnienia merytoryczne oraz ew. współpracę z
                podmiotami zewnętrznymi.
              </p>
            </div>
            <div className="rounded-lg border p-4 space-y-1">
              <h3 className="font-medium text-sm">Dawid Lorenz</h3>
              <p className="text-sm text-muted-foreground">
                Pomysłodawca i ojciec założyciel BTSearch. Aktualnie nie pracuje na bieżąco nad serwisem, aczkolwiek BTSearch &quot;v2&quot; to jego
                dzieło. ;)
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Wśród osób, które wspierały rozwój BTSearch w przeszłości znajdują się <strong>Dominik Boryś</strong> oraz <strong>Tomasz Wasiak</strong>.
            Autorem logotypu jest <strong>Sławomir Salicki</strong>. Nieocenioną pomocą przy wdrażaniu &quot;v2&quot; służył{" "}
            <strong>Marek Matulka</strong>. <strong>Dziękujemy!</strong>
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Podziękowania</h2>
          <p className="text-sm text-muted-foreground">
            Przede wszystkim serdecznie dziękujemy wszystkim &quot;łowcom BTS-ów&quot;, którzy bezinteresownie przysyłali dane o stacjach bazowych i
            bez których baza danych BTSearch byłaby po prostu pusta.
          </p>
          <p className="text-sm text-muted-foreground">
            Dziękujemy serwisowi telekomunikacyjnemu{" "}
            <a href="https://telepolis.pl" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-80">
              TELEPOLIS.PL
            </a>{" "}
            za udostępnienie hostingu.
          </p>
        </section>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/_layout/about")({
  component: AboutPage,
  staticData: {
    title: "O serwisie",
  },
});
