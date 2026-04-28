import { STYLE_PRESETS, TEMPLATE_PRESETS, extractSearchKeywords, type StylePreset, type TemplatePreset } from './promptPresets'

export type PromptTemplateCategory = 'poster' | 'portrait' | 'anime' | 'product' | 'ui-screenshot' | 'infographic' | 'scene' | 'other'
export type PromptTemplateScenario =
  | 'brand-key-visual'
  | 'ecommerce-sale-poster'
  | 'event-release-poster'
  | 'social-campaign-cover'
  | 'saas-landing-hero'
  | 'analytics-dashboard'
  | 'food-drink-photo'
  | 'tech-product-render'
  | 'packaging-display'
  | 'interior-architecture'
  | 'workflow-explainer'

export interface PromptTemplateSlot {
  label: string
  required?: boolean
  default?: string
  examples?: string[]
}

export interface PromptOutputHints {
  aspectRatio?: string
  language?: string
  textDensity?: 'none' | 'low' | 'medium' | 'high'
  realism?: 'low' | 'medium' | 'high'
}

export type TemplateGovernanceStatus = 'active' | 'needs-review' | 'deprecated' | 'inactive'
export type TemplateQualityTier = 'high' | 'medium' | 'low'
export type TemplateTextDensity = NonNullable<PromptOutputHints['textDensity']>

export interface TemplateGovernance {
  sourceRole: 'primary' | 'reference' | 'user'
  status: TemplateGovernanceStatus
  qualityTier: TemplateQualityTier
  intents: string[]
  platforms: string[]
  subjectTypes: string[]
  textDensity: TemplateTextDensity[]
}

export interface VisualIntentTextRequirement {
  required?: boolean
  content?: string
  density?: TemplateTextDensity
}

export interface VisualIntent {
  subject?: string
  category?: PromptTemplateCategory
  scenario?: PromptTemplateScenario
  scenarioLabel?: string
  purpose?: string
  platform?: string
  styleHints: string[]
  mood?: string
  palette?: string
  composition?: string
  aspectRatio?: string
  realism?: 'low' | 'medium' | 'high'
  text: VisualIntentTextRequirement
  constraints: string[]
  negativeHints: string[]
  missingFields: string[]
  confidence: number
}

export interface StructuredPromptTemplate {
  id: string
  name: string
  category: PromptTemplateCategory
  scenario?: PromptTemplateScenario
  scenarioLabel?: string
  scenarioAliases?: string[]
  description: string
  tags: string[]
  slots: Record<string, PromptTemplateSlot>
  promptPattern: string
  negativePrompt: string
  outputHints: PromptOutputHints
  examples: string[]
  source?: 'official' | 'legacy' | 'user'
  sourceTitle?: string
  sourcePrompt?: string
  sourceLanguage?: string
  sourceUrl?: string
  author?: string
  isPlaceholderOnly?: boolean
  governance?: Partial<TemplateGovernance>
}

export interface StyleVisualTraits {
  lighting?: string
  composition?: string
  color?: string
  texture?: string
  rendering?: string
  camera?: string
}

export interface StructuredStylePreset extends StylePreset {
  category: 'photographic' | 'traditional-art' | 'anime-game' | 'commercial-design' | 'sci-fi-trend' | 'craft-material'
  tags: string[]
  aliases: string[]
  visualTraits: StyleVisualTraits
  bestFor: PromptTemplateCategory[]
  avoidFor: PromptTemplateCategory[]
  negativePrompt: string
}

export interface RankedResult<T> {
  item: T
  score: number
  matchedKeywords: string[]
}

export interface PromptRecommendation {
  template: StructuredPromptTemplate
  styles: StructuredStylePreset[]
  confidence: number
  reason: string
  filledSlots: Record<string, string>
  missingSlots?: string[]
}

export interface LegacyReferenceInsight {
  id: string
  title: string
  category: PromptTemplateCategory
  sourceRole: 'reference'
  qualityTier: TemplateQualityTier
  traits: string[]
  keywords: string[]
  strengths: string[]
  risks: string[]
  score: number
  matchedKeywords: string[]
}

export interface PromptStrategyChain {
  id: string
  title: string
  scenario?: PromptTemplateScenario
  scenarioLabel?: string
  intent: string[]
  structure: string[]
  visualLanguage: string[]
  keywordPack: {
    structure: string[]
    composition: string[]
    visual: string[]
    quality: string[]
    negative: string[]
  }
  ruleIds: string[]
  templateIds: string[]
  styleIds: string[]
  referenceIds: string[]
  confidence: number
  reason: string
}

export interface TemplateDraft extends StructuredPromptTemplate {
  source: 'user'
  createdAt: number
}

export type AssistantEvidenceSourceType = 'template' | 'style' | 'knowledge' | 'reference' | 'strategy' | 'custom'
export type AssistantValidationSeverity = 'info' | 'warning' | 'error'

export interface AssistantBorrowedSource {
  sourceType?: AssistantEvidenceSourceType
  id?: string
  title?: string
  aspects: string[]
  reason?: string
}

export interface AssistantRejectedTrait {
  sourceType?: AssistantEvidenceSourceType
  id?: string
  trait: string
  reason?: string
}

export interface AssistantValidationNote {
  type?: 'completeness' | 'anti-template' | 'compatibility' | 'local-only' | 'other'
  severity?: AssistantValidationSeverity
  message: string
}

export interface AssistantRewriteStages {
  retrieval?: string[]
  judgment?: string[]
  expression?: string[]
  validation?: string[]
}

export interface ParsedAssistantComposition {
  intent?: Partial<VisualIntent> | Record<string, unknown>
  recommendations?: Array<{
    templateId?: string
    styleIds?: string[]
    confidence?: number
    reason?: string
    filledSlots?: Record<string, string>
  }>
  borrowedSources?: AssistantBorrowedSource[]
  rejectedTraits?: AssistantRejectedTrait[]
  validationNotes?: AssistantValidationNote[]
  rewriteStages?: AssistantRewriteStages
  finalPrompt?: string
  negativePrompt?: string
  actions?: string[]
  templateDraft?: TemplateDraft
}

export interface AssistantCompositionValidation {
  composition: ParsedAssistantComposition
  validTemplateIds: string[]
  validStyleIds: string[]
  invalidTemplateIds: string[]
  invalidStyleIds: string[]
  missingRequiredSlots: string[]
  warnings: string[]
  promptWarnings?: string[]
}

export const TEMPLATE_CATEGORY_LABELS: Record<PromptTemplateCategory, string> = {
  poster: '海报 / 广告',
  portrait: '人物 / 摄影',
  anime: '二次元 / 角色',
  product: '产品 / 物体',
  'ui-screenshot': 'UI / 截图',
  infographic: '信息图 / 百科',
  scene: '场景 / 环境',
  other: '其他',
}

export const TEMPLATE_SCENARIO_LABELS: Record<PromptTemplateScenario, string> = {
  'brand-key-visual': '品牌主视觉',
  'ecommerce-sale-poster': '电商促销海报',
  'event-release-poster': '活动 / 发布海报',
  'social-campaign-cover': '社媒传播封面',
  'saas-landing-hero': 'SaaS 落地页首屏',
  'analytics-dashboard': '数据看板截图',
  'food-drink-photo': '食品 / 饮品摄影',
  'tech-product-render': '科技产品渲染',
  'packaging-display': '包装展示',
  'interior-architecture': '室内 / 建筑空间',
  'workflow-explainer': '流程解释图',
}

const TEMPLATE_SCENARIO_ALIASES: Record<PromptTemplateScenario, string[]> = {
  'brand-key-visual': ['品牌主视觉', '主视觉', 'KV', 'key visual', '品牌海报', '品牌大片', '品牌形象'],
  'ecommerce-sale-poster': ['电商', '促销', '大促', '优惠', '618', '双11', '限时', '买赠', 'sale', '商品促销'],
  'event-release-poster': ['活动', '发布会', '新品发布', '邀请函', '展会', '峰会', '开业', 'release', 'event'],
  'social-campaign-cover': ['小红书', '封面', '种草', '社媒', '社交媒体', '笔记', '朋友圈', 'campaign'],
  'saas-landing-hero': ['SaaS', '官网', '落地页', 'landing page', 'hero', '首页首屏', '产品首页'],
  'analytics-dashboard': ['dashboard', '仪表盘', '数据看板', '后台', '管理台', 'BI', '图表界面', 'analytics'],
  'food-drink-photo': ['美食', '食物', '饮品', '咖啡', '甜品', '餐饮', '奶茶', 'food', 'drink'],
  'tech-product-render': ['科技产品', '硬件', '耳机', '无线耳机', 'earbud', 'earbuds', '手机', '机器人', '设备', '3C', 'render', '渲染'],
  'packaging-display': ['包装', '盒子', '瓶身', '标签', '礼盒', '包装设计', '包装展示'],
  'interior-architecture': ['室内', '建筑', '空间', '家居', '展厅', '办公室', '民宿', 'interior', 'architecture'],
  'workflow-explainer': ['流程图', '工作流', '步骤', '解释图', '教程', '方法论', '对比图', 'process', 'workflow'],
}

const USER_TEMPLATE_STORAGE_KEY = 'gpt-image-user-structured-templates'

