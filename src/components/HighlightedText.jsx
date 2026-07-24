import React from 'react'
import { queryWords, removeAccents } from '../utils/formatters'

export function HighlightedText({ text, query }) {
  const words = queryWords(query)
  if (!words.length || !text) return text || ''

  // Split text by word boundaries
  const parts = text.split(/([\s,.!?:;„”"']+)/)

  return parts.map((part, index) => {
    const normalized = removeAccents(part.toLowerCase())
    const isMatch = words.some(w => w.length > 1 && normalized.includes(w))
    if (isMatch && part.trim().length > 0) {
      return <mark key={index}>{part}</mark>
    }
    return part
  })
}

