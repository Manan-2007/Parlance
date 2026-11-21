import * as words from './animations/words.js'
import * as alphabets from './animations/alphabets.js'
import { NUMBER_ANIMATIONS } from './animations/numbers.js'
import { appendSignFrames } from './signQueue.js'

export const MAX_LIVE_BACKLOG = 8

export function scheduleSigns(tokens, runtime, { append = false } = {}) {
  if (!append) {
    runtime.animations = []
    runtime.segments = []
  }

  for (const token of tokens) {
    const word = token.toUpperCase()
    const wordSign = word.includes('-') ? undefined : words[word]
    let added = 0
    if (typeof wordSign === 'function') {
      added = appendSignFrames(runtime, wordSign)
    } else {
      for (const character of word.replaceAll('-', '')) {
        const sign = alphabets[character] ?? NUMBER_ANIMATIONS[character]
        if (sign) added += appendSignFrames(runtime, sign)
      }
    }
    if (added) runtime.segments.push({ token: word, frames: added })
  }
  runtime.characters.length = 0

  if (append) {
    while (runtime.segments.length > MAX_LIVE_BACKLOG) {
      runtime.animations.splice(runtime.segments[0].frames, runtime.segments[1].frames)
      runtime.segments.splice(1, 1)
    }
  }
}