export const OFFICIAL_PROMPT_TEMPLATES: StructuredPromptTemplate[] = [
  {
    id: 'poster-product-premium',
    name: '高级产品海报',
    category: 'poster',
    description: '适合新品发布、品牌种草和高级商业视觉的产品主海报。',
    tags: ['海报', '广告', '产品', '小红书', '高级', '商业', '新品', '少文字'],
    slots: {
      subject: { label: '产品/主题', required: true, examples: ['高级咖啡新品', '香氛蜡烛', '护肤精华'] },
      mood: { label: '情绪', default: '高级、克制、干净、精致' },
      composition: { label: '构图', default: '中央产品主视觉，大面积留白，清晰标题层级' },
      palette: { label: '色彩', default: '低饱和品牌色、奶油白、暗金或深棕点缀' },
      text: { label: '文字', default: '短标题、副标题和少量卖点标签' },
    },
    promptPattern: '生成一张 9:16 竖版高级产品宣传海报，主题是{{subject}}。整体情绪{{mood}}。构图采用{{composition}}。色彩体系为{{palette}}。画面文字控制为{{text}}。要求商业广告级质感、清晰主视觉、精致材质表现、适合社交媒体传播。',
    negativePrompt: '避免廉价促销感、杂乱排版、过多文字、错误文字、低清晰度、主体不明确。',
    outputHints: { aspectRatio: '9:16', language: 'zh-CN', textDensity: 'low', realism: 'high' },
    examples: ['高级咖啡新品海报', '新中式茶饮主视觉', '香水产品发布海报'],
    source: 'official',
  },
  {
    id: 'poster-cinematic-epic',
    name: '暗黑史诗电影海报',
    category: 'poster',
    description: '适合人物、IP、事件或抽象主题的高预算电影感主海报。',
    tags: ['海报', '电影感', '暗黑', '史诗', '主视觉', '宣传', '角色'],
    slots: {
      subject: { label: '主题/主体', required: true, examples: ['未来守护者', '特朗普的思考', '末日城市'] },
      mood: { label: '情绪', default: '庄严、神秘、压迫感、仪式感' },
      environment: { label: '环境', default: '神殿、废墟、洞穴或封闭史诗空间' },
      lighting: { label: '光源', default: '顶部单一强光、轮廓光、强烈明暗对比' },
      symbols: { label: '象征元素', default: '徽记、残碑、符文、能量环或抽象象征物' },
    },
    promptPattern: '围绕{{subject}}生成一张顶级暗黑史诗电影海报。场景位于{{environment}}，整体情绪{{mood}}。光线使用{{lighting}}，画面包含{{symbols}}。要求高预算电影主海报气质、cinematic matte painting、超写实摄影质感、强空间叙事和仪式感构图。',
    negativePrompt: '避免普通插画感、廉价游戏截图、杂乱背景、低质感文字、主体比例错误。',
    outputHints: { aspectRatio: '9:16', language: 'zh-CN', textDensity: 'low', realism: 'high' },
    examples: ['暗黑英雄电影海报', '游戏 boss 主视觉', '史诗事件宣传图'],
    source: 'official',
  },
  {
    id: 'poster-xiaohongshu-cover',
    name: '小红书封面种草图',
    category: 'poster',
    description: '适合生活方式、产品种草、教程和清爽社媒封面。',
    tags: ['小红书', '封面', '种草', '生活方式', '教程', '少文字', '社媒'],
    slots: {
      subject: { label: '主题', required: true, examples: ['夏日咖啡', '护肤步骤', '旅行穿搭'] },
      audience: { label: '目标人群', default: '年轻女性社媒用户' },
      style: { label: '版式', default: '干净网格、圆角贴纸、轻量标签、留白充足' },
      palette: { label: '色彩', default: '奶油色、浅粉、浅咖、低饱和明亮色' },
    },
    promptPattern: '生成一张小红书风格封面图，主题是{{subject}}，面向{{audience}}。版式采用{{style}}，色彩为{{palette}}。画面要清爽、有高级生活方式感，文字少但重点明确，适合手机端浏览。',
    negativePrompt: '避免文字拥挤、土味促销、过度滤镜、主体太小、排版混乱。',
    outputHints: { aspectRatio: '3:4', language: 'zh-CN', textDensity: 'low' },
    examples: ['小红书咖啡封面', '护肤种草图', '旅行攻略封面'],
    source: 'official',
  },
  {
    id: 'poster-science-infographic',
    name: '科普百科信息图',
    category: 'infographic',
    description: '适合将主题转成图鉴感、百科感、信息结构清晰的竖版知识卡。',
    tags: ['科普', '百科', '信息图', '图鉴', '知识卡', '模块化', '海报'],
    slots: {
      subject: { label: '科普主题', required: true, examples: ['咖啡豆', '猫科动物', '月球基地'] },
      sections: { label: '栏目', default: '基础档案、结构特征、Top 5、养护/使用建议、重点总结' },
      visual: { label: '主视觉', default: '清晰漂亮的主题主视觉和局部放大细节' },
      layout: { label: '版式', default: '圆角模块化分区、清楚标题层级、可视化标签' },
    },
    promptPattern: '请根据{{subject}}生成一张高质量竖版科普百科信息图。主视觉为{{visual}}。内容栏目包含{{sections}}。整体版式为{{layout}}。风格参考高级博物图鉴、现代百科书页和高传播社媒知识卡。',
    negativePrompt: '避免文字过密、知识点无结构、低级卡通、无主视觉、错误文字。',
    outputHints: { aspectRatio: '9:16', language: 'zh-CN', textDensity: 'high' },
    examples: ['咖啡豆百科图', '宠物养护信息图', '城市知识卡'],
    source: 'official',
  },
  {
    id: 'portrait-editorial-soft-light',
    name: '柔光杂志人像',
    category: 'portrait',
    description: '适合高级、自然、干净的人像摄影和杂志大片。',
    tags: ['人像', '摄影', '杂志', '柔光', '高级感', '写真', '自然'],
    slots: {
      subject: { label: '人物主体', required: true, examples: ['年轻女性', '咖啡师', '科技创业者'] },
      pose: { label: '姿态', default: '自然站姿或半身坐姿，轻微看向镜头' },
      lighting: { label: '光线', default: '柔和自然窗光，低对比，皮肤质感真实' },
      background: { label: '背景', default: '简洁室内背景，浅色墙面，轻微景深' },
      mood: { label: '情绪', default: '安静、自然、克制、高级' },
    },
    promptPattern: '生成一张{{subject}}的高级杂志人像摄影。人物{{pose}}。光线为{{lighting}}。背景为{{background}}。整体情绪{{mood}}。要求真实皮肤质感、自然比例、专业摄影构图。',
    negativePrompt: '避免塑料皮肤、过度磨皮、五官变形、手部错误、廉价写真感。',
    outputHints: { aspectRatio: '9:16', textDensity: 'none', realism: 'high' },
    examples: ['柔光职业肖像', '杂志封面人像', '自然窗边写真'],
    source: 'official',
  },
  {
    id: 'portrait-ccd-snapshot',
    name: '复古 CCD 快照',
    category: 'portrait',
    description: '适合真实、随手拍、复古闪光灯氛围的人物照片。',
    tags: ['CCD', '复古', '快照', '闪光灯', '人像', '胶片', '随手拍'],
    slots: {
      subject: { label: '人物主体', required: true, examples: ['年轻女性', '朋友聚会', '街头路人'] },
      setting: { label: '场景', default: '昏暗室内、街边、派对或日常生活空间' },
      pose: { label: '动作', default: '轻微动态、回头、被抓拍的自然表情' },
      effect: { label: '成像效果', default: '硬闪、颗粒、轻微运动模糊、旧数码相机质感' },
    },
    promptPattern: '生成一张{{subject}}的复古 CCD 快照。场景是{{setting}}，人物{{pose}}。成像效果为{{effect}}。整体像真实手机或旧数码相机随手拍，亲密、自然、生活化。',
    negativePrompt: '避免棚拍感、过度精修、AI 塑料皮肤、过度性感化、假背景。',
    outputHints: { aspectRatio: '9:16', textDensity: 'none', realism: 'high' },
    examples: ['CCD 夜晚街拍', '朋友聚会闪光灯照片', '复古偶像快照'],
    source: 'official',
  },
  {
    id: 'anime-character-sheet',
    name: '二次元角色设定',
    category: 'anime',
    description: '适合生成角色立绘、设定图和视觉设定说明。',
    tags: ['二次元', '动漫', '角色', '立绘', '设定图', '游戏', '番剧'],
    slots: {
      subject: { label: '角色概念', required: true, examples: ['机甲少女', '魔法咖啡师', '赛博忍者'] },
      personality: { label: '性格', default: '鲜明、有辨识度、带轻微反差' },
      outfit: { label: '服装', default: '与角色身份强相关的服装和配饰' },
      pose: { label: '姿态', default: '全身立绘，清晰展示轮廓和装备' },
      details: { label: '细节', default: '发型、眼睛、道具、标志性元素、材质差异' },
    },
    promptPattern: '生成一张{{subject}}的二次元角色设定图。角色性格{{personality}}，服装为{{outfit}}，姿态为{{pose}}。重点展示{{details}}。要求线条干净、色彩明确、角色辨识度强，适合动画或游戏设定。',
    negativePrompt: '避免人体比例崩坏、手部错误、服装细节混乱、背景喧宾夺主、低清晰度。',
    outputHints: { aspectRatio: '3:4', textDensity: 'low' },
    examples: ['机甲少女设定图', '魔法师立绘', '游戏角色三视图'],
    source: 'official',
  },
  {
    id: 'anime-key-visual',
    name: '番剧游戏主视觉',
    category: 'anime',
    description: '适合动画、游戏、轻小说风格的海报级主视觉。',
    tags: ['二次元', '番剧', '游戏', '主视觉', '海报', '角色群像'],
    slots: {
      subject: { label: '作品/主题', required: true, examples: ['架空动画电影', '幻想冒险小队', '机甲学院'] },
      characters: { label: '角色', default: '1-3 名核心角色，身份和姿态有差异' },
      world: { label: '世界观', default: '具有叙事感的背景场景和象征元素' },
      mood: { label: '情绪', default: '热血、梦幻、宏大或青春感' },
    },
    promptPattern: '为{{subject}}生成一张二次元番剧/游戏主视觉海报。画面包含{{characters}}，背景体现{{world}}，整体情绪{{mood}}。要求角色和背景有清晰层次、强叙事感、适合作品宣传。',
    negativePrompt: '避免角色脸部不一致、构图拥挤、文字错误、廉价同人图感。',
    outputHints: { aspectRatio: '9:16', language: 'zh-CN', textDensity: 'low' },
    examples: ['架空动画电影海报', '游戏活动主视觉', '轻小说封面'],
    source: 'official',
  },
  {
    id: 'product-studio-shot',
    name: '产品棚拍静物',
    category: 'product',
    description: '适合电商、品牌官网和产品展示的高质感静物摄影。',
    tags: ['产品', '棚拍', '静物', '电商', '材质', '商业摄影'],
    slots: {
      subject: { label: '产品', required: true, examples: ['咖啡杯', '运动鞋', '护肤瓶'] },
      surface: { label: '承载面', default: '干净亚克力、石材、木质或品牌色背景' },
      lighting: { label: '光线', default: '专业棚拍柔光，边缘高光突出材质' },
      angle: { label: '角度', default: '三分之二视角或正面英雄角度' },
    },
    promptPattern: '生成一张{{subject}}的高级产品棚拍图。产品放置在{{surface}}上，光线为{{lighting}}，拍摄角度为{{angle}}。要求材质清晰、反光自然、背景干净、商业摄影质感强。',
    negativePrompt: '避免廉价电商图、脏背景、过曝、产品变形、无质感。',
    outputHints: { aspectRatio: '1:1', textDensity: 'none', realism: 'high' },
    examples: ['咖啡杯棚拍', '护肤品静物图', '耳机产品照'],
    source: 'official',
  },
  {
    id: 'product-detail-page',
    name: '商品详情页',
    category: 'product',
    description: '适合展示产品卖点、三视图、细节和使用场景的商品详情图。',
    tags: ['产品', '详情页', '电商', '三视图', '卖点', '参数'],
    slots: {
      subject: { label: '产品', required: true, examples: ['T-800 机器人', '咖啡机', '智能手表'] },
      modules: { label: '模块', default: '正面/侧面/背面、细节放大、价格、功能、使用场景' },
      style: { label: '视觉', default: '现代电商详情页，信息清晰，模块分区明确' },
    },
    promptPattern: '生成一张{{subject}}的商品详情页，包含{{modules}}。整体视觉为{{style}}。要求产品信息结构清楚、细节图真实、排版专业，像真实电商平台详情图。',
    negativePrompt: '避免参数乱码、文字错误过多、模块混乱、产品比例不一致。',
    outputHints: { aspectRatio: '9:16', language: 'zh-CN', textDensity: 'high', realism: 'high' },
    examples: ['机器人商品详情页', '咖啡机详情图', '智能设备卖点页'],
    source: 'official',
  },
  {
    id: 'ui-social-profile',
    name: '社媒主页截图',
    category: 'ui-screenshot',
    description: '适合生成小红书、抖音、社交主页等真实感 UI 截图。',
    tags: ['UI', '截图', '社媒', '主页', '小红书', '抖音', '手机'],
    slots: {
      subject: { label: '账号/人物', required: true, examples: ['不知火舞的小红书主页', '咖啡品牌账号'] },
      platform: { label: '平台', default: '中文移动社交媒体平台' },
      content: { label: '内容', default: '头像、昵称、关注数据、图文瀑布流、互动按钮' },
      realism: { label: '真实感', default: '像手机真实截图，UI 元素清晰但不侵犯真实品牌' },
    },
    promptPattern: '生成一张{{subject}}的{{platform}}主页截图。界面包含{{content}}。整体要求{{realism}}，竖版手机截图构图，信息丰富，交互元素真实。',
    negativePrompt: '避免真实平台商标过度精确、乱码文字、UI 错位、元素比例错误。',
    outputHints: { aspectRatio: '9:16', language: 'zh-CN', textDensity: 'high' },
    examples: ['角色小红书主页', '品牌抖音主页', '虚拟博主社媒页'],
    source: 'official',
  },
  {
    id: 'ui-live-stream-screenshot',
    name: '直播间截图',
    category: 'ui-screenshot',
    description: '适合生成直播间、弹幕、礼物特效和互动 UI 的手机截图。',
    tags: ['直播', '截图', '抖音', 'UI', '弹幕', '礼物', '手机'],
    slots: {
      subject: { label: '主播/主题', required: true, examples: ['未来机器人直播卖货', '马斯克直播感谢粉丝'] },
      scene: { label: '直播环境', default: '真实直播间、手机支架、补光灯、桌面设备' },
      overlays: { label: '互动元素', default: '点赞、评论、分享按钮、弹幕、礼物提示、直播标识' },
    },
    promptPattern: '生成一张 9:16 竖版手机直播间截图，主题为{{subject}}。环境为{{scene}}。界面叠加{{overlays}}。要求像真实直播画面，氛围热烈，UI 信息丰富。',
    negativePrompt: '避免 UI 混乱、文字错误过多、人物变形、低清晰度、品牌侵权式真实标识。',
    outputHints: { aspectRatio: '9:16', language: 'zh-CN', textDensity: 'high', realism: 'high' },
    examples: ['名人直播间截图', '虚拟角色带货直播', '游戏主播直播间'],
    source: 'official',
  },
  {
    id: 'product-white-background-main-image',
    name: '电商白底主图',
    category: 'product',
    description: '适合电商平台商品首图、目录图和标准化产品展示。',
    tags: ['电商', '白底图', '主图', '商品', '产品摄影', '淘宝', '京东', '亚马逊'],
    slots: {
      product: { label: '商品', required: true, examples: ['无线降噪耳机', '玻璃保温杯', '护肤精华瓶'] },
      angle: { label: '拍摄角度', default: '正面三分之二角度，主体居中，完整展示轮廓' },
      material: { label: '材质重点', default: '真实材质、边缘清晰、细节可见' },
      shadow: { label: '阴影', default: '轻微自然投影，不抢主体' },
    },
    promptPattern: '生成一张电商白底商品主图，商品是{{product}}。拍摄角度为{{angle}}，重点表现{{material}}，背景为纯净白色，阴影为{{shadow}}。要求商业产品摄影质感，主体清晰，适合电商列表和详情页首屏。',
    negativePrompt: '避免杂乱背景、夸张滤镜、文字水印、变形商品、过度反光、低清晰度、主体被裁切。',
    outputHints: { aspectRatio: '1:1', language: 'zh-CN', textDensity: 'none', realism: 'high' },
    examples: ['无线耳机白底主图', '护肤品电商主图', '家居小物白底产品照'],
    source: 'official',
  },
  {
    id: 'product-lifestyle-scene',
    name: '生活方式产品场景图',
    category: 'product',
    description: '把产品放入真实生活场景，适合种草、详情页和广告素材。',
    tags: ['产品', '生活方式', '场景图', '种草', '详情页', '广告', '氛围'],
    slots: {
      product: { label: '产品', required: true, examples: ['香薰蜡烛', '露营咖啡壶', '儿童学习台灯'] },
      userScene: { label: '使用场景', default: '温暖整洁的真实家居环境' },
      audience: { label: '目标人群', default: '注重品质生活的年轻用户' },
      mood: { label: '氛围', default: '自然、舒适、有生活气息' },
    },
    promptPattern: '生成一张{{product}}的生活方式场景图，场景为{{userScene}}，面向{{audience}}。画面氛围{{mood}}，产品自然融入环境但仍是视觉焦点，光线柔和，质感真实，适合电商详情页和社交媒体种草。',
    negativePrompt: '避免产品不突出、场景脏乱、人物抢戏、廉价摆拍感、错误文字、品牌侵权标识。',
    outputHints: { aspectRatio: '4:3', language: 'zh-CN', textDensity: 'none', realism: 'high' },
    examples: ['香薰蜡烛卧室氛围图', '咖啡器具露营场景', '台灯书桌使用图'],
    source: 'official',
  },
  {
    id: 'product-selling-point-detail-page',
    name: '产品卖点详情页',
    category: 'product',
    description: '适合展示核心卖点、结构拆解和功能说明的商品详情页视觉。',
    tags: ['详情页', '卖点', '产品', '电商', '功能说明', '信息层级', '长图'],
    slots: {
      product: { label: '产品', required: true, examples: ['智能筋膜枪', '空气炸锅', '防晒霜'] },
      sellingPoints: { label: '卖点', default: '三到五个核心卖点，图标化呈现' },
      layout: { label: '版式', default: '模块化分区，标题醒目，图文比例均衡' },
      tone: { label: '视觉调性', default: '专业、可信、清爽' },
    },
    promptPattern: '生成一张{{product}}的电商卖点详情页视觉，重点展示{{sellingPoints}}。版式采用{{layout}}，整体调性{{tone}}。包含产品主视觉、功能说明区、细节放大区和少量中文标题占位，适合详情页首屏或中段模块。',
    negativePrompt: '避免文字过多、信息拥挤、错别字、产品结构错误、低端促销感、排版失衡。',
    outputHints: { aspectRatio: '3:4', language: 'zh-CN', textDensity: 'high', realism: 'high' },
    examples: ['筋膜枪功能详情页', '空气炸锅卖点长图', '防晒霜成分说明页'],
    source: 'official',
  },
  {
    id: 'poster-product-promotion-banner',
    name: '商品促销横幅',
    category: 'poster',
    description: '适合活动页、店铺首页和广告位的商品促销 Banner。',
    tags: ['促销', 'Banner', '活动', '电商', '商品', '折扣', '广告'],
    slots: {
      product: { label: '商品/品类', required: true, examples: ['夏季防晒套装', '咖啡豆礼盒', '运动鞋新品'] },
      campaign: { label: '活动主题', default: '限时新品优惠' },
      discount: { label: '促销信息', default: '醒目的优惠数字和行动按钮' },
      palette: { label: '色彩', default: '高对比、明快、有购买欲' },
    },
    promptPattern: '生成一张电商商品促销横幅，主推{{product}}，活动主题为{{campaign}}，画面包含{{discount}}。色彩风格{{palette}}，构图适合网页和移动端广告位，商品清晰，信息层级明确。',
    negativePrompt: '避免文字错乱、折扣信息不可读、元素过满、商品失真、廉价模板感。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'medium', realism: 'medium' },
    examples: ['618 运动鞋促销横幅', '咖啡礼盒活动 Banner', '防晒套装限时优惠图'],
    source: 'official',
  },
  {
    id: 'product-packaging-display',
    name: '产品包装陈列图',
    category: 'product',
    description: '适合包装盒、瓶身、套装和礼盒的商业陈列展示。',
    tags: ['包装', '陈列', '礼盒', '产品', '品牌', '包装设计', '商业摄影'],
    slots: {
      product: { label: '包装产品', required: true, examples: ['茶叶礼盒', '香水套装', '宠物零食包装'] },
      arrangement: { label: '陈列方式', default: '主包装打开展示，配套单品错落摆放' },
      background: { label: '背景道具', default: '与品牌调性一致的简洁道具和材质台面' },
      brandMood: { label: '品牌气质', default: '精致、可信、有高级感' },
    },
    promptPattern: '生成一张{{product}}的包装陈列展示图，陈列方式为{{arrangement}}，背景道具使用{{background}}，品牌气质{{brandMood}}。要求包装结构清晰、材质真实、适合官网和电商详情页展示。',
    negativePrompt: '避免包装文字错乱、透视错误、杂乱道具、低清晰度、过度反光、品牌标识侵权。',
    outputHints: { aspectRatio: '4:3', language: 'zh-CN', textDensity: 'low', realism: 'high' },
    examples: ['茶叶礼盒包装展示', '香水礼盒陈列图', '食品包装套装图'],
    source: 'official',
  },
  {
    id: 'poster-xiaohongshu-lifestyle-cover',
    name: '小红书生活方式封面',
    category: 'poster',
    description: '适合生活方式、教程、好物分享和种草笔记封面。',
    tags: ['小红书', '封面', '种草', '社交媒体', '笔记', '标题', '生活方式'],
    slots: {
      topic: { label: '笔记主题', required: true, examples: ['春季通勤穿搭', '租房卧室改造', '新手咖啡器具'] },
      title: { label: '封面标题', default: '醒目的短标题，控制在 8 到 14 个字' },
      visual: { label: '主视觉', default: '清晰主体、生活化场景、强记忆点' },
      tone: { label: '风格', default: '干净明亮、真实、有分享欲' },
    },
    promptPattern: '生成一张小红书笔记封面，主题是{{topic}}。封面标题为{{title}}，主视觉要求{{visual}}，整体风格{{tone}}。采用竖版构图，标题清晰醒目，适合提高点击率。',
    negativePrompt: '避免标题太长、错别字、信息拥挤、低质拼贴、过度磨皮、营销感太重。',
    outputHints: { aspectRatio: '3:4', language: 'zh-CN', textDensity: 'medium', realism: 'medium' },
    examples: ['通勤穿搭小红书封面', '卧室改造前后封面', '咖啡入门笔记封面'],
    source: 'official',
  },
  {
    id: 'poster-wechat-article-header',
    name: '公众号文章头图',
    category: 'poster',
    description: '适合公众号、长文、专栏和品牌内容的文章头图。',
    tags: ['公众号', '头图', '文章', '长文', '品牌内容', '封面', '配图'],
    slots: {
      topic: { label: '文章主题', required: true, examples: ['年度消费趋势', 'AI 设计工作流', '城市更新观察'] },
      title: { label: '标题文字', default: '沉稳清晰的中文标题' },
      metaphor: { label: '视觉隐喻', default: '与主题相关的象征性画面' },
      tone: { label: '调性', default: '专业、克制、有观点感' },
    },
    promptPattern: '生成一张公众号文章头图，文章主题为{{topic}}，标题文字为{{title}}。画面使用{{metaphor}}作为视觉隐喻，整体调性{{tone}}，横版构图，留出标题区，适合知识型或品牌型内容。',
    negativePrompt: '避免花哨营销风、标题不可读、素材堆砌、错误文字、低分辨率。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'medium', realism: 'medium' },
    examples: ['AI 工作流公众号头图', '消费趋势文章封面', '城市观察专栏头图'],
    source: 'official',
  },
  {
    id: 'poster-bilibili-video-cover',
    name: 'B站视频封面',
    category: 'poster',
    description: '适合知识区、游戏区、数码区和娱乐向视频封面。',
    tags: ['B站', '视频封面', '封面', '标题', 'UP主', '点击率', '横版'],
    slots: {
      topic: { label: '视频主题', required: true, examples: ['三分钟看懂机械键盘', '独立游戏实况', 'AI 绘画避坑指南'] },
      hook: { label: '钩子标题', default: '一句强钩子标题，突出反差或收益' },
      subject: { label: '画面主体', default: '夸张但清晰的主视觉人物或物体' },
      style: { label: '封面风格', default: '高对比、强层次、年轻化' },
    },
    promptPattern: '生成一张 B站视频封面，视频主题是{{topic}}，钩子标题为{{hook}}，画面主体为{{subject}}。整体风格{{style}}，横版 16:9，标题大而清楚，主体表情或动作有冲击力。',
    negativePrompt: '避免标题太小、文字乱码、主体不明确、元素太碎、低清晰度、侵权 Logo。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'medium', realism: 'medium' },
    examples: ['机械键盘科普封面', '游戏实况高能封面', 'AI 绘画教程封面'],
    source: 'official',
  },
  {
    id: 'poster-livestream-cover',
    name: '直播预约封面',
    category: 'poster',
    description: '适合带货、课程、访谈和活动直播的预约封面。',
    tags: ['直播', '封面', '预约', '带货', '课程', '活动', '主播'],
    slots: {
      event: { label: '直播主题', required: true, examples: ['新品发布直播', '摄影课公开课', '年货节带货'] },
      host: { label: '主播/嘉宾', default: '清晰的人物主视觉或品牌形象' },
      timeInfo: { label: '时间信息', default: '醒目的直播时间和预约按钮' },
      atmosphere: { label: '气氛', default: '热烈、可信、行动感强' },
    },
    promptPattern: '生成一张直播预约封面，主题为{{event}}，主视觉包含{{host}}，信息区包含{{timeInfo}}。整体气氛{{atmosphere}}，适合移动端直播入口和社交传播。',
    negativePrompt: '避免信息拥挤、时间文字错乱、人物变形、廉价促销感、平台真实商标。',
    outputHints: { aspectRatio: '9:16', language: 'zh-CN', textDensity: 'high', realism: 'medium' },
    examples: ['课程直播预约封面', '新品发布直播图', '年货节带货封面'],
    source: 'official',
  },
  {
    id: 'poster-event-key-visual',
    name: '活动主视觉海报',
    category: 'poster',
    description: '适合大会、展览、市集、音乐节和线下活动主视觉。',
    tags: ['活动', '主视觉', '海报', 'KV', '展览', '大会', '市集'],
    slots: {
      event: { label: '活动名称/主题', required: true, examples: ['城市咖啡节', 'AI 创作者大会', '独立设计市集'] },
      audience: { label: '受众', default: '年轻创意人群' },
      symbol: { label: '核心符号', default: '一个可延展的视觉符号或场景' },
      palette: { label: '色彩', default: '鲜明、有识别度、适合物料延展' },
    },
    promptPattern: '生成一张活动主视觉海报，活动主题为{{event}}，面向{{audience}}，核心符号为{{symbol}}。色彩使用{{palette}}，版式适合线上海报、门票和现场物料延展，标题区清晰。',
    negativePrompt: '避免信息杂乱、视觉符号不统一、标题不可读、低级模板感、错别字。',
    outputHints: { aspectRatio: '4:5', language: 'zh-CN', textDensity: 'medium', realism: 'medium' },
    examples: ['咖啡节活动 KV', 'AI 大会主视觉', '设计市集宣传海报'],
    source: 'official',
  },
  {
    id: 'portrait-professional-headshot',
    name: '职业形象照',
    category: 'portrait',
    description: '适合个人品牌、简历、企业官网和商务头像。',
    tags: ['头像', '职业照', '商务', '人像', '简历', '个人品牌', '摄影'],
    slots: {
      person: { label: '人物描述', required: true, examples: ['年轻产品经理', '资深律师', '创业公司 CEO'] },
      clothing: { label: '服装', default: '简洁得体的商务休闲服装' },
      background: { label: '背景', default: '干净浅色背景或柔和办公环境' },
      expression: { label: '表情', default: '自然自信、亲和但专业' },
    },
    promptPattern: '生成一张{{person}}的职业形象照，服装为{{clothing}}，背景为{{background}}，表情{{expression}}。要求真实摄影质感，面部清晰，光线柔和，适合作为简历、官网和社交头像。',
    negativePrompt: '避免过度美颜、五官变形、背景杂乱、夸张姿势、低清晰度、证件照僵硬感。',
    outputHints: { aspectRatio: '1:1', language: 'zh-CN', textDensity: 'none', realism: 'high' },
    examples: ['产品经理职业头像', '律师商务形象照', '创业者个人品牌照'],
    source: 'official',
  },
  {
    id: 'portrait-id-photo',
    name: '标准证件照',
    category: 'portrait',
    description: '适合生成规范、干净、正面构图的证件照风格头像。',
    tags: ['证件照', '头像', '正面', '白底', '蓝底', '人像', '规范'],
    slots: {
      person: { label: '人物描述', required: true, examples: ['短发年轻女性', '戴眼镜的男性工程师', '学生形象'] },
      background: { label: '底色', default: '纯白或浅蓝色背景' },
      clothing: { label: '服装', default: '深色有领上衣，整洁正式' },
      lighting: { label: '光线', default: '均匀柔和，无强烈阴影' },
    },
    promptPattern: '生成一张{{person}}的标准证件照，背景为{{background}}，服装为{{clothing}}，光线{{lighting}}。正面半身构图，表情自然，头肩比例规范，画面干净。',
    negativePrompt: '避免侧脸、夸张表情、浓重滤镜、背景纹理、头发遮脸、五官变形、艺术化构图。',
    outputHints: { aspectRatio: '3:4', language: 'zh-CN', textDensity: 'none', realism: 'high' },
    examples: ['白底职业证件照', '蓝底学生证件照', '正式头像照'],
    source: 'official',
  },
  {
    id: 'portrait-cinematic-still',
    name: '电影剧照人像',
    category: 'portrait',
    description: '适合有叙事感、氛围感和电影光影的人物照片。',
    tags: ['电影感', '剧照', '人像', '叙事', '光影', '氛围', '摄影'],
    slots: {
      character: { label: '人物', required: true, examples: ['雨夜里的侦探', '末日旅人', '复古歌手'] },
      scene: { label: '场景', default: '具有故事感的环境' },
      lighting: { label: '光影', default: '低调电影光、轮廓光、浅景深' },
      emotion: { label: '情绪', default: '克制、神秘、带有未完成的故事' },
    },
    promptPattern: '生成一张{{character}}的电影剧照人像，场景为{{scene}}，光影采用{{lighting}}，人物情绪{{emotion}}。要求电影镜头语言、真实皮肤质感、强叙事氛围。',
    negativePrompt: '避免影楼感、过度锐化、表情僵硬、背景空洞、五官变形、低清晰度。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'none', realism: 'high' },
    examples: ['雨夜侦探电影人像', '末日旅人剧照', '复古歌手舞台后台'],
    source: 'official',
  },
  {
    id: 'portrait-couple-lifestyle',
    name: '情侣生活人像',
    category: 'portrait',
    description: '适合情侣写真、婚礼预热和生活方式双人肖像。',
    tags: ['情侣', '双人', '人像', '写真', '生活方式', '婚礼', '自然'],
    slots: {
      couple: { label: '人物关系', required: true, examples: ['年轻情侣', '新婚夫妻', '旅行中的伴侣'] },
      location: { label: '地点', default: '自然光充足的城市街角或家居空间' },
      interaction: { label: '互动', default: '自然牵手、对视或轻松交谈' },
      mood: { label: '情绪', default: '温暖、真实、亲密但不刻意' },
    },
    promptPattern: '生成一张{{couple}}的情侣生活人像，地点为{{location}}，互动方式是{{interaction}}，整体情绪{{mood}}。要求自然摄影质感，双人关系清晰，画面温柔有故事。',
    negativePrompt: '避免姿势僵硬、面部变形、关系不自然、过度摆拍、低清晰度、背景杂乱。',
    outputHints: { aspectRatio: '4:5', language: 'zh-CN', textDensity: 'none', realism: 'high' },
    examples: ['街角情侣写真', '居家情侣生活照', '旅行伴侣自然人像'],
    source: 'official',
  },
  {
    id: 'anime-character-turnaround',
    name: '角色三视图设定',
    category: 'anime',
    description: '适合二次元、游戏和动画角色的正侧背设定图。',
    tags: ['角色设定', '三视图', '二次元', '游戏角色', '动画', '设定稿', '立绘'],
    slots: {
      character: { label: '角色', required: true, examples: ['赛博忍者少女', '森林治愈系法师', '蒸汽朋克机械师'] },
      outfit: { label: '服装装备', default: '与身份匹配的服装、配饰和武器道具' },
      views: { label: '视图', default: '正面、侧面、背面三视图，同一比例' },
      notes: { label: '设定备注', default: '少量中文标注，说明关键材质和设计点' },
    },
    promptPattern: '生成一张{{character}}的角色三视图设定图，服装装备为{{outfit}}，包含{{views}}，并加入{{notes}}。要求角色比例一致，轮廓清楚，适合动画或游戏美术设定。',
    negativePrompt: '避免三视图不一致、比例漂移、姿势过度夸张、文字过多、背景复杂、肢体错误。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'medium', realism: 'low' },
    examples: ['赛博忍者少女三视图', '奇幻法师角色设定', '机械师游戏角色设定'],
    source: 'official',
  },
  {
    id: 'anime-game-splash-art',
    name: '游戏角色宣传图',
    category: 'anime',
    description: '适合游戏角色上线、卡池宣传和英雄主视觉。',
    tags: ['游戏', '角色', '宣传图', 'Splash Art', '二次元', '英雄', '卡池'],
    slots: {
      character: { label: '角色', required: true, examples: ['雷电弓手', '机械龙骑士', '水元素偶像'] },
      action: { label: '动作', default: '具有冲击力的战斗或登场姿态' },
      environment: { label: '环境', default: '与角色能力匹配的史诗背景' },
      effects: { label: '特效', default: '技能光效、粒子、动势线和层次化前景' },
    },
    promptPattern: '生成一张游戏角色宣传图，角色是{{character}}，动作是{{action}}，环境为{{environment}}，特效包含{{effects}}。要求动态构图、强视觉冲击、适合游戏卡池或英雄上线主视觉。',
    negativePrompt: '避免动作混乱、面部崩坏、特效遮挡主体、廉价页游感、低清晰度、肢体错误。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'low', realism: 'low' },
    examples: ['雷电弓手角色宣传', '机械龙骑士上线图', '水元素偶像卡池图'],
    source: 'official',
  },
  {
    id: 'anime-chibi-avatar',
    name: 'Q版头像',
    category: 'anime',
    description: '适合社交头像、表情包头像和可爱角色形象。',
    tags: ['Q版', '头像', '可爱', '二次元', '萌系', '社交头像', '角色'],
    slots: {
      character: { label: '角色', required: true, examples: ['戴猫耳的程序员', '奶茶店女孩', '小机器人助手'] },
      expression: { label: '表情', default: '开心、灵动、有亲和力' },
      props: { label: '道具', default: '一到两个能表达身份的小道具' },
      palette: { label: '色彩', default: '明亮柔和的糖果色' },
    },
    promptPattern: '生成一个{{character}}的 Q版头像，表情{{expression}}，道具包含{{props}}，色彩为{{palette}}。圆形头像构图，大头小身，可爱干净，适合社交媒体头像。',
    negativePrompt: '避免恐怖感、复杂背景、五官错位、过多文字、低清晰度、不可爱比例。',
    outputHints: { aspectRatio: '1:1', language: 'zh-CN', textDensity: 'none', realism: 'low' },
    examples: ['猫耳程序员 Q版头像', '奶茶女孩头像', '机器人助手头像'],
    source: 'official',
  },
  {
    id: 'anime-character-card-illustration',
    name: '角色卡牌插画',
    category: 'anime',
    description: '适合桌游、手游、OC 设定和收藏卡牌视觉。',
    tags: ['卡牌', '角色', '插画', '二次元', '桌游', '手游', '收藏'],
    slots: {
      character: { label: '角色', required: true, examples: ['月光刺客', '火焰召唤师', '星际修女'] },
      rarity: { label: '稀有度气质', default: '高稀有度，华丽但不杂乱' },
      frame: { label: '卡面框架', default: '精致边框、属性徽章和留白标题区' },
      background: { label: '背景', default: '与角色故事匹配的幻想场景' },
    },
    promptPattern: '生成一张{{character}}的角色卡牌插画，稀有度气质为{{rarity}}，卡面框架包含{{frame}}，背景为{{background}}。要求竖版卡牌构图，角色突出，装饰细节精致。',
    negativePrompt: '避免卡框遮挡人物、文字错乱、主体太小、细节糊成一团、肢体错误。',
    outputHints: { aspectRatio: '2:3', language: 'zh-CN', textDensity: 'low', realism: 'low' },
    examples: ['月光刺客卡牌', '火焰召唤师卡面', '星际修女收藏卡'],
    source: 'official',
  },
  {
    id: 'other-logo-concept-board',
    name: 'Logo 概念提案',
    category: 'other',
    description: '适合品牌 Logo 方向探索、图形符号和提案板。',
    tags: ['Logo', '品牌', '标志', '概念', '提案', '视觉识别', '符号'],
    slots: {
      brand: { label: '品牌/项目', required: true, examples: ['精品咖啡品牌', 'AI 效率工具', '户外运动社群'] },
      keywords: { label: '品牌关键词', default: '三个核心关键词，如专业、友好、可信' },
      direction: { label: '图形方向', default: '简洁几何符号，可延展为图标系统' },
      palette: { label: '颜色', default: '黑白稿加一组品牌主色方案' },
    },
    promptPattern: '生成一张{{brand}}的 Logo 概念提案板，品牌关键词为{{keywords}}，图形方向为{{direction}}，颜色包含{{palette}}。展示多个标志草案、图形解释和应用预览，整体专业清爽。',
    negativePrompt: '避免复杂插画化、真实品牌侵权、文字乱码、图形不可识别、低端模板感。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'medium', realism: 'low' },
    examples: ['咖啡品牌 Logo 提案', 'AI 工具标志概念', '户外社群视觉符号'],
    source: 'official',
  },
  {
    id: 'other-brand-moodboard',
    name: '品牌视觉情绪板',
    category: 'other',
    description: '适合品牌方向、活动视觉和产品线调性的情绪板。',
    tags: ['品牌', '情绪板', 'Moodboard', '视觉调性', '色彩', '材质', '提案'],
    slots: {
      brand: { label: '品牌/项目', required: true, examples: ['自然护肤品牌', '独立书店', '科技播客'] },
      mood: { label: '情绪关键词', default: '自然、克制、温暖、可信' },
      elements: { label: '视觉元素', default: '色卡、材质、摄影参考、字体感和图形碎片' },
      audience: { label: '受众', default: '重视审美与品质的年轻用户' },
    },
    promptPattern: '生成一张{{brand}}的品牌视觉情绪板，情绪关键词为{{mood}}，包含{{elements}}，面向{{audience}}。画面以拼贴板形式呈现，信息有序，适合设计提案。',
    negativePrompt: '避免素材堆砌、风格不统一、文字过多、低清晰度、侵权图片水印。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'medium', realism: 'medium' },
    examples: ['护肤品牌情绪板', '书店视觉 Moodboard', '科技播客品牌板'],
    source: 'official',
  },
  {
    id: 'product-packaging-label-design',
    name: '包装标签设计',
    category: 'product',
    description: '适合瓶贴、盒贴、食品标签和小包装正面设计。',
    tags: ['包装', '标签', '瓶贴', '食品', '品牌', '版式', '产品'],
    slots: {
      product: { label: '产品', required: true, examples: ['精酿啤酒', '手工果酱', '宠物洗护液'] },
      labelInfo: { label: '标签信息', default: '品牌名、品类名、核心卖点和少量说明文字' },
      style: { label: '设计风格', default: '清晰、可印刷、货架识别度强' },
      material: { label: '材质效果', default: '哑光纸张、轻微压纹或局部烫金' },
    },
    promptPattern: '生成一张{{product}}的包装标签设计，标签信息包含{{labelInfo}}，设计风格{{style}}，材质效果为{{material}}。正面版式清晰，适合印刷和货架展示。',
    negativePrompt: '避免文字乱码、信息过密、不可印刷细节、真实商标侵权、低清晰度。',
    outputHints: { aspectRatio: '1:1', language: 'zh-CN', textDensity: 'high', realism: 'medium' },
    examples: ['精酿啤酒标签', '果酱瓶贴设计', '宠物洗护包装标签'],
    source: 'official',
  },
  {
    id: 'ui-mobile-app-home-screen',
    name: '移动 App 首页',
    category: 'ui-screenshot',
    description: '适合展示移动应用首页、功能入口和真实产品界面概念。',
    tags: ['App', '首页', 'UI', '移动端', '界面', '产品设计', '截图'],
    slots: {
      app: { label: 'App 类型', required: true, examples: ['健身打卡 App', '旅行规划 App', '个人财务 App'] },
      modules: { label: '核心模块', default: '顶部欢迎区、数据卡片、主要操作按钮、内容列表' },
      style: { label: '视觉风格', default: '现代、清爽、易读、留白充足' },
      device: { label: '设备呈现', default: '竖版手机截图或手机样机' },
    },
    promptPattern: '生成一张{{app}}的移动 App 首页 UI，核心模块包含{{modules}}，视觉风格{{style}}，设备呈现为{{device}}。要求信息层级清楚，组件真实可用，适合产品概念展示。',
    negativePrompt: '避免 UI 错位、组件不可读、文字乱码、信息过密、真实平台商标、低清晰度。',
    outputHints: { aspectRatio: '9:16', language: 'zh-CN', textDensity: 'high', realism: 'medium' },
    examples: ['健身 App 首页', '旅行规划 App 截图', '记账 App 首页 UI'],
    source: 'official',
  },
  {
    id: 'ui-saas-landing-hero',
    name: 'SaaS 官网首屏',
    category: 'ui-screenshot',
    description: '适合 B2B 产品官网、AI 工具官网和软件服务落地页首屏。',
    tags: ['SaaS', '官网', '首屏', '落地页', 'B2B', 'UI', '产品'],
    slots: {
      product: { label: '产品', required: true, examples: ['AI 客服系统', '团队知识库', '数据分析平台'] },
      value: { label: '核心价值', default: '一句清晰价值主张和两个行动按钮' },
      visual: { label: '产品视觉', default: '仪表盘截图、数据卡片或抽象产品图形' },
      tone: { label: '调性', default: '专业、可信、现代、有科技感' },
    },
    promptPattern: '生成一张{{product}}的 SaaS 官网首屏 UI，核心价值表达为{{value}}，产品视觉包含{{visual}}，整体调性{{tone}}。横版网页构图，导航、标题、按钮和产品展示区层级清楚。',
    negativePrompt: '避免过度炫技、文字乱码、按钮混乱、真实公司 Logo、信息缺少重点、低清晰度。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'high', realism: 'medium' },
    examples: ['AI 客服官网首屏', '知识库 SaaS 落地页', '数据平台 Hero 区'],
    source: 'official',
  },
  {
    id: 'infographic-comparison-card',
    name: '对比信息卡片',
    category: 'infographic',
    description: '适合产品对比、方案对比、前后对比和知识科普。',
    tags: ['对比', '信息卡片', '信息图', '科普', '产品对比', '表格', '卡片'],
    slots: {
      topic: { label: '对比主题', required: true, examples: ['有氧运动 vs 力量训练', '两款耳机参数', '传统流程 vs AI 流程'] },
      dimensions: { label: '对比维度', default: '三到五个关键维度，图标加短句说明' },
      layout: { label: '版式', default: '左右双栏或卡片矩阵，差异一眼可读' },
      tone: { label: '调性', default: '清晰、理性、适合收藏分享' },
    },
    promptPattern: '生成一张{{topic}}的对比信息卡片，对比维度为{{dimensions}}，版式采用{{layout}}，整体调性{{tone}}。要求中文信息层级清晰，图标辅助理解，适合社交媒体保存和转发。',
    negativePrompt: '避免文字太小、对比关系混乱、图标无关、错别字、信息过载、低清晰度。',
    outputHints: { aspectRatio: '4:5', language: 'zh-CN', textDensity: 'high', realism: 'low' },
    examples: ['运动方式对比卡片', '耳机参数对比图', 'AI 流程对比信息图'],
    source: 'official',
  },
  {
    id: 'infographic-timeline-story',
    name: '时间线信息图',
    category: 'infographic',
    description: '适合历史梳理、项目路线、产品发展和步骤说明。',
    tags: ['时间线', '信息图', '流程', '历史', '路线图', '步骤', '科普'],
    slots: {
      topic: { label: '主题', required: true, examples: ['AI 绘画发展史', '新品上市计划', '旅行行程安排'] },
      milestones: { label: '节点', default: '五到七个关键时间节点' },
      visualStyle: { label: '视觉风格', default: '清晰线性结构，节点图标化' },
      emphasis: { label: '重点', default: '突出关键转折点和最终结果' },
    },
    promptPattern: '生成一张{{topic}}的时间线信息图，包含{{milestones}}，视觉风格为{{visualStyle}}，重点{{emphasis}}。中文节点短句清晰，适合科普、汇报或社交媒体分享。',
    negativePrompt: '避免节点顺序混乱、文字过密、年份错误感、图标杂乱、低清晰度。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'high', realism: 'low' },
    examples: ['AI 绘画发展时间线', '产品上市路线图', '旅行行程时间线'],
    source: 'official',
  },
  {
    id: 'scene-interior-design',
    name: '室内空间设计图',
    category: 'scene',
    description: '适合家装、商业空间、民宿和办公空间概念图。',
    tags: ['室内设计', '空间', '家装', '办公', '民宿', '场景', '效果图'],
    slots: {
      space: { label: '空间类型', required: true, examples: ['小户型客厅', '精品咖啡店', '开放式办公室'] },
      style: { label: '设计风格', default: '现代自然风，干净温暖' },
      materials: { label: '材质', default: '木材、微水泥、织物和柔和灯光' },
      camera: { label: '镜头', default: '广角但不过度畸变，空间层次清晰' },
    },
    promptPattern: '生成一张{{space}}的室内空间设计效果图，设计风格为{{style}}，材质包含{{materials}}，镜头为{{camera}}。要求真实空间感、光线自然、家具尺度合理，适合方案展示。',
    negativePrompt: '避免空间比例错误、家具漂浮、过度广角畸变、杂乱陈设、低清晰度、不可实现结构。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'none', realism: 'high' },
    examples: ['小户型客厅设计', '咖啡店室内效果图', '开放办公室空间图'],
    source: 'official',
  },
  {
    id: 'other-app-icon-design',
    name: 'App 图标设计',
    category: 'other',
    description: '适合移动应用、工具产品和游戏 App 的图标概念。',
    tags: ['App 图标', 'icon', '图标', '应用', '品牌', '启动图标', '工具'],
    slots: {
      app: { label: 'App 类型', required: true, examples: ['冥想 App', 'AI 笔记工具', '像素冒险游戏'] },
      symbol: { label: '核心符号', default: '一个简洁可识别的主符号' },
      style: { label: '图标风格', default: '圆角方形、现代、高清、适合小尺寸识别' },
      palette: { label: '颜色', default: '一到两种主色，高对比但不刺眼' },
    },
    promptPattern: '生成一个{{app}}的 App 图标设计，核心符号为{{symbol}}，图标风格{{style}}，颜色使用{{palette}}。要求居中构图、边缘干净、可在小尺寸下识别。',
    negativePrompt: '避免文字、小细节过多、真实品牌 Logo、低分辨率、边缘毛糙、背景杂乱。',
    outputHints: { aspectRatio: '1:1', language: 'zh-CN', textDensity: 'none', realism: 'low' },
    examples: ['冥想 App 图标', 'AI 笔记工具图标', '像素游戏应用图标'],
    source: 'official',
  },
  {
    id: 'other-sticker-pack',
    name: '贴纸表情包套组',
    category: 'other',
    description: '适合聊天贴纸、社群表情、周边贴纸和角色衍生物。',
    tags: ['贴纸', '表情包', 'Sticker', '角色', '社群', '可爱', '套组'],
    slots: {
      character: { label: '角色', required: true, examples: ['圆滚滚小猫', '咖啡杯吉祥物', '小恐龙程序员'] },
      emotions: { label: '表情动作', default: '开心、震惊、加油、哭哭、点赞、睡觉' },
      style: { label: '贴纸风格', default: '粗描边、透明背景、可爱夸张' },
      labels: { label: '文字标签', default: '少量中文短词，可选' },
    },
    promptPattern: '生成一组{{character}}的贴纸表情包，表情动作包含{{emotions}}，贴纸风格为{{style}}，文字标签为{{labels}}。每个贴纸独立清晰，适合聊天软件和社群使用。',
    negativePrompt: '避免角色不一致、背景复杂、文字乱码、表情不清楚、边缘模糊、数量过少。',
    outputHints: { aspectRatio: '1:1', language: 'zh-CN', textDensity: 'low', realism: 'low' },
    examples: ['小猫表情包套组', '咖啡杯吉祥物贴纸', '小恐龙程序员贴纸'],
    source: 'official',
  },
  {
    id: 'poster-course-promotion',
    name: '课程招生海报',
    category: 'poster',
    description: '适合训练营、公开课、知识付费和社群课程宣传。',
    tags: ['课程', '招生', '海报', '训练营', '公开课', '知识付费', '教育'],
    slots: {
      course: { label: '课程主题', required: true, examples: ['AI 绘画入门课', '短视频剪辑训练营', '职场沟通公开课'] },
      audience: { label: '目标学员', default: '想快速上手的初学者' },
      benefits: { label: '收益点', default: '三条清晰学习收益和报名行动按钮' },
      teacher: { label: '讲师呈现', default: '讲师头像或专业形象区域' },
    },
    promptPattern: '生成一张课程招生海报，课程主题为{{course}}，目标学员是{{audience}}，收益点包含{{benefits}}，讲师呈现为{{teacher}}。竖版构图，信息清楚，可信且有转化感。',
    negativePrompt: '避免营销过度、文字拥挤、错别字、讲师形象失真、廉价模板风、低清晰度。',
    outputHints: { aspectRatio: '9:16', language: 'zh-CN', textDensity: 'high', realism: 'medium' },
    examples: ['AI 绘画课招生海报', '剪辑训练营宣传图', '沟通公开课海报'],
    source: 'official',
  },
  {
    id: 'infographic-process-steps',
    name: '流程步骤图',
    category: 'infographic',
    description: '适合教程、操作指南、产品流程和工作流说明。',
    tags: ['流程', '步骤', '教程', '工作流', '信息图', '指南', '说明'],
    slots: {
      process: { label: '流程主题', required: true, examples: ['AI 生图工作流', '咖啡手冲步骤', '新用户注册流程'] },
      steps: { label: '步骤数量', default: '四到六个清晰步骤' },
      layout: { label: '版式', default: '编号卡片加箭头连接' },
      style: { label: '视觉风格', default: '简洁明快，图标统一' },
    },
    promptPattern: '生成一张{{process}}的流程步骤图，包含{{steps}}，版式为{{layout}}，视觉风格{{style}}。每一步用中文短句说明，层级清楚，适合教程和产品说明。',
    negativePrompt: '避免步骤顺序混乱、文字太小、图标风格不统一、信息拥挤、低清晰度。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'high', realism: 'low' },
    examples: ['AI 生图流程图', '手冲咖啡步骤图', '注册流程说明图'],
    source: 'official',
  },
  {
    id: 'scene-architecture-exterior',
    name: '建筑外观概念场景',
    category: 'scene',
    description: '适合建筑外立面、商业综合体、民宿酒店和城市更新概念图。',
    tags: ['建筑', '外观', '概念图', '城市', '空间', '立面', '环境'],
    slots: {
      building: { label: '建筑类型', required: true, examples: ['山地精品酒店', '未来感图书馆', '社区商业综合体'] },
      environment: { label: '周边环境', default: '开阔街区、自然绿化与清晰人行尺度' },
      materials: { label: '材质语言', default: '玻璃、石材、金属与温暖灯光结合' },
      time: { label: '时间氛围', default: '傍晚蓝调时刻，室内灯光微亮' },
    },
    promptPattern: '生成一张{{building}}的建筑外观概念场景，周边环境为{{environment}}，材质语言采用{{materials}}，时间氛围为{{time}}。画面强调建筑体量、入口动线、景观层次和真实空间尺度。',
    negativePrompt: '避免建筑比例错误、透视混乱、重复窗格、行人畸形、材质脏乱、低清晰度、文字水印。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'none', realism: 'high' },
    examples: ['山地酒店外观概念图', '未来图书馆建筑效果图', '商业综合体黄昏外立面'],
    source: 'official',
  },
  {
    id: 'scene-food-tabletop',
    name: '美食桌面氛围场景',
    category: 'scene',
    description: '适合餐饮宣传、菜单主视觉、咖啡甜点和生活方式美食图。',
    tags: ['美食', '餐桌', '咖啡', '甜点', '餐饮', '氛围', '生活方式'],
    slots: {
      food: { label: '食物主体', required: true, examples: ['柠檬海盐蛋糕', '手冲咖啡与可颂', '冬季火锅套餐'] },
      setting: { label: '桌面环境', default: '木质桌面、自然餐具、少量生活化道具' },
      lighting: { label: '光线', default: '窗边自然侧光，柔和阴影' },
      mood: { label: '情绪', default: '温暖、干净、有食欲' },
    },
    promptPattern: '生成一张{{food}}的美食桌面氛围场景，桌面环境为{{setting}}，光线为{{lighting}}，整体情绪{{mood}}。突出食物质感、摆盘层次和真实餐饮摄影感。',
    negativePrompt: '避免食物变形、餐具漂浮、过度油腻、颜色脏、背景杂乱、手部畸形、文字乱码。',
    outputHints: { aspectRatio: '4:5', language: 'zh-CN', textDensity: 'none', realism: 'high' },
    examples: ['咖啡可颂桌面图', '甜点店菜单主视觉', '火锅套餐氛围图'],
    source: 'official',
  },
  {
    id: 'scene-travel-destination',
    name: '旅行目的地风景场景',
    category: 'scene',
    description: '适合旅行宣传、目的地种草、户外风景和城市漫游视觉。',
    tags: ['旅行', '风景', '目的地', '户外', '城市', '自然', '种草'],
    slots: {
      destination: { label: '目的地', required: true, examples: ['海边白色小镇', '秋季山谷公路', '雨后古城街巷'] },
      viewpoint: { label: '视角', default: '游客视角的沉浸式广角构图' },
      season: { label: '季节天气', default: '天气通透，光线舒适' },
      travelMood: { label: '旅行情绪', default: '松弛、向往、适合社交媒体分享' },
    },
    promptPattern: '生成一张{{destination}}旅行目的地风景场景，采用{{viewpoint}}，季节天气为{{season}}，旅行情绪{{travelMood}}。画面有清晰前中后景，突出可到达、可体验的目的地魅力。',
    negativePrompt: '避免景物拼贴、地标错误、天空脏乱、游客畸形、过度锐化、低分辨率、虚假文字。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'none', realism: 'high' },
    examples: ['海边小镇旅行种草图', '秋季山谷公路风景', '古城街巷雨后氛围'],
    source: 'official',
  },
  {
    id: 'scene-exhibition-booth',
    name: '展台快闪商业空间',
    category: 'scene',
    description: '适合品牌展台、快闪店、活动装置和线下体验空间概念图。',
    tags: ['展台', '快闪店', '商业空间', '活动', '品牌', '装置', '体验'],
    slots: {
      brand: { label: '品牌或主题', required: true, examples: ['新能源车发布会', '香水品牌快闪店', '咖啡节展位'] },
      space: { label: '空间结构', default: '开放式展台、主视觉墙、互动体验区和产品陈列区' },
      materials: { label: '材料与灯光', default: '高级亚克力、金属、柔和灯带与重点射灯' },
      crowd: { label: '现场氛围', default: '少量自然参观人群，秩序清晰' },
    },
    promptPattern: '生成一张{{brand}}的展台快闪商业空间概念图，空间结构包含{{space}}，材料与灯光为{{materials}}，现场氛围{{crowd}}。强调品牌识别、动线、陈列层次和可落地搭建感。',
    negativePrompt: '避免品牌字样乱码、结构不可搭建、比例失真、人群拥挤、灯光过曝、低质渲染。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'low', realism: 'high' },
    examples: ['香水品牌快闪店', '新能源车展台概念图', '咖啡节展位设计'],
    source: 'official',
  },
  {
    id: 'scene-product-lifestyle',
    name: '产品生活方式环境图',
    category: 'scene',
    description: '适合把产品放入真实使用环境，强化生活方式、场景感和购买想象。',
    tags: ['产品', '生活方式', '场景', '家居', '户外', '种草', '商业摄影'],
    slots: {
      product: { label: '产品', required: true, examples: ['便携香薰机', '露营保温杯', '智能床头灯'] },
      usageScene: { label: '使用场景', default: '真实生活空间中的自然使用状态' },
      props: { label: '辅助道具', default: '少量相关道具，服务主体不抢戏' },
      atmosphere: { label: '氛围', default: '干净、舒适、有品质感' },
    },
    promptPattern: '生成一张{{product}}的产品生活方式环境图，使用场景为{{usageScene}}，辅助道具包含{{props}}，整体氛围{{atmosphere}}。产品是画面焦点，同时呈现真实可想象的使用情境。',
    negativePrompt: '避免产品结构错误、Logo 乱码、主体不突出、道具过多、空间杂乱、过度广告感、低清晰度。',
    outputHints: { aspectRatio: '4:5', language: 'zh-CN', textDensity: 'none', realism: 'high' },
    examples: ['香薰机卧室生活方式图', '露营杯户外使用场景', '智能灯床头氛围图'],
    source: 'official',
  },
  {
    id: 'scene-cinematic-environment',
    name: '电影感环境概念场景',
    category: 'scene',
    description: '适合世界观气氛图、故事场景、概念设定和影视级环境视觉。',
    tags: ['电影感', '环境', '概念场景', '世界观', '气氛图', '光影', '叙事'],
    slots: {
      world: { label: '场景世界', required: true, examples: ['雨夜霓虹港口', '废弃太空殖民地', '雾中的古代山城'] },
      storyCue: { label: '叙事线索', default: '一个明确但不抢戏的事件线索' },
      lighting: { label: '电影光影', default: '强方向光、体积雾和深浅层次' },
      palette: { label: '色彩', default: '统一的电影调色，高级低饱和' },
    },
    promptPattern: '生成一张{{world}}的电影感环境概念场景，包含{{storyCue}}，电影光影为{{lighting}}，色彩为{{palette}}。画面强调空间纵深、情绪张力和可用于故事设定的视觉线索。',
    negativePrompt: '避免主体模糊、空间逻辑混乱、元素堆砌、过度赛博噪点、人物畸形、低清晰度、文字水印。',
    outputHints: { aspectRatio: '21:9', language: 'zh-CN', textDensity: 'none', realism: 'medium' },
    examples: ['雨夜霓虹港口气氛图', '太空殖民地概念场景', '古代山城电影场景'],
    source: 'official',
  },
  {
    id: 'ui-dashboard-analytics',
    name: '数据分析仪表盘界面',
    category: 'ui-screenshot',
    description: '适合 SaaS 后台、运营看板、数据驾驶舱和管理系统截图。',
    tags: ['仪表盘', 'Dashboard', '数据', 'SaaS', '后台', '图表', '看板'],
    slots: {
      product: { label: '产品类型', required: true, examples: ['电商运营后台', '财务分析平台', 'AI 模型监控台'] },
      metrics: { label: '核心指标', default: '三到五个关键指标卡片' },
      charts: { label: '图表类型', default: '折线图、柱状图、环形图和明细表' },
      style: { label: '界面风格', default: '现代 SaaS，浅色背景，清晰层级' },
    },
    promptPattern: '生成一张{{product}}的数据分析仪表盘界面截图，核心指标包含{{metrics}}，图表类型为{{charts}}，界面风格{{style}}。布局专业可信，导航、筛选器、卡片和图表层级清楚。',
    negativePrompt: '避免数据乱码、图表轴混乱、按钮不可读、布局拥挤、无意义占位、低清晰度。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'high', realism: 'low' },
    examples: ['电商运营数据看板', '财务分析仪表盘', 'AI 模型监控后台'],
    source: 'official',
  },
  {
    id: 'ui-ecommerce-shopping-flow',
    name: '电商购物流程界面',
    category: 'ui-screenshot',
    description: '适合商品详情、购物车、结算页和移动端电商流程展示。',
    tags: ['电商', '购物', 'App', '商品详情', '购物车', '结算', '移动端'],
    slots: {
      productCategory: { label: '商品类别', required: true, examples: ['美妆护肤', '运动鞋服', '智能家居'] },
      screens: { label: '页面组合', default: '首页推荐、商品详情、购物车、结算页' },
      conversionFocus: { label: '转化重点', default: '价格、优惠、评价和购买按钮清晰突出' },
      visualStyle: { label: '视觉风格', default: '干净商业化，适合真实 App 截图展示' },
    },
    promptPattern: '生成一组{{productCategory}}电商购物流程界面，页面组合包含{{screens}}，转化重点为{{conversionFocus}}，视觉风格{{visualStyle}}。多屏并排展示，信息层级清晰，适合产品方案演示。',
    negativePrompt: '避免商品图变形、价格乱码、按钮错位、页面重复、信息过载、低清晰度。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'high', realism: 'low' },
    examples: ['美妆电商购物流程', '运动鞋 App 商品详情', '智能家居结算流程'],
    source: 'official',
  },
  {
    id: 'ui-onboarding-multi-screen',
    name: '应用引导多屏界面',
    category: 'ui-screenshot',
    description: '适合新用户引导、功能介绍、会员权益和 App 启动流程。',
    tags: ['引导页', 'Onboarding', '多屏', 'App', '功能介绍', '启动页', '移动端'],
    slots: {
      app: { label: '应用类型', required: true, examples: ['冥想 App', 'AI 写作工具', '旅行规划应用'] },
      steps: { label: '引导步骤', default: '三屏核心价值介绍' },
      illustration: { label: '插画方向', default: '统一风格插画或 3D 小场景' },
      tone: { label: '文案气质', default: '简短友好，突出价值和行动按钮' },
    },
    promptPattern: '生成一组{{app}}的应用引导多屏界面，包含{{steps}}，插画方向为{{illustration}}，文案气质{{tone}}。多屏并排展示，按钮和进度提示一致，适合移动端产品演示。',
    negativePrompt: '避免屏幕尺寸不一致、文案乱码、按钮层级混乱、插画风格不统一、低清晰度。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'medium', realism: 'low' },
    examples: ['冥想 App 引导页', 'AI 写作工具三屏介绍', '旅行规划应用启动流程'],
    source: 'official',
  },
  {
    id: 'infographic-data-report-card',
    name: '数据报告摘要卡',
    category: 'infographic',
    description: '适合月报、运营复盘、增长成果和核心数据摘要展示。',
    tags: ['数据报告', '月报', '复盘', '摘要卡', '增长', 'KPI', '信息图'],
    slots: {
      topic: { label: '报告主题', required: true, examples: ['小红书投放月报', '新品上线复盘', '门店销售周报'] },
      metrics: { label: '关键数据', default: '三到六个核心数字指标' },
      insight: { label: '结论洞察', default: '一条醒目的核心结论和趋势说明' },
      style: { label: '视觉风格', default: '商务克制，数据卡片化，高对比重点数字' },
    },
    promptPattern: '生成一张{{topic}}的数据报告摘要卡，关键数据包含{{metrics}}，结论洞察为{{insight}}，视觉风格{{style}}。用中文信息层级展示，重点数字醒目，适合汇报和社交媒体分享。',
    negativePrompt: '避免数字混乱、单位缺失、文字过小、图表无意义、颜色刺眼、版面拥挤。',
    outputHints: { aspectRatio: '4:5', language: 'zh-CN', textDensity: 'high', realism: 'low' },
    examples: ['投放月报摘要卡', '新品复盘数据卡', '门店销售周报'],
    source: 'official',
  },
  {
    id: 'infographic-checklist-guide',
    name: '清单指南信息卡',
    category: 'infographic',
    description: '适合步骤清单、避坑指南、购买建议和知识科普卡片。',
    tags: ['清单', '指南', 'Checklist', '避坑', '科普', '知识卡', '信息图'],
    slots: {
      guide: { label: '指南主题', required: true, examples: ['新手露营装备清单', '香水选购避坑指南', '面试准备 Checklist'] },
      items: { label: '清单数量', default: '六到八条短句要点' },
      grouping: { label: '分组方式', default: '按重要程度或使用场景分组' },
      visual: { label: '视觉元素', default: '图标、勾选框和重点标注' },
    },
    promptPattern: '生成一张{{guide}}清单指南信息卡，包含{{items}}，分组方式为{{grouping}}，视觉元素使用{{visual}}。中文短句清楚易读，适合收藏、转发和快速理解。',
    negativePrompt: '避免条目重复、文字乱码、图标不统一、重点不清、排版拥挤、低清晰度。',
    outputHints: { aspectRatio: '4:5', language: 'zh-CN', textDensity: 'high', realism: 'low' },
    examples: ['露营装备清单', '香水选购指南', '面试准备 Checklist'],
    source: 'official',
  },
  {
    id: 'infographic-concept-map',
    name: '概念关系图谱',
    category: 'infographic',
    description: '适合知识框架、品牌策略、产品生态和概念之间的关系展示。',
    tags: ['概念图', '关系图', '知识框架', '图谱', '策略', '生态', '信息图'],
    slots: {
      concept: { label: '中心概念', required: true, examples: ['个人品牌内容体系', 'AI 产品能力地图', '咖啡风味知识框架'] },
      branches: { label: '主要分支', default: '四到六个一级分支' },
      relation: { label: '关系表达', default: '节点、连线、层级和简短说明结合' },
      layout: { label: '布局', default: '中心放射或左右分层结构' },
    },
    promptPattern: '生成一张{{concept}}的概念关系图谱，主要分支包含{{branches}}，关系表达采用{{relation}}，布局为{{layout}}。画面清晰展示概念层级和关联逻辑，适合知识整理和策略说明。',
    negativePrompt: '避免连线混乱、节点重复、文字过小、层级不清、装饰过多、低清晰度。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'high', realism: 'low' },
    examples: ['个人品牌内容体系图', 'AI 产品能力地图', '咖啡风味知识框架'],
    source: 'official',
  },
  {
    id: 'other-presentation-cover',
    name: '演示文稿报告封面',
    category: 'other',
    description: '适合商业汇报、项目提案、年度总结和研究报告封面。',
    tags: ['PPT', '报告', '封面', '提案', '汇报', '商务', '演示文稿'],
    slots: {
      title: { label: '标题主题', required: true, examples: ['2026 品牌增长策略', 'AI 产品立项提案', '城市更新研究报告'] },
      subtitle: { label: '副标题信息', default: '日期、团队或一句简短说明' },
      visualMetaphor: { label: '视觉隐喻', default: '抽象几何、数据光线或主题相关场景' },
      tone: { label: '调性', default: '专业、克制、高级、可信' },
    },
    promptPattern: '生成一张{{title}}演示文稿报告封面，副标题信息为{{subtitle}}，视觉隐喻采用{{visualMetaphor}}，整体调性{{tone}}。留出清晰标题区，适合商务汇报第一页。',
    negativePrompt: '避免标题乱码、廉价模板感、装饰过满、主体偏移、低清晰度、过度花哨。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'medium', realism: 'low' },
    examples: ['品牌增长策略封面', 'AI 产品提案封面', '城市更新研究报告封面'],
    source: 'official',
  },
  {
    id: 'other-portfolio-profile',
    name: '作品集个人介绍页',
    category: 'other',
    description: '适合作品集首页、简历视觉页、个人品牌介绍和设计师 Profile。',
    tags: ['作品集', '简历', 'Profile', '个人介绍', '设计师', '履历', '品牌'],
    slots: {
      role: { label: '身份角色', required: true, examples: ['品牌设计师', '产品经理', '摄影创作者'] },
      highlights: { label: '亮点信息', default: '三条核心能力、代表项目或经验标签' },
      portraitStyle: { label: '头像或视觉', default: '专业头像区域或抽象个人标识' },
      layout: { label: '版式', default: '左右分栏，信息清晰，留白充足' },
    },
    promptPattern: '生成一张{{role}}作品集个人介绍页，亮点信息包含{{highlights}}，头像或视觉为{{portraitStyle}}，版式采用{{layout}}。整体专业、有记忆点，适合简历、作品集和个人品牌展示。',
    negativePrompt: '避免头像畸形、履历文字乱码、信息堆叠、版式松散、颜色冲突、低清晰度。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'medium', realism: 'medium' },
    examples: ['品牌设计师作品集首页', '产品经理个人介绍页', '摄影创作者 Profile'],
    source: 'official',
  },
  {
    id: 'other-print-flyer',
    name: '线下宣传单页',
    category: 'other',
    description: '适合门店活动、展会派发、社区宣传和线下促销印刷物。',
    tags: ['宣传单', '印刷', 'Flyer', '线下活动', '门店', '促销', '传单'],
    slots: {
      campaign: { label: '活动主题', required: true, examples: ['咖啡店开业优惠', '社区瑜伽体验课', '宠物领养日'] },
      offer: { label: '核心信息', default: '时间、地点、优惠或报名方式' },
      audience: { label: '目标人群', default: '附近社区用户或线下到店顾客' },
      printStyle: { label: '印刷风格', default: '清晰标题、强行动按钮、适合 A5 单页' },
    },
    promptPattern: '生成一张{{campaign}}线下宣传单页，核心信息包含{{offer}}，目标人群是{{audience}}，印刷风格为{{printStyle}}。版面醒目易读，适合派发、张贴和门店展示。',
    negativePrompt: '避免小字过多、联系方式乱码、印刷出血不合理、信息层级混乱、颜色脏、低清晰度。',
    outputHints: { aspectRatio: '4:5', language: 'zh-CN', textDensity: 'high', realism: 'low' },
    examples: ['咖啡店开业传单', '瑜伽体验课宣传单', '宠物领养日 flyer'],
    source: 'official',
  },
]

