// ===== 设置 =====

export interface ChatSettings {
  enabled: boolean
  useImageApiConfig: boolean
  baseUrl: string
  apiKey: string
  model: string
  timeout: number
  stream: boolean
}

export interface AppSettings {
  baseUrl: string
  apiKey: string
  model: string
  timeout: number
  chat: ChatSettings
}

const DEFAULT_BASE_URL = import.meta.env.VITE_DEFAULT_API_URL?.trim() || 'https://api.openai.com'
const DEFAULT_IMAGE_MODEL = 'gpt-image-2'
const DEFAULT_IMAGE_TIMEOUT = 300

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeTimeout(value: unknown, fallback: number): number {
  const next = Number(value)
  return Number.isFinite(next) && next > 0 ? next : fallback
}

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  enabled: false,
  useImageApiConfig: false,
  baseUrl: '',
  apiKey: '',
  model: 'gpt-4.1-mini',
  timeout: 60,
  stream: false,
}

export function normalizeChatSettings(value: unknown): ChatSettings {
  const chat = isPlainObject(value) ? value : {}

  return {
    enabled: Boolean(chat.enabled ?? DEFAULT_CHAT_SETTINGS.enabled),
    useImageApiConfig: Boolean(chat.useImageApiConfig ?? DEFAULT_CHAT_SETTINGS.useImageApiConfig),
    baseUrl: typeof chat.baseUrl === 'string' ? chat.baseUrl : DEFAULT_CHAT_SETTINGS.baseUrl,
    apiKey: typeof chat.apiKey === 'string' ? chat.apiKey : DEFAULT_CHAT_SETTINGS.apiKey,
    model: typeof chat.model === 'string' ? chat.model : DEFAULT_CHAT_SETTINGS.model,
    timeout: normalizeTimeout(chat.timeout, DEFAULT_CHAT_SETTINGS.timeout),
    stream: Boolean(chat.stream ?? DEFAULT_CHAT_SETTINGS.stream),
  }
}

export function normalizeAppSettings(value: unknown): AppSettings {
  const settings = isPlainObject(value) ? value : {}

  return {
    baseUrl: typeof settings.baseUrl === 'string' ? settings.baseUrl : DEFAULT_BASE_URL,
    apiKey: typeof settings.apiKey === 'string' ? settings.apiKey : '',
    model: typeof settings.model === 'string' ? settings.model : DEFAULT_IMAGE_MODEL,
    timeout: normalizeTimeout(settings.timeout, DEFAULT_IMAGE_TIMEOUT),
    chat: normalizeChatSettings(settings.chat),
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  baseUrl: DEFAULT_BASE_URL,
  apiKey: '',
  model: DEFAULT_IMAGE_MODEL,
  timeout: DEFAULT_IMAGE_TIMEOUT,
  chat: { ...DEFAULT_CHAT_SETTINGS },
}

// ===== 任务参数 =====

export interface TaskParams {
  size: string
  quality: 'auto' | 'low' | 'medium' | 'high'
  output_format: 'png' | 'jpeg' | 'webp'
  output_compression: number | null
  moderation: 'auto' | 'low'
  n: number
}

export const DEFAULT_PARAMS: TaskParams = {
  size: 'auto',
  quality: 'auto',
  output_format: 'png',
  output_compression: null,
  moderation: 'auto',
  n: 1,
}

// ===== 输入图片（UI 层面） =====

export interface InputImage {
  /** IndexedDB image store 的 id（SHA-256 hash） */
  id: string
  /** data URL，用于预览 */
  dataUrl: string
}

// ===== 任务记录 =====

export type TaskStatus = 'running' | 'done' | 'error'

export interface TaskRecord {
  id: string
  prompt: string
  params: TaskParams
  /** 输入图片的 image store id 列表 */
  inputImageIds: string[]
  /** 输出图片的 image store id 列表 */
  outputImages: string[]
  status: TaskStatus
  error: string | null
  createdAt: number
  finishedAt: number | null
  /** 总耗时毫秒 */
  elapsed: number | null
}

// ===== IndexedDB 存储的图片 =====

export interface StoredImage {
  id: string
  dataUrl: string
  /** 图片首次存储时间（ms） */
  createdAt?: number
  /** 图片来源：用户上传 / API 生成 */
  source?: 'upload' | 'generated'
}

// ===== API 请求体 =====

export interface ImageGenerationRequest {
  model: string
  prompt: string
  size: string
  quality: string
  output_format: string
  moderation: string
  output_compression?: number
  n?: number
}

// ===== API 响应 =====

export interface ImageResponseItem {
  b64_json?: string
  url?: string
}

export interface ImageApiResponse {
  data: ImageResponseItem[]
}

// ===== Chat API =====

export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface ChatModelInfo {
  id: string
}

export interface ChatCompletionChoice {
  message?: ChatMessage
}

export interface ChatCompletionResponse {
  choices?: ChatCompletionChoice[]
}

// ===== 导出数据 =====

/** ZIP manifest.json 格式 */
export interface ExportData {
  version: number
  exportedAt: string
  settings: AppSettings
  tasks: TaskRecord[]
  /** imageId → 图片信息 */
  imageFiles: Record<string, {
    path: string
    createdAt?: number
    source?: 'upload' | 'generated'
  }>
}

