import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useStore } from '../store'
import { useCloseOnEscape } from '../hooks/useCloseOnEscape'
import {
  callPromptAgent,
  generatePromptAgentSessionTitle,
  resolveEffectiveChatSettings,
  type PresetContext,
} from '../lib/chatApi'
import {
  createTemplateDraftFromPrompt,
  extractAssistantFinalPrompt,
  normalizeAssistantComposition,
  parseAssistantComposition,
  renderTemplatePrompt,
  saveUserTemplate,
  validateAssistantComposition,
  validateFinalPromptText,
  validateTemplateDraft,
  type TemplateDraft,
} from '../data/structuredPrompts'
import {
  createPromptAgentMessage,
  promptAgentMessagesToChatMessages,
  type PromptAgentMessage,
  type PromptAgentMessageArtifacts,
} from '../lib/promptAgentSession'

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

function buildAssistantArtifacts(
  content: string,
  presetContext: PresetContext | null,
  presetOnly: boolean,
): PromptAgentMessageArtifacts {
  const composition = normalizeAssistantComposition(parseAssistantComposition(content))
  const validation = composition && presetContext
    ? validateAssistantComposition(composition, { presetOnly, visualIntent: presetContext.visualIntent })
    : null
  const finalPrompt = extractFinalPrompt(content)
  const templateDraft = composition?.templateDraft && validateTemplateDraft(composition.templateDraft).valid
    ? composition.templateDraft
    : null
  const invalidIds = validation ? [...validation.invalidTemplateIds, ...validation.invalidStyleIds] : []
  const promptWarnings = validation?.promptWarnings ?? validateFinalPromptText(finalPrompt, presetContext?.visualIntent)
  const validationNotes = [
    ...(composition?.validationNotes ?? []),
    ...promptWarnings.map((message) => ({ type: 'anti-template' as const, severity: 'warning' as const, message })),
  ]
  const knowledgeMatch = content.match(/Used knowledge IDs:\s*(.+)/i)
  const knowledgeIds = knowledgeMatch
    ? knowledgeMatch[1].split(/[,，;；\s]+/).map((id) => id.trim()).filter((id) => id && id.length > 1)
    : []
  return {
    finalPrompt,
    presetContext,
    composition,
    validation,
    templateDraft,
    draftStatus: invalidIds.length ? `已忽略无效预设 ID：${invalidIds.join(', ')}` : null,
    knowledgeIds,
    borrowedSources: composition?.borrowedSources ?? [],
    rejectedTraits: composition?.rejectedTraits ?? [],
    validationNotes,
    rewriteStages: composition?.rewriteStages ?? null,
  }
}

function sessionTitle(title: string): string {
  return title.trim() || '新会话'
}

