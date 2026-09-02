import test from 'node:test'
import assert from 'node:assert/strict'
import { parseSRT, queryWords, removeAccents, youtubeId } from '../src/utils/formatters.js'

test('youtubeId extracts IDs from supported YouTube URL formats', () => {
  assert.equal(youtubeId('https://www.youtube.com/watch?v=abcdefghijk'), 'abcdefghijk')
  assert.equal(youtubeId('https://youtu.be/abcdefghijk?t=30'), 'abcdefghijk')
  assert.equal(youtubeId('https://youtube.com/shorts/abcdefghijk'), 'abcdefghijk')
  assert.equal(youtubeId('https://example.com/watch?v=abcdefghijk'), null)
  assert.equal(youtubeId('not a url'), null)
})

test('removeAccents and queryWords normalize Polish text', () => {
  assert.equal(removeAccents('Zażółć gęślą jaźń'), 'Zazolc gesla jazn')
  assert.deepEqual(queryWords('Jaka jest główna konkluzja?'), ['jaka', 'jest', 'glowna', 'konkluzja'])
})

test('parseSRT parses comma timestamps and multiline captions', () => {
  const input = [
    '1',
    '00:00:01,250 --> 00:00:03,500',
    'Pierwsza linia',
    'druga linia',
    '',
    '2',
    '00:01:02.000 --> 00:01:04.750',
    'Drugi fragment',
    ''
  ].join('\n')

  assert.deepEqual(parseSRT(input), [
    { id: 'srt-0', start: 1.3, end: 3.5, text: 'Pierwsza linia druga linia' },
    { id: 'srt-1', start: 62, end: 64.8, text: 'Drugi fragment' }
  ])
})

test('parseSRT ignores blocks without timestamps or text', () => {
  const input = 'not a subtitle\n\n1\n00:00:01,000 --> 00:00:02,000\n\n2\n00:00:03,000 --> 00:00:04,000\nPoprawny tekst'
  assert.deepEqual(parseSRT(input), [
    { id: 'srt-2', start: 3, end: 4, text: 'Poprawny tekst' }
  ])
})
