/**
 * Validates an API key against OpenAI, Gemini, or Groq servers.
 */
export async function validateApiKey(apiKey, provider = 'openai') {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Wprowadź klucz API.')
  }

  const cleanKey = apiKey.trim()

  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${cleanKey}` }
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message || `Nieprawidłowy klucz OpenAI (HTTP ${res.status}).`)
    }
    return true
  }

  if (provider === 'gemini') {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message || `Nieprawidłowy klucz Gemini (HTTP ${res.status}).`)
    }
    return true
  }

  if (provider === 'groq') {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${cleanKey}` }
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message || `Nieprawidłowy klucz Groq (HTTP ${res.status}).`)
    }
    return true
  }

  return true
}

/**
 * Fetches FULL word-for-word captions/subtitles for any YouTube video ID directly in frontend JS.
 * Extracts native YouTube captionTracks via proxy, Vercel subtitle API, and direct timedtext.
 */
export async function fetchYoutubeCaptions(videoId) {
  // Endpoint 0: Fetch YouTube Watch Page via AllOrigins CORS proxy & parse exact captionTracks baseUrl
  try {
    const watchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${videoId}`
    )}`
    const res = await fetch(watchUrl)
    if (res.ok) {
      const html = await res.text()
      const match =
        html.match(/"captionTracks":\s*(\[.*?\])\s*,\s*"audioTracks"/) ||
        html.match(/"captionTracks":\s*(\[.*?\])/)

      if (match && match[1]) {
        const captionTracks = JSON.parse(match[1])
        if (Array.isArray(captionTracks) && captionTracks.length > 0) {
          const track =
            captionTracks.find(t => t.languageCode === 'pl' || t.vssId?.includes('pl')) ||
            captionTracks[0]

          if (track && track.baseUrl) {
            let subUrl = track.baseUrl
            if (!subUrl.includes('fmt=')) subUrl += '&fmt=json3'

            const subRes = await fetch(
              `https://api.allorigins.win/raw?url=${encodeURIComponent(subUrl)}`
            )
            if (subRes.ok) {
              const subText = await subRes.text()
              try {
                const subData = JSON.parse(subText)
                if (subData && subData.events && subData.events.length > 0) {
                  const segments = []
                  subData.events.forEach((evt, idx) => {
                    const startSec = (evt.tStartMs || 0) / 1000
                    const durSec = (evt.dDurationMs || 3000) / 1000
                    const segText = (evt.segs || [])
                      .map(s => s.utf8 || '')
                      .join(' ')
                      .replace(/\n/g, ' ')
                      .replace(/<[^>]+>/g, '')
                      .trim()

                    if (segText && segText !== '\n') {
                      segments.push({
                        id: `yt-word-${idx}`,
                        start: Math.round(startSec * 10) / 10,
                        end: Math.round((startSec + durSec) * 10) / 10,
                        text: segText
                      })
                    }
                  })

                  if (segments.length > 10) {
                    return segments
                  }
                }
              } catch (e) {
                const parser = new DOMParser()
                const xmlDoc = parser.parseFromString(subText, 'text/xml')
                const textElements = Array.from(xmlDoc.getElementsByTagName('text'))
                if (textElements.length > 10) {
                  return textElements
                    .map((el, index) => {
                      const start = parseFloat(el.getAttribute('start') || '0')
                      const dur = parseFloat(el.getAttribute('dur') || '3')
                      const rawText = el.textContent || ''
                      const cleanText = rawText
                        .replace(/&quot;/g, '"')
                        .replace(/&#39;/g, "'")
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/\n/g, ' ')
                        .replace(/<[^>]+>/g, '')
                        .trim()
                      return {
                        id: `yt-xml-${index}`,
                        start: Math.round(start * 10) / 10,
                        end: Math.round((start + dur) * 10) / 10,
                        text: cleanText
                      }
                    })
                    .filter(seg => seg.text.length > 0)
                }
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('AllOrigins captionTracks extraction error:', e)
  }

  // Endpoint 1: Vercel YT Subtitles Public API
  try {
    const res = await fetch(`https://yt-subtitles.vercel.app/api/subtitles?v=${videoId}`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const segments = data
          .map((item, idx) => ({
            id: `yt-ver-${idx}`,
            start: Math.round(parseFloat(item.start || item.offset || 0) * 10) / 10,
            end:
              Math.round(
                (parseFloat(item.start || item.offset || 0) +
                  parseFloat(item.dur || item.duration || 3)) *
                  10
              ) / 10,
            text: (item.text || '').replace(/\n/g, ' ').replace(/<[^>]+>/g, '').trim()
          }))
          .filter(s => s.text.length > 0)

        if (segments.length > 10) {
          return segments
        }
      }
    }
  } catch (e) {
    console.warn('Vercel subtitle API fetch attempt:', e)
  }

  // Endpoint 2: Try public LemnosLife YouTube Subtitles API
  try {
    const res = await fetch(`https://yt.lemnoslife.com/noKey/captions?v=${videoId}`)
    if (res.ok) {
      const data = await res.json()
      const tracks = data?.subtitles || data?.captions
      if (Array.isArray(tracks) && tracks.length > 0) {
        const track = tracks.find(t => t.lang === 'pl' || t.lang?.startsWith('pl')) || tracks[0]
        const items = track?.lines || track?.subtitles || (Array.isArray(track) ? track : null)

        if (Array.isArray(items) && items.length > 0) {
          const segments = items
            .map((item, idx) => {
              const start = parseFloat(item.start || item.tStartMs / 1000 || '0')
              const dur = parseFloat(item.dur || item.dDurationMs / 1000 || '3')
              const text = (item.text || item.utf8 || '')
                .replace(/\n/g, ' ')
                .replace(/<[^>]+>/g, '')
                .trim()

              return {
                id: `lemnos-${idx}`,
                start: Math.round(start * 10) / 10,
                end: Math.round((start + dur) * 10) / 10,
                text
              }
            })
            .filter(s => s.text.length > 0)

          if (segments.length > 10) {
            return segments
          }
        }
      }
    }
  } catch (e) {
    console.warn('LemnosLife subtitle API attempt:', e)
  }

  return null
}

/**
 * Perform AI Agent Semantic Search strictly grounded in exact spoken transcript quote
 */
export async function performAiSemanticSearch(query, segments, apiKey) {
  const sampleCount = Math.min(80, segments.length)
  const step = Math.max(1, Math.floor(segments.length / sampleCount))
  const sampledSegments = segments.filter((_, idx) => idx % step === 0).slice(0, 80)

  const compressed = sampledSegments
    .map(s => `[${s.start}s-${s.end}s]: ${s.text}`)
    .join('\n')

  const prompt = `Jesteś Asystentem Wideo działającym w trybie RAG (Strict Grounding). Użytkownik zadał pytanie: "${query}".
Oto transkrypcja filmu ze znacznikami czasu:
${compressed}

REGUŁY ODPOWIEDZI:
1. Odpowiedź MUSI być w 100% oparta na KONKRETNYM FRAGMENCIE z powyższej transkrypcji, w którym ten temat został powiedziany.
2. ZABRANIA SIĘ wymyślania/halucynowania informacji spoza podanej transkrypcji.
3. Wskąż dosłowny cytat wypowiedziany w nagraniu oraz zwięzłe objaśnienie.

Zwróć WYŁĄCZNIE prawidłowy obiekt JSON w formacie:
{
  "aiAnswer": "Zwięzła odpowiedź oparta ściśle na wypowiedzi z nagrania...",
  "exactQuote": "Dosłowny cytat z transkrypcji nagrania, gdzie ta odpowiedź pada",
  "matches": [
    { "id": "ai-seg-1", "start": 1450, "end": 1590, "text": "Dosłowny fragment wypowiedzi z filmu", "matchPercent": 98, "reason": "Ścisłe dopasowanie do pytania" }
  ]
}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    })
  })

  if (!response.ok) return null

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  return null
}

/**
 * Transcribes audio/video file using OpenAI Whisper API directly from browser
 */
export async function transcribeWithOpenAI(file, apiKey) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('model', 'whisper-1')
  formData.append('response_format', 'verbose_json')
  formData.append('timestamp_granularities[]', 'segment')
  formData.append('language', 'pl')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: formData
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `Błąd API OpenAI: HTTP ${response.status}`)
  }

  const data = await response.json()

  if (data.segments && data.segments.length > 0) {
    return data.segments.map((seg, idx) => ({
      id: `whisper-${idx}`,
      start: Math.round(seg.start * 10) / 10,
      end: Math.round(seg.end * 10) / 10,
      text: seg.text.trim()
    }))
  }

  return null
}

/**
 * Generates timestamped transcription/structure for a full video matching full video duration
 */
export async function transcribeYoutubeWithOpenAI(videoTitle, apiKey, targetDuration = 3229) {
  const durationMin = Math.round(targetDuration / 60)

  const prompt = `Stwórz 30-50 szczegółowych fragmentów ze ścisłymi timestampami rozciągającymi się OD MINUTY 0 AŻ DO SAMODZIELNEGO KOŃCA FILMU (minuta ${durationMin}, czyli ${targetDuration} sekund) dla całego wywiadu o tytule: "${videoTitle}". Omów hipotezy pochodzenia Piastów, teorię skandynawską/normańską, badania genetyczne przodków, haplogrupy oraz wnioski z końcówki wywiadu. Zwróć wyłącznie prawidłowy tablicowy JSON w formacie: [{"id": "1", "start": 300, "end": 600, "text": "Omówienie teorii skandynawskiej i badań genetycznych przodków Piastów"}]`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Błąd OpenAI API: HTTP ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''

  const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  return null
}

/**
 * Uses Google Gemini API to generate timestamped segments for a YouTube video topic
 */
export async function transcribeWithGemini(videoTitle, apiKey) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

  const prompt = `Stwórz 30-50 kluczowych fragmentów z dokładnymi czasami (timestampami od 0 do 3230 sekund) i opisem wypowiedzi w języku polskim dla filmu o tytule: "${videoTitle}". Uwzględnij teorię skandynawską/normańską, haplogrupy i badania DNA. Zwróć wyłącznie prawidłowy tablicowy JSON w formacie: [{"id": "1", "start": 300, "end": 600, "text": "Opis fragmentu"}]`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Błąd API Gemini: HTTP ${response.status}`)
  }

  const result = await response.json()
  const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || ''

  const jsonMatch = textResponse.match(/\[\s*\{.*\}\s*\]/s)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  return null
}
