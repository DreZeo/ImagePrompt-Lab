import type { AppSettings, ChatMessage, ChatCompletionResponse, ChatModelInfo, ChatSettings } from '../types'
import { DEFAULT_CHAT_SETTINGS, normalizeAppSettings } from '../types'
import { buildApiUrl, normalizeBaseUrl, readClientDevProxyConfig } from './devProxy'
import {
  TEMPLATE_CATEGORY_LABELS,
  deriveTemplateGovernance,
  extractVisualIntent,
  getPromptRecommendations,
  parseAssistantComposition,
  searchLegacyReferenceInsights,
  renderRecommendationPrompt,
  searchStructuredStyles,
  searchStructuredTemplates,
  validateAssistantComposition,
  type LegacyReferenceInsight,
  type PromptRecommendation,
  type PromptStrategyChain,
  type VisualIntent,
} from '../data/structuredPrompts'
import { searchPromptKnowledge, type PromptKnowledgeContext } from '../data/promptKnowledge'
import { sanitizePromptAgentTitle } from './promptAgentSession'

export interface EffectiveChatSettings {
  baseUrl: string
  apiKey: string
  model: string
  timeout: number
  stream: boolean
}

export interface PresetContext {
  query: string
  presetOnly: boolean
  visualIntent: VisualIntent
  recommendations: PromptRecommendation[]
  styles: Array<{
    id: string
    name: string
    keyword: string
    description: string
    promptFragment: string
    category?: string
    bestFor?: string[]
    avoidFor?: string[]
    score: number
    matchedKeywords: string[]
  }>
  templates: Array<{
    id: string
    title: string
    category: string
    scenario?: string
    scenarioLabel?: string
    author?: string
    sourceUrl?: string
    lang?: string
    prompt: string
    description?: string
    tags?: string[]
    slots?: Record<string, { label: string; required?: boolean; default?: string; examples?: string[] }>
    negativePrompt?: string
    source?: string
    governance?: ReturnType<typeof deriveTemplateGovernance>
    score: number
    matchedKeywords: string[]
  }>
  references: LegacyReferenceInsight[]
  strategyChains: PromptStrategyChain[]
  knowledge: PromptKnowledgeContext
}

function uniqueValues(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]))
}

function buildStrategyChains(
  visualIntent: VisualIntent,
  recommendations: PromptRecommendation[],
  knowledge: PromptKnowledgeContext,
  references: LegacyReferenceInsight[],
): PromptStrategyChain[] {
  return recommendations.map((recommendation, index) => {
    const template = recommendation.template
    const styleNames = recommendation.styles.map((style) => style.name)
    const styleKeywords = recommendation.styles.map((style) => style.englishKeyword)
    const ruleIds = knowledge.rules.slice(0, 5).map((entry) => entry.item.id)
    const rules = knowledge.rules.slice(0, 4)
    const relatedReferences = references.filter((reference) => reference.category === template.category).slice(0, 3)
    const scenarioLabel = template.scenarioLabel ?? visualIntent.scenarioLabel
    const structureKeywords = uniqueValues([
      TEMPLATE_CATEGORY_LABELS[template.category],
      scenarioLabel,
      template.outputHints.aspectRatio,
      visualIntent.platform,
      visualIntent.purpose,
      ...template.tags.slice(0, 4),
    ])
    const compositionKeywords = uniqueValues([
      visualIntent.composition,
      ...Object.values(template.slots).map((slot) => slot.label),
      ...relatedReferences.flatMap((reference) => reference.traits).slice(0, 4),
    ])
    const visualKeywords = uniqueValues([
      ...styleNames,
      ...styleKeywords,
      ...visualIntent.styleHints,
      visualIntent.mood,
      visualIntent.palette,
    ])
    const qualityKeywords = uniqueValues([
      ...rules.flatMap((entry) => entry.item.positiveFragments.slice(0, 2)),
      knowledge.outputProfile.name,
      ...knowledge.outputProfile.tags.slice(0, 2),
    ]).slice(0, 8)
    const negativeKeywords = uniqueValues([
      template.negativePrompt,
      ...rules.flatMap((entry) => entry.item.negativeFragments.slice(0, 2)),
      ...knowledge.outputProfile.avoid.slice(0, 3),
    ]).slice(0, 8)

    return {
      id: `strategy-${index + 1}`,
      title: scenarioLabel ? `${TEMPLATE_CATEGORY_LABELS[template.category]} · ${scenarioLabel}策略链` : `${TEMPLATE_CATEGORY_LABELS[template.category]}策略链`,
      scenario: template.scenario ?? visualIntent.scenario,
      scenarioLabel,
      intent: uniqueValues([visualIntent.subject, visualIntent.purpose, visualIntent.platform, scenarioLabel, visualIntent.text.density]).slice(0, 6),
      structure: uniqueValues([scenarioLabel, template.name, template.description, ...structureKeywords]).slice(0, 6),
      visualLanguage: visualKeywords.slice(0, 6),
      keywordPack: {
        structure: structureKeywords.slice(0, 8),
        composition: compositionKeywords.slice(0, 8),
        visual: visualKeywords.slice(0, 8),
        quality: qualityKeywords,
        negative: negativeKeywords,
      },
      ruleIds,
      templateIds: [template.id],
      styleIds: recommendation.styles.map((style) => style.id),
      referenceIds: relatedReferences.map((reference) => reference.id),
      confidence: recommendation.confidence,
      reason: recommendation.reason,
    }
  })
}

