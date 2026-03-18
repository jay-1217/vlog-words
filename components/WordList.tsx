'use client'

import { useState } from 'react'
import { Word, WordStatus, isDueForReview } from '@/types/word'
import WordCard from './WordCard'

type Filter = 'all' | WordStatus | 'due'

interface Props {
  words: Word[]
  onToggleStatus: (id: number) => void
  onDelete: (id: number) => void
  onIncrementViewCount: (id: number) => void
  onMarkReviewed: (id: number) => void
  categories: string[]
}

const FILTERS: { label: string; value: Filter }[] = [
  { label: '全部', value: 'all' },
  { label: '复习中', value: 'reviewing' },
  { label: '已学会', value: 'learned' },
  { label: '今日待复习', value: 'due' },
]

export default function WordList({ words, onToggleStatus, onDelete, onIncrementViewCount, onMarkReviewed, categories }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  let filtered = filter === 'due'
    ? words.filter(isDueForReview)
    : filter === 'all' ? words : words.filter(w => w.status === filter)
  if (categoryFilter !== 'all') {
    filtered = filtered.filter(w => (w.category || '未分类') === categoryFilter)
  }
  const dueCount = words.filter(isDueForReview).length

  return (
    <div>
      {/* Filter tabs + stats */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-all font-medium flex items-center gap-1.5 ${
                filter === f.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {f.label}
              {f.value === 'due' && dueCount > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  filter === 'due' ? 'bg-amber-400 text-white' : 'bg-amber-100 text-amber-600'
                }`}>
                  {dueCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-300">
          {filtered.length} / {words.length} 个单词
        </p>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
            categoryFilter === 'all'
              ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
              : 'border-gray-200 text-gray-400 hover:border-gray-300'
          }`}
        >
          全部分类
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
              categoryFilter === cat
                ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                : 'border-gray-200 text-gray-400 hover:border-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(w => (
            <WordCard
              key={w.id}
              word={w}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
              onIncrementViewCount={onIncrementViewCount}
              onMarkReviewed={onMarkReviewed}
              isDue={isDueForReview(w)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="text-4xl mb-3">📖</p>
          <p className="text-sm text-gray-300">
            {words.length === 0 ? '还没有单词，输入第一个吧' : '这个分类暂时没有单词'}
          </p>
        </div>
      )}
    </div>
  )
}
