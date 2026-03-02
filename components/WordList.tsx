'use client'

import { useState } from 'react'
import { Word, WordStatus } from '@/types/word'
import WordCard from './WordCard'

type Filter = 'all' | WordStatus

interface Props {
  words: Word[]
  onToggleStatus: (id: number) => void
  onDelete: (id: number) => void
  onIncrementViewCount: (id: number) => void
}

const FILTERS: { label: string; value: Filter }[] = [
  { label: '全部', value: 'all' },
  { label: '复习中', value: 'reviewing' },
  { label: '已学会', value: 'learned' },
]

export default function WordList({ words, onToggleStatus, onDelete, onIncrementViewCount }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = filter === 'all' ? words : words.filter(w => w.status === filter)

  return (
    <div>
      {/* Filter tabs + stats */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-all font-medium ${
                filter === f.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-300">
          {filtered.length} / {words.length} 个单词
        </p>
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