export function withDefaultChatSettings(settings: AppSettings): AppSettings {
  return normalizeAppSettings(settings)
}

export function resolveEffectiveChatSettings(settings: AppSettings): EffectiveChatSettings {
  const normalized = withDefaultChatSettings(settings)
  const chat = normalized.chat

  return {
    baseUrl: normalizeBaseUrl(chat.baseUrl),
    apiKey: chat.apiKey,
    model: chat.model.trim() || DEFAULT_CHAT_SETTINGS.model,
    timeout: Number(chat.timeout) || DEFAULT_CHAT_SETTINGS.timeout,
    stream: Boolean(chat.stream),
  }
}

function buildChatApiUrl(settings: EffectiveChatSettings, path: string): string {
  return buildApiUrl(settings.baseUrl, path, readClientDevProxyConfig())
}

function authHeaders(settings: EffectiveChatSettings): HeadersInit {
  return {
    Authorization: `Bearer ${settings.apiKey}`,
    'Cache-Control': 'no-store, no-cache, max-age=0',
    Pragma: 'no-cache',
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const errJson = await response.json()
    if (errJson.error?.message) return errJson.error.message
    if (errJson.message) return errJson.message
  } catch {
    try {
      const text = await response.text()
      if (text) return text
    } catch {
      /* ignore */
    }
  }
  return `HTTP ${response.status}`
}

function assertChatConfig(settings: EffectiveChatSettings) {
  if (!settings.baseUrl) throw new Error('请先配置 Chat API 地址')
  if (!settings.apiKey) throw new Error('请先配置 Chat API Key')
  if (!settings.model) throw new Error('请先配置 Chat 模型 ID')
}

function extractAssistantText(payload: ChatCompletionResponse): string {
  const content = payload.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error('接口未返回助手回复')
  return content
}

export async function listChatModels(settings: EffectiveChatSettings): Promise<ChatModelInfo[]> {
  assertChatConfig({ ...settings, model: settings.model || DEFAULT_CHAT_SETTINGS.model })
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), settings.timeout * 1000)

  try {
    const response = await fetch(buildChatApiUrl(settings, 'models'), {
      method: 'GET',
      headers: authHeaders(settings),
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) throw new Error(await parseError(response))
    const payload = await response.json() as { data?: Array<{ id?: unknown }> }
    const models = (payload.data ?? [])
      .map((item) => (typeof item.id === 'string' ? item.id : ''))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .map((id) => ({ id }))

    if (!models.length) throw new Error('接口未返回可用模型')
    return models
  } finally {
    clearTimeout(timeoutId)
  }
}

function extractStreamDelta(payload: unknown): string {
  const choice = (payload as { choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }> }).choices?.[0]
  return choice?.delta?.content ?? choice?.message?.content ?? ''
}

