'use client'

import { useState, useEffect } from 'react'
import { Word, isDueForReview } from '@/types/word'

const STORAGE_KEY = 'vlog_words'
const CATEGORIES_KEY = 'vlog_categories'
const DEFAULT_CATEGORY = '未分类'

export function useWords() {
  const [words, setWords] = useState<Word[]>([])
  const [categories, setCategories] = useState<string[]>([DEFAULT_CATEGORY])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed: Word[] = JSON.parse(stored)
      const migrated = parsed.map(w => ({
        ...w,
        review_stage: w.review_stage ?? 0,
        last_review_date: w.last_review_date ?? w.createdAt,
      }))
      setWords(migrated)
    }

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
    const now = new Date().toISOString()
    setWords(prev => [{ ...word, review_stage: 0, last_review_date: now }, ...prev])
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

  function advanceReview(id: number) {
    setWords(prev =>
      prev.map(w => {
        if (w.id !== id) return w
        const stage = w.review_stage ?? 0
        return { ...w, review_stage: Math.min(stage + 1, 7), last_review_date: new Date().toISOString() }
      })
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
    setWords(prev =>
      prev.map(w =>
        w.category === category ? { ...w, category: DEFAULT_CATEGORY } : w
      )
    )
  }

  return { words, addWord, toggleStatus, deleteWord, incrementViewCount, advanceReview, categories, addCategory, deleteCategory }
}
