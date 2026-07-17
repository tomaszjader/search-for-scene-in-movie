# FrameFinder

FrameFinder to frontendowa aplikacja do wyszukiwania konkretnych momentów w nagraniach. Została zbudowana w React i Vite i działa w całości w przeglądarce.

## Funkcje

- otwieranie filmów z YouTube na podstawie linku,
- lokalne odtwarzanie plików audio i wideo,
- przeciąganie plików metodą „przeciągnij i upuść”,
- materiał demonstracyjny z przykładową transkrypcją,
- wyszukiwanie tekstowe w transkrypcji demo,
- wyświetlanie dopasowanych fragmentów z timestampami,
- przechodzenie do wybranego momentu nagrania.

## Ograniczenia wersji demonstracyjnej

Automatyczna transkrypcja przesłanych plików oraz semantyczne wyszukiwanie w filmach z YouTube nie są obecnie dostępne. Te funkcje wymagają usługi backendowej — bezpośrednie wywoływanie zewnętrznego API z przeglądarki ujawniłoby klucz API użytkownikom aplikacji.

Pełny przepływ wyszukiwania można przetestować, wybierając **Demo** na ekranie startowym. Dodane pliki pozostają lokalnie w przeglądarce i nie są wysyłane na serwer.

## Wymagania

- Node.js 18 lub nowszy,
- npm.

Node.js jest potrzebny tylko do uruchomienia środowiska deweloperskiego i zbudowania aplikacji. Gotowa wersja produkcyjna składa się ze statycznych plików.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Po uruchomieniu otwórz adres wyświetlony przez Vite (domyślnie `http://localhost:5173`).

## Wersja produkcyjna

```bash
npm run build
npm run preview
```

Polecenie `npm run build` zapisuje gotowe pliki w katalogu `dist`. Można je wdrożyć na dowolnym hostingu plików statycznych.

## Technologie

- React,
- Vite,
- Lucide React,
- CSS.
