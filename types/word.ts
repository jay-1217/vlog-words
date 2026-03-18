export type WordStatus = 'reviewing' | 'learned'

export interface Word {
  id: number
  text: string          // word, phrase, or sentence
  translation: string   // Chinese meaning
  example: string       // example sentence (optional)
  source: string        // e.g. Vlog title (optional)
  status: WordStatus
  createdAt: string
  phonetic?: string     // phonetic transcription, e.g. "/ˈæp.əl/"
  viewCount?: number    // number of times viewed
  derivatives?: { [key: string]: string }  // word forms, e.g. { "noun": "happiness", "adjective": "happy" }
  category?: string     // theme category, e.g. "旅行", "商务"
  review_stage?: number       // 0-7，艾宾浩斯8阶段，默认0
  last_review_date?: string   // ISO 8601，如 "2026-03-18T10:00:00.000Z"
}

// 艾宾浩斯复习间隔（毫秒）
export const REVIEW_INTERVALS = [
  5 * 60 * 1000,
  30 * 60 * 1000,
  12 * 60 * 60 * 1000,
  1 * 24 * 60 * 60 * 1000,
  2 * 24 * 60 * 60 * 1000,
  4 * 24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
  15 * 24 * 60 * 60 * 1000,
]

export function isDueForReview(word: Word): boolean {
  const stage = word.review_stage ?? 0
  if (stage >= REVIEW_INTERVALS.length) return false
  const lastDate = word.last_review_date ?? word.createdAt
  const t = new Date(lastDate).getTime()
  if (isNaN(t)) return false
  return Date.now() >= t + REVIEW_INTERVALS[stage]
}
