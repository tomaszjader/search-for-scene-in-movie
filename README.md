# FrameFinder

FrameFinder to aplikacja webowa do wyszukiwania konkretnych momentów w nagraniach. Dodaj film z YouTube albo plik z dysku, zadaj pytanie własnymi słowami i przejdź bezpośrednio do pasującego fragmentu.

## Obecne funkcje

- import filmów z YouTube przez linki `watch`, `youtu.be`, `shorts`, `embed` i `live`,
- pobieranie dostępnych napisów z YouTube,
- automatyczna transkrypcja ścieżki audio, gdy film na YouTube nie ma dostępnych napisów,
- dodawanie lokalnych plików audio i wideo metodą „przeciągnij i upuść” lub przez okno wyboru,
- obsługa formatów FLAC, M4A, MP3, MP4, MPEG, MPGA, OGA, OGG, WAV i WEBM,
- transkrypcja nagrań z dokładnymi znacznikami czasu przy użyciu OpenAI Whisper,
- semantyczne wyszukiwanie scen, wypowiedzi, tematów i emocji w języku naturalnym,
- prezentowanie do 6 najlepiej dopasowanych fragmentów wraz z cytatem i zakresem czasu,
- odtwarzanie lokalnego nagrania lub filmu z YouTube od właściwego momentu,
- proste wyszukiwanie tekstowe jako mechanizm awaryjny po nieudanym wyszukiwaniu AI,
- wbudowany materiał demonstracyjny, który pozwala sprawdzić interfejs bez dodawania pliku.

## Wymagania

- Node.js 18 lub nowszy,
- klucz API OpenAI,
- dostęp do internetu dla importu filmów z YouTube i funkcji OpenAI.

FFmpeg jest dostarczany przez pakiet `ffmpeg-static`, więc nie trzeba instalować go osobno.

## Uruchomienie lokalne

1. Zainstaluj zależności:

   ```bash
   npm install
   ```

2. Skopiuj konfigurację środowiska:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Uzupełnij `.env`:

   ```env
   OPENAI_API_KEY=sk-...
   PORT=8787
   YOUTUBE_MAX_DURATION_SECONDS=14400
   ```

4. Uruchom frontend i API:

   ```bash
   npm run dev
   ```

Frontend będzie dostępny pod adresem wyświetlonym przez Vite (zwykle `http://localhost:5173`), a API pod `http://localhost:8787`.

## Budowanie i uruchomienie produkcyjne

```bash
npm run build
npm start
```

Serwer Express udostępnia wtedy API oraz gotową aplikację z katalogu `dist` na porcie ustawionym w `PORT`.

## Jak korzystać

1. Wklej link do filmu z YouTube albo wybierz plik z dysku.
2. W przypadku pliku lokalnego kliknij **Utwórz transkrypcję**.
3. Opisz szukany moment, np. „Gdzie rozmówca mówi o zmianie produktu?”.
4. Kliknij wynik, aby odtworzyć wskazany fragment.

## Konfiguracja

| Zmienna | Wymagana | Domyślna wartość | Opis |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | Tak* | — | Transkrypcja oraz wyszukiwanie semantyczne. |
| `PORT` | Nie | `8787` | Port serwera Express. |
| `YOUTUBE_MAX_DURATION_SECONDS` | Nie | `14400` | Maksymalna długość filmu YouTube transkrybowanego z audio (4 godziny). |

\* Materiał demonstracyjny działa bez klucza. Filmy YouTube z dostępnymi napisami można zaimportować bez transkrypcji OpenAI, ale wyszukiwanie semantyczne nadal wymaga klucza.

## Limity i prywatność

- Maksymalny rozmiar lokalnego pliku wynosi 200 MB.
- Przesłane pliki są zapisywane tymczasowo w katalogu `uploads` i usuwane po zakończeniu transkrypcji.
- Tymczasowe pliki audio pobrane z YouTube są usuwane po zakończeniu analizy.
- Transkrypcje i zapytania są wysyłane do API OpenAI.
- Import z YouTube zależy od dostępności filmu, napisów i możliwości pobrania jego ścieżki audio.

## Technologie

React, Vite, Express, OpenAI API, Multer, youtube-transcript-plus, youtube-dl-exec oraz FFmpeg.

## Endpointy API

- `POST /api/youtube` — import filmu i pobranie napisów lub transkrypcja audio,
- `POST /api/transcribe` — transkrypcja przesłanego pliku,
- `POST /api/search` — semantyczne dopasowanie pytania do segmentów transkrypcji.