function createScenarioTemplate(template: Omit<StructuredPromptTemplate, 'scenarioLabel' | 'scenarioAliases' | 'source' | 'governance'> & {
  scenario: PromptTemplateScenario
  governance: TemplateGovernance
}): StructuredPromptTemplate {
  return {
    ...template,
    scenarioLabel: TEMPLATE_SCENARIO_LABELS[template.scenario],
    scenarioAliases: TEMPLATE_SCENARIO_ALIASES[template.scenario],
    source: 'official',
    governance: template.governance,
  }
}

export const SCENARIO_PROMPT_TEMPLATES: StructuredPromptTemplate[] = [
  createScenarioTemplate({
    id: 'scenario-poster-brand-key-visual', name: '品牌主视觉 KV', category: 'poster', scenario: 'brand-key-visual',
    description: '适合品牌形象升级、年度主题、品牌大片和高端 Campaign 的主视觉策略。',
    tags: ['品牌', '主视觉', 'KV', '品牌海报', '高级', 'Campaign'],
    slots: { subject: { label: '品牌/主题', required: true, examples: ['高端咖啡品牌', 'AI 创作工具'] }, coreMessage: { label: '核心信息', default: '一句清晰的品牌主张' }, symbol: { label: '品牌符号', default: '产品轮廓、Logo 图形或代表性材质' }, composition: { label: '视觉结构', default: '强中心主视觉、留白、标题区和品牌落款' } },
    promptPattern: '生成一张品牌主视觉 KV 海报，品牌/主题是{{subject}}。核心信息为{{coreMessage}}，融入{{symbol}}，视觉结构采用{{composition}}。要求商业广告级完成度、品牌资产清晰、可延展到多渠道 Campaign。',
    negativePrompt: '避免普通促销感、Logo 过大、文字堆满、品牌符号不清、廉价素材拼贴。',
    outputHints: { aspectRatio: '4:5', language: 'zh-CN', textDensity: 'low', realism: 'high' }, examples: ['咖啡品牌年度主视觉', 'AI 工具品牌发布 KV'],
    governance: { sourceRole: 'primary', status: 'active', qualityTier: 'high', intents: ['brand-system', 'brand-promotion'], platforms: ['campaign'], subjectTypes: ['brand', 'product'], textDensity: ['low'] },
  }),
  createScenarioTemplate({
    id: 'scenario-poster-ecommerce-sale', name: '电商促销海报', category: 'poster', scenario: 'ecommerce-sale-poster',
    description: '适合大促、限时优惠、买赠活动和商品利益点明确的商业促销画面。', tags: ['电商', '促销', '大促', '商品', '优惠', '转化'],
    slots: { subject: { label: '商品', required: true, examples: ['咖啡豆礼盒', '降噪耳机'] }, offer: { label: '促销信息', default: '限时优惠、买赠或新品首发权益' }, hierarchy: { label: '信息层级', default: '商品主视觉最大，价格/权益第二，辅助卖点第三' }, background: { label: '背景氛围', default: '干净商业背景，少量促销符号和品牌色块' } },
    promptPattern: '生成一张电商促销海报，商品是{{subject}}，促销信息是{{offer}}。信息层级采用{{hierarchy}}，背景氛围为{{background}}。要求商品清晰、利益点醒目、转化导向强，同时保持精致商业质感。',
    negativePrompt: '避免低端叫卖感、红包元素堆砌、价格文字乱码、商品变形、信息层级混乱。',
    outputHints: { aspectRatio: '4:5', language: 'zh-CN', textDensity: 'medium', realism: 'high' }, examples: ['618 咖啡礼盒促销海报', '耳机新品限时优惠图'],
    governance: { sourceRole: 'primary', status: 'active', qualityTier: 'high', intents: ['commercial-product', 'brand-promotion'], platforms: ['ecommerce', 'social'], subjectTypes: ['product'], textDensity: ['medium'] },
  }),
  createScenarioTemplate({
    id: 'scenario-poster-event-release', name: '活动发布海报', category: 'poster', scenario: 'event-release-poster',
    description: '适合发布会、峰会、展览、课程、开业和线下活动的正式传播海报。', tags: ['活动', '发布会', '展会', '峰会', '邀请函', '时间地点'],
    slots: { subject: { label: '活动主题', required: true, examples: ['AI 产品发布会', '咖啡节'] }, venue: { label: '时间地点', default: '清晰但不喧宾夺主的时间地点信息区' }, atmosphere: { label: '活动氛围', default: '正式、期待感、秩序感、轻仪式感' }, visualHook: { label: '视觉钩子', default: '舞台光、产品轮廓或抽象主题符号' } },
    promptPattern: '生成一张活动发布海报，活动主题是{{subject}}。画面包含{{venue}}，整体氛围{{atmosphere}}，核心视觉钩子为{{visualHook}}。要求信息层级清晰、具有发布感和传播感。',
    negativePrompt: '避免像普通通知单、文字密度失控、时间地点难读、舞台杂乱、廉价渐变。',
    outputHints: { aspectRatio: '9:16', language: 'zh-CN', textDensity: 'medium', realism: 'medium' }, examples: ['AI 新品发布会海报', '咖啡节活动海报'],
    governance: { sourceRole: 'primary', status: 'active', qualityTier: 'high', intents: ['event-promotion', 'brand-promotion'], platforms: ['social', 'offline'], subjectTypes: ['event'], textDensity: ['medium'] },
  }),
  createScenarioTemplate({
    id: 'scenario-poster-social-campaign-cover', name: '社媒传播封面', category: 'poster', scenario: 'social-campaign-cover',
    description: '适合小红书、朋友圈、短内容封面和轻 Campaign 的高点击率封面。', tags: ['社媒', '小红书', '封面', '种草', '点击率', '标题'],
    slots: { subject: { label: '封面主题', required: true, examples: ['咖啡新品测评', 'AI 工作流教程'] }, hook: { label: '点击钩子', default: '一个短而明确的利益点标题' }, layout: { label: '移动端版式', default: '主体大、标题短、标签少、上屏 1 秒可读' }, tone: { label: '传播语气', default: '真实、有用、清爽、有生活方式感' } },
    promptPattern: '生成一张社媒传播封面，主题是{{subject}}。点击钩子为{{hook}}，移动端版式采用{{layout}}，传播语气{{tone}}。要求手机端缩略图也清楚、有记忆点，文字少但吸引点击。',
    negativePrompt: '避免标题太长、封面过满、营销味过重、贴纸过多、主体不清。',
    outputHints: { aspectRatio: '3:4', language: 'zh-CN', textDensity: 'low', realism: 'medium' }, examples: ['小红书咖啡种草封面', 'AI 工作流教程封面'],
    governance: { sourceRole: 'primary', status: 'active', qualityTier: 'high', intents: ['social-seeding', 'brand-promotion'], platforms: ['xiaohongshu', 'social'], subjectTypes: ['lifestyle'], textDensity: ['low'] },
  }),
  createScenarioTemplate({
    id: 'scenario-ui-saas-landing-hero', name: 'SaaS 落地页首屏', category: 'ui-screenshot', scenario: 'saas-landing-hero',
    description: '适合 B 端产品官网、AI 工具首页和 SaaS 落地页 Hero 区截图。', tags: ['SaaS', '落地页', '官网', 'Hero', 'B端', 'CTA'],
    slots: { subject: { label: '产品', required: true, examples: ['AI 提示词工作台', '数据分析平台'] }, valueProp: { label: '价值主张', default: '一句清晰的产品价值主张' }, uiBlocks: { label: '界面模块', default: '导航栏、Hero 标题、CTA、产品截图卡片、客户信任标识' }, style: { label: '视觉风格', default: '现代、留白充足、渐变柔和、玻璃卡片、可信赖' } },
    promptPattern: '生成一张 SaaS 产品落地页首屏截图，产品是{{subject}}，价值主张为{{valueProp}}。页面包含{{uiBlocks}}，视觉风格{{style}}。要求像真实可上线官网截图，组件对齐精确，层级清楚。',
    negativePrompt: '避免低保真线框图、按钮错位、文本乱码密集、组件无对齐、过度装饰。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'medium', realism: 'medium' }, examples: ['AI 工具官网首屏', '数据平台 SaaS Landing Page'],
    governance: { sourceRole: 'primary', status: 'active', qualityTier: 'high', intents: ['ui-product', 'brand-promotion'], platforms: ['web'], subjectTypes: ['software'], textDensity: ['medium'] },
  }),
  createScenarioTemplate({
    id: 'scenario-ui-analytics-dashboard', name: '数据看板截图', category: 'ui-screenshot', scenario: 'analytics-dashboard',
    description: '适合后台管理台、数据分析、BI 看板和运营监控类界面截图。', tags: ['Dashboard', '数据看板', '图表', '后台', '管理台', 'BI'],
    slots: { subject: { label: '业务主题', required: true, examples: ['咖啡店销售数据', 'AI 模型监控'] }, metrics: { label: '核心指标', default: '收入、增长率、转化率、趋势图和分布图' }, layout: { label: '布局', default: '左侧导航、顶部筛选、KPI 卡片、折线图、柱状图、明细表' }, theme: { label: '界面主题', default: '深色科技感或浅色专业 B 端风格' } },
    promptPattern: '生成一张专业数据看板 UI 截图，业务主题是{{subject}}。核心指标包括{{metrics}}，布局为{{layout}}，界面主题{{theme}}。要求图表真实、组件整齐、信息密度高但可读。',
    negativePrompt: '避免图表随机、数字乱码过多、组件拥挤、卡片不对齐、像概念海报而非真实界面。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'high', realism: 'medium' }, examples: ['咖啡店销售看板', 'AI 模型监控后台'],
    governance: { sourceRole: 'primary', status: 'active', qualityTier: 'high', intents: ['ui-product', 'data-visualization'], platforms: ['web'], subjectTypes: ['software'], textDensity: ['high'] },
  }),
  createScenarioTemplate({
    id: 'scenario-product-food-drink-photo', name: '食品饮品摄影', category: 'product', scenario: 'food-drink-photo',
    description: '适合咖啡、饮品、甜品、餐饮新品和生活方式食品广告摄影。', tags: ['美食', '饮品', '咖啡', '餐饮', '食品摄影', '自然光'],
    slots: { subject: { label: '食品/饮品', required: true, examples: ['冰拿铁', '草莓蛋糕'] }, setting: { label: '场景', default: '干净桌面、自然窗光、少量原料和器皿陪衬' }, appetite: { label: '食欲点', default: '新鲜、温度感、质地细节和可口光泽' }, camera: { label: '镜头', default: '商业摄影浅景深，主体锐利，背景柔和' } },
    promptPattern: '生成一张食品/饮品商业摄影图，主体是{{subject}}。场景为{{setting}}，突出{{appetite}}，镜头语言为{{camera}}。要求真实可口、材质细节丰富、适合品牌宣传或社媒种草。',
    negativePrompt: '避免食物不新鲜、颜色发灰、摆盘脏乱、液体质感错误、过度塑料感。',
    outputHints: { aspectRatio: '4:5', language: 'zh-CN', textDensity: 'none', realism: 'high' }, examples: ['冰拿铁自然光摄影', '草莓蛋糕新品图'],
    governance: { sourceRole: 'primary', status: 'active', qualityTier: 'high', intents: ['commercial-product', 'social-seeding'], platforms: ['social', 'ecommerce'], subjectTypes: ['food', 'product'], textDensity: ['none', 'low'] },
  }),
  createScenarioTemplate({
    id: 'scenario-product-tech-render', name: '科技产品渲染', category: 'product', scenario: 'tech-product-render',
    description: '适合 3C、硬件、机器人、设备和未来科技产品的高端渲染图。', tags: ['科技产品', '3C', '硬件', '产品渲染', '工业设计'],
    slots: { subject: { label: '科技产品', required: true, examples: ['降噪耳机', '桌面机器人'] }, material: { label: '材质', default: '金属、磨砂玻璃、精密塑料和微细工艺纹理' }, angle: { label: '展示角度', default: '三分之四角度英雄视图，局部细节悬浮分解' }, lighting: { label: '灯光', default: '棚拍轮廓光、冷暖渐变反射、干净暗背景' } },
    promptPattern: '生成一张高端科技产品渲染图，产品是{{subject}}。材质表现为{{material}}，展示角度为{{angle}}，灯光为{{lighting}}。要求工业设计感、精密细节、商业级 3D render 质感。',
    negativePrompt: '避免廉价塑料感、比例错误、接口混乱、反射脏、背景杂乱、像玩具。',
    outputHints: { aspectRatio: '1:1', language: 'zh-CN', textDensity: 'none', realism: 'high' }, examples: ['降噪耳机高端渲染', '桌面机器人宣传图'],
    governance: { sourceRole: 'primary', status: 'active', qualityTier: 'high', intents: ['commercial-product', 'tech-product'], platforms: ['ecommerce', 'web'], subjectTypes: ['product', 'technology'], textDensity: ['none', 'low'] },
  }),
  createScenarioTemplate({
    id: 'scenario-product-packaging-display', name: '包装展示图', category: 'product', scenario: 'packaging-display',
    description: '适合瓶身、礼盒、标签、包装系列和品牌包装系统展示。', tags: ['包装', '礼盒', '瓶身', '标签', '包装设计'],
    slots: { subject: { label: '包装对象', required: true, examples: ['咖啡豆包装', '护肤品瓶身'] }, lineup: { label: '展示方式', default: '正面主包装、侧面辅助包装、局部标签细节' }, surface: { label: '材质表面', default: '纸张肌理、烫金、磨砂标签或透明瓶身质感' }, scene: { label: '陈列场景', default: '干净棚拍台面或品牌色背景' } },
    promptPattern: '生成一张包装展示图，包装对象是{{subject}}。展示方式为{{lineup}}，材质表面突出{{surface}}，陈列场景为{{scene}}。要求品牌系统统一、包装信息层级清楚、商业摄影质感。',
    negativePrompt: '避免标签乱码、包装透视错误、材质廉价、信息过密、品牌风格不统一。',
    outputHints: { aspectRatio: '4:5', language: 'zh-CN', textDensity: 'low', realism: 'high' }, examples: ['咖啡豆包装系列展示', '护肤品瓶身棚拍'],
    governance: { sourceRole: 'primary', status: 'active', qualityTier: 'high', intents: ['brand-system', 'commercial-product'], platforms: ['ecommerce', 'web'], subjectTypes: ['product', 'packaging'], textDensity: ['low'] },
  }),
  createScenarioTemplate({
    id: 'scenario-scene-interior-architecture', name: '室内建筑空间', category: 'scene', scenario: 'interior-architecture',
    description: '适合室内设计、建筑空间、展厅、办公室、咖啡店和家居效果图。', tags: ['室内', '建筑', '空间', '家居', '展厅', '办公室'],
    slots: { subject: { label: '空间类型', required: true, examples: ['精品咖啡店', 'AI 公司办公室'] }, layout: { label: '空间布局', default: '清晰动线、前中后景层次、功能区明确' }, material: { label: '材质', default: '木、石材、金属、织物与自然光形成高级质感' }, camera: { label: '镜头', default: '广角但不畸变，建筑摄影水平垂直线准确' } },
    promptPattern: '生成一张室内/建筑空间效果图，空间类型是{{subject}}。空间布局为{{layout}}，材质为{{material}}，镜头语言{{camera}}。要求真实建筑摄影质感、光线自然、尺度合理、细节高级。',
    negativePrompt: '避免空间尺度错误、透视畸变、家具漂浮、材质脏乱、过度 HDR、灯光不真实。',
    outputHints: { aspectRatio: '16:9', language: 'zh-CN', textDensity: 'none', realism: 'high' }, examples: ['精品咖啡店室内效果图', 'AI 公司办公室空间'],
    governance: { sourceRole: 'primary', status: 'active', qualityTier: 'high', intents: ['scene-design', 'architecture-interior'], platforms: ['web', 'presentation'], subjectTypes: ['space', 'architecture'], textDensity: ['none'] },
  }),
  createScenarioTemplate({
    id: 'scenario-infographic-workflow-explainer', name: '流程解释图', category: 'infographic', scenario: 'workflow-explainer',
    description: '适合 AI 工作流、教程步骤、方法论、产品流程和复杂概念解释。', tags: ['流程图', '工作流', '教程', '步骤', '解释图', '方法论'],
    slots: { subject: { label: '流程主题', required: true, examples: ['AI 图片生成工作流', '咖啡冲煮步骤'] }, steps: { label: '步骤结构', default: '3-6 个主要步骤，每步有短标题和一句说明' }, visualSystem: { label: '视觉系统', default: '统一图标、箭头、编号、分区卡片和清晰阅读路径' }, emphasis: { label: '重点', default: '突出关键决策点、输入输出和结果收益' } },
    promptPattern: '生成一张流程解释信息图，主题是{{subject}}。步骤结构为{{steps}}，视觉系统采用{{visualSystem}}，重点突出{{emphasis}}。要求阅读路径清晰、图标统一、信息层级明确，适合教程或产品说明。',
    negativePrompt: '避免箭头混乱、步骤过多、文字不可读、图标风格不一致、信息无层级。',
    outputHints: { aspectRatio: '4:5', language: 'zh-CN', textDensity: 'high', realism: 'low' }, examples: ['AI 图片生成工作流图', '咖啡冲煮步骤图'],
    governance: { sourceRole: 'primary', status: 'active', qualityTier: 'high', intents: ['infographic', 'education'], platforms: ['social', 'presentation'], subjectTypes: ['process'], textDensity: ['high'] },
  }),
]