export default function PromptAgentModal({ prompt, onApplyPrompt, onClose, seedMessage, onSeedConsumed }: PromptAgentModalProps) {
  const settings = useStore((s) => s.settings)
  const setShowSettings = useStore((s) => s.setShowSettings)
  const setConfirmDialog = useStore((s) => s.setConfirmDialog)
  const showToast = useStore((s) => s.showToast)
  const sessions = useStore((s) => s.promptAgentSessions)
  const activeSessionId = useStore((s) => s.activePromptAgentSessionId)
  const rewriteState = useStore((s) => s.promptAgentRewrite)
  const ensureSession = useStore((s) => s.ensurePromptAgentSession)
  const createSession = useStore((s) => s.createPromptAgentSession)
  const selectSession = useStore((s) => s.selectPromptAgentSession)
  const deleteSession = useStore((s) => s.deletePromptAgentSession)
  const renameSession = useStore((s) => s.renamePromptAgentSession)
  const setSessionTitle = useStore((s) => s.setPromptAgentSessionTitle)
  const appendMessage = useStore((s) => s.appendPromptAgentMessage)
  const updateMessage = useStore((s) => s.updatePromptAgentMessage)
  const updateArtifacts = useStore((s) => s.updatePromptAgentMessageArtifacts)
  const startRewrite = useStore((s) => s.startPromptAgentRewrite)
  const cancelRewrite = useStore((s) => s.cancelPromptAgentRewrite)

  const [input, setInput] = useState('')
  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [presetOnly, setPresetOnly] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isSessionsOpen, setIsSessionsOpen] = useState(false)
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [expandedArtifacts, setExpandedArtifacts] = useState<Record<string, boolean>>({})
  const scrollerRef = useRef<HTMLDivElement>(null)
  const agentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const agentPrevHeightRef = useRef(42)

  useCloseOnEscape(!isCollapsed, () => setIsCollapsed(true))

  const effectiveSettings = useMemo(() => resolveEffectiveChatSettings(settings), [settings])
  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? sessions[0] ?? null,
    [sessions, activeSessionId],
  )
  const messages = activeSession?.messages ?? []
  const loading = Boolean(loadingMessageId)
  const canSend = input.trim() && !loading
  const sortedSessions = useMemo(() => [...sessions].sort((a, b) => b.updatedAt - a.updatedAt), [sessions])
  const rewriteActive = rewriteState?.sessionId === activeSession?.id

  useEffect(() => {
    if (!isCollapsed) ensureSession()
  }, [ensureSession, isCollapsed])

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

  useEffect(() => {
    if (!isCollapsed) {
      const timer = window.setTimeout(() => {
        agentTextareaRef.current?.focus()
      }, 100)
      return () => window.clearTimeout(timer)
    }
  }, [isCollapsed])

  const scrollToBottom = useCallback(() => {
    window.setTimeout(() => scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' }), 0)
  }, [])

  const maybeGenerateTitle = useCallback(async (sessionId: string) => {
    const session = useStore.getState().promptAgentSessions.find((item) => item.id === sessionId)
    if (!session || session.titleStatus === 'manual' || session.titleStatus === 'generated') return
    const hasAssistant = session.messages.some((message) => message.role === 'assistant' && message.status === 'done' && message.content.trim())
    if (!hasAssistant) return
    try {
      const title = await generatePromptAgentSessionTitle(effectiveSettings, promptAgentMessagesToChatMessages(session.messages))
      if (title) setSessionTitle(sessionId, title, 'generated')
      else setSessionTitle(sessionId, session.title, 'failed')
    } catch {
      const latest = useStore.getState().promptAgentSessions.find((item) => item.id === sessionId)
      if (latest && latest.titleStatus !== 'manual') setSessionTitle(sessionId, latest.title, 'failed')
    }
  }, [effectiveSettings, setSessionTitle])

  const sendMessage = async () => {
    const content = input.trim()
    if (!content || loading) return

    const session = activeSession ?? ensureSession()
    const sessionPromptContext = session.messages.length === 0 ? '' : prompt
    setError(null)
    const userMessage = createPromptAgentMessage('user', content)
    const assistantMessage = createPromptAgentMessage('assistant', '', 'streaming')
    const contextMessages = promptAgentMessagesToChatMessages([...session.messages, userMessage])

    appendMessage(session.id, userMessage)
    appendMessage(session.id, assistantMessage)
    cancelRewrite()
    setInput('')
    setLoadingMessageId(assistantMessage.id)
    setSelectedMessageId(assistantMessage.id)
    setExpandedArtifacts((value) => ({ ...value, [assistantMessage.id]: true }))
    scrollToBottom()

    try {
      const result = await callPromptAgent(effectiveSettings, contextMessages, content, presetOnly, sessionPromptContext, effectiveSettings.stream
        ? (_delta, fullText) => {
          updateMessage(session.id, assistantMessage.id, { content: fullText, status: 'streaming' })
          scrollToBottom()
        }
        : undefined)
      const artifacts = buildAssistantArtifacts(result.content, result.presetContext, presetOnly)
      updateMessage(session.id, assistantMessage.id, {
        content: result.content,
        status: 'done',
        error: null,
      })
      updateArtifacts(session.id, assistantMessage.id, artifacts)
      if (!result.content.trim()) throw new Error('接口未返回助手回复')
      if (artifacts.draftStatus) showToast(artifacts.draftStatus, 'info')
      maybeGenerateTitle(session.id)
      scrollToBottom()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      updateMessage(session.id, assistantMessage.id, { content: message, status: 'error', error: message })
    } finally {
      setLoadingMessageId(null)
    }
  }

  const openSettings = () => {
    setIsCollapsed(true)
    onClose?.()
    setShowSettings(true)
  }

  const startRename = (sessionId: string, title: string) => {
    setRenamingSessionId(sessionId)
    setRenameValue(title)
  }

  const commitRename = () => {
    if (!renamingSessionId) return
    renameSession(renamingSessionId, renameValue)
    setRenamingSessionId(null)
    setRenameValue('')
  }

  const confirmDeleteSession = (sessionId: string) => {
    const session = sessions.find((item) => item.id === sessionId)
    setConfirmDialog({
      title: '删除会话',
      message: `确定要删除“${sessionTitle(session?.title ?? '新会话')}”吗？此操作会删除该会话内的所有聊天消息。`,
      action: () => {
        deleteSession(sessionId)
        setSelectedMessageId(null)
      },
    })
  }

  const copyText = async (text: string, label = '已复制') => {
    try {
      await navigator.clipboard.writeText(text)
      showToast(label, 'success')
    } catch {
      showToast('复制失败，请手动复制', 'error')
    }
  }

  const handleRewrite = (message: PromptAgentMessage) => {
    if (!activeSession) return
    const content = startRewrite(activeSession.id, message.id)
    if (!content) return
    setInput(content)
    setSelectedMessageId(null)
    window.setTimeout(() => agentTextareaRef.current?.focus(), 0)
  }

  const saveDraft = (draft: TemplateDraft) => {
    const validation = validateTemplateDraft(draft)
    if (!validation.valid) {
      showToast('模板无效，无法保存', 'error')
      return
    }
    saveUserTemplate(draft)
    showToast('模板已保存到我的模板', 'success')
  }

  const createDraftForMessage = (message: PromptAgentMessage) => {
    if (!activeSession) return
    const sourcePrompt = message.artifacts?.finalPrompt || extractFinalPrompt(message.content) || prompt
    if (!sourcePrompt.trim()) return
    updateArtifacts(activeSession.id, message.id, {
      templateDraft: createTemplateDraftFromPrompt(sourcePrompt, '我的 AI 模板'),
      draftStatus: '已生成模板草案，请检查后保存',
    })
    setExpandedArtifacts((value) => ({ ...value, [message.id]: true }))
  }

  const renderPresetContext = (message: PromptAgentMessage) => {
    const context = message.artifacts?.presetContext
    if (!context) return null
    const retrievalKeywords = uniqueList([
      ...context.styles.flatMap((style) => style.matchedKeywords),
      ...context.templates.flatMap((template) => template.matchedKeywords),
      ...context.references.flatMap((reference) => reference.keywords),
      ...context.knowledge.rules.flatMap((rule) => rule.matchedKeywords),
    ]).slice(0, 8)
    const intent = context.visualIntent
    const intentSummary = uniqueList([intent.category, intent.purpose, intent.platform, intent.mood, intent.palette]).slice(0, 5)
    const topRecommendation = context.recommendations[0]

    return (
      <div className="mt-3 space-y-3 rounded-2xl bg-slate-50/90 p-3 text-xs text-slate-600 ring-1 ring-slate-200/70 dark:bg-white/[0.04] dark:text-slate-300 dark:ring-white/[0.06]">
        <div className="grid grid-cols-4 gap-1.5">
          {[
            ['视觉语言', context.styles.length],
            ['结构策略', context.strategyChains.length],
            ['专业规则', context.knowledge.rules.length],
            ['参考灵感', context.references.length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white/80 px-2 py-2 text-center shadow-sm ring-1 ring-slate-200/60 dark:bg-black/20 dark:ring-white/[0.06]">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">{label}</div>
            </div>
          ))}
        </div>
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
        {message.artifacts?.knowledgeIds?.length ? (
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">LLM 引用知识规则</div>
            <div className="flex flex-wrap gap-1">
              {message.artifacts.knowledgeIds.map((id) => (
                <span key={id} className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-600 dark:text-amber-300">{id}</span>
              ))}
            </div>
          </div>
        ) : null}
        {topRecommendation && (
          <div className="rounded-xl bg-white/80 px-2 py-1.5 text-slate-600 dark:bg-black/20 dark:text-slate-300">
            最佳结构候选：<span className="font-medium">{topRecommendation.template.name}</span> · {(topRecommendation.confidence * 100).toFixed(0)}%
          </div>
        )}
        {context.strategyChains.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">策略链</div>
            {context.strategyChains.slice(0, 3).map((chain) => (
              <div key={chain.id} className="rounded-2xl bg-white/85 p-3 text-xs shadow-sm ring-1 ring-slate-200/60 dark:bg-black/20 dark:ring-white/[0.06]">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-slate-800 dark:text-slate-100">{chain.title}</div>
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-600 dark:text-blue-300">{(chain.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {[...chain.keywordPack.structure, ...chain.keywordPack.visual, ...chain.keywordPack.quality].slice(0, 8).map((keyword) => (
                    <span key={keyword} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-white/[0.06] dark:text-slate-300">{keyword}</span>
                  ))}
                </div>
                <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">{chain.reason}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderEvidencePanel = (message: PromptAgentMessage) => {
    const artifacts = message.artifacts
    const borrowed = artifacts?.borrowedSources ?? artifacts?.composition?.borrowedSources ?? []
    const rejected = artifacts?.rejectedTraits ?? artifacts?.composition?.rejectedTraits ?? []
    const notes = artifacts?.validationNotes ?? artifacts?.composition?.validationNotes ?? []
    if (!borrowed.length && !rejected.length && !notes.length) return null

    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300">
        <div className="mb-2 font-semibold text-slate-700 dark:text-slate-100">创作依据</div>
        {borrowed.length ? (
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wide text-emerald-600/80 dark:text-emerald-300/80">借鉴</div>
            <div className="space-y-1.5">
              {borrowed.slice(0, 4).map((item, index) => (
                <div key={`${item.id ?? item.title ?? 'borrowed'}-${index}`} className="rounded-xl bg-white/80 px-2 py-1.5 dark:bg-black/20">
                  <span className="font-medium">{item.title || item.id || item.sourceType || '本地知识'}</span>
                  <span className="text-slate-400"> · {item.aspects.slice(0, 3).map((aspect) => shortText(aspect, 42)).join('、')}</span>
                  {item.reason ? <span className="text-slate-400"> · {shortText(item.reason, 64)}</span> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {rejected.length ? (
          <div className={borrowed.length ? 'mt-3' : ''}>
            <div className="mb-1 text-[10px] uppercase tracking-wide text-rose-600/80 dark:text-rose-300/80">舍弃</div>
            <div className="flex flex-wrap gap-1">
              {rejected.slice(0, 8).map((item, index) => (
                <span key={`${item.id ?? item.trait}-${index}`} className="rounded-full bg-rose-500/10 px-2 py-0.5 text-rose-600 dark:text-rose-300" title={item.reason ?? item.id ?? ''}>
                  {shortText(item.trait, 32)}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {notes.length ? (
          <div className={borrowed.length || rejected.length ? 'mt-3' : ''}>
            <div className="mb-1 text-[10px] uppercase tracking-wide text-amber-600/80 dark:text-amber-300/80">校验</div>
            <div className="space-y-1">
              {notes.slice(0, 5).map((note, index) => (
                <div key={`${note.message}-${index}`} className={`rounded-xl px-2 py-1.5 ${
                  note.severity === 'error'
                    ? 'bg-red-500/10 text-red-600 dark:text-red-300'
                    : note.severity === 'warning'
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-200'
                      : 'bg-white/80 text-slate-500 dark:bg-black/20 dark:text-slate-300'
                }`}>
                  {note.message}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  const renderAssistantArtifacts = (message: PromptAgentMessage) => {
    const artifacts = message.artifacts
    const finalPrompt = artifacts?.finalPrompt || extractFinalPrompt(message.content)
    const composition = artifacts?.composition ?? normalizeAssistantComposition(parseAssistantComposition(message.content))
    const validation = artifacts?.validation
    const templateDraft = artifacts?.templateDraft
    const validationNotes = artifacts?.validationNotes ?? composition?.validationNotes ?? []
    const isExpanded = expandedArtifacts[message.id] ?? selectedMessageId === message.id

    if (!finalPrompt && !composition?.recommendations?.length && !templateDraft && !artifacts?.presetContext) return null

    return (
      <div className="mt-3 border-t border-gray-200/70 pt-3 dark:border-white/[0.08]">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            setExpandedArtifacts((value) => ({ ...value, [message.id]: !isExpanded }))
          }}
          className="flex w-full items-center justify-between rounded-xl bg-white/60 px-3 py-2 text-xs font-medium text-gray-500 ring-1 ring-gray-200/70 hover:text-blue-600 dark:bg-black/20 dark:text-gray-300 dark:ring-white/[0.06] dark:hover:text-blue-300"
        >
          <span>最终提示词与结构建议</span>
          <span>{isExpanded ? '收起' : '展开'}</span>
        </button>
        {isExpanded && (
          <div className="mt-2 space-y-3">
            {finalPrompt && (
              <div className="rounded-2xl bg-white/75 p-3 text-xs text-gray-600 ring-1 ring-gray-200/70 dark:bg-black/20 dark:text-gray-300 dark:ring-white/[0.06]">
                <div className="mb-2 font-semibold text-gray-700 dark:text-gray-100">Final prompt</div>
                <div className="max-h-40 overflow-auto whitespace-pre-wrap leading-relaxed">{finalPrompt}</div>
                {validationNotes.length ? (
                  <div className="mt-3 space-y-1 rounded-xl bg-amber-50/80 p-2 text-[11px] text-amber-700 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/20">
                    {validationNotes.slice(0, 4).map((note, index) => (
                      <div key={`${note.message}-${index}`}>{note.message}</div>
                    ))}
                  </div>
                ) : null}
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <button onClick={(event) => { event.stopPropagation(); onApplyPrompt(appendToPrompt(prompt, finalPrompt)) }} className="rounded-xl bg-gray-100 px-3 py-2 text-xs text-gray-600 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/[0.1]">插入</button>
                  <button onClick={(event) => { event.stopPropagation(); onApplyPrompt(finalPrompt) }} className="rounded-xl bg-blue-500 px-3 py-2 text-xs text-white hover:bg-blue-600">替换</button>
                  <button onClick={(event) => { event.stopPropagation(); copyText(finalPrompt, '已复制最终提示词') }} className="rounded-xl bg-gray-100 px-3 py-2 text-xs text-gray-600 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/[0.1]">复制</button>
                  <button onClick={(event) => { event.stopPropagation(); createDraftForMessage(message) }} className="rounded-xl bg-emerald-500 px-3 py-2 text-xs text-white hover:bg-emerald-600">存模板</button>
                </div>
              </div>
            )}
            {composition?.recommendations?.length ? (
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">
                <div className="font-semibold">AI 结构化建议</div>
                {composition.recommendations.slice(0, 3).map((item, index) => (
                  <div key={`${item.templateId ?? 'custom'}-${index}`} className="mt-1">
                    {item.templateId ?? '自定义'} · {item.styleIds?.join(', ') || '无画风'} · {item.reason ?? ''}
                  </div>
                ))}
                {validation?.warnings.length ? (
                  <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-200">校验提示：{validation.warnings.join('；')}</div>
                ) : null}
              </div>
            ) : null}
            {renderEvidencePanel(message)}
            {renderPresetContext(message)}
            {templateDraft && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-xs text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">模板草案：{templateDraft.name}</div>
                    <div className="mt-1 opacity-80">{templateDraft.description}</div>
                  </div>
                  <button onClick={(event) => { event.stopPropagation(); saveDraft(templateDraft) }} className="rounded-lg bg-emerald-500 px-2.5 py-1.5 text-white hover:bg-emerald-600">保存</button>
                </div>
                <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap rounded-xl bg-white/70 p-2 text-[11px] text-emerald-900 dark:bg-black/20 dark:text-emerald-100">{renderTemplatePrompt(templateDraft, { subject: '示例主题' })}</pre>
                {artifacts?.draftStatus && <div className="mt-2 opacity-80">{artifacts.draftStatus}</div>}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderMessageActions = (message: PromptAgentMessage) => {
    if (selectedMessageId !== message.id) return null
    const finalPrompt = message.artifacts?.finalPrompt || extractFinalPrompt(message.content)
    return (
      <div className={`mt-2 flex flex-wrap gap-1.5 text-[11px] ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <button type="button" onClick={(event) => { event.stopPropagation(); copyText(message.content) }} className="rounded-full bg-white/90 px-2.5 py-1 text-gray-500 shadow-sm ring-1 ring-gray-200/70 hover:text-blue-600 dark:bg-white/[0.06] dark:text-gray-300 dark:ring-white/[0.08]">复制</button>
        {message.role === 'user' ? (
          <button type="button" onClick={(event) => { event.stopPropagation(); handleRewrite(message) }} className="rounded-full bg-blue-500 px-2.5 py-1 text-white shadow-sm hover:bg-blue-600">重新编写并发送</button>
        ) : finalPrompt ? (
          <>
            <button type="button" onClick={(event) => { event.stopPropagation(); copyText(finalPrompt, '已复制最终提示词') }} className="rounded-full bg-white/90 px-2.5 py-1 text-gray-500 shadow-sm ring-1 ring-gray-200/70 hover:text-blue-600 dark:bg-white/[0.06] dark:text-gray-300 dark:ring-white/[0.08]">复制最终提示词</button>
            <button type="button" onClick={(event) => { event.stopPropagation(); onApplyPrompt(finalPrompt) }} className="rounded-full bg-blue-500 px-2.5 py-1 text-white shadow-sm hover:bg-blue-600">替换主提示词</button>
          </>
        ) : null}
      </div>
    )
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
    <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-full justify-end pointer-events-none sm:w-[min(560px,calc(100vw-24px))]">
      <div className="pointer-events-auto flex h-full w-full flex-col border-l border-gray-200/80 bg-white/95 shadow-[0_0_45px_rgb(0,0,0,0.18)] ring-1 ring-black/5 animate-panel-slide-in dark:border-white/[0.08] dark:bg-gray-900/95 dark:ring-white/10">
        <div className="border-b border-gray-200/70 px-4 py-4 dark:border-white/[0.08] sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">AI 提示词助手</h2>
              <button type="button" onClick={() => setIsSessionsOpen((value) => !value)} className="mt-1 flex max-w-full items-center gap-1 rounded-lg text-left text-xs text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-300" title="切换会话">
                <span className="truncate">当前会话：{sessionTitle(activeSession?.title ?? '新会话')}</span>
                <span>{isSessionsOpen ? '▲' : '▼'}</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => { createSession(); setIsSessionsOpen(true) }} className="h-9 rounded-xl px-3 text-sm text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-blue-300" title="新建会话">＋</button>
              <label className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-2.5 py-2 text-xs text-gray-500 dark:bg-white/[0.06] dark:text-gray-300" title="只使用本地知识链">
                <input type="checkbox" checked={presetOnly} onChange={(event) => setPresetOnly(event.target.checked)} className="accent-blue-500" />
                本地
              </label>
              <button onClick={() => setIsCollapsed(true)} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-200 dark:hover:bg-white/[0.06] transition-colors" title="收起面板">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {isSessionsOpen && (
            <div className="mt-3 max-h-52 overflow-auto rounded-2xl border border-gray-200/70 bg-white/90 p-2 shadow-sm dark:border-white/[0.08] dark:bg-gray-950/60">
              <button type="button" onClick={() => createSession()} className="mb-2 w-full rounded-xl bg-blue-500 px-3 py-2 text-left text-sm text-white hover:bg-blue-600">＋ 新建会话</button>
              <div className="space-y-1">
                {sortedSessions.map((session) => (
                  <div key={session.id} className={`rounded-xl p-2 ${session.id === activeSession?.id ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'}`}>
                    {renamingSessionId === session.id ? (
                      <div className="flex gap-1.5">
                        <input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') commitRename(); if (event.key === 'Escape') setRenamingSessionId(null) }} className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/[0.08] dark:bg-gray-900 dark:text-gray-100" autoFocus />
                        <button onClick={commitRename} className="rounded-lg bg-blue-500 px-2 text-xs text-white">保存</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => selectSession(session.id)} className="min-w-0 flex-1 text-left">
                          <div className="truncate text-sm font-medium text-gray-700 dark:text-gray-100">{sessionTitle(session.title)}</div>
                          <div className="text-[11px] text-gray-400 dark:text-gray-500">{session.messages.length} 条消息</div>
                        </button>
                        <button onClick={() => startRename(session.id, session.title)} className="rounded-lg px-2 py-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-white/[0.06]">重命名</button>
                        <button onClick={() => confirmDeleteSession(session.id)} className="rounded-lg px-2 py-1 text-xs text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10">删除</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/70 p-4 text-sm text-gray-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-400">
              <div className="font-medium text-gray-700 dark:text-gray-200">开始一个提示词会话</div>
              <p className="mt-1 text-xs leading-relaxed">可以让 AI 帮你拆解画面、优化提示词、生成最终 prompt。会话会自动保存并命名。</p>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === 'user'
            const isSelected = selectedMessageId === message.id
            return (
              <div key={message.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedMessageId((value) => value === message.id ? null : message.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedMessageId((value) => value === message.id ? null : message.id)
                    }
                  }}
                  className={`max-w-[94%] rounded-2xl px-3 py-2 text-left text-sm leading-relaxed outline-none transition focus:ring-2 focus:ring-blue-500/30 ${
                    isUser
                      ? 'bg-blue-500 text-white whitespace-pre-wrap'
                      : message.status === 'error'
                        ? 'bg-red-50 text-red-600 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20'
                        : 'bg-gray-100 text-gray-700 ring-1 ring-transparent dark:bg-white/[0.06] dark:text-gray-200'
                  } ${isSelected ? 'ring-2 ring-blue-400/60 dark:ring-blue-300/50' : ''}`}
                >
                  {message.role === 'assistant' ? (
                    <div className="markdown-message">
                      {message.content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown> : <span className="text-gray-400 dark:text-gray-500">AI 正在分析…</span>}
                    </div>
                  ) : (
                    message.content
                  )}
                  {message.role === 'assistant' && renderAssistantArtifacts(message)}
                </div>
                {renderMessageActions(message)}
              </div>
            )
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 px-1">
              <span>AI 正在分析</span>
              <span className="loading-dots"><span /><span /><span /></span>
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 px-3 py-2 text-xs">
              {error} <button className="underline" onClick={openSettings}>打开设置</button>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200/70 p-4 dark:border-white/[0.08] sm:p-5">
          {rewriteActive && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/20">
              <span>正在重新编写上一条消息，发送后会生成新的后续回复。</span>
              <button type="button" onClick={cancelRewrite} className="rounded-lg px-2 py-1 hover:bg-amber-100 dark:hover:bg-amber-500/20">取消</button>
            </div>
          )}
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
              {rewriteActive ? '重新发送' : '发送'}
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
