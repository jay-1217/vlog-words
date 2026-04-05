'use client'

import { useState, useRef } from 'react'
import { Word } from '@/types/word'

interface Props {
  onAdd: (word: Word) => void
  categories: string[]
  onAddCategory: (category: string) => void
}

interface ManualFields {
  translation: string
  example: string
  source: string
}

const POS_MAP: Record<string, string> = {
  noun: 'n.', verb: 'v.', adjective: 'adj.', adverb: 'adv.',
  pronoun: 'pron.', preposition: 'prep.', conjunction: 'conj.',
  interjection: 'int.', exclamation: 'int.',
}

function extractDerivatives(meanings: any[], baseWord: string): { [key: string]: string } {
  const result: { [key: string]: string } = {}
  const base = baseWord.toLowerCase()

  for (const meaning of meanings) {
    const abbr = POS_MAP[meaning.partOfSpeech] || meaning.partOfSpeech
    if (result[abbr]) continue

    const synonyms: string[] = [
      ...(meaning.synonyms ?? []),
      ...(meaning.definitions ?? []).flatMap((d: any) => d.synonyms ?? []),
    ]

    const related = synonyms.find(s =>
      s !== base &&
      s.length > 2 &&
      !s.includes(' ') &&
      (s.startsWith(base.slice(0, 4)) || base.startsWith(s.slice(0, 4)))
    )

    if (related) result[abbr] = related
  }

  return result
}

const textareaClass =
  'w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 placeholder-gray-300 focus:outline-none focus:border-indigo-400 transition-colors resize-none'

