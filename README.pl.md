# FrameFinder

**Polski** | [English](README.md)

FrameFinder to aplikacja desktopowa Electron do tworzenia pełnych transkrypcji filmów i wyszukiwania konkretnych wypowiedzi oraz momentów nagrania.

## Funkcje

- pobieranie ścieżki audio z filmu YouTube w wersji Electron,
- pełna transkrypcja przez OpenAI Whisper albo Groq Whisper,
- transkrypcja lokalna Whisper bez klucza API i bez wysyłania audio,
- automatyczny podział długich nagrań na części,
- obsługa lokalnych plików MP4, WEBM, MP3 i WAV,
- import i eksport napisów SRT,
- wyszukiwanie tekstowe i semantyczne,
- interaktywne timestampy prowadzące do fragmentu filmu.

Używaj wyłącznie nagrań, do których masz odpowiednie prawa lub zgodę na przetwarzanie.

## Wymagania do samodzielnego zbudowania

- Windows 10 lub Windows 11,
- Node.js 18 lub nowszy,
- npm,
- połączenie z internetem podczas pierwszego `npm install`.

`ffmpeg` i `yt-dlp` są pobierane jako zależności projektu i dołączane do gotowej aplikacji. Użytkownik zbudowanego programu nie musi instalować ich osobno.

## Budowanie aplikacji krok po kroku

Otwórz PowerShell w katalogu projektu i wykonaj:

```powershell
npm install
npm run desktop:pack:win
```

Gotowe pliki pojawią się w katalogu `release`:

- `FrameFinder Setup 1.0.0.exe` — instalator Windows,
- `FrameFinder 1.0.0.exe` — wersja przenośna,
- `win-unpacked/FrameFinder.exe` — rozpakowana wersja testowa.

## Uruchomienie podczas tworzenia programu

```powershell
npm install
npm run desktop:dev
```

Tryb ten uruchamia Vite i okno Electron z automatycznym odświeżaniem zmian.

## Test wersji produkcyjnej bez instalatora

```powershell
npm run desktop:start
```

## Klucz API

Po uruchomieniu aplikacji otwórz ustawienia i dodaj własny klucz OpenAI albo Groq. Klucz jest zapisywany lokalnie na urządzeniu użytkownika. Transkrypcja powoduje naliczenie opłat lub wykorzystanie limitu zgodnie z zasadami wybranego dostawcy.

Możesz również wybrać opcję **Lokalnie — Whisper Small**. Przy pierwszej transkrypcji aplikacja pobierze model do pamięci urządzenia. Kolejne transkrypcje mogą działać bez klucza API; szybkość zależy od procesora komputera.

## Technologie

- Electron
- React
- Vite
- `yt-dlp`
- `ffmpeg`
- OpenAI Whisper / Groq Whisper

## Licencja

Projekt jest udostępniany na licencji [MIT](LICENSE).
