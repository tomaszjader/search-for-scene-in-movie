# FrameFinder

[Polski](README.pl.md) | **English** | [Deutsch](README.de.md)

FrameFinder is an Electron desktop application for creating complete video transcripts and finding specific spoken moments.

## Features

- YouTube audio processing in the Electron build,
- complete transcription with OpenAI Whisper or Groq Whisper,
- local Whisper transcription without an API key or audio upload,
- automatic chunking of long recordings,
- local MP4, WEBM, MP3 and WAV support,
- SRT import and export,
- text and semantic search,
- interactive timestamps linked to video moments.

Only process recordings you have the rights or permission to use.

## Build requirements

- Windows 10 or Windows 11,
- Node.js 18 or newer,
- npm,
- an internet connection for the first `npm install`.

`ffmpeg` and `yt-dlp` are installed as project dependencies and bundled with the packaged application. End users do not need to install them separately.

## Build the Windows application

Open PowerShell in the project directory and run:

```powershell
npm install
npm run desktop:pack:win
```

The `release` directory will contain:

- `FrameFinder Setup 1.0.0.exe` — Windows installer,
- `FrameFinder 1.0.0.exe` — portable application,
- `win-unpacked/FrameFinder.exe` — unpacked test build.

## Development mode

```powershell
npm install
npm run desktop:dev
```

## Test the production build

```powershell
npm run desktop:start
```

## API key

Open the application settings and enter an OpenAI or Groq API key. The key is stored locally on the user's device. Transcription may consume paid credits or provider usage limits.

## Technology

- Electron
- React
- Vite
- `yt-dlp`
- `ffmpeg`
- OpenAI Whisper / Groq Whisper

## License

Licensed under the [MIT License](LICENSE).