const STYLE_CATEGORY_BY_ID: Record<string, StructuredStylePreset['category']> = {
  'style-10': 'photographic', 'style-11': 'photographic', 'style-47': 'photographic', 'style-48': 'photographic', 'style-34': 'photographic',
  'style-04': 'traditional-art', 'style-05': 'traditional-art', 'style-13': 'traditional-art', 'style-14': 'traditional-art', 'style-15': 'traditional-art', 'style-16': 'traditional-art', 'style-20': 'traditional-art', 'style-27': 'traditional-art', 'style-38': 'traditional-art', 'style-42': 'traditional-art', 'style-44': 'traditional-art', 'style-46': 'traditional-art',
  'style-01': 'anime-game', 'style-02': 'anime-game', 'style-03': 'anime-game', 'style-07': 'anime-game', 'style-08': 'anime-game', 'style-25': 'anime-game', 'style-40': 'anime-game', 'style-41': 'anime-game', 'style-50': 'anime-game',
  'style-21': 'commercial-design', 'style-22': 'commercial-design', 'style-23': 'commercial-design', 'style-26': 'commercial-design', 'style-29': 'commercial-design', 'style-30': 'commercial-design', 'style-36': 'commercial-design', 'style-37': 'commercial-design', 'style-39': 'commercial-design', 'style-43': 'commercial-design', 'style-45': 'commercial-design', 'style-49': 'commercial-design',
  'style-06': 'sci-fi-trend', 'style-09': 'sci-fi-trend', 'style-17': 'sci-fi-trend', 'style-18': 'sci-fi-trend', 'style-19': 'sci-fi-trend', 'style-28': 'sci-fi-trend', 'style-31': 'sci-fi-trend', 'style-32': 'sci-fi-trend', 'style-24': 'sci-fi-trend',
  'style-33': 'craft-material', 'style-35': 'craft-material',
}