async function readChatCompletionStream(response: Response, onDelta?: (delta: string, fullText: string) => void): Promise<string> {
  if (!response.body) throw new Error('当前 Chat API 未返回可读取的流式响应')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let content = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') return content
      try {
        const delta = extractStreamDelta(JSON.parse(data))
        if (delta) {
          content += delta
          onDelta?.(delta, content)
        }
      } catch {
        // Ignore malformed keepalive or provider-specific stream fragments.
      }
    }
  }

  return content
}

async function postChatCompletion(
  settings: EffectiveChatSettings,
  messages: ChatMessage[],
  temperature = 0.3,
  options: { stream?: boolean; onDelta?: (delta: string, fullText: string) => void } = {},
): Promise<string> {
  assertChatConfig(settings)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), settings.timeout * 1000)
  const stream = options.stream ?? settings.stream

  try {
    const response = await fetch(buildChatApiUrl(settings, 'chat/completions'), {
      method: 'POST',
      headers: {
        ...authHeaders(settings),
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify({
        model: settings.model,
        messages,
        temperature,
        stream,
      }),
      signal: controller.signal,
    })

    if (!response.ok) throw new Error(await parseError(response))
    if (stream) return readChatCompletionStream(response, options.onDelta)
    return extractAssistantText(await response.json() as ChatCompletionResponse)
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function testChatConnection(settings: EffectiveChatSettings): Promise<string> {
  return postChatCompletion(settings, [
    { role: 'user', content: 'Reply with OK.' },
  ], 0)
}

export async function generatePromptAgentSessionTitle(
  settings: EffectiveChatSettings,
  messages: ChatMessage[],
): Promise<string> {
  const source = messages
    .filter((message) => message.role !== 'system')
    .slice(0, 4)
    .map((message) => `${message.role}: ${message.content}`)
    .join('\n')
  const title = await postChatCompletion({ ...settings, stream: false }, [
    {
      role: 'system',
      content: '你是会话标题生成器。请只输出一个简短标题，4到12个中文字符或2到5个英文词，不要引号、标点或解释。标题要体现图像提示词对话的主题。',
    },
    { role: 'user', content: source },
  ], 0.2, { stream: false })
  return sanitizePromptAgentTitle(title)
}

export function buildPresetContext(query: string, presetOnly = false): PresetContext {
  const visualIntent = extractVisualIntent(query)
  const recommendations = getPromptRecommendations(query, 3, visualIntent)
  const preferredCategory = recommendations[0]?.template.category
  const styleResults = searchStructuredStyles(query, preferredCategory, visualIntent).slice(0, 8)
  const templateResults = searchStructuredTemplates(query, visualIntent.category ?? 'all', visualIntent).slice(0, 8)
  const references = searchLegacyReferenceInsights(query, visualIntent.category ?? 'all', visualIntent, 5)
  const styles = styleResults.map(({ item: style, score, matchedKeywords }) => ({
    id: style.id,
    name: style.name,
    keyword: style.englishKeyword,
    description: style.description,
    promptFragment: style.promptFragment,
    category: style.category,
    bestFor: style.bestFor,
    avoidFor: style.avoidFor,
    score,
    matchedKeywords,
  }))

  const templates = templateResults.map(({ item: template, score, matchedKeywords }) => ({
    id: template.id,
    title: template.name,
    category: TEMPLATE_CATEGORY_LABELS[template.category],
    scenario: template.scenario,
    scenarioLabel: template.scenarioLabel,
    prompt: renderRecommendationPrompt({
      template,
      styles: [],
      confidence: 0,
      reason: '',
      filledSlots: {},
    }),
    description: template.description,
    tags: template.tags,
    slots: template.slots,
    negativePrompt: template.negativePrompt,
    source: template.source,
    governance: deriveTemplateGovernance(template),
    score,
    matchedKeywords,
  }))
  const knowledge = searchPromptKnowledge(query, {
    category: preferredCategory ?? visualIntent.category,
    visualIntent,
    templates: templateResults.map((entry) => entry.item),
    styles: styleResults.map((entry) => entry.item),
    limit: 5,
  })
  const strategyChains = buildStrategyChains(visualIntent, recommendations, knowledge, references)

  return { query, presetOnly, visualIntent, recommendations, styles, templates, references, strategyChains, knowledge }
}

function buildSystemPrompt(presetContext: PresetContext): string {
  const hasCandidates = presetContext.styles.length > 0 || presetContext.templates.length > 0
  return [
    'You are a senior visual prompt director inside ImagePrompt Lab.',
    'Your job is not only to write prompts. Your job is to understand the visual intent, build a local knowledge chain, judge what to borrow or reject, compose high-quality natural image prompts, and help users build reusable prompt assets.',
    'Think like an art director, commercial designer, photographer, poster layout designer, anime character designer, and prompt engineer.',
    'Use a four-stage workflow: Retrieval brain finds relevant templates/styles/rules/references; Judgment brain decides what to borrow, reject, and fuse; Expression brain rewrites a natural final prompt; Validation brain checks completeness and template residue.',
    'First classify the visual task: poster/advertisement, portrait/photography, anime/character design, product/object, UI screenshot/social media, infographic/encyclopedia, scene/environment, or other.',
    'Infer subject, purpose, platform, aspect ratio, style, mood, composition, lighting, palette, text density, realism level, constraints, and missing information.',
    'If the request is vague, ask 1-3 concise clarification questions or fill safe defaults while clearly naming assumptions. If it is clear enough, produce a final prompt.',
    'Do not claim to generate images. Do not trigger image generation. The user will decide whether to apply the prompt.',
    'Treat main-track structured templates and styles as reusable design patterns, not plain text. Borrow structure, layout logic, style language, and quality signals; do not output a slot-filled template as the final prompt.',
    'Treat prompt knowledge entries as professional guidance for composition, quality, text control, negative constraints, intent mapping, and output formatting. They are not templates or styles, and their IDs must not be listed as preset IDs.',
    'Use structure strategies as the scenario skeleton, styles as visual language, and prompt knowledge as the standardization layer. Adapt rules to the user request instead of pasting rule text mechanically.',
    'Treat the selected output profile as a model adapter. If it targets DALL-E, Flux, Stable Diffusion, Midjourney, or domestic Chinese models, shape the final prompt in the style expected by that model family instead of using one universal syntax.',
    'Legacy collected examples are reference-only. They may inspire keywords, traits, strengths, or risks, but you must not copy them, expose them as selectable templates, or treat them as the primary structure. Reject author signatures, source handles, platform traces, and overly specific copied wording.',
    'Select at most one primary style and up to two secondary styles. Do not invent template IDs or style IDs that are not listed here.',
    presetContext.presetOnly
      ? 'Local knowledge only mode is ON: recommend or use only listed local knowledge sources. If none fit, ask the user to broaden keywords or turn local knowledge only off. Never invent template, style, reference, or knowledge IDs.'
      : 'Local knowledge only mode is OFF: you may write a custom prompt, but if you use local sources you must identify their internal IDs in the required evidence fields.',
    !hasCandidates && presetContext.presetOnly
      ? 'No local preset candidates were retrieved. Do not invent preset IDs, knowledge IDs, or reference IDs. Ask the user for broader keywords or explain that local sources did not match.'
      : '',
    '',
    'Structured visual intent extracted locally:',
    JSON.stringify(presetContext.visualIntent, null, 2),
    '',
    'Local strategy chains:',
    presetContext.strategyChains.length
      ? presetContext.strategyChains.map((chain) => [
        `- ${chain.id}: ${chain.title} confidence ${chain.confidence.toFixed(2)}`,
        `  Intent: ${chain.intent.join(', ') || 'general'}`,
        `  Scenario: ${chain.scenarioLabel ?? 'category-level strategy'}`,
        `  Structure strategy: ${chain.structure.join('；')}`,
        `  Visual language: ${chain.visualLanguage.join(', ') || 'none'}`,
        `  Keyword pack: ${JSON.stringify(chain.keywordPack)}`,
        `  Professional rule IDs: ${chain.ruleIds.join(', ') || 'none'}`,
        `  Internal template/style/reference IDs: templates=${chain.templateIds.join(', ') || 'none'}; styles=${chain.styleIds.join(', ') || 'none'}; references=${chain.referenceIds.join(', ') || 'none'}`,
        `  Reason: ${chain.reason}`,
      ].join('\n')).join('\n')
      : '- none',
    '',
    'Internal structured recommendations for validation:',
    presetContext.recommendations.length
      ? presetContext.recommendations.map((item) => [
        `- Template ${item.template.id}: ${item.template.name} (${TEMPLATE_CATEGORY_LABELS[item.template.category]}) confidence ${item.confidence.toFixed(2)}`,
        `  Reason: ${item.reason}`,
        `  Suggested style IDs: ${item.styles.map((style) => style.id).join(', ') || 'none'}`,
        `  Filled slots: ${JSON.stringify(item.filledSlots)}`,
        `  Missing required slots: ${item.missingSlots?.join(', ') || 'none'}`,
      ].join('\n')).join('\n')
      : '- none',
    '',
    'Relevant local style presets:',
    presetContext.styles.length
      ? presetContext.styles.map((style) => [
        `- ${style.id}: ${style.name} / ${style.keyword}`,
        `  Description: ${style.description}`,
        `  Fragment: ${style.promptFragment}`,
        `  Best for: ${style.bestFor?.join(', ') || 'unknown'}; avoid for: ${style.avoidFor?.join(', ') || 'none'}`,
        `  Matched keywords: ${style.matchedKeywords.join(', ') || 'none'}`,
      ].join('\n')).join('\n')
      : '- none matched',
    '',
    'Relevant local prompt templates:',
    presetContext.templates.length
      ? presetContext.templates.map((template) => [
        `- ${template.id}: ${template.title} [${template.category}]${template.source ? ` source:${template.source}` : ''}`,
        `  Scenario: ${template.scenarioLabel ?? 'category-level'}`,
        `  Governance: ${template.governance ? JSON.stringify(template.governance) : 'none'}`,
        `  Description: ${template.description ?? ''}`,
        `  Tags: ${template.tags?.join(', ') || 'none'}`,
        `  Slots: ${template.slots ? JSON.stringify(template.slots).slice(0, 800) : 'none'}`,
        `  Prompt pattern/rendered excerpt: ${template.prompt.slice(0, 1000)}`,
        `  Negative prompt: ${template.negativePrompt ?? 'none'}`,
        `  Matched keywords: ${template.matchedKeywords.join(', ') || 'none'}`,
      ].join('\n')).join('\n')
      : '- none matched',
    '',
    'Reference-only legacy example insights:',
    presetContext.references.length
      ? presetContext.references.map((reference) => [
        `- ${reference.id}: ${reference.title} [${TEMPLATE_CATEGORY_LABELS[reference.category]}] quality:${reference.qualityTier} score ${reference.score.toFixed(1)}`,
        `  Traits: ${reference.traits.join('；') || 'none'}`,
        `  Keywords: ${reference.keywords.join(', ') || 'none'}`,
        `  Strengths: ${reference.strengths.join('；') || 'none'}`,
        `  Risks to avoid: ${reference.risks.join('；') || 'none'}`,
        '  Use as inspiration only; do not copy prompt text or expose as a template choice.',
      ].join('\n')).join('\n')
      : '- none matched',
    '',
    'Relevant prompt knowledge rules:',
    presetContext.knowledge.rules.length
      ? presetContext.knowledge.rules.map((entry) => [
        `- ${entry.item.id}: ${entry.item.name} [${entry.item.type}] score ${entry.score}`,
        `  Applies to: ${entry.item.appliesTo.join(', ')}`,
        `  Description: ${entry.item.description}`,
        `  Dimensions: ${entry.item.dimensions.join('；')}`,
        `  Positive guidance: ${entry.item.positiveFragments.slice(0, 6).join('；')}`,
        `  Negative guidance: ${entry.item.negativeFragments.slice(0, 6).join('；')}`,
        `  Matched keywords: ${entry.matchedKeywords.join(', ') || 'none'}`,
      ].join('\n')).join('\n')
      : '- none matched',
    '',
    'Matched prompt intents:',
    presetContext.knowledge.intents.length
      ? presetContext.knowledge.intents.map((entry) => `- ${entry.item.id}: phrases ${entry.item.phrases.join(', ')}; categories ${entry.item.categories.join(', ')}; rules ${entry.item.ruleIds.join(', ')}; score ${entry.score}`).join('\n')
      : '- none matched',
    '',
    'Output profile guidance:',
    `- ${presetContext.knowledge.outputProfile.id}: ${presetContext.knowledge.outputProfile.name}`,
    `  Language: ${presetContext.knowledge.outputProfile.language}`,
    `  Description: ${presetContext.knowledge.outputProfile.description}`,
    `  Tags: ${presetContext.knowledge.outputProfile.tags.join(', ')}`,
    `  Required sections: ${presetContext.knowledge.outputProfile.requiredSections.join(', ')}`,
    `  Format guidance: ${presetContext.knowledge.outputProfile.formatGuidance.join('；')}`,
    `  Avoid: ${presetContext.knowledge.outputProfile.avoid.join('；')}`,
    '',
    'Response format requirements:',
    '- Start with a short human-readable recommendation summary in Chinese.',
    '- Include a fenced ```json block with keys: intent, recommendations, borrowedSources, rejectedTraits, validationNotes, rewriteStages, finalPrompt, negativePrompt, actions. Use templateId/styleIds only from the listed internal candidates.',
    '- In the JSON intent field, preserve or refine the structured visual intent instead of replacing it with unrelated free-form text.',
    '- borrowedSources must be an array of objects: {sourceType: "template"|"style"|"knowledge"|"reference"|"strategy", id, title, aspects, reason}. List only what you actually borrow.',
    '- rejectedTraits must be an array of objects: {sourceType, id, trait, reason}. Include unsuitable template traits such as hard-sell price tags, information-graphic modules, copied signatures, platform residue, or conflicting styles.',
    '- validationNotes must be an array of objects: {type: "completeness"|"anti-template"|"compatibility"|"local-only"|"other", severity: "info"|"warning"|"error", message}. Mention missing visual dimensions or anti-template residue.',
    '- rewriteStages should summarize the four brains with arrays named retrieval, judgment, expression, and validation.',
    '- If required slots are missing, either ask concise questions or state the safe assumptions used to fill them.',
    '- If the user asks to create/save a template, include templateDraft in the JSON. Do not save raw prompts directly; abstract category, tags, slots, promptPattern, negativePrompt, outputHints, and examples.',
    '- Include a visible line or section named exactly "Used local knowledge IDs:".',
    '- For compatibility, also include a visible line or section named exactly "Used preset IDs:" and keep it to actual template/style IDs only, or "Used preset IDs: none".',
    '- If prompt knowledge rules influence the answer, mention them separately as "Used knowledge IDs:". Do not mix knowledge IDs into "Used preset IDs:".',
    '- When you produce a ready-to-use prompt, label it exactly as "Final prompt:" followed by the prompt text.',
    '- Final prompts must be a natural rewrite, not a concatenation of retrieved fragments or a direct slot-fill. They should follow the selected output profile first, while still covering subject, scene/background, composition/layout, camera or viewing angle, lighting, color palette, material/texture, style guidance, text requirements, quality constraints, and negative constraints when applicable.',
  ].filter(Boolean).join('\n')
}

export async function callPromptAgent(
  settings: EffectiveChatSettings,
  messages: ChatMessage[],
  latestUserMessage: string,
  presetOnly = false,
  currentPrompt = '',
  onDelta?: (delta: string, fullText: string) => void,
): Promise<{ content: string; presetContext: PresetContext }> {
  const contextQuery = [currentPrompt, latestUserMessage].filter(Boolean).join('\n')
  const presetContext = buildPresetContext(contextQuery || latestUserMessage, presetOnly)
  const recentMessages = messages.slice(-8)
  const content = await postChatCompletion(settings, [
    { role: 'system', content: buildSystemPrompt(presetContext) },
    currentPrompt.trim()
      ? { role: 'user', content: `Current input prompt before this conversation:\n${currentPrompt.trim()}` }
      : { role: 'user', content: 'Current input prompt is empty.' },
    ...recentMessages,
  ], 0.6, { stream: settings.stream, onDelta })

  return { content, presetContext }
}

