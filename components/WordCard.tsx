'use client'

import { useState } from 'react'
import { Word } from '@/types/word'

interface Props {
  word: Word
  onToggleStatus: (id: number) => void
  onDelete: (id: number) => void
  onIncrementViewCount: (id: number) => void
}

function speak(text: string) {
  if (typeof window === 'undefined') return
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'en-US'
  utter.rate = 0.9
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utter)
}

export default function WordCard({ word, onToggleStatus, onDelete, onIncrementViewCount }: Props) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className="group"
      style={{ perspective: '1000px', minHeight: '200px' }}
      onClick={() => {
        const newFlipped = !flipped
        setFlipped(newFlipped)
        if (newFlipped) {
          onIncrementViewCount(word.id)
        }
      }}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          minHeight: '200px',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-sm group-hover:shadow-md transition-shadow"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div>
            <p className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight leading-snug">
              {word.text}
            </p>
            {word.phonetic && (
              <p className="text-sm text-gray-400 mt-1 font-mono">
                {word.phonetic}
              </p>
            )}
            {word.source && (
              <p className="text-xs text-gray-300 mt-1">📹 {word.source}</p>
            )}
          </div>
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={e => { e.stopPropagation(); speak(word.text) }}
              className="text-sm text-indigo-400 hover:text-indigo-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-indigo-50 min-h-[44px] flex items-center gap-1"
            >
              🔊 朗读
            </button>
            <span className="text-xs text-gray-300">点击翻转 →</span>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 bg-gray-50 border border-gray-100 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-sm"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="space-y-2 overflow-y-auto flex-1">
            {(() => {
              const raw = word.translation ?? ''
              const lines = raw.split('\n')
              const core = lines[0] || '暂无释义'
              const detail = lines.slice(1).join('\n')
              return (
                <>
                  <p className="text-base font-semibold text-gray-900 leading-snug">{core}</p>
                  {detail && (
                    <p className="text-xs text-gray-500 leading-relaxed">{detail}</p>
                  )}
                </>
              )
            })()}
            {word.example && (
              <p className="text-xs text-gray-400 italic leading-relaxed border-t border-gray-100 pt-2 mt-1">
                {word.example}
              </p>
            )}
            {word.viewCount !== undefined && word.viewCount > 0 && (
              <p className="text-xs text-gray-300 mt-2">
                已查看 {word.viewCount} 次
              </p>
            )}
          </div>
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={e => { e.stopPropagation(); onToggleStatus(word.id) }}
              className={`text-sm font-medium px-3 py-2 rounded-full transition-colors min-h-[44px] flex items-center ${
                word.status === 'learned'
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              }`}
            >
              {word.status === 'learned' ? '✓ 已学会' : '↻ 复习中'}
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(word.id) }}
              className="text-xs text-gray-300 hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-50 min-h-[44px] flex items-center"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
