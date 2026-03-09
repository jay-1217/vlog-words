'use client'

import { useState } from 'react'
import { Word } from '@/types/word'
import { exportToExcel, exportToMarkdown } from '@/utils/export'

interface Props {
  words: Word[]
}

export default function ExportButton({ words }: Props) {
  const [showMenu, setShowMenu] = useState(false)

  const handleExport = (format: 'excel' | 'markdown') => {
    if (words.length === 0) {
      alert('暂无单词可导出')
      return
    }

    const timestamp = new Date().toISOString().slice(0, 10)

    if (format === 'excel') {
      exportToExcel(words, `vlog-words-${timestamp}.xlsx`)
    } else {
      exportToMarkdown(words, `vlog-words-${timestamp}.md`)
    }

    setShowMenu(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span>📥</span>
        <span>导出</span>
      </button>

      {showMenu && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* 下拉菜单 */}
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            <button
              onClick={() => handleExport('excel')}
              className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              <span>📊</span>
              <div>
                <div className="font-medium">Excel 格式</div>
                <div className="text-xs text-gray-400">适合数据分析</div>
              </div>
            </button>

            <div className="border-t border-gray-100" />

            <button
              onClick={() => handleExport('markdown')}
              className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              <span>📝</span>
              <div>
                <div className="font-medium">Markdown 格式</div>
                <div className="text-xs text-gray-400">适合笔记分享</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
