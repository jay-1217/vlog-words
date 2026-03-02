'use client'

import { useState, useEffect } from 'react'
import { Word } from '@/types/word'

const STORAGE_KEY = 'vlog_words'
const CATEGORIES_KEY = 'vlog_categories'
const DEFAULT_CATEGORY = '未分类'

export function useWords() {
  const [words, setWords] = useState<Word[]>([])
  const [categories, setCategories] = useState<string[]>([DEFAULT_CATEGORY])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setWords(JSON.parse(stored))

    const storedCategories = localStorage.getItem(CATEGORIES_KEY)
    if (storedCategories) {
      setCategories(JSON.parse(storedCategories))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words))
  }, [words])

  useEffect(() => {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
  }, [categories])

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

  function incrementViewCount(id: number) {
    setWords(prev =>
      prev.map(w =>
        w.id === id
          ? { ...w, viewCount: (w.viewCount ?? 0) + 1 }
          : w
      )
    )
  }

  function addCategory(category: string) {
    if (category && !categories.includes(category)) {
      setCategories(prev => [...prev, category])
    }
  }

  function deleteCategory(category: string) {
    if (category === DEFAULT_CATEGORY) return
    setCategories(prev => prev.filter(c => c !== category))
    // Move words in this category to uncategorized
    setWords(prev =>
      prev.map(w =>
        w.category === category ? { ...w, category: DEFAULT_CATEGORY } : w
      )
    )
  }

  return { words, addWord, toggleStatus, deleteWord, incrementViewCount, categories, addCategory, deleteCategory }
}
