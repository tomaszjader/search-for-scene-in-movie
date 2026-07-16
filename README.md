# FrameFinder

FrameFinder jest statyczną aplikacją frontendową zbudowaną w React i Vite. Nie wymaga Node.js ani osobnego API po wdrożeniu i może być hostowana na dowolnym hostingu plików statycznych.

## Funkcje

- osadzanie filmu z YouTube na podstawie linku,
- lokalne odtwarzanie plików audio i wideo bez wysyłania ich na serwer,
- materiał demonstracyjny z przykładową transkrypcją,
- lokalne wyszukiwanie tekstowe w transkrypcji demo,
- przechodzenie do znalezionych fragmentów.

Automatyczna transkrypcja i wyszukiwanie przez OpenAI nie są dostępne w wariancie wyłącznie frontendowym. Wywołanie OpenAI bezpośrednio z przeglądarki ujawniłoby klucz API użytkownikom aplikacji.

## Uruchomienie

```bash
npm install
npm run dev
```

## Budowanie

```bash
npm run build
npm run preview
```

Gotowe pliki statyczne są zapisywane w katalogu `dist`.

## Technologie

React, Vite i Lucide React.