const STYLE_TAGS: Record<string, string[]> = {
  'style-10': ['写实', '摄影', '真实', '人像', '产品'],
  'style-11': ['电影感', '戏剧光', '高对比', '海报', '氛围'],
  'style-03': ['动漫', '二次元', '角色', '明亮', '线条'],
  'style-44': ['水墨', '中国风', '东方', '留白', '山水'],
  'style-22': ['金箔', '高级', '奢华', '质感', '商业'],
  'style-19': ['赛博朋克', '霓虹', '未来', '科技', '城市'],
  'style-06': ['蓝图', '技术', '结构', '工程', '说明'],
  'style-49': ['扁平', 'UI', '图标', '矢量', '简洁'],
}

function inferStyleTraits(style: StylePreset): StyleVisualTraits {
  const text = `${style.name} ${style.englishKeyword} ${style.description}`.toLowerCase()
  return {
    lighting: text.includes('cinematic') || style.id === 'style-11' ? 'dramatic cinematic lighting, rim light, atmospheric contrast' : undefined,
    composition: text.includes('isometric') ? 'isometric angled composition' : text.includes('minimal') ? 'clean minimal composition' : undefined,
    color: text.includes('neon') || text.includes('cyber') ? 'electric neon color palette' : text.includes('pastel') ? 'soft pastel palette' : undefined,
    texture: text.includes('watercolor') ? 'organic watercolor paper texture' : text.includes('oil') ? 'rich brush strokes and canvas texture' : style.description,
    rendering: `${style.englishKeyword} visual language`,
    camera: style.id === 'style-10' ? 'realistic photographic camera perspective' : undefined,
  }
}

