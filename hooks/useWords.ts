'use client'

import { useState, useEffect } from 'react'
import { Word } from '@/types/word'

const STORAGE_KEY = 'vlog_words'

export function useWords() {
  const [words, setWords] = useState<Word[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setWords(JSON.parse(stored))
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words))
  }, [words])

  function addWord(word: Word) {
    setWords(prev => [word, ...prev])
  }

  function toggleStatus(id: number) {
    setWords(prev =>
      prev.map(w =>
        w.id === id
          ? { ...w, status: w.status === 'reviewing' ? 'learned' : 'reviewing' }
          : w
      )
    )
  }

  function deleteWord(id: number) {
    setWords(prev => prev.filter(w => w.id !== id))
  }

  return { words, addWord, toggleStatus, deleteWord }
}
