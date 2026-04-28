import { useEffect, useRef, useState, useCallback } from 'react'
import { normalizeBaseUrl } from '../lib/api'
import { listChatModels, resolveEffectiveChatSettings, testChatConnection, withDefaultChatSettings } from '../lib/chatApi'
import { useStore, exportData, importData, clearAllData } from '../store'
import { DEFAULT_CHAT_SETTINGS, DEFAULT_SETTINGS, normalizeAppSettings, type AppSettings } from '../types'
import { useCloseOnEscape } from '../hooks/useCloseOnEscape'

export default function SettingsModal() {
  const showSettings = useStore((s) => s.showSettings)
  const setShowSettings = useStore((s) => s.setShowSettings)
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const setConfirmDialog = useStore((s) => s.setConfirmDialog)
  const importInputRef = useRef<HTMLInputElement>(null)
  const normalizedSettings = normalizeAppSettings(settings)
  const [draft, setDraft] = useState<AppSettings>(normalizedSettings)
  const [timeoutInput, setTimeoutInput] = useState(String(normalizedSettings.timeout))
  const [chatTimeoutInput, setChatTimeoutInput] = useState(String(normalizedSettings.chat.timeout))
  const [showApiKey, setShowApiKey] = useState(false)
  const [showChatApiKey, setShowChatApiKey] = useState(false)
  const [chatModels, setChatModels] = useState<string[]>([])
  const [chatStatus, setChatStatus] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null)
  const [loadingChatModels, setLoadingChatModels] = useState(false)
  const [testingChat, setTestingChat] = useState(false)

  useEffect(() => {
    if (showSettings) {
      const normalizedSettings = normalizeAppSettings(settings)
      setDraft(normalizedSettings)
      setTimeoutInput(String(normalizedSettings.timeout))
      setChatTimeoutInput(String(normalizedSettings.chat.timeout))
      setChatStatus(null)
    }
  }, [showSettings, settings])

  const commitSettings = (nextDraft: AppSettings) => {
    const safeDraft = normalizeAppSettings(nextDraft)
    const normalizedDraft = normalizeAppSettings({
      ...safeDraft,
      baseUrl: normalizeBaseUrl(safeDraft.baseUrl.trim() || DEFAULT_SETTINGS.baseUrl),
      apiKey: safeDraft.apiKey,
      model: safeDraft.model.trim() || DEFAULT_SETTINGS.model,
      timeout: Number(safeDraft.timeout) || DEFAULT_SETTINGS.timeout,
      chat: {
        ...DEFAULT_CHAT_SETTINGS,
        ...safeDraft.chat,
        useImageApiConfig: false,
        baseUrl: normalizeBaseUrl(safeDraft.chat.baseUrl.trim() || ''),
        model: safeDraft.chat.model.trim() || DEFAULT_CHAT_SETTINGS.model,
        timeout: Number(safeDraft.chat.timeout) || DEFAULT_CHAT_SETTINGS.timeout,
      },
    })
    setDraft(normalizedDraft)
    setSettings(normalizedDraft)
  }

  const handleClose = () => {
    const nextTimeout = Number(timeoutInput)
    const nextChatTimeout = Number(chatTimeoutInput)
    commitSettings({
      ...draft,
      timeout:
        timeoutInput.trim() === '' || Number.isNaN(nextTimeout)
          ? DEFAULT_SETTINGS.timeout
          : nextTimeout,
      chat: {
        ...draft.chat,
        timeout:
          chatTimeoutInput.trim() === '' || Number.isNaN(nextChatTimeout)
            ? DEFAULT_CHAT_SETTINGS.timeout
            : nextChatTimeout,
      },
    })
    setShowSettings(false)
  }

  const commitTimeout = useCallback(() => {
    const nextTimeout = Number(timeoutInput)
    const normalizedTimeout =
      timeoutInput.trim() === '' ? DEFAULT_SETTINGS.timeout : Number.isNaN(nextTimeout) ? draft.timeout : nextTimeout
    setTimeoutInput(String(normalizedTimeout))
    commitSettings({ ...draft, timeout: normalizedTimeout })
  }, [draft, timeoutInput])


  const commitChatTimeout = useCallback(() => {
    const nextTimeout = Number(chatTimeoutInput)
    const normalizedTimeout =
      chatTimeoutInput.trim() === ''
        ? DEFAULT_CHAT_SETTINGS.timeout
        : Number.isNaN(nextTimeout)
          ? draft.chat.timeout
          : nextTimeout
    setChatTimeoutInput(String(normalizedTimeout))
    commitSettings({ ...draft, chat: { ...draft.chat, timeout: normalizedTimeout } })
  }, [chatTimeoutInput, draft])

  const handleFetchChatModels = async () => {
    setLoadingChatModels(true)
    setChatStatus({ type: 'info', message: '正在获取模型列表...' })
    try {
      const nextDraft = withDefaultChatSettings(draft)
      commitSettings(nextDraft)
      const models = await listChatModels(resolveEffectiveChatSettings(nextDraft))
      setChatModels(models.map((model) => model.id))
      setChatStatus({ type: 'success', message: `已获取 ${models.length} 个模型` })
    } catch (error) {
      setChatStatus({ type: 'error', message: error instanceof Error ? error.message : String(error) })
    } finally {
      setLoadingChatModels(false)
    }
  }

  const handleTestChatConnection = async () => {
    setTestingChat(true)
    setChatStatus({ type: 'info', message: '正在测试 Chat 连接...' })
    try {
      const nextDraft = withDefaultChatSettings(draft)
      commitSettings(nextDraft)
      await testChatConnection(resolveEffectiveChatSettings(nextDraft))
      setChatStatus({ type: 'success', message: 'Chat 连接成功，当前模型可用' })
    } catch (error) {
      setChatStatus({ type: 'error', message: error instanceof Error ? error.message : String(error) })
    } finally {
      setTestingChat(false)
    }
  }

  useCloseOnEscape(showSettings, handleClose)

  if (!showSettings) return null

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) importData(file)
    e.target.value = ''
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-overlay-in"
        onClick={handleClose}
      />
      <div
        className="relative z-10 w-full max-w-5xl rounded-3xl border border-white/50 bg-white/95 p-5 shadow-2xl ring-1 ring-black/5 animate-modal-in dark:border-white/[0.08] dark:bg-gray-900/95 dark:ring-white/10 overflow-y-auto max-h-[85vh] custom-scrollbar"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            设置
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono select-none">v{__APP_VERSION__}</span>
            <button
              onClick={handleClose}
              className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
              aria-label="关闭"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
          <section className="rounded-2xl border border-gray-100 bg-white/60 p-4 dark:border-white/[0.08] dark:bg-white/[0.03] lg:col-start-1 lg:row-start-1">
            <h4 className="mb-4 text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              API 配置
            </h4>
            <div className="space-y-4">
              <label className="block">
                <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">API URL</span>
                <input
                  value={draft.baseUrl}
                  onChange={(e) => setDraft((prev) => ({ ...prev, baseUrl: e.target.value }))}
                  onBlur={(e) => commitSettings({ ...draft, baseUrl: e.target.value })}
                  type="text"
                  placeholder={DEFAULT_SETTINGS.baseUrl}
                  className="w-full rounded-xl border border-gray-200/70 bg-white/60 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-200 dark:focus:border-blue-500/50"
                />
                <div className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                  支持通过查询参数覆盖：<code className="bg-gray-100 dark:bg-white/[0.06] px-1 py-0.5 rounded">?apiUrl=</code>
                </div>
              </label>

              <div className="block">
                <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">API Key</span>
                <div className="relative">
                  <input
                    value={draft.apiKey}
                    onChange={(e) => setDraft((prev) => ({ ...prev, apiKey: e.target.value }))}
                    onBlur={(e) => commitSettings({ ...draft, apiKey: e.target.value })}
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="sk-..."
                    className="w-full rounded-xl border border-gray-200/70 bg-white/60 px-3 py-2 pr-10 text-sm text-gray-700 outline-none transition focus:border-blue-300 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-200 dark:focus:border-blue-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showApiKey ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                  支持通过查询参数覆盖：<code className="bg-gray-100 dark:bg-white/[0.06] px-1 py-0.5 rounded">?apiKey=</code>
                </div>
              </div>

              <label className="block">
                <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">模型 ID</span>
                <input
                  value={draft.model}
                  onChange={(e) => setDraft((prev) => ({ ...prev, model: e.target.value }))}
                  onBlur={(e) => commitSettings({ ...draft, model: e.target.value })}
                  type="text"
                  placeholder="gpt-image-2"
                  className="w-full rounded-xl border border-gray-200/70 bg-white/60 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-200 dark:focus:border-blue-500/50"
                />
              </label>

              <label className="block">
                <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">请求超时 (秒)</span>
                <input
                  value={timeoutInput}
                  onChange={(e) => setTimeoutInput(e.target.value)}
                  onBlur={commitTimeout}
                  type="number"
                  min={10}
                  max={600}
                  className="w-full rounded-xl border border-gray-200/70 bg-white/60 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-200 dark:focus:border-blue-500/50"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white/60 p-4 dark:border-white/[0.08] dark:bg-white/[0.03] lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <h4 className="mb-4 text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z" />
              </svg>
              AI 助手配置
            </h4>
            <div className="space-y-4">
              <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-200/70 bg-white/50 px-3 py-2 dark:border-white/[0.08] dark:bg-white/[0.03]">
                <span className="text-sm text-gray-700 dark:text-gray-200">启用 AI 助手</span>
                <input
                  type="checkbox"
                  checked={draft.chat.enabled}
                  onChange={(e) => commitSettings({ ...draft, chat: { ...draft.chat, enabled: e.target.checked } })}
                  className="h-4 w-4 accent-blue-500"
                />
              </label>

              <label className="block">
                <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Chat API URL</span>
                <input
                  value={draft.chat.baseUrl}
                  onChange={(e) => setDraft((prev) => ({ ...prev, chat: { ...prev.chat, baseUrl: e.target.value } }))}
                  onBlur={(e) => commitSettings({ ...draft, chat: { ...draft.chat, baseUrl: e.target.value } })}
                  type="text"
                  placeholder={DEFAULT_SETTINGS.baseUrl}
                  className="w-full rounded-xl border border-gray-200/70 bg-white/60 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-200 dark:focus:border-blue-500/50"
                />
              </label>

              <div className="block">
                <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Chat API Key</span>
                <div className="relative">
                  <input
                    value={draft.chat.apiKey}
                    onChange={(e) => setDraft((prev) => ({ ...prev, chat: { ...prev.chat, apiKey: e.target.value } }))}
                    onBlur={(e) => commitSettings({ ...draft, chat: { ...draft.chat, apiKey: e.target.value } })}
                    type={showChatApiKey ? 'text' : 'password'}
                    placeholder="sk-..."
                    className="w-full rounded-xl border border-gray-200/70 bg-white/60 px-3 py-2 pr-12 text-sm text-gray-700 outline-none transition focus:border-blue-300 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-200 dark:focus:border-blue-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowChatApiKey((v) => !v)}
                    className="absolute right-1.5 top-1/2 flex h-7 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/[0.08] dark:hover:text-gray-200"
                    tabIndex={-1}
                    aria-label={showChatApiKey ? '隐藏 Chat API Key' : '显示 Chat API Key'}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      {showChatApiKey ? (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      ) : (
                        <>
                          <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7S2 12 2 12z" />
                          <path d="M1 1l22 22" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div className="block">
                <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Chat 模型 ID</span>
                {chatModels.length > 0 ? (
                  <select
                    value={draft.chat.model}
                    onChange={(e) => commitSettings({ ...draft, chat: { ...draft.chat, model: e.target.value } })}
                    className="w-full rounded-xl border border-gray-200/70 bg-white/60 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 dark:border-white/[0.08] dark:bg-gray-900 dark:text-gray-200 dark:focus:border-blue-500/50"
                  >
                    {chatModels.includes(draft.chat.model) ? null : <option value={draft.chat.model}>{draft.chat.model || DEFAULT_CHAT_SETTINGS.model}</option>}
                    {chatModels.map((model) => <option key={model} value={model}>{model}</option>)}
                  </select>
                ) : (
                  <input
                    value={draft.chat.model}
                    onChange={(e) => setDraft((prev) => ({ ...prev, chat: { ...prev.chat, model: e.target.value } }))}
                    onBlur={(e) => commitSettings({ ...draft, chat: { ...draft.chat, model: e.target.value } })}
                    type="text"
                    placeholder={DEFAULT_CHAT_SETTINGS.model}
                    className="w-full rounded-xl border border-gray-200/70 bg-white/60 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-200 dark:focus:border-blue-500/50"
                  />
                )}
                <div className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                  获取模型后可从列表选择；如需手动输入，请在获取前填写或保留当前自定义模型。
                </div>
              </div>

              <label className="block">
                <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Chat 请求超时 (秒)</span>
                <input
                  value={chatTimeoutInput}
                  onChange={(e) => setChatTimeoutInput(e.target.value)}
                  onBlur={commitChatTimeout}
                  type="number"
                  min={10}
                  max={600}
                  className="w-full rounded-xl border border-gray-200/70 bg-white/60 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-200 dark:focus:border-blue-500/50"
                />
              </label>

              <label className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/80 p-3 dark:border-white/[0.08] dark:bg-white/[0.03]">
                <span>
                  <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">流式输出</span>
                  <span className="mt-0.5 block text-xs text-gray-400 dark:text-gray-500">AI 助手边生成边显示；不兼容时可关闭</span>
                </span>
                <input
                  type="checkbox"
                  checked={draft.chat.stream}
                  onChange={(e) => commitSettings({ ...draft, chat: { ...draft.chat, stream: e.target.checked } })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
              </label>

              <div className="flex gap-2">
                <button
                  onClick={handleFetchChatModels}
                  disabled={loadingChatModels}
                  className="flex-1 rounded-xl bg-gray-100/80 px-4 py-2.5 text-sm text-gray-600 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/[0.1]"
                >
                  {loadingChatModels ? '获取中...' : '获取模型'}
                </button>
                <button
                  onClick={handleTestChatConnection}
                  disabled={testingChat}
                  className="flex-1 rounded-xl bg-blue-500 px-4 py-2.5 text-sm text-white transition hover:bg-blue-600 disabled:opacity-50"
                >
                  {testingChat ? '测试中...' : '测试连接'}
                </button>
              </div>

              {chatStatus && (
                <div className={`rounded-xl px-3 py-2 text-xs ${
                  chatStatus.type === 'success'
                    ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                    : chatStatus.type === 'error'
                      ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                      : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                }`}>
                  {chatStatus.message}
                </div>
              )}
            </div>
          </section>
          <section className="rounded-2xl border border-gray-100 bg-white/60 p-4 dark:border-white/[0.08] dark:bg-white/[0.03] lg:col-start-1 lg:row-start-2">
            <h4 className="mb-4 text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              数据管理
            </h4>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => exportData()}
                  className="flex-1 rounded-xl bg-gray-100/80 px-4 py-2.5 text-sm text-gray-600 transition hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/[0.1] flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  导出
                </button>
                <button
                  onClick={() => importInputRef.current?.click()}
                  className="flex-1 rounded-xl bg-gray-100/80 px-4 py-2.5 text-sm text-gray-600 transition hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/[0.1] flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  导入
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={handleImport}
                />
              </div>
              <button
                onClick={() =>
                  setConfirmDialog({
                    title: '清空所有数据',
                    message: '确定要清空所有任务记录和图片数据吗？此操作不可恢复。',
                    action: () => clearAllData(),
                  })
                }
                className="w-full rounded-xl border border-red-200/80 bg-red-50/50 px-4 py-2.5 text-sm text-red-500 transition hover:bg-red-100/80 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
              >
                清空所有数据
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}