function inferBestFor(category: StructuredStylePreset['category']): PromptTemplateCategory[] {
  if (category === 'photographic') return ['poster', 'portrait', 'product', 'scene']
  if (category === 'traditional-art') return ['poster', 'portrait', 'anime', 'scene', 'infographic']
  if (category === 'anime-game') return ['anime', 'poster', 'scene']
  if (category === 'commercial-design') return ['poster', 'product', 'ui-screenshot', 'infographic']
  if (category === 'sci-fi-trend') return ['poster', 'anime', 'product', 'scene', 'infographic']
  return ['poster', 'product', 'scene']
}

function inferAvoidFor(style: StylePreset, category: StructuredStylePreset['category']): PromptTemplateCategory[] {
  if (['style-01', 'style-02', 'style-41', 'style-50'].includes(style.id)) return ['portrait', 'ui-screenshot']
  if (category === 'photographic') return []
  if (category === 'traditional-art') return ['ui-screenshot']
  return []
}

export const STRUCTURED_STYLE_PRESETS: StructuredStylePreset[] = STYLE_PRESETS.map((style) => {
  const category = STYLE_CATEGORY_BY_ID[style.id] ?? 'commercial-design'
  return {
    ...style,
    category,
    tags: [style.name, style.englishKeyword, ...style.description.split(/[,&/ ]+/), ...(STYLE_TAGS[style.id] ?? [])].filter(Boolean),
    aliases: [style.name, style.englishKeyword],
    visualTraits: inferStyleTraits(style),
    bestFor: inferBestFor(category),
    avoidFor: inferAvoidFor(style, category),
    negativePrompt: `avoid weak ${style.englishKeyword} expression, low quality rendering, messy composition`,
  }
})

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function getUserTemplates(): TemplateDraft[] {
  if (!canUseStorage()) return []
  try {
    const raw = window.localStorage.getItem(USER_TEMPLATE_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((item) => validateTemplateDraft(item).valid) : []
  } catch {
    return []
  }
}

export function saveUserTemplate(template: TemplateDraft): TemplateDraft[] {
  const existing = getUserTemplates().filter((item) => item.id !== template.id)
  const next = [template, ...existing]
  if (canUseStorage()) window.localStorage.setItem(USER_TEMPLATE_STORAGE_KEY, JSON.stringify(next))
  return next
}

export function updateUserTemplate(template: TemplateDraft): { templates: TemplateDraft[]; errors: string[] } {
  const validation = validateTemplateDraft(template)
  if (!validation.valid) return { templates: getUserTemplates(), errors: validation.errors }
  return { templates: saveUserTemplate({ ...template, source: 'user' }), errors: [] }
}

export function deleteUserTemplate(templateId: string): TemplateDraft[] {
  const next = getUserTemplates().filter((item) => item.id !== templateId)
  if (canUseStorage()) window.localStorage.setItem(USER_TEMPLATE_STORAGE_KEY, JSON.stringify(next))
  return next
}

export function getAllStructuredTemplates(): StructuredPromptTemplate[] {
  const legacyTemplates = TEMPLATE_PRESETS.map(toLegacyStructuredTemplate)
  return [...getUserTemplates(), ...OFFICIAL_PROMPT_TEMPLATES, ...SCENARIO_PROMPT_TEMPLATES, ...legacyTemplates]
}

export function getMainTrackTemplates(): StructuredPromptTemplate[] {
  return [...getUserTemplates(), ...OFFICIAL_PROMPT_TEMPLATES, ...SCENARIO_PROMPT_TEMPLATES]
}

export function getLegacyReferenceTemplates(): StructuredPromptTemplate[] {
  return TEMPLATE_PRESETS.map(toLegacyStructuredTemplate)
}

export function isReferenceOnlyTemplate(template: StructuredPromptTemplate): boolean {
  return deriveTemplateGovernance(template).sourceRole === 'reference'
}

export function isUsableReferenceTemplate(template: StructuredPromptTemplate): boolean {
  const governance = deriveTemplateGovernance(template)
  return governance.sourceRole === 'reference' && governance.status === 'active' && governance.qualityTier !== 'low' && !template.isPlaceholderOnly
}

function toLegacyStructuredTemplate(template: TemplatePreset): StructuredPromptTemplate {
  const category = mapLegacyCategory(template.category)
  const name = template.localizedTitle || template.title
  const prompt = template.localizedPrompt || template.prompt
  return {
    id: template.id,
    name,
    category,
    description: prompt.slice(0, 180),
    tags: [template.category, name, template.title, template.author ?? '', template.lang ?? ''].filter(Boolean),
    slots: { subject: { label: '主题', default: '用户输入的主题' } },
    promptPattern: prompt,
    negativePrompt: '避免低清晰度、错误文字、构图混乱。',
    outputHints: { language: template.localizedPrompt ? 'zh-CN' : template.lang, textDensity: prompt.length > 500 ? 'high' : 'medium' },
    examples: [name],
    source: 'legacy',
    sourceTitle: template.title,
    sourcePrompt: template.prompt,
    sourceLanguage: template.lang,
    sourceUrl: template.sourceUrl,
    author: template.author,
    isPlaceholderOnly: Boolean(template.isPlaceholderOnly),
  }
}

function mapLegacyCategory(category: string): PromptTemplateCategory {
  if (category.includes('海报')) return 'poster'
  if (category.includes('人像')) return 'portrait'
  if (category.includes('UI') || category.includes('截图')) return 'ui-screenshot'
  if (category.includes('产品') || category.includes('物体')) return 'product'
  return 'other'
}

export function renderTemplatePrompt(template: StructuredPromptTemplate, values: Record<string, string> = {}): string {
  let rendered = template.promptPattern
  Object.entries(template.slots).forEach(([key, slot]) => {
    const value = (values[key] || slot.default || slot.examples?.[0] || '').trim()
    rendered = rendered.split(`{{${key}}}`).join(value)
  })
  return rendered.replace(/{{[^}]+}}/g, '').replace(/\s+\n/g, '\n').trim()
}

export function composeStylePrompt(primary?: StructuredStylePreset, secondary: StructuredStylePreset[] = []): string {
  const styles = [primary, ...secondary].filter(Boolean).slice(0, 3) as StructuredStylePreset[]
  if (!styles.length) return ''
  return styles.map((style, index) => {
    const role = index === 0 ? 'Primary style' : 'Secondary style'
    const traits = Object.values(style.visualTraits).filter(Boolean).join('; ')
    return `${role}: ${style.name} (${style.englishKeyword}) — ${style.promptFragment}. ${traits}`
  }).join('\n')
}

function scoreText(fields: string[], keywords: string[], weight = 1): { score: number; matched: string[] } {
  const haystack = fields.join(' ').toLowerCase()
  const matched: string[] = []
  let score = 0
  keywords.forEach((keyword) => {
    const token = keyword.toLowerCase()
    if (token && haystack.includes(token)) {
      matched.push(keyword)
      score += weight * (token.length >= 4 ? 2 : 1)
    }
  })
  return { score, matched: Array.from(new Set(matched)) }
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]))
}

function textHasAny(text: string, terms: string[]): boolean {
  const normalized = text.toLowerCase()
  return terms.some((term) => normalized.includes(term.toLowerCase()))
}

function countMatches(text: string, terms: string[]): number {
  const normalized = text.toLowerCase()
  return terms.reduce((count, term) => count + (normalized.includes(term.toLowerCase()) ? 1 : 0), 0)
}

