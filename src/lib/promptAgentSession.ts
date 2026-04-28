import type { ChatMessage, ChatRole } from '../types'
import type { PresetContext } from './chatApi'
import type {
  AssistantCompositionValidation,
  ParsedAssistantComposition,
  TemplateDraft,
} from '../data/structuredPrompts'

export type PromptAgentTitleStatus = 'default' | 'pending' | 'generated' | 'manual' | 'failed'
export type PromptAgentMessageStatus = 'done' | 'streaming' | 'error'

export interface PromptAgentMessageArtifacts {
  finalPrompt?: string
  presetContext?: PresetContext | null
  composition?: ParsedAssistantComposition | null
  validation?: AssistantCompositionValidation | null
  templateDraft?: TemplateDraft | null
  draftStatus?: string | null
}

export interface PromptAgentMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: number
  status: PromptAgentMessageStatus
  error?: string | null
  artifacts?: PromptAgentMessageArtifacts
}

export interface PromptAgentSession {
  id: string
  title: string
  titleStatus: PromptAgentTitleStatus
  createdAt: number
  updatedAt: number
  messages: PromptAgentMessage[]
}

export interface PromptAgentRewriteState {
  sessionId: string
  sourceMessageId: string
}

let promptAgentUid = 0

export function createPromptAgentId(): string {
  return `${Date.now().toString(36)}${(++promptAgentUid).toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

export function createPromptAgentSession(title = '新会话'): PromptAgentSession {
  const now = Date.now()
  return {
    id: createPromptAgentId(),
    title,
    titleStatus: 'default',
    createdAt: now,
    updatedAt: now,
    messages: [],
  }
}

export function createPromptAgentMessage(
  role: ChatRole,
  content: string,
  status: PromptAgentMessageStatus = 'done',
  artifacts?: PromptAgentMessageArtifacts,
): PromptAgentMessage {
  return {
    id: createPromptAgentId(),
    role,
    content,
    createdAt: Date.now(),
    status,
    error: null,
    artifacts,
  }
}

export function promptAgentMessagesToChatMessages(messages: PromptAgentMessage[]): ChatMessage[] {
  return messages
    .filter((message) => message.status !== 'error' && message.content.trim())
    .map((message) => ({ role: message.role, content: message.content.trim() }))
}

export function createFallbackPromptAgentTitle(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (!normalized) return '新会话'
  return normalized.length > 18 ? `${normalized.slice(0, 18)}…` : normalized
}

export function sanitizePromptAgentTitle(title: string): string {
  const normalized = title
    .replace(/["“”'‘’]/g, '')
    .replace(/[。.!！?？]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!normalized) return ''
  return normalized.length > 18 ? normalized.slice(0, 18) : normalized
}
