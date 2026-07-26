# FrameFinder

[🇵🇱 Wersja polska](README.pl.md) | **🇬🇧 English**

FrameFinder is a frontend web application for searching specific moments within video and audio recordings. Built with React and Vite, it runs entirely in your browser.

## Features

- Open YouTube videos via link
- Local playback of audio and video files
- Drag-and-drop file upload support
- Demo mode with sample transcriptions
- Full-text search within transcriptions
- Highlighted matching segments with interactive timestamps
- Instant seek/jump to any selected moment in the recording

## Demo Limitations

Automatic transcription of uploaded files and semantic search for YouTube videos are currently unavailable in this frontend-only build. These features require a backend proxy service — making direct calls to external AI/transcription APIs from the client browser would expose secret API keys to end users.

You can test the full search interaction flow by selecting **Demo** on the home screen. Any user-added files remain stored locally in your browser and are never uploaded to a remote server.

## Prerequisites

- Node.js 18 or higher
- npm

Node.js is only required for local development and building the application. The production output consists purely of static files.

## Local Setup

```bash
npm install
npm run dev
```

Once started, open the local URL shown by Vite (default: `http://localhost:5173`).

## Production Build

```bash
npm run build
npm run preview
```

Running `npm run build` generates optimized static assets inside the `dist` directory, ready to be deployed to any static host (e.g. GitHub Pages, Vercel, Netlify).

## Tech Stack

- React
- Vite
- Lucide React
- Vanilla CSS
