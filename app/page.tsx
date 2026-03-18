'use client'

import { useWords } from '@/hooks/useWords'
import AddWordForm from '@/components/AddWordForm'
import WordList from '@/components/WordList'
import ExportButton from '@/components/ExportButton'

export default function Home() {
  const {
    words,
    addWord,
    toggleStatus,
    deleteWord,
    incrementViewCount,
    markReviewed,
    categories,
    addCategory,
    deleteCategory
  } = useWords()

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Vlog Words</h1>
          <p className="text-sm text-gray-400 mt-0.5">从 Vlog 里学英语</p>
        </div>
        <ExportButton words={words} />
      </header>

      <AddWordForm
        onAdd={addWord}
        categories={categories}
        onAddCategory={addCategory}
      />

      <WordList
        words={words}
        onToggleStatus={toggleStatus}
        onDelete={deleteWord}
        onIncrementViewCount={incrementViewCount}
        onMarkReviewed={markReviewed}
        categories={categories}
      />
    </div>
  )
}
