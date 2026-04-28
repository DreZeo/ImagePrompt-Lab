import { useMemo, useState } from 'react'
import { useCloseOnEscape } from '../hooks/useCloseOnEscape'
import {
  STRUCTURED_STYLE_PRESETS,
  TEMPLATE_CATEGORY_LABELS,
  composeStylePrompt,
  deleteUserTemplate,
  getLegacyReferenceTemplates,
  getUserTemplates,
  renderTemplatePrompt,
  searchStructuredStyles,
  searchStructuredTemplates,
  updateUserTemplate,
  validateTemplateDraft,
  type PromptTemplateCategory,
  type StructuredPromptTemplate,
  type StructuredStylePreset,
  type TemplateDraft,
} from '../data/structuredPrompts'

type PresetTab = 'styles' | 'templates' | 'custom'
type TemplateSourceTab = 'main' | 'legacy'

interface PromptPresetModalProps {
  prompt: string
  onApplyPrompt: (prompt: string) => void
  onClose: () => void
}

function appendToPrompt(currentPrompt: string, addition: string): string {
  const current = currentPrompt.trim()
  const next = addition.trim()
  return current ? `${current}\n\n${next}` : next
}

function truncateText(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength).trim()}...` : normalized
}

function matchesCustomTemplate(template: TemplateDraft, query: string): boolean {
  const keyword = query.trim().toLowerCase()
  if (!keyword) return true
  return [
    template.name,
    template.description,
    template.promptPattern,
    template.negativePrompt,
    ...template.tags,
    ...template.examples,
  ].join(' ').toLowerCase().includes(keyword)
}

function matchesTemplate(
  template: StructuredPromptTemplate,
  query: string,
  category: PromptTemplateCategory | 'all',
): boolean {
  if (category !== 'all' && template.category !== category) return false
  const keyword = query.trim().toLowerCase()
  if (!keyword) return true
  return [
    template.name,
    template.description,
    template.promptPattern,
    template.negativePrompt,
    template.sourceTitle ?? '',
    template.sourcePrompt ?? '',
    ...template.tags,
    ...template.examples,
  ].join(' ').toLowerCase().includes(keyword)
}

export default function PromptPresetModal({ prompt, onApplyPrompt, onClose }: PromptPresetModalProps) {
  const [activeTab, setActiveTab] = useState<PresetTab>('styles')
  const [templateSource, setTemplateSource] = useState<TemplateSourceTab>('main')
  const [styleQuery, setStyleQuery] = useState('')
  const [templateQuery, setTemplateQuery] = useState('')
  const [customQuery, setCustomQuery] = useState('')
  const [templateCategory, setTemplateCategory] = useState<PromptTemplateCategory | 'all'>('all')
  const [customTemplates, setCustomTemplates] = useState<TemplateDraft[]>(() => getUserTemplates())
  const [editingTemplate, setEditingTemplate] = useState<TemplateDraft | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  useCloseOnEscape(true, onClose)

  const styles = useMemo(() => searchStructuredStyles(styleQuery).map((entry) => entry.item), [styleQuery])
  const mainTemplates = useMemo(
    () => searchStructuredTemplates(templateQuery, templateCategory).map((entry) => entry.item).filter((template) => template.source !== 'user'),
    [templateQuery, templateCategory],
  )
  const legacyTemplates = useMemo(
    () => getLegacyReferenceTemplates().filter((template) => matchesTemplate(template, templateQuery, templateCategory)),
    [templateCategory, templateQuery],
  )
  const templates = templateSource === 'main' ? mainTemplates : legacyTemplates
  const filteredCustomTemplates = useMemo(
    () => customTemplates.filter((template) => matchesCustomTemplate(template, customQuery)),
    [customTemplates, customQuery],
  )

  const applyStyle = (style: StructuredStylePreset) => {
    onApplyPrompt(appendToPrompt(prompt, composeStylePrompt(style)))
    onClose()
  }

  const replaceWithTemplate = (template: StructuredPromptTemplate) => {
    onApplyPrompt(renderTemplatePrompt(template))
    onClose()
  }

  const insertTemplate = (template: StructuredPromptTemplate) => {
    onApplyPrompt(appendToPrompt(prompt, renderTemplatePrompt(template)))
    onClose()
  }

  const saveEditingTemplate = () => {
    if (!editingTemplate) return
    const validation = validateTemplateDraft(editingTemplate)
    if (!validation.valid) {
      setEditError(validation.errors.join('；'))
      return
    }
    const result = updateUserTemplate(editingTemplate)
    if (result.errors.length) {
      setEditError(result.errors.join('；'))
      return
    }
    setCustomTemplates(result.templates)
    setEditingTemplate(null)
    setEditError(null)
  }

  const removeCustomTemplate = (template: TemplateDraft) => {
    if (!window.confirm(`删除自定义提示词“${template.name}”？`)) return
    setCustomTemplates(deleteUserTemplate(template.id))
  }

  const renderTemplateCard = (template: StructuredPromptTemplate, custom = false) => (
    <div key={template.id} className="rounded-2xl border border-gray-200/70 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] p-3 flex flex-col gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[11px] text-gray-500 dark:text-gray-400 flex-shrink-0">{TEMPLATE_CATEGORY_LABELS[template.category]}</span>
          {template.source && <span className="text-[11px] text-gray-400 dark:text-gray-500">{custom ? '自定义' : template.source === 'legacy' ? '旧固定模板' : template.source}</span>}
          {template.isPlaceholderOnly && <span className="text-[11px] text-amber-500">需补全</span>}
        </div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2">{template.name}</h3>
        <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-3">{truncateText(template.description || template.promptPattern, 220)}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500 line-clamp-2">槽位：{Object.values(template.slots).map((slot) => slot.label).join('、') || '无'}</p>
      </div>
      <div className="flex items-center justify-between gap-2 mt-auto">
        <div className="text-[11px] text-gray-400 dark:text-gray-500 min-w-0 truncate">{template.tags.slice(0, 4).join(' · ')}</div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {custom && (
            <>
              <button onClick={() => setEditingTemplate(template as TemplateDraft)} className="px-2.5 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors">编辑</button>
              <button onClick={() => removeCustomTemplate(template as TemplateDraft)} className="px-2.5 py-1.5 rounded-lg text-xs text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">删除</button>
            </>
          )}
          <button onClick={() => insertTemplate(template)} className="px-2.5 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors">插入</button>
          <button onClick={() => replaceWithTemplate(template)} className="px-2.5 py-1.5 rounded-lg text-xs text-white bg-blue-500 hover:bg-blue-600 transition-colors">替换</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3 sm:p-5" onClick={onClose}>
      <div className="absolute inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-md" />
      <div className="relative z-10 w-full max-w-4xl max-h-[86vh] bg-white/95 dark:bg-gray-900/95 border border-white/60 dark:border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-[0_12px_50px_rgb(0,0,0,0.18)] dark:shadow-[0_12px_50px_rgb(0,0,0,0.45)] ring-1 ring-black/5 dark:ring-white/10 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-gray-200/70 dark:border-white/[0.08]">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">结构化提示词预设</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">模板负责场景结构，画风负责视觉语言，自定义提示词属于你的资产库</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-200 dark:hover:bg-white/[0.06] transition-colors flex-shrink-0" title="关闭">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-4 sm:px-5 pt-4">
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-gray-100/80 dark:bg-white/[0.04] p-1">
            {([
              ['styles', `画风 ${STRUCTURED_STYLE_PRESETS.length}`],
              ['templates', `模板 ${templates.length}`],
              ['custom', `自定义 ${customTemplates.length}`],
            ] as Array<[PresetTab, string]>).map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab ? 'bg-white dark:bg-white/[0.08] text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>{label}</button>
            ))}
          </div>
        </div>

        {activeTab === 'styles' ? (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="px-4 sm:px-5 py-3"><input value={styleQuery} onChange={(e) => setStyleQuery(e.target.value)} placeholder="搜索画风、英文关键词或视觉特征" className="w-full px-3 py-2 rounded-xl border border-gray-200/70 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
            <div className="px-4 sm:px-5 pb-5 overflow-y-auto min-h-0"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {styles.map((style) => <button key={style.id} onClick={() => applyStyle(style)} className="text-left rounded-2xl border border-gray-200/70 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] p-3 hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{style.name}</div><div className="text-xs text-blue-500 dark:text-blue-400 mt-0.5 truncate">{style.englishKeyword}</div></div><span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">{style.id.replace('style-', '')}</span></div><p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{style.description}</p><p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 line-clamp-2">适合：{style.bestFor.map((category) => TEMPLATE_CATEGORY_LABELS[category]).join('、')}</p><p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 line-clamp-2">{style.promptFragment}</p></button>)}
            </div></div>
          </div>
        ) : activeTab === 'templates' ? (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="px-4 sm:px-5 py-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-2"><input value={templateQuery} onChange={(e) => setTemplateQuery(e.target.value)} placeholder="搜索中文模板、标签、槽位或使用场景" className="w-full px-3 py-2 rounded-xl border border-gray-200/70 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" /><select value={templateCategory} onChange={(e) => setTemplateCategory(e.target.value as PromptTemplateCategory | 'all')} className="w-full px-3 py-2 rounded-xl border border-gray-200/70 dark:border-white/[0.08] bg-white/70 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"><option value="all">全部分类</option>{Object.entries(TEMPLATE_CATEGORY_LABELS).map(([category, label]) => <option key={category} value={category}>{label}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-1 rounded-2xl bg-gray-100/80 dark:bg-white/[0.04] p-1">
                {([
                  ['main', '结构/场景模板'],
                  ['legacy', '旧固定模板'],
                ] as Array<[TemplateSourceTab, string]>).map(([source, label]) => (
                  <button
                    key={source}
                    onClick={() => setTemplateSource(source)}
                    className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                      templateSource === source
                        ? 'bg-white dark:bg-white/[0.08] text-gray-800 dark:text-gray-100 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 sm:px-5 pb-5 overflow-y-auto min-h-0"><div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{templates.map((template) => renderTemplateCard(template))}</div></div>
          </div>
        ) : (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="px-4 sm:px-5 py-3"><input value={customQuery} onChange={(e) => setCustomQuery(e.target.value)} placeholder="搜索你的自定义提示词" className="w-full px-3 py-2 rounded-xl border border-gray-200/70 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
            <div className="px-4 sm:px-5 pb-5 overflow-y-auto min-h-0">
              {filteredCustomTemplates.length ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{filteredCustomTemplates.map((template) => renderTemplateCard(template, true))}</div> : <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.1] p-8 text-center text-sm text-gray-500 dark:text-gray-400">暂无自定义提示词。你可以在 AI 助手中生成模板草案并保存，之后会出现在这里。</div>}
            </div>
          </div>
        )}

        {editingTemplate && (
          <div className="absolute inset-0 z-20 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/[0.08] p-4 shadow-2xl space-y-3">
              <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">编辑自定义提示词</h3><button onClick={() => setEditingTemplate(null)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">关闭</button></div>
              <input value={editingTemplate.name} onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200/70 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] text-sm" placeholder="名称" />
              <textarea value={editingTemplate.description} onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })} className="w-full h-20 px-3 py-2 rounded-xl border border-gray-200/70 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] text-sm" placeholder="描述" />
              <textarea value={editingTemplate.promptPattern} onChange={(e) => setEditingTemplate({ ...editingTemplate, promptPattern: e.target.value })} className="w-full h-40 px-3 py-2 rounded-xl border border-gray-200/70 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] text-sm font-mono" placeholder="提示词模板，可包含 {{subject}} 等槽位" />
              <input value={editingTemplate.tags.join('，')} onChange={(e) => setEditingTemplate({ ...editingTemplate, tags: e.target.value.split(/[，,]/).map((item) => item.trim()).filter(Boolean) })} className="w-full px-3 py-2 rounded-xl border border-gray-200/70 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] text-sm" placeholder="标签，用逗号分隔" />
              {editError && <div className="text-xs text-red-500">{editError}</div>}
              <div className="flex justify-end gap-2"><button onClick={() => setEditingTemplate(null)} className="px-3 py-2 rounded-xl text-sm bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300">取消</button><button onClick={saveEditingTemplate} className="px-3 py-2 rounded-xl text-sm bg-blue-500 text-white">保存</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