export default function AddWordForm({ onAdd, categories, onAddCategory }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [fields, setFields] = useState<ManualFields>({ translation: '', example: '', source: '' })
  const [apiHint, setApiHint] = useState('')
  const [engRef, setEngRef] = useState('')
  const [phonetic, setPhonetic] = useState('')
  const [derivatives, setDerivatives] = useState<{ [key: string]: string }>({})
  const [selectedCategory, setSelectedCategory] = useState('未分类')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryInput, setNewCategoryInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const translationRef = useRef<HTMLTextAreaElement>(null)

  function setField(key: keyof ManualFields, value: string) {
    setFields(f => ({ ...f, [key]: value }))
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    const term = input.trim()
    if (!term) return

    setLoading(true)
    setApiHint('')
    setEngRef('')
    setPhonetic('')
    setDerivatives({})

    // Step 1: fetch DictionaryAPI + plain MyMemory in parallel
    const [dictRes, plainTransRes] = await Promise.allSettled([
      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term)}`),
      fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(term)}&langpair=en|zh-CN`),
    ])

    let coreWord = ''       // shortest direct translation, e.g. "苹果"
    let detailLines = ''    // "n. 一种红色水果；v. 下雪"
    let englishRef = ''
    let example = ''

    // Always parse plain MyMemory for core word
    if (plainTransRes.status === 'fulfilled' && plainTransRes.value.ok) {
      try {
        const data = await plainTransRes.value.json()
        coreWord = data?.responseData?.translatedText ?? ''
      } catch { /* ignore */ }
    }

    const dictOk = dictRes.status === 'fulfilled' && dictRes.value.ok

    if (dictOk) {
      try {
        const data = await dictRes.value.json()

        // Extract phonetic transcription with US priority
        let phoneticText = ''

        // Priority 1: Look for US phonetic in phonetics array
        if (data[0]?.phonetics?.length > 0) {
          const usPhonetic = data[0].phonetics.find((p: any) =>
            p.audio?.includes('-us-') || p.audio?.includes('-us.mp3')
          )
          if (usPhonetic?.text) {
            phoneticText = usPhonetic.text
          }
        }

        // Priority 2: Fall back to root phonetic
        if (!phoneticText) {
          phoneticText = data[0]?.phonetic ?? ''
        }

        // Priority 3: Iterate through ALL phonetics entries to find first valid text
        if (!phoneticText && data[0]?.phonetics?.length > 0) {
          for (const p of data[0].phonetics) {
            if (p.text) {
              phoneticText = p.text
              break
            }
          }
        }

        setPhonetic(phoneticText || '/  /')  // 如果完全没有音标，使用占位符

        const meanings: { partOfSpeech: string; definitions: { definition: string; example?: string }[] }[] =
          data[0]?.meanings ?? []

        // Extract derivatives and batch-translate them
        const derivativesData = extractDerivatives(meanings, term)
        const derivWords = Object.values(derivativesData)
        if (derivWords.length > 0) {
          try {
            const derivRes = await fetch(
              `https://api.mymemory.translated.net/get?q=${encodeURIComponent(derivWords.join(' | '))}&langpair=en|zh-CN`
            )
            if (derivRes.ok) {
              const derivData = await derivRes.json()
              const derivTranslated: string = derivData?.responseData?.translatedText ?? ''
              const derivParts = derivTranslated.split('|').map((s: string) => s.trim())
              const keys = Object.keys(derivativesData)
              const enriched: { [key: string]: string } = {}
              keys.forEach((k, i) => {
                const engForm = derivativesData[k]
                const cnMatch = (derivParts[i] ?? '').match(/[\u4e00-\u9fa5]{1,6}/)
                const cn = cnMatch ? cnMatch[0] : ''
                enriched[k] = cn ? `${engForm} (${cn})` : engForm
              })
              setDerivatives(enriched)
            } else {
              setDerivatives(derivativesData)
            }
          } catch {
            setDerivatives(derivativesData)
          }
        } else {
          setDerivatives(derivativesData)
        }

        // Extract first available example
        for (const m of meanings) {
          const ex = m.definitions.find(d => d.example)?.example
          if (ex) { example = ex; break }
        }

        // Build English ref string
        englishRef = meanings
          .slice(0, 3)
          .map(m => `${m.partOfSpeech}: ${m.definitions[0]?.definition ?? ''}`)
          .join(' / ')

        // Build pipe-separated definitions for structured translation
        const posEntries = meanings.slice(0, 4).map(m => m.definitions[0]?.definition ?? '').join(' | ')

        const structRes = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(posEntries)}&langpair=en|zh-CN`
        )
        if (structRes.ok) {
          const structData = await structRes.json()
          const translated: string = structData?.responseData?.translatedText ?? ''
          const parts = translated.split('|').map((s: string) => s.trim()).filter(Boolean)

          detailLines = meanings.slice(0, parts.length).map((m, i) => {
            const abbr = POS_MAP[m.partOfSpeech] ?? m.partOfSpeech
            const rawTrans = parts[i] ?? ''
            const chineseMatch = rawTrans.match(/[\u4e00-\u9fa5，、]{1,8}/)
            const trans = chineseMatch ? chineseMatch[0] : (coreWord || rawTrans.slice(0, 6))
            return `${abbr} ${trans}`
          }).join('; ')
        }
      } catch { /* ignore */ }
    }

    // Format: "核心词\n详细词性行" — only add detail line if it differs from core
    let finalTranslation = coreWord
    if (detailLines && detailLines !== coreWord) {
      finalTranslation = `${coreWord}\n${detailLines}`
    }

    setFields(f => ({ ...f, translation: finalTranslation || '', example: example || '' }))
    setEngRef(englishRef)
    setApiHint(finalTranslation ? '已自动填入释义，可修改后保存' : '未能自动翻译，请手动填写')
    setLoading(false)
    setShowManual(true)

    // Auto-focus translation textarea after render
    setTimeout(() => translationRef.current?.focus(), 50)
  }

  function handleSave() {
    if (!input.trim() || !fields.translation.trim()) return
    onAdd({
      id: Date.now(),
      text: input.trim(),
      translation: fields.translation.trim(),
      example: fields.example.trim(),
      source: fields.source.trim(),
      status: 'reviewing',
      createdAt: new Date().toLocaleDateString('zh-CN'),
      phonetic: phonetic || undefined,
      derivatives: Object.keys(derivatives).length > 0 ? derivatives : undefined,
      category: selectedCategory,
    })
    setInput('')
    setFields({ translation: '', example: '', source: '' })
    setShowManual(false)
    setApiHint('')
    setEngRef('')
    setPhonetic('')
    setDerivatives({})
    setSelectedCategory('未分类')
    setShowNewCategory(false)
    setNewCategoryInput('')
    inputRef.current?.focus()
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
        添加单词 / 短语 / 句子
      </p>

      {/* Step 1: text input */}
      <form onSubmit={handleLookup} className="flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setShowManual(false); setApiHint(''); setEngRef('') }}
          placeholder="输入英文，如 give it a shot…"
          disabled={loading}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 placeholder-gray-300 focus:outline-none focus:border-indigo-400 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium px-5 py-3 rounded-xl transition-all active:scale-95 whitespace-nowrap min-h-[44px]"
        >
          {loading ? '查询…' : '查询'}
        </button>
      </form>

      {/* Step 2: manual fields */}
      {showManual && (
        <div className="mt-4 space-y-3">
          {apiHint && <p className="text-xs text-indigo-400">{apiHint}</p>}
          {engRef && (
            <p className="text-xs text-gray-300 leading-relaxed">
              <span className="font-medium text-gray-400">英文原意：</span>{engRef}
            </p>
          )}

          <div>
            <label className="text-xs text-gray-400 mb-1 block">中文释义 *</label>
            <textarea
              ref={translationRef}
              rows={3}
              value={fields.translation}
              onChange={e => setField('translation', e.target.value)}
              placeholder="如：苹果&#10;n. 一种红色的多汁水果"
              className={textareaClass}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">例句（可选）</label>
            <textarea
              rows={2}
              value={fields.example}
              onChange={e => setField('example', e.target.value)}
              placeholder="如：Just give it a shot, you might surprise yourself."
              className={textareaClass}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">来源（可选）</label>
            <input
              value={fields.source}
              onChange={e => setField('source', e.target.value)}
              placeholder="如：Japan Trip Day 3"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 placeholder-gray-300 focus:outline-none focus:border-indigo-400 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">主题分类</label>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={e => {
                  if (e.target.value === '__new__') {
                    setShowNewCategory(true)
                  } else {
                    setSelectedCategory(e.target.value)
                    setShowNewCategory(false)
                  }
                }}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 focus:outline-none focus:border-indigo-400 transition-colors"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__new__">+ 新建分类</option>
              </select>
            </div>
            {showNewCategory && (
              <div className="flex gap-2 mt-2">
                <input
                  value={newCategoryInput}
                  onChange={e => setNewCategoryInput(e.target.value)}
                  placeholder="输入新分类名称"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 placeholder-gray-300 focus:outline-none focus:border-indigo-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newCategoryInput.trim()) {
                      onAddCategory(newCategoryInput.trim())
                      setSelectedCategory(newCategoryInput.trim())
                      setNewCategoryInput('')
                      setShowNewCategory(false)
                    }
                  }}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                >
                  确定
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!fields.translation.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-medium py-3 rounded-xl transition-all active:scale-95 min-h-[44px]"
          >
            保存
          </button>
        </div>
      )}
    </section>
  )
}
