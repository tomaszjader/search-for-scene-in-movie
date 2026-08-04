# FrameFinder

[Polski](README.pl.md) | [English](README.md) | **Deutsch**

FrameFinder ist eine Electron-Desktop-Anwendung zum Erstellen vollständiger Videotranskripte und zum Auffinden bestimmter Aussagen und Momente.

## Funktionen

- Verarbeitung von YouTube-Audio in der Electron-Version,
- vollständige Transkription mit OpenAI Whisper oder Groq Whisper,
- lokale Whisper-Transkription ohne API-Schlüssel und ohne Audio-Upload,
- automatische Aufteilung langer Aufnahmen,
- Unterstützung für lokale MP4-, WEBM-, MP3- und WAV-Dateien,
- Import und Export von SRT-Untertiteln,
- Text- und semantische Suche,
- interaktive Zeitstempel, die direkt zu Videomomenten führen.

Verarbeite nur Aufnahmen, für die du die erforderlichen Rechte oder eine Genehmigung besitzt.

## Voraussetzungen

- Windows 10 oder Windows 11,
- Node.js 18 oder neuer,
- npm,
- Internetverbindung beim ersten `npm install`.

`ffmpeg` und `yt-dlp` werden als Projektabhängigkeiten installiert und mit der Anwendung ausgeliefert. Endbenutzer müssen sie nicht separat installieren.

## Windows-Anwendung erstellen

Öffne PowerShell im Projektverzeichnis und führe Folgendes aus:

```powershell
npm install
npm run desktop:pack:win
```

Im Ordner `release` befinden sich anschließend:

- `FrameFinder Setup 1.0.0.exe` — Windows-Installationsprogramm,
- `FrameFinder 1.0.0.exe` — portable Anwendung,
- `win-unpacked/FrameFinder.exe` — entpackte Testversion.

## Entwicklungsmodus

```powershell
npm install
npm run desktop:dev
```

## Produktions-Build testen

```powershell
npm run desktop:start
```

## API-Schlüssel

Öffne die Anwendungseinstellungen und gib einen OpenAI- oder Groq-API-Schlüssel ein. Der Schlüssel wird lokal auf dem Gerät gespeichert. Die Transkription kann kostenpflichtige Guthaben oder Nutzungslimits des Anbieters verbrauchen.

Alternativ kannst du **Lokal — Whisper Small** wählen. Beim ersten Einsatz wird das Modell auf das Gerät geladen. Weitere Transkriptionen können ohne API-Schlüssel ausgeführt werden; die Geschwindigkeit hängt vom Prozessor ab.

## Technologien

- Electron
- React
- Vite
- `yt-dlp`
- `ffmpeg`
- OpenAI Whisper / Groq Whisper

## Lizenz

Lizenziert unter der [MIT-Lizenz](LICENSE).
