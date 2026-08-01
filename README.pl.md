# FrameFinder

**🇵🇱 Polski** | [🇬🇧 English version](README.md)

FrameFinder to frontendowa aplikacja internetowa do wyszukiwania konkretnych momentów w nagraniach wideo i audio. Została zbudowana w React i Vite i działa w całości w przeglądarce.

## Funkcje

- Otwieranie filmów z YouTube na podstawie linku
- Lokalne odtwarzanie plików audio i wideo
- Obsługa wgrywania plików metodą „przeciągnij i upuść” (drag and drop)
- Tryb demonstracyjny z przykładową transkrypcją
- Wyszukiwanie tekstowe w transkrypcji demo
- Wyświetlanie dopasowanych fragmentów wraz z interaktywnymi znacznikami czasu (timestampami)
- Natychmiastowe przechodzenie do wybranego momentu nagrania

## Ograniczenia wersji demonstracyjnej

Automatyczna transkrypcja przesłanych plików oraz semantyczne wyszukiwanie w filmach z YouTube nie są obecnie dostępne w wersji klienckiej. Te funkcje wymagają usługi backendowej — bezpośrednie wywoływanie zewnętrznych API transkrypcyjnych z przeglądarki ujawniłoby klucze API użytkownikom aplikacji.

Pełny przepływ wyszukiwania można przetestować, wybierając **Demo** na ekranie startowym. Dodane pliki lokalne pozostają w przeglądarce i nie są wysyłane na żaden zewnętrzny serwer.

## Wymagania

- Node.js 18 lub nowszy
- npm

Node.js jest potrzebny tylko do uruchomienia środowiska deweloperskiego i zbudowania aplikacji. Gotowa wersja produkcyjna składa się wyłącznie ze statycznych plików.

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

Polecenie `npm run build` zapisuje zoptymalizowane pliki produkcyjne w katalogu `dist`. Można je wdrożyć na dowolnym hostingu plików statycznych (np. GitHub Pages, Vercel, Netlify).

## Aplikacja desktopowa (Electron)

```bash
# Tryb deweloperski
npm run desktop:dev

# Lokalny build produkcyjny
npm run desktop:start

# Instalator i wersja przenośna dla Windows
npm run desktop:pack:win
```

Gotowe pliki są zapisywane w katalogu `release`.

## Technologie

- React
- Vite
- Lucide React
- Vanilla CSS

## Licencja

Projekt jest udostępniany na licencji [MIT](LICENSE).
