import React from 'react'
import { queryWords } from '../utils/formatters'

export function HighlightedText({ text, query }) {
  const words = queryWords(query)
  if (!words.length) return text
  const pattern = new RegExp(`(${words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'giu')
  return text.split(pattern).map((part, index) =>
    words.includes(part.toLowerCase()) ? <mark key={index}>{part}</mark> : part
  )
}
