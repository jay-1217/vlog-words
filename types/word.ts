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
}