function inferCategoryFromText(text: string): PromptTemplateCategory | undefined {
  const categoryTerms: Array<[PromptTemplateCategory, string[]]> = [
    ['ui-screenshot', ['ui', 'app', 'web', 'screenshot', 'mockup', '界面', '截图', '后台', '仪表盘', '管理台', '首页', '落地页', 'dashboard', 'hud']],
    ['infographic', ['infographic', 'diagram', 'knowledge', 'flowchart', '信息图', '流程图', '时间线', '科普', '知识卡片', '教程图']],
    ['anime', ['anime', 'manga', 'character', 'comic', '二次元', '动漫', '角色', '立绘', '漫画', '卡牌']],
    ['portrait', ['portrait', 'avatar', 'photo', 'headshot', '人像', '头像', '写真', '形象照', '模特', '穿搭']],
    ['poster', ['poster', 'cover', 'ad', 'campaign', 'xiaohongshu', 'rednote', '海报', '封面', '广告', '主视觉', 'kv', '种草']],
    ['scene', ['scene', 'space', 'interior', 'architecture', 'environment', '场景', '空间', '室内', '建筑', '环境', '客厅', '展厅', '办公室']],
    ['product', ['product', 'ecommerce', 'perfume', 'package', 'object', '产品', '商品', '电商', '包装', '耳机', '无线耳机', 'earbud', 'earbuds', '手机', '硬件', '饮品', '食物', '咖啡']],
  ]
  return categoryTerms
    .map(([category, terms], index) => ({ category, index, score: countMatches(text, terms) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.category
}

function inferPurpose(text: string): string | undefined {
  const purposeTerms: Array<[string, string[]]> = [
    ['social-seeding', ['xiaohongshu', 'rednote', 'social', 'seeding', 'post', '小红书', '种草', '笔记', '封面', '直播封面', '朋友圈']],
    ['ecommerce', ['ecommerce', 'taobao', 'detail', 'product page', '电商', '淘宝', '天猫', '京东', '详情页', '卖点图', '商品卡']],
    ['brand-promotion', ['brand', 'campaign', 'advertising', 'launch', 'promotion', '品牌', '宣传', '推广', '发布', '上新', '主视觉']],
    ['avatar', ['avatar', 'profile', 'headshot', '头像', '职业照', '证件照', '形象照']],
    ['wallpaper', ['wallpaper', '壁纸']],
    ['education', ['education', 'infographic', 'tutorial', 'diagram', '教程', '科普', '讲解', '流程图', '知识卡']],
  ]
  return purposeTerms
    .map(([purpose, terms], index) => ({ purpose, index, score: countMatches(text, terms) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.purpose
}

function inferPlatform(text: string): string | undefined {
  const platformTerms: Array<[string, string[]]> = [
    ['xiaohongshu', ['xiaohongshu', 'rednote', '小红书']],
    ['douyin', ['douyin', 'tiktok', '抖音']],
    ['taobao', ['taobao', 'tmall', 'ecommerce', '淘宝', '天猫']],
    ['jd', ['jd', '京东']],
    ['wechat', ['wechat', '微信', '公众号']],
    ['instagram', ['instagram', 'ins']],
    ['bilibili', ['bilibili', 'b站']],
    ['steam', ['steam']],
    ['appstore', ['app store', 'appstore']],
  ]
  return platformTerms
    .map(([platform, terms], index) => ({ platform, index, score: countMatches(text, terms) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.platform
}

function inferSubjectType(text: string, category?: PromptTemplateCategory): string | undefined {
  if (textHasAny(text, ['perfume', 'product', 'package', 'coffee', 'drink', 'skincare', 'robot', '商品', '产品', '耳机', '手机', '包装'])) return 'product'
  if (textHasAny(text, ['food', 'dish', 'dessert', 'beverage', '美食', '菜品', '甜品', '饮品'])) return 'food'
  if (textHasAny(text, ['fashion', 'outfit', 'lookbook', '穿搭', '时尚', '服装'])) return 'fashion'
  if (textHasAny(text, ['person', 'portrait', 'avatar', 'character', '人像', '头像', '模特', '角色'])) return 'person'
  if (textHasAny(text, ['app', 'ui', 'web', 'screenshot', 'homepage', '界面', '截图', 'dashboard', 'hud', '后台'])) return 'interface'
  if (textHasAny(text, ['architecture', 'interior', 'space', 'scene', 'landscape', '建筑', '室内', '空间', '环境'])) return 'scene'
  return category
}

function inferTextDensity(text: string): TemplateTextDensity | undefined {
  if (textHasAny(text, ['no text', 'without text', '无字', '不要文字', '无文案'])) return 'none'
  if (textHasAny(text, ['lots of text', 'long copy', 'detailed explanation', '大量文字', '长文案', '信息密度高'])) return 'high'
  if (textHasAny(text, ['title', 'copy', 'text', 'logo', 'slogan', '标题', '文案', '文字', '口号', '标签'])) return 'low'
  return undefined
}

function inferAspectRatio(text: string): string | undefined {
  const explicit = text.match(/(?:\b|[:])([1-9]\d?\s*[:]\s*[1-9]\d?)(?:\b|[^\d])/)
  if (explicit) return explicit[1].replace(/\s+/g, '')
  if (textHasAny(text, ['vertical', 'mobile', 'poster', '竖版', '手机竖屏'])) return '3:4'
  if (textHasAny(text, ['horizontal', 'banner', 'cover', '横版', '宽屏'])) return '16:9'
  if (textHasAny(text, ['avatar', 'square', '方图', '头像方形'])) return '1:1'
  return undefined
}

function inferSubject(text: string): string | undefined {
  const cleaned = text
    .replace(/^(please|create|generate|make|design|draw|help me)+/i, '')
    .replace(/^(帮我|请帮我|请|生成|做一张|设计一张|画一张|来一张)+/i, '')
    .replace(/(image|picture|poster|prompt)$/i, '')
    .trim()
  if (!cleaned) return undefined
  return cleaned.length > 32 ? cleaned.slice(0, 32).trim() : cleaned
}

function inferStyleHints(text: string): string[] {
  const hintTerms: Array<[string, string[]]> = [
    ['premium', ['premium', '高级感', '高端', '奢华']],
    ['black gold', ['black gold', '黑金']],
    ['minimal', ['minimal', '极简', '简约']],
    ['realistic', ['realistic', '写实', '真实摄影', '逼真']],
    ['cinematic', ['cinematic', '电影感', '电影级']],
    ['cyberpunk', ['cyberpunk', '赛博朋克']],
    ['pixel', ['pixel', '像素风']],
    ['watercolor', ['watercolor', '水彩']],
    ['anime', ['anime', '动漫', '二次元']],
    ['cute', ['cute', '可爱']],
    ['retro', ['retro', '复古']],
    ['commercial', ['commercial', '商业', '广告感']],
    ['3d', ['3d', '三维', '渲染']],
    ['flat', ['flat', '扁平']],
    ['hand drawn', ['hand drawn', '手绘']],
    ['fashion', ['fashion', '时尚', 'editorial', 'lookbook']],
    ['tech', ['tech', '科技感', '未来感']],
  ]
  return hintTerms.filter(([, terms]) => textHasAny(text, terms)).map(([label]) => label)
}

function inferPalette(text: string): string | undefined {
  const palettes: Array<[string, string[]]> = [
    ['black gold', ['black gold', '黑金']],
    ['blue', ['blue', '蓝色']],
    ['red', ['red', '红色']],
    ['pink', ['pink', '粉色']],
    ['green', ['green', '绿色']],
    ['white', ['white', '白色']],
    ['cream', ['cream', '奶油色', '米白']],
    ['neon', ['neon', '霓虹']],
    ['low saturation', ['low saturation', '低饱和']],
    ['high saturation', ['high saturation', '高饱和']],
  ]
  return palettes.find(([, terms]) => textHasAny(text, terms))?.[0]
}

function inferMood(text: string): string | undefined {
  const moods: Array<[string, string[]]> = [
    ['premium', ['premium', '高级']],
    ['warm', ['warm', '温暖']],
    ['fresh', ['fresh', '清新']],
    ['luxury', ['luxury', '奢华']],
    ['cute', ['cute', '可爱']],
    ['cool', ['cool', '冷酷']],
    ['mysterious', ['mysterious', '神秘']],
    ['clean', ['clean', '干净']],
    ['playful', ['playful', '俏皮']],
    ['professional', ['professional', '专业']],
    ['tech', ['tech', '科技感']],
  ]
  return moods.filter(([, terms]) => textHasAny(text, terms)).map(([label]) => label).join(', ') || undefined
}

function inferRealism(text: string): VisualIntent['realism'] | undefined {
  if (textHasAny(text, ['realistic', 'photo', 'photography', 'shot', '写实', '摄影', '实拍'])) return 'high'
  if (textHasAny(text, ['flat', 'illustration', 'anime', 'cartoon', '插画', '动漫', '卡通', '扁平'])) return 'low'
  return undefined
}

function inferScenarioFromText(text: string): PromptTemplateScenario | undefined {
  return (Object.entries(TEMPLATE_SCENARIO_ALIASES) as Array<[PromptTemplateScenario, string[]]>)
    .map(([scenario, aliases], index) => ({ scenario, index, score: countMatches(text, aliases) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.scenario
}

function inferCategoryFromScenario(scenario?: PromptTemplateScenario): PromptTemplateCategory | undefined {
  if (!scenario) return undefined
  if (['brand-key-visual', 'ecommerce-sale-poster', 'event-release-poster', 'social-campaign-cover'].includes(scenario)) return 'poster'
  if (['saas-landing-hero', 'analytics-dashboard'].includes(scenario)) return 'ui-screenshot'
  if (['food-drink-photo', 'tech-product-render', 'packaging-display'].includes(scenario)) return 'product'
  if (scenario === 'interior-architecture') return 'scene'
  if (scenario === 'workflow-explainer') return 'infographic'
  return undefined
}

export function extractVisualIntent(query: string): VisualIntent {
  const text = query.trim()
  const scenario = inferScenarioFromText(text)
  const category = inferCategoryFromText(text) ?? inferCategoryFromScenario(scenario)
  const textDensity = inferTextDensity(text)
  const subject = inferSubject(text)
  const purpose = inferPurpose(text)
  const platform = inferPlatform(text)
  const styleHints = inferStyleHints(text)
  const mood = inferMood(text)
  const palette = inferPalette(text)
  const aspectRatio = inferAspectRatio(text)
  const realism = inferRealism(text)
  const needsPurpose = textHasAny(text, ['海报', '封面', '主图', '详情页', '界面', '空间', '美食', '穿搭', 'dashboard', 'render'])
  const needsPlatform = textHasAny(text, ['小红书', 'rednote', '抖音', 'douyin', '淘宝', '天猫', '京东', 'b站', 'steam', 'app store'])
  const confidenceSignals = [subject, category, scenario, purpose, platform, textDensity, palette, mood, aspectRatio, realism, styleHints.length ? 'style' : undefined].filter(Boolean).length
  return {
    subject,
    category,
    scenario,
    scenarioLabel: scenario ? TEMPLATE_SCENARIO_LABELS[scenario] : undefined,
    purpose,
    platform,
    styleHints,
    mood,
    palette,
    aspectRatio,
    realism,
    text: {
      required: textDensity ? textDensity !== 'none' : undefined,
      density: textDensity,
    },
    constraints: textHasAny(text, ['避免', '不要', '禁止']) ? [text] : [],
    negativeHints: textHasAny(text, ['避免', '不要', '禁止']) ? extractSearchKeywords(text).slice(0, 8) : [],
    missingFields: uniqueStrings([
      subject ? undefined : 'subject',
      category ? undefined : 'category',
      needsPurpose && !purpose ? 'purpose' : undefined,
      needsPlatform && !platform ? 'platform' : undefined,
      (category === 'poster' || category === 'ui-screenshot' || scenario === 'workflow-explainer') && !textDensity ? 'text-density' : undefined,
    ]),
    confidence: Math.min(0.95, Math.max(0.2, confidenceSignals / 11)),
  }
}

export function deriveTemplateGovernance(template: StructuredPromptTemplate): TemplateGovernance {
  const source = template.source ?? 'official'
  const text = [template.id, template.name, template.description, ...template.tags, ...template.examples, template.sourcePrompt ?? '', template.promptPattern].join(' ')
  const textDensity = uniqueStrings([template.outputHints.textDensity, inferTextDensity(text)]) as TemplateTextDensity[]
  return {
    sourceRole: template.governance?.sourceRole ?? (source === 'legacy' ? 'reference' : source === 'user' ? 'user' : 'primary'),
    status: template.governance?.status ?? (template.isPlaceholderOnly ? 'needs-review' : 'active'),
    qualityTier: template.governance?.qualityTier ?? (source === 'official' ? 'high' : source === 'legacy' ? 'medium' : 'medium'),
    intents: uniqueStrings([...(template.governance?.intents ?? []), inferPurpose(text), template.category]),
    platforms: uniqueStrings([...(template.governance?.platforms ?? []), inferPlatform(text)]),
    subjectTypes: uniqueStrings([...(template.governance?.subjectTypes ?? []), inferSubjectType(text, template.category)]),
    textDensity: textDensity.length ? textDensity : ['low', 'medium'],
  }
}

function governanceScore(template: StructuredPromptTemplate, intent: VisualIntent): number {
  const governance = deriveTemplateGovernance(template)
  const sourceScore = governance.sourceRole === 'primary' ? 10 : governance.sourceRole === 'user' ? 6 : 1
  const qualityScore = governance.qualityTier === 'high' ? 8 : governance.qualityTier === 'medium' ? 4 : 0
  const statusPenalty = governance.status === 'active' ? 0 : governance.status === 'needs-review' ? 8 : 999
  const categoryScore = intent.category && template.category === intent.category ? 24 : 0
  const purposeScore = intent.purpose && governance.intents.includes(intent.purpose) ? 14 : 0
  const platformScore = intent.platform && governance.platforms.includes(intent.platform) ? 12 : 0
  const subjectType = inferSubjectType(intent.subject ?? '', intent.category)
  const subjectScore = subjectType && governance.subjectTypes.includes(subjectType) ? 8 : 0
  const textScore = intent.text.density && governance.textDensity.includes(intent.text.density) ? 6 : 0
  const scenarioScore = intent.scenario && template.scenario === intent.scenario ? 36 : 0
  const scenarioAliasScore = intent.scenario && template.scenarioAliases?.some((alias) => textHasAny(alias, TEMPLATE_SCENARIO_ALIASES[intent.scenario!])) ? 4 : 0
  return sourceScore + qualityScore + categoryScore + scenarioScore + scenarioAliasScore + purposeScore + platformScore + subjectScore + textScore - statusPenalty
}

export function searchStructuredTemplates(query: string, category: PromptTemplateCategory | 'all' = 'all', visualIntent?: VisualIntent): RankedResult<StructuredPromptTemplate>[] {
  const keywords = extractSearchKeywords(query)
  const intent = visualIntent ?? extractVisualIntent(query)
  return getMainTrackTemplates()
    .filter((template) => category === 'all' || template.category === category)
    .map((template, index) => {
      const governance = deriveTemplateGovernance(template)
      if (!keywords.length) return { item: template, score: 1000 - index + governanceScore(template, intent), matchedKeywords: [] }
      const slotText = Object.values(template.slots).flatMap((slot) => [slot.label, slot.default ?? '', ...(slot.examples ?? [])])
      const result = scoreText([
        template.id,
        template.name,
        TEMPLATE_CATEGORY_LABELS[template.category],
        template.description,
        template.sourceTitle ?? '',
        governance.sourceRole === 'reference' ? '' : template.sourcePrompt ?? '',
        ...template.tags,
        ...template.examples,
        ...governance.intents,
        ...governance.platforms,
        ...governance.subjectTypes,
        ...governance.textDensity,
        ...slotText,
        template.promptPattern,
      ], keywords, 4)
      return { item: template, score: Math.max(0, result.score + governanceScore(template, intent) - (template.isPlaceholderOnly ? 5 : 0)), matchedKeywords: result.matched }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
}

function referenceTraits(template: StructuredPromptTemplate, governance: TemplateGovernance): string[] {
  return uniqueStrings([
    TEMPLATE_CATEGORY_LABELS[template.category],
    ...governance.intents,
    ...governance.platforms,
    ...governance.subjectTypes,
    ...governance.textDensity.map((density) => `${density} text`),
    ...template.tags.slice(0, 4),
  ]).filter((trait) => trait.length <= 40)
}

function referenceStrengths(template: StructuredPromptTemplate, governance: TemplateGovernance): string[] {
  return uniqueStrings([
    governance.subjectTypes.includes('product') ? '产品主体表达' : undefined,
    governance.intents.includes('brand-promotion') ? '品牌传播结构' : undefined,
    governance.intents.includes('social-seeding') ? '社媒传播感' : undefined,
    governance.textDensity.includes('low') ? '少字高冲击版式' : undefined,
    template.promptPattern.length > 500 ? '完整视觉指令密度' : '轻量结构灵感',
  ])
}

function referenceRisks(template: StructuredPromptTemplate): string[] {
  return uniqueStrings([
    template.author || template.sourceUrl ? '来源痕迹需去除' : undefined,
    template.promptPattern.includes('@') || template.promptPattern.includes('签名') ? '可能包含作者署名' : undefined,
    template.promptPattern.length > 1200 ? '原文过长不宜直用' : undefined,
    template.isPlaceholderOnly ? '占位内容不可用' : undefined,
  ])
}

export function searchLegacyReferenceInsights(query: string, category: PromptTemplateCategory | 'all' = 'all', visualIntent?: VisualIntent, limit = 5): LegacyReferenceInsight[] {
  const keywords = extractSearchKeywords(query)
  const intent = visualIntent ?? extractVisualIntent(query)
  return getLegacyReferenceTemplates()
    .filter(isUsableReferenceTemplate)
    .filter((template) => category === 'all' || template.category === category)
    .map((template, index) => {
      const governance = deriveTemplateGovernance(template)
      const fields = [
        template.name,
        template.description,
        template.scenario ?? '',
        template.scenarioLabel ?? '',
        ...(template.scenarioAliases ?? []),
        template.sourceTitle ?? '',
        ...template.tags,
        ...template.examples,
        ...governance.intents,
        ...governance.platforms,
        ...governance.subjectTypes,
        ...governance.textDensity,
      ]
      const result = keywords.length ? scoreText(fields, keywords, 3) : { score: 8, matched: [] }
      const categoryBonus = intent.category && template.category === intent.category ? 10 : 0
      const score = result.score + categoryBonus + governanceScore(template, intent) + Math.max(0, 5 - index * 0.1)
      return {
        id: template.id,
        title: template.name,
        category: template.category,
        sourceRole: 'reference' as const,
        qualityTier: governance.qualityTier,
        traits: referenceTraits(template, governance).slice(0, 8),
        keywords: uniqueStrings([...result.matched, ...template.tags, ...governance.intents, ...governance.platforms]).slice(0, 10),
        strengths: referenceStrengths(template, governance).slice(0, 4),
        risks: referenceRisks(template).slice(0, 4),
        score,
        matchedKeywords: result.matched,
      }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function searchStructuredStyles(query: string, category?: PromptTemplateCategory, visualIntent?: VisualIntent): RankedResult<StructuredStylePreset>[] {
  const keywords = extractSearchKeywords(query)
  const intent = visualIntent ?? extractVisualIntent(query)
  return STRUCTURED_STYLE_PRESETS.map((style, index) => {
    if (!keywords.length) return { item: style, score: STRUCTURED_STYLE_PRESETS.length - index, matchedKeywords: [] }
    const result = scoreText([
      style.id,
      style.name,
      style.englishKeyword,
      style.description,
      style.promptFragment,
      ...style.tags,
      ...style.aliases,
      ...Object.values(style.visualTraits).filter(Boolean),
    ], keywords, 3)
    const effectiveCategory = category ?? intent.category
    const fitBonus = effectiveCategory && style.bestFor.includes(effectiveCategory) ? 8 : 0
    const avoidPenalty = effectiveCategory && style.avoidFor.includes(effectiveCategory) ? 999 : 0
    const styleHintBonus = intent.styleHints.some((hint) => [style.name, style.englishKeyword, ...style.tags, ...style.aliases].join(' ').toLowerCase().includes(hint.toLowerCase())) ? 6 : 0
    return { item: style, score: Math.max(0, result.score + fitBonus + styleHintBonus - avoidPenalty), matchedKeywords: result.matched }
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
}

function slotValueFromIntent(key: string, slot: PromptTemplateSlot, intent: VisualIntent): string | undefined {
  const normalized = `${key} ${slot.label}`.toLowerCase()
  if (key === 'subject' || textHasAny(normalized, ['主体', '主题', '产品', '角色'])) return intent.subject
  if (textHasAny(normalized, ['情绪', '氛围', 'mood'])) return intent.mood
  if (textHasAny(normalized, ['色彩', '颜色', 'palette'])) return intent.palette
  if (textHasAny(normalized, ['构图', 'composition', '版式'])) return intent.composition
  if (textHasAny(normalized, ['文字', '标题', 'text'])) return intent.text.content ?? (intent.text.required ? `${intent.text.density ?? 'low'} text, concise readable title` : undefined)
  if (textHasAny(normalized, ['平台', '媒介', '渠道'])) return intent.platform
  if (textHasAny(normalized, ['比例', '尺寸', 'aspect'])) return intent.aspectRatio
  if (textHasAny(normalized, ['风格', 'style'])) return intent.styleHints.join('、')
  return undefined
}

function inferSlotValues(template: StructuredPromptTemplate, query: string, visualIntent?: VisualIntent): { values: Record<string, string>; missingSlots: string[] } {
  const values: Record<string, string> = {}
  const missingSlots: string[] = []
  const intent = visualIntent ?? extractVisualIntent(query)
  Object.entries(template.slots).forEach(([key, slot]) => {
    const intentValue = slotValueFromIntent(key, slot, intent)
    if (intentValue) values[key] = intentValue
    else if (slot.default) values[key] = slot.default
    else if (key === 'subject' && intent.subject) values[key] = intent.subject
    else if (slot.required) missingSlots.push(key)
  })
  return { values, missingSlots }
}

export function getPromptRecommendations(query: string, limit = 3, visualIntent?: VisualIntent): PromptRecommendation[] {
  if (!query.trim() || extractSearchKeywords(query).length < 1) return []
  const intent = visualIntent ?? extractVisualIntent(query)
  return searchStructuredTemplates(query, intent.category ?? 'all', intent).slice(0, limit).map(({ item: template, score }) => {
    const styles = searchStructuredStyles(query, template.category, intent).slice(0, 3).map((entry) => entry.item)
    const { values: filledSlots, missingSlots } = inferSlotValues(template, query, intent)
    const confidence = Math.min(0.98, Math.max(0.45, score / 24))
    const governance = deriveTemplateGovernance(template)
    return {
      template,
      styles,
      confidence,
      filledSlots,
      missingSlots,
      reason: `Matched ${TEMPLATE_CATEGORY_LABELS[template.category]} with ${governance.sourceRole} template; intent: ${uniqueStrings([intent.purpose, intent.platform, ...intent.styleHints]).join(', ') || 'general'}`,
    }
  }).filter((item) => item.confidence >= 0.5)
}
export function renderRecommendationPrompt(recommendation: PromptRecommendation): string {
  const templatePrompt = renderTemplatePrompt(recommendation.template, recommendation.filledSlots)
  const stylePrompt = composeStylePrompt(recommendation.styles[0], recommendation.styles.slice(1, 3))
  return [templatePrompt, stylePrompt, `Negative guidance: ${recommendation.template.negativePrompt}`].filter(Boolean).join('\n\n')
}

export function parseAssistantComposition(text: string): ParsedAssistantComposition | null {
  const jsonBlock = text.match(/```json\s*([\s\S]*?)```/i)?.[1] ?? text.match(/\{[\s\S]*\}/)?.[0]
  if (!jsonBlock) return null
  try {
    const parsed = JSON.parse(jsonBlock) as ParsedAssistantComposition
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => Array.isArray(item) ? asStringArray(item) : [String(item ?? '').trim()])
      .filter(Boolean)
  }
  if (typeof value === 'string') {
    return value.split(/[,，;；\n]+/).map((item) => item.trim()).filter(Boolean)
  }
  return []
}

function normalizeEvidenceSourceType(value: unknown): AssistantEvidenceSourceType | undefined {
  const text = String(value ?? '').toLowerCase()
  if (['template', 'style', 'knowledge', 'reference', 'strategy', 'custom'].includes(text)) {
    return text as AssistantEvidenceSourceType
  }
  if (text.includes('rule') || text.includes('知识')) return 'knowledge'
  if (text.includes('preset') || text.includes('模板')) return 'template'
  if (text.includes('风格') || text.includes('style')) return 'style'
  if (text.includes('参考') || text.includes('legacy')) return 'reference'
  return undefined
}

function normalizeBorrowedSources(value: unknown): AssistantBorrowedSource[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    if (typeof item === 'string') return { aspects: [item] }
    const entry = item as Record<string, unknown>
    const aspects = asStringArray(entry.aspects ?? entry.borrowedAspects ?? entry.borrow ?? entry.parts ?? entry.traits)
    const fallback = [entry.aspect, entry.trait, entry.reason, entry.title].map((field) => String(field ?? '').trim()).filter(Boolean)
    return {
      sourceType: normalizeEvidenceSourceType(entry.sourceType ?? entry.type ?? entry.source),
      id: typeof entry.id === 'string' ? entry.id : typeof entry.sourceId === 'string' ? entry.sourceId : undefined,
      title: typeof entry.title === 'string' ? entry.title : typeof entry.name === 'string' ? entry.name : undefined,
      aspects: aspects.length ? aspects : fallback.slice(0, 3),
      reason: typeof entry.reason === 'string' ? entry.reason : undefined,
    }
  }).filter((item) => item.aspects.length || item.id || item.title)
}

function normalizeRejectedTraits(value: unknown): AssistantRejectedTrait[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    if (typeof item === 'string') return { trait: item }
    const entry = item as Record<string, unknown>
    const trait = String(entry.trait ?? entry.aspect ?? entry.rejectedTrait ?? entry.name ?? '').trim()
    const reason = typeof entry.reason === 'string' ? entry.reason : undefined
    return {
      sourceType: normalizeEvidenceSourceType(entry.sourceType ?? entry.type ?? entry.source),
      id: typeof entry.id === 'string' ? entry.id : typeof entry.sourceId === 'string' ? entry.sourceId : undefined,
      trait: trait || reason || '未说明的舍弃项',
      reason,
    }
  }).filter((item) => item.trait)
}

function normalizeValidationNotes(value: unknown): AssistantValidationNote[] {
  if (!Array.isArray(value)) return asStringArray(value).map((message) => ({ severity: 'info', message }))
  return value.map((item) => {
    if (typeof item === 'string') return { severity: 'info' as const, message: item }
    const entry = item as Record<string, unknown>
    const severityText = String(entry.severity ?? '').toLowerCase()
    const typeText = String(entry.type ?? '').toLowerCase()
    const severity: AssistantValidationSeverity = severityText === 'error' ? 'error' : severityText === 'warning' ? 'warning' : 'info'
    const type = ['completeness', 'anti-template', 'compatibility', 'local-only', 'other'].includes(typeText)
      ? typeText as AssistantValidationNote['type']
      : 'other'
    return {
      type,
      severity,
      message: String(entry.message ?? entry.text ?? entry.note ?? '').trim(),
    }
  }).filter((item) => item.message)
}

function normalizeRewriteStages(value: unknown): AssistantRewriteStages | undefined {
  if (!value || typeof value !== 'object') return undefined
  const entry = value as Record<string, unknown>
  const stages: AssistantRewriteStages = {
    retrieval: asStringArray(entry.retrieval),
    judgment: asStringArray(entry.judgment),
    expression: asStringArray(entry.expression),
    validation: asStringArray(entry.validation),
  }
  return Object.values(stages).some((items) => items?.length) ? stages : undefined
}

export function normalizeAssistantComposition(composition: ParsedAssistantComposition | null): ParsedAssistantComposition | null {
  if (!composition) return null
  return {
    ...composition,
    borrowedSources: normalizeBorrowedSources((composition as Record<string, unknown>).borrowedSources ?? (composition as Record<string, unknown>).borrowed),
    rejectedTraits: normalizeRejectedTraits((composition as Record<string, unknown>).rejectedTraits ?? (composition as Record<string, unknown>).rejected),
    validationNotes: normalizeValidationNotes((composition as Record<string, unknown>).validationNotes ?? (composition as Record<string, unknown>).validation),
    rewriteStages: normalizeRewriteStages((composition as Record<string, unknown>).rewriteStages ?? (composition as Record<string, unknown>).stages),
  }
}

function hasAnyText(text: string, values: string[]): boolean {
  const normalized = text.toLowerCase()
  return values.some((value) => normalized.includes(value.toLowerCase()))
}

export function validateFinalPromptText(prompt: string, visualIntent?: VisualIntent): string[] {
  const text = prompt.trim()
  if (!text) return []
  const warnings: string[] = []
  const maybeScene = ['场景', '背景', '环境', '室内', '户外', 'studio', 'scene', 'background', 'environment']
  const maybeComposition = ['构图', '视角', '镜头', '特写', '近景', '中景', '全景', '俯视', '正面', '中央', '留白', 'composition', 'view', 'camera']
  const maybeLighting = ['光线', '灯光', '布光', '柔光', '自然光', '逆光', '轮廓光', 'lighting', 'light', 'shadow']
  const maybeVisual = ['色彩', '颜色', '材质', '质感', '风格', '调性', 'palette', 'color', 'material', 'texture', 'style']
  const maybeNegative = ['避免', '不要', '禁止', '负面', '低清晰', '模糊', '变形', '错误文字', 'negative', 'avoid', 'no ']

  if (!visualIntent?.subject && text.length < 24) warnings.push('提示词主体可能不够明确')
  if (!hasAnyText(text, maybeScene)) warnings.push('提示词可能缺少场景或背景描述')
  if (!hasAnyText(text, maybeComposition)) warnings.push('提示词可能缺少构图、视角或镜头描述')
  if (!hasAnyText(text, maybeLighting)) warnings.push('提示词可能缺少光线描述')
  if (!hasAnyText(text, maybeVisual)) warnings.push('提示词可能缺少色彩、材质或风格描述')
  if (!hasAnyText(text, maybeNegative)) warnings.push('提示词可能缺少负面约束或失败模式控制')

  if (/[{[【][^}\]】]*(主题|主体|subject)[^}\]】]*[}\]】]/i.test(text) || /{{[^}]+}}/.test(text)) {
    warnings.push('提示词包含未替换的模板占位符')
  }
  if (/\b(template|style|rule|intent)-[a-z0-9-]+\b/i.test(text)) {
    warnings.push('提示词疑似泄露内部模板、风格或规则 ID')
  }
  if (/@[a-z0-9_]{3,}/i.test(text) || /https?:\/\/|x\.com|twitter\.com/i.test(text)) {
    warnings.push('提示词疑似包含来源署名、链接或平台痕迹')
  }
  const slotLabels = text.match(/(主体|场景|构图|光线|色彩|材质|风格|负面约束|质量约束)\s*[：:]/g) ?? []
  if (slotLabels.length >= 5) warnings.push('提示词看起来过于像填槽模板，可考虑改写成更自然的画面描述')
  const commaCount = (text.match(/[,，]/g) ?? []).length
  if (commaCount >= 16 && !/[。.!?？]/.test(text)) warnings.push('提示词可能过度堆叠标签，缺少自然表达')

  const isPromoIntent = visualIntent?.scenario === 'ecommerce-sale-poster' || visualIntent?.purpose === 'promotion' || hasAnyText(visualIntent?.subject ?? '', ['促销', '优惠', '大促'])
  if (!isPromoIntent && hasAnyText(text, ['价格标签', '折扣', '优惠券', '限时促销', '满减', 'sale badge'])) {
    warnings.push('非促销意图中出现促销价格或折扣元素')
  }
  const simplePosterOrProduct = visualIntent?.category === 'poster' || visualIntent?.category === 'product'
  if (simplePosterOrProduct && visualIntent?.scenario !== 'workflow-explainer' && hasAnyText(text, ['多模块信息图', '流程步骤', '时间线', '百科栏目', 'Top 5模块'])) {
    warnings.push('简单海报或产品图中出现信息图式多模块结构')
  }

  return uniqueStrings(warnings)
}

export function validateAssistantComposition(
  composition: ParsedAssistantComposition,
  options: { presetOnly?: boolean; visualIntent?: VisualIntent } = {},
): AssistantCompositionValidation {
  const templates = getAllStructuredTemplates()
  const templateById = new Map(templates.map((template) => [template.id, template]))
  const styleById = new Map(STRUCTURED_STYLE_PRESETS.map((style) => [style.id, style]))
  const validTemplateIds: string[] = []
  const validStyleIds: string[] = []
  const invalidTemplateIds: string[] = []
  const invalidStyleIds: string[] = []
  const missingRequiredSlots: string[] = []
  const warnings: string[] = []

  for (const recommendation of composition.recommendations ?? []) {
    const templateId = recommendation.templateId
    const template = templateId ? templateById.get(templateId) : undefined
    if (templateId && template) validTemplateIds.push(templateId)
    if (templateId && !template) invalidTemplateIds.push(templateId)

    for (const styleId of recommendation.styleIds ?? []) {
      const style = styleById.get(styleId)
      if (style) validStyleIds.push(styleId)
      else invalidStyleIds.push(styleId)
      if (style && template && style.avoidFor.includes(template.category)) {
        warnings.push(`Style ${styleId} conflicts with template category ${template.category}`)
      }
    }

    if (template) {
      for (const [slotKey, slot] of Object.entries(template.slots)) {
        if (slot.required && !recommendation.filledSlots?.[slotKey]?.trim()) {
          missingRequiredSlots.push(`${template.id}.${slotKey}`)
        }
      }
    }
  }

  if (options.presetOnly && (!validTemplateIds.length || invalidTemplateIds.length || invalidStyleIds.length)) {
    warnings.push('Preset-only mode requires recommendations to use valid local template/style IDs only')
  }
  if (options.visualIntent?.missingFields.length) {
    warnings.push(`Visual intent missing fields: ${options.visualIntent.missingFields.join(', ')}`)
  }
  const promptWarnings = validateFinalPromptText(composition.finalPrompt ?? '', options.visualIntent)

  return {
    composition,
    validTemplateIds: uniqueStrings(validTemplateIds),
    validStyleIds: uniqueStrings(validStyleIds),
    invalidTemplateIds: uniqueStrings(invalidTemplateIds),
    invalidStyleIds: uniqueStrings(invalidStyleIds),
    missingRequiredSlots: uniqueStrings(missingRequiredSlots),
    warnings: uniqueStrings([...warnings, ...promptWarnings]),
    promptWarnings,
  }
}

export function extractAssistantFinalPrompt(text: string): string {
  const structured = parseAssistantComposition(text)
  if (structured?.finalPrompt) return structured.finalPrompt.trim()
  const match = text.match(/Final prompt:\s*([\s\S]*)/i)
  const extracted = match?.[1] ?? text
  return extracted
    .replace(/\n+\s*(Negative prompt|Negative guidance|Used preset IDs|Used knowledge IDs|Actions):[\s\S]*$/i, '')
    .trim()
}

export function createTemplateDraftFromPrompt(prompt: string, name = 'AI 生成模板'): TemplateDraft {
  const slug = name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '').slice(0, 36) || 'ai-template'
  const now = Date.now()
  const subjectPlaceholder = '{{subject}}'
  return {
    id: `user-${slug}-${now.toString(36)}`,
    name,
    category: 'other',
    description: '由 AI 助手从当前提示词抽象出的可复用模板。',
    tags: extractSearchKeywords(prompt).slice(0, 10),
    slots: {
      subject: { label: '主题/主体', required: true, examples: ['替换为新的主题'] },
    },
    promptPattern: `${prompt.trim()}\n\n主题：${subjectPlaceholder}`,
    negativePrompt: '避免低清晰度、构图混乱、错误文字、主体不明确。',
    outputHints: { language: 'zh-CN', textDensity: 'medium' },
    examples: [prompt.slice(0, 80)],
    source: 'user',
    createdAt: now,
  }
}
export function validateTemplateDraft(value: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const draft = value as Partial<TemplateDraft>
  if (!draft || typeof draft !== 'object') errors.push('Template is not an object')
  if (!draft.id || typeof draft.id !== 'string') errors.push('Missing id')
  if (!draft.name || typeof draft.name !== 'string') errors.push('Missing name')
  if (!draft.category || !(draft.category in TEMPLATE_CATEGORY_LABELS)) errors.push('Invalid category')
  if (!draft.slots || typeof draft.slots !== 'object') errors.push('Missing slots')
  if (!draft.promptPattern || typeof draft.promptPattern !== 'string') errors.push('Missing promptPattern')
  if (draft.promptPattern && draft.slots) {
    Object.keys(draft.slots).forEach((key) => {
      const slot = (draft.slots as Record<string, unknown>)[key] as PromptTemplateSlot
      if (slot.required && !draft.promptPattern?.includes(`{{${key}}}`)) {
        errors.push(`Required slot ${key} is missing from promptPattern`)
      }
    })
  }
  return { valid: errors.length === 0, errors }
}
