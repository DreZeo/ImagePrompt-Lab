import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useStore } from '../store'
import { useCloseOnEscape } from '../hooks/useCloseOnEscape'
import { callPromptAgent, resolveEffectiveChatSettings, type PresetContext } from '../lib/chatApi'
import { createTemplateDraftFromPrompt, extractAssistantFinalPrompt, parseAssistantComposition, renderTemplatePrompt, saveUserTemplate, validateAssistantComposition, validateTemplateDraft, type TemplateDraft } from '../data/structuredPrompts'
import type { ChatMessage } from '../types'

interface PromptAgentModalProps {
  prompt: string
  onApplyPrompt: (prompt: string) => void
  onClose?: () => void
  seedMessage?: string
  onSeedConsumed?: () => void
}

function appendToPrompt(currentPrompt: string, addition: string): string {
  const current = currentPrompt.trim()
  const next = addition.trim()
  return current ? `${current}\n\n${next}` : next
}

function extractFinalPrompt(text: string): string {
  return extractAssistantFinalPrompt(text)
}

function shortText(text: string, max = 96): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized
}

function uniqueList(values: Array<string | undefined | null>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]))
}

export default function PromptAgentModal({ prompt, onApplyPrompt, onClose, seedMessage, onSeedConsumed }: PromptAgentModalProps) {
  const settings = useStore((s) => s.settings)
  const setShowSettings = useStore((s) => s.setShowSettings)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastPresetContext, setLastPresetContext] = useState<PresetContext | null>(null)
  const [presetOnly, setPresetOnly] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isPresetContextCollapsed, setIsPresetContextCollapsed] = useState(true)
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft | null>(null)
  const [draftStatus, setDraftStatus] = useState<string | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const agentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const agentPrevHeightRef = useRef(42)

  useCloseOnEscape(!isCollapsed, () => setIsCollapsed(true))

  const effectiveSettings = useMemo(() => resolveEffectiveChatSettings(settings), [settings])
  const canSend = input.trim() && !loading
  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant')
  const assistantPromptText = lastAssistantMessage ? extractFinalPrompt(lastAssistantMessage.content) : ''
  const assistantComposition = lastAssistantMessage ? parseAssistantComposition(lastAssistantMessage.content) : null
  const assistantValidation = assistantComposition ? validateAssistantComposition(assistantComposition, { presetOnly, visualIntent: lastPresetContext?.visualIntent }) : null
  const retrievalKeywords = useMemo(() => {
    if (!lastPresetContext) return []
    return uniqueList([
      ...lastPresetContext.styles.flatMap((style) => style.matchedKeywords),
      ...lastPresetContext.templates.flatMap((template) => template.matchedKeywords),
      ...lastPresetContext.references.flatMap((reference) => reference.keywords),
      ...lastPresetContext.knowledge.rules.flatMap((rule) => rule.matchedKeywords),
    ]).slice(0, 8)
  }, [lastPresetContext])
  const intentSummary = useMemo(() => {
    if (!lastPresetContext) return []
    const intent = lastPresetContext.visualIntent
    return uniqueList([intent.category, intent.purpose, intent.platform, intent.mood, intent.palette]).slice(0, 5)
  }, [lastPresetContext])
  const topRecommendation = lastPresetContext?.recommendations[0]

  useEffect(() => {
    if (!seedMessage) return
    setIsCollapsed(false)
    setInput(seedMessage)
    onSeedConsumed?.()
  }, [seedMessage, onSeedConsumed])

  const adjustAgentTextareaHeight = useCallback(() => {
    const el = agentTextareaRef.current
    if (!el) return
    const maxH = 200
    el.style.transition = 'none'
    el.style.height = '0'
    el.style.overflowY = 'hidden'
    const scrollH = el.scrollHeight
    const minH = 42
    const desired = Math.max(scrollH, minH)
    const targetH = desired > maxH ? maxH : desired
    el.style.height = agentPrevHeightRef.current + 'px'
    void el.offsetHeight
    el.style.transition = 'height 150ms ease, border-color 200ms, box-shadow 200ms'
    el.style.height = targetH + 'px'
    el.style.overflowY = desired > maxH ? 'auto' : 'hidden'
    agentPrevHeightRef.current = targetH
  }, [])

  useEffect(() => {
    adjustAgentTextareaHeight()
  }, [input, adjustAgentTextareaHeight])

  // Auto-focus the textarea when panel opens
  useEffect(() => {
    if (!isCollapsed) {
      const timer = window.setTimeout(() => {
        agentTextareaRef.current?.focus()
      }, 100)
      return () => window.clearTimeout(timer)
    }
  }, [isCollapsed])

  const sendMessage = async () => {
    const content = input.trim()
    if (!content || loading) return

    setError(null)
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      let assistantMessageStarted = false
      const result = await callPromptAgent(effectiveSettings, nextMessages, content, presetOnly, prompt, effectiveSettings.stream
        ? (_delta, fullText) => {
          assistantMessageStarted = true
          setMessages([...nextMessages, { role: 'assistant', content: fullText }])
          window.setTimeout(() => scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' }), 0)
        }
        : undefined)
      setLastPresetContext(result.presetContext)
      setIsPresetContextCollapsed(true)
      const parsed = parseAssistantComposition(result.content)
      if (parsed?.templateDraft && validateTemplateDraft(parsed.templateDraft).valid) setTemplateDraft(parsed.templateDraft)
      if (!assistantMessageStarted || result.content) setMessages([...nextMessages, { role: 'assistant', content: result.content }])
      if (parsed) {
        const validation = validateAssistantComposition(parsed, { presetOnly, visualIntent: result.presetContext.visualIntent })
        if (validation.invalidTemplateIds.length || validation.invalidStyleIds.length) {
          setDraftStatus(`已忽略无效预设 ID：${[...validation.invalidTemplateIds, ...validation.invalidStyleIds].join(', ')}`)
        }
      }
      window.setTimeout(() => scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' }), 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const openSettings = () => {
    setIsCollapsed(true)
    onClose?.()
    setShowSettings(true)
  }

  const createDraft = () => {
    const sourcePrompt = assistantPromptText || prompt
    if (!sourcePrompt.trim()) return
    setTemplateDraft(createTemplateDraftFromPrompt(sourcePrompt, '我的 AI 模板'))
    setDraftStatus('已生成模板草案，请检查后保存')
  }

  const saveDraft = () => {
    if (!templateDraft) return
    const validation = validateTemplateDraft(templateDraft)
    if (!validation.valid) {
      setDraftStatus(`模板无效：`)
      return
    }
    saveUserTemplate(templateDraft)
    setDraftStatus('模板已保存到我的模板')
  }

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed right-0 top-1/2 z-[80] -translate-y-1/2 rounded-l-2xl border border-r-0 border-white/60 bg-white/95 px-2.5 py-4 text-xs font-medium text-gray-600 shadow-[0_8px_30px_rgb(0,0,0,0.16)] ring-1 ring-black/5 transition hover:bg-gray-50 animate-attention-glow dark:border-white/[0.08] dark:bg-gray-900/95 dark:text-gray-300 dark:ring-white/10 dark:hover:bg-gray-800"
        title="展开 AI 提示词助手"
      >
        <span className="block [writing-mode:vertical-rl] tracking-wider">AI 助手</span>
      </button>
    )
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-full justify-end pointer-events-none sm:w-[min(520px,calc(100vw-24px))]">
      <div className="pointer-events-auto flex h-full w-full flex-col border-l border-gray-200/80 bg-white/95 shadow-[0_0_45px_rgb(0,0,0,0.18)] ring-1 ring-black/5 animate-panel-slide-in dark:border-white/[0.08] dark:bg-gray-900/95 dark:ring-white/10">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-gray-200/70 dark:border-white/[0.08]">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">AI 提示词助手</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">检索本地知识链，只写入 prompt</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setIsCollapsed(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-200 dark:hover:bg-white/[0.06] transition-colors"
              title="收起面板"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-5 py-3 border-b border-gray-200/70 dark:border-white/[0.08]">
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 dark:bg-white/[0.03] px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
            <span>仅使用本地知识</span>
            <input
              type="checkbox"
              checked={presetOnly}
              onChange={(event) => setPresetOnly(event.target.checked)}
              className="h-4 w-4 accent-blue-500"
            />
          </label>
        </div>

        <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3 custom-scrollbar">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.08] p-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              描述你想生成的图片。我会先构建本地知识链，再帮你分析视觉策略并输出最终 prompt。
            </div>
          )}

          {lastPresetContext && (
            <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 p-3 shadow-sm dark:border-white/[0.08] dark:from-slate-950/70 dark:via-slate-900/70 dark:to-blue-950/20 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">本地知识检索完成</div>
                  <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">基于输入意图完成结构策略、视觉语言、专业规则召回</div>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  {lastPresetContext.presetOnly && <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-600 dark:text-blue-300">仅本地知识</span>}
                  <button onClick={() => setIsPresetContextCollapsed((value) => !value)} className="rounded-full bg-white/90 px-2.5 py-1 text-slate-500 shadow-sm ring-1 ring-slate-200/70 hover:text-blue-600 dark:bg-white/[0.06] dark:text-slate-300 dark:ring-white/[0.08] dark:hover:text-blue-300">
                    {isPresetContextCollapsed ? '展开' : '收起'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[
                  ['视觉语言', lastPresetContext.styles.length],
                  ['结构策略', lastPresetContext.strategyChains.length],
                  ['专业规则', lastPresetContext.knowledge.rules.length],
                  ['参考灵感', lastPresetContext.references.length],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white/80 px-3 py-2.5 text-center shadow-sm ring-1 ring-slate-200/60 dark:bg-white/[0.04] dark:ring-white/[0.06]">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">{label}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-white/75 p-2.5 text-[11px] text-slate-500 shadow-sm ring-1 ring-slate-200/60 dark:bg-white/[0.04] dark:text-slate-400 dark:ring-white/[0.06]">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-600 dark:text-slate-300">知识链路</span>
                  <span className="text-slate-400 dark:text-slate-500">输入理解 → 策略组装 → 规则约束 → 参考去污染</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">意图解析</div>
                    <div className="flex flex-wrap gap-1">
                      {intentSummary.length ? intentSummary.map((item) => <span key={item} className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-indigo-600 dark:text-indigo-300">{item}</span>) : <span className="text-slate-400 dark:text-slate-500">自动识别中</span>}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">命中关键词</div>
                    <div className="flex flex-wrap gap-1">
                      {retrievalKeywords.length ? retrievalKeywords.map((keyword) => <span key={keyword} className="rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-600 dark:text-blue-300">{keyword}</span>) : <span className="text-slate-400 dark:text-slate-500">暂无显式关键词命中</span>}
                    </div>
                  </div>
                </div>
                {topRecommendation && (
                  <div className="mt-2 rounded-xl bg-slate-50 px-2 py-1.5 text-slate-600 dark:bg-black/20 dark:text-slate-300">
                    最佳结构候选：<span className="font-medium">{topRecommendation.template.name}</span> · {(topRecommendation.confidence * 100).toFixed(0)}%
                  </div>
                )}
              </div>

              {!isPresetContextCollapsed && (
                <>
                  {lastPresetContext.strategyChains.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">策略链</div>
                      {lastPresetContext.strategyChains.map((chain) => (
                        <div key={chain.id} className="rounded-2xl bg-white/85 p-3 text-xs text-slate-600 shadow-sm ring-1 ring-slate-200/60 dark:bg-white/[0.04] dark:text-slate-300 dark:ring-white/[0.06]">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium text-slate-800 dark:text-slate-100">{chain.title}</div>
                            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-600 dark:text-blue-300">{(chain.confidence * 100).toFixed(0)}%</span>
                          </div>
                          {chain.scenarioLabel && <div className="mt-1 inline-flex rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] text-indigo-600 dark:text-indigo-300">场景策略：{chain.scenarioLabel}</div>}
                          <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{chain.reason}</div>
                          <div className="mt-2 grid grid-cols-1 gap-2">
                            {[
                              ['结构策略', chain.keywordPack.structure],
                              ['构图线索', chain.keywordPack.composition],
                              ['视觉语言', chain.keywordPack.visual],
                              ['质量约束', chain.keywordPack.quality],
                              ['负面控制', chain.keywordPack.negative],
                            ].map(([label, values]) => (
                              <div key={label as string}>
                                <div className="mb-1 text-[10px] text-slate-400 dark:text-slate-500">{label as string}</div>
                                <div className="flex flex-wrap gap-1">
                                  {(values as string[]).length ? (values as string[]).slice(0, 6).map((value) => <span key={value} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-white/[0.06] dark:text-slate-300">{shortText(value, 32)}</span>) : <span className="text-[11px] text-slate-400">无</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {lastPresetContext.knowledge.rules.length > 0 && (
                    <div className="space-y-1.5 border-t border-slate-200/60 dark:border-white/[0.06] pt-3">
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">专业规则</div>
                      <div className="flex flex-wrap gap-1.5">
                        {lastPresetContext.knowledge.rules.slice(0, 5).map((entry) => (
                          <span key={entry.item.id} title={entry.item.description} className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-700 ring-1 ring-emerald-500/10 dark:text-emerald-200">
                            {entry.item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {lastPresetContext.references.length > 0 && (
                    <div className="space-y-1.5 border-t border-slate-200/60 dark:border-white/[0.06] pt-3">
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">参考灵感（不直接套用）</div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {lastPresetContext.references.slice(0, 3).map((reference) => (
                          <div key={reference.id} className="rounded-2xl bg-white/70 px-3 py-2 text-xs text-slate-600 shadow-sm ring-1 ring-slate-200/60 dark:bg-white/[0.04] dark:text-slate-300 dark:ring-white/[0.06]">
                            <div className="font-medium">{shortText(reference.title, 72)}</div>
                            <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                              {[...reference.traits, ...reference.strengths].slice(0, 6).map((item) => <span key={item} className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-200">{item}</span>)}
                            </div>
                            {reference.risks.length > 0 && <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">规避：{reference.risks.join('、')}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <details className="border-t border-slate-200/60 pt-3 text-[11px] text-slate-500 dark:border-white/[0.06] dark:text-slate-400">
                    <summary className="cursor-pointer font-medium">内部证据</summary>
                    <div className="mt-2 space-y-2">
                      {lastPresetContext.styles.length > 0 && <div>视觉语言 ID：{lastPresetContext.styles.map((style) => style.id).join(', ')}</div>}
                      {lastPresetContext.templates.length > 0 && <div>结构来源 ID：{lastPresetContext.templates.map((template) => template.id).join(', ')}</div>}
                      {lastPresetContext.references.length > 0 && <div>参考来源 ID：{lastPresetContext.references.map((reference) => reference.id).join(', ')}</div>}
                    </div>
                  </details>

                  {!lastPresetContext.styles.length && !lastPresetContext.templates.length && !lastPresetContext.strategyChains.length && (
                    <div className="text-xs text-gray-400 dark:text-gray-500">没有找到合适的本地知识，可以换关键词或关闭仅本地知识。</div>
                  )}
                </>
              )}
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white whitespace-pre-wrap'
                  : 'bg-gray-100 text-gray-700 dark:bg-white/[0.06] dark:text-gray-200'
              }`}>
                {message.role === 'assistant' ? (
                  <div className="markdown-message">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 px-1">
              <span>AI 正在分析</span>
              <span className="loading-dots">
                <span /><span /><span />
              </span>
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 px-3 py-2 text-xs">
              {error} <button className="underline" onClick={openSettings}>打开设置</button>
            </div>
          )}

          {assistantComposition?.recommendations?.length ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">
              <div className="font-semibold">AI 结构化建议</div>
              {assistantComposition.recommendations.slice(0, 3).map((item, index) => (
                <div key={`${item.templateId ?? 'custom'}-${index}`} className="mt-1">
                  {item.templateId ?? '自定义'} · {item.styleIds?.join(', ') || '无画风'} · {item.reason ?? ''}
                </div>
              ))}
              {assistantValidation?.warnings.length ? (
                <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-200">校验提示：{assistantValidation.warnings.join('；')}</div>
              ) : null}
            </div>
          ) : null}

          {templateDraft && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-xs text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold">模板草案：{templateDraft.name}</div>
                  <div className="mt-1 opacity-80">{templateDraft.description}</div>
                </div>
                <button onClick={saveDraft} className="rounded-lg bg-emerald-500 px-2.5 py-1.5 text-white hover:bg-emerald-600">保存</button>
              </div>
              <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap rounded-xl bg-white/70 p-2 text-[11px] text-emerald-900 dark:bg-black/20 dark:text-emerald-100">{renderTemplatePrompt(templateDraft, { subject: '示例主题' })}</pre>
              {draftStatus && <div className="mt-2 opacity-80">{draftStatus}</div>}
            </div>
          )}
        </div>

        {assistantPromptText && (
          <div className="px-4 sm:px-5 py-3 border-t border-gray-200/70 dark:border-white/[0.08] flex gap-2">
            <button
              onClick={() => onApplyPrompt(appendToPrompt(prompt, assistantPromptText))}
              className="flex-1 rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/[0.1] transition-colors"
            >
              插入 AI 结果
            </button>
            <button
              onClick={() => onApplyPrompt(assistantPromptText)}
              className="flex-1 rounded-xl bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 transition-colors"
            >
              替换为 AI 结果
            </button>
            <button
              onClick={createDraft}
              className="rounded-xl bg-emerald-500 px-3 py-2 text-sm text-white hover:bg-emerald-600 transition-colors"
            >
              存为模板
            </button>
          </div>
        )}

        <div className="p-4 sm:p-5 border-t border-gray-200/70 dark:border-white/[0.08]">
          <div className="flex items-end gap-2">
            <textarea
              ref={agentTextareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                if (e.shiftKey) return
                e.preventDefault()
                sendMessage()
              }}
              rows={1}
              placeholder="例如：我想做一张小红书风格的高级咖啡产品海报，少文字..."
              className="flex-1 rounded-2xl border border-gray-200/70 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              onClick={sendMessage}
              disabled={!canSend}
              className="self-stretch px-4 rounded-2xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed dark:disabled:bg-white/[0.08] transition-colors"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
