import * as XLSX from 'xlsx'
import { Word } from '@/types/word'

// 导出为 Excel
export function exportToExcel(words: Word[], filename: string = 'vlog-words.xlsx') {
  // 准备数据
  const data = words.map(word => ({
    '单词': word.text,
    '音标': word.phonetic || '',
    '翻译': word.translation.replace(/\n/g, '; '),
    '例句': word.example || '',
    '来源': word.source || '',
    '分类': word.category || '未分类',
    '状态': word.status === 'learned' ? '已学会' : '复习中',
    '查看次数': word.viewCount || 0,
    '衍生词': word.derivatives ? Object.entries(word.derivatives).map(([k, v]) => `${k}: ${v}`).join('; ') : '',
    '添加日期': word.createdAt,
  }))

  // 创建工作表
  const ws = XLSX.utils.json_to_sheet(data)

  // 设置列宽
  ws['!cols'] = [
    { wch: 15 },  // 单词
    { wch: 20 },  // 音标
    { wch: 30 },  // 翻译
    { wch: 40 },  // 例句
    { wch: 20 },  // 来源
    { wch: 12 },  // 分类
    { wch: 10 },  // 状态
    { wch: 10 },  // 查看次数
    { wch: 50 },  // 衍生词
    { wch: 12 },  // 添加日期
  ]

  // 创建工作簿
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '单词列表')

  // 下载文件
  XLSX.writeFile(wb, filename)
}

// 导出为 Markdown
export function exportToMarkdown(words: Word[], filename: string = 'vlog-words.md') {
  let markdown = '# Vlog Words - 生词本\n\n'
  markdown += `导出时间：${new Date().toLocaleString('zh-CN')}\n\n`
  markdown += `总计：${words.length} 个单词\n\n`
  markdown += '---\n\n'

  // 按分类分组
  const grouped = words.reduce((acc, word) => {
    const cat = word.category || '未分类'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(word)
    return acc
  }, {} as Record<string, Word[]>)

  // 生成 Markdown
  for (const [category, categoryWords] of Object.entries(grouped)) {
    markdown += `## ${category}\n\n`

    for (const word of categoryWords) {
      markdown += `### ${word.text}`
      if (word.phonetic) markdown += ` ${word.phonetic}`
      markdown += `\n\n`

      markdown += `**翻译**：${word.translation.replace(/\n/g, ' / ')}\n\n`

      if (word.example) {
        markdown += `**例句**：${word.example}\n\n`
      }

      if (word.derivatives && Object.keys(word.derivatives).length > 0) {
        markdown += `**词形**：\n`
        for (const [type, form] of Object.entries(word.derivatives)) {
          markdown += `- ${type}: ${form}\n`
        }
        markdown += '\n'
      }

      markdown += `**状态**：${word.status === 'learned' ? '✅ 已学会' : '🔄 复习中'}`
      if (word.viewCount) markdown += ` | 查看 ${word.viewCount} 次`
      if (word.source) markdown += ` | 来源：${word.source}`
      markdown += `\n\n`

      markdown += `---\n\n`
    }
  }

  // 下载文件
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
