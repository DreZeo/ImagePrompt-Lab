import { extractSearchKeywords } from './promptPresets'
import type { PromptTemplateCategory, RankedResult, StructuredPromptTemplate, StructuredStylePreset, VisualIntent } from './structuredPrompts'

export type PromptKnowledgeType = 'rule' | 'quality' | 'intent' | 'output-profile'

export interface PromptKnowledgeRule {
  id: string
  type: PromptKnowledgeType
  name: string
  description: string
  appliesTo: PromptTemplateCategory[]
  tags: string[]
  aliases: string[]
  dimensions: string[]
  positiveFragments: string[]
  negativeFragments: string[]
  examples: string[]
  outputProfileIds?: string[]
}

export interface PromptOutputProfile {
  id: string
  name: string
  language: 'zh-CN' | 'en-US'
  description: string
  tags: string[]
  formatGuidance: string[]
  requiredSections: string[]
  avoid: string[]
}

export interface PromptIntentMapping {
  id: string
  phrases: string[]
  categories: PromptTemplateCategory[]
  ruleIds: string[]
  styleHints: string[]
  outputProfileId?: string
}

export interface PromptKnowledgeContext {
  rules: RankedResult<PromptKnowledgeRule>[]
  intents: RankedResult<PromptIntentMapping>[]
  outputProfile: PromptOutputProfile
}

export interface PromptKnowledgeSearchOptions {
  templates?: StructuredPromptTemplate[]
  styles?: StructuredStylePreset[]
  category?: PromptTemplateCategory
  visualIntent?: VisualIntent
  limit?: number
  outputProfileId?: string
}

export const PROMPT_OUTPUT_PROFILES: PromptOutputProfile[] = [
  {
    id: 'universal-zh',
    name: '通用中文专业提示词',
    language: 'zh-CN',
    description: '面向多数图像模型的中文专业提示词格式，强调完整视觉字段和负面约束。',
    tags: ['中文', '通用', '专业', '标准化', '默认'],
    formatGuidance: [
      '使用清晰中文自然段或分号分隔短句。',
      '优先包含主体、场景、构图、镜头/视角、光线、色彩、材质、风格、文字要求、质量约束和负面约束。',
      '如果用户输入较短，补全安全默认值并说明假设。',
    ],
    requiredSections: ['主体', '场景/背景', '构图/视角', '光线', '色彩', '材质/纹理', '风格', '质量约束', '负面约束'],
    avoid: ['不要堆砌互相冲突的风格', '不要捏造不可用模板或画风 ID', '不要把规则原文机械粘贴进最终提示词'],
  },
  {
    id: 'universal-en',
    name: 'Universal English Prompt',
    language: 'en-US',
    description: 'A general English image prompt format for broad model compatibility.',
    tags: ['English', 'universal', 'professional', 'standardized'],
    formatGuidance: [
      'Write a concise but complete English image prompt.',
      'Include subject, scene, composition, camera/view, lighting, color palette, material, style, text requirements, quality constraints, and negative constraints when applicable.',
      'Avoid model-specific syntax unless the user asks for it.',
    ],
    requiredSections: ['subject', 'scene/background', 'composition/view', 'lighting', 'color palette', 'material/texture', 'style', 'quality constraints', 'negative constraints'],
    avoid: ['Do not invent preset IDs', 'Do not overfit to a platform-specific syntax', 'Do not paste raw rule text mechanically'],
  },
  {
    id: 'midjourney-style',
    name: 'Midjourney 风格提示词',
    language: 'en-US',
    description: '偏 Midjourney 习惯的英文短语式提示词，用于用户明确要求 MJ 风格时。',
    tags: ['Midjourney', 'MJ', '英文', '参数', '短语式'],
    formatGuidance: [
      'Use compact English phrase clusters with strong visual nouns and adjectives.',
      'Keep scene, composition, lighting, lens, style, and quality guidance near the front.',
      'Mention aspect ratio only when inferred from template or user intent.',
    ],
    requiredSections: ['subject', 'scene', 'composition', 'lighting', 'style', 'quality', 'negative constraints'],
    avoid: ['Do not add unsupported parameters by default', 'Do not include long explanatory prose inside the final prompt'],
  },
  {
    id: 'stable-diffusion-style',
    name: 'Stable Diffusion 风格提示词',
    language: 'en-US',
    description: '偏 Stable Diffusion 的正向/负向分离提示词结构。',
    tags: ['Stable Diffusion', 'SD', '正向提示词', '负向提示词', '英文'],
    formatGuidance: [
      'Separate positive prompt and negative prompt clearly.',
      'Use weighted concise descriptors only when helpful and not excessive.',
      'Keep negative prompt focused on visible failure modes.',
    ],
    requiredSections: ['positive prompt', 'negative prompt', 'quality descriptors', 'composition', 'lighting', 'style'],
    avoid: ['Do not overload with repetitive quality tags', 'Do not use conflicting style tags'],
  },
  {
    id: 'dalle-natural-zh',
    name: 'DALL-E 自然语言提示词',
    language: 'zh-CN',
    description: '适合 DALL-E / OpenAI Images 一类模型的自然语言式提示词，强调清晰关系、完整画面描述和少量高价值约束。',
    tags: ['DALL-E', 'OpenAI Images', '中文', '自然语言', '场景叙事'],
    formatGuidance: [
      '使用完整自然语言描述主体、环境、构图关系和关键视觉目标。',
      '优先强调画面中谁在什么场景、以什么方式被看到，而不是堆叠短标签。',
      '避免权重语法、参数符号和过长的负面词串。',
    ],
    requiredSections: ['主体', '场景关系', '构图/视角', '光线', '色彩', '材质', '风格目标', '关键约束'],
    avoid: ['不要堆叠逗号式碎片标签', '不要默认加入 MJ/SD 参数', '不要使用过长负面词列表替代清晰正向描述'],
  },
  {
    id: 'flux-descriptive-en',
    name: 'Flux 描述型提示词',
    language: 'en-US',
    description: '适合 Flux 一类模型的描述型英文提示词，强调摄影、材质、空间关系和一致的视觉语气。',
    tags: ['Flux', 'English', 'descriptive', 'photography', 'material'],
    formatGuidance: [
      'Write fluent descriptive English with coherent subject, environment, lighting, and material cues.',
      'Keep the most important scene, composition, and realism signals near the front.',
      'Use negative constraints sparingly and focus on visible failure modes.',
    ],
    requiredSections: ['subject', 'scene', 'composition/view', 'lighting', 'material detail', 'style direction', 'quality constraints'],
    avoid: ['Do not turn the prompt into MJ-style parameter chains', 'Do not repeat the same quality adjectives excessively', 'Do not mix too many incompatible render styles'],
  },
  {
    id: 'domestic-zh-concise',
    name: '国产模型中文短句提示词',
    language: 'zh-CN',
    description: '适合即梦、可灵、通义万相、豆包等中文模型的短句式提示词，强调主体明确、结构清楚、语义少冲突。',
    tags: ['国产模型', '中文', '短句', '即梦', '可灵', '通义万相', '豆包'],
    formatGuidance: [
      '使用短句或短分句描述主体、场景、构图、光线、色彩和风格，层次清晰。',
      '优先给出单一主视觉和少量强约束，避免长串英文混写。',
      '如涉及文字或界面，明确要求少量可读中文占位。',
    ],
    requiredSections: ['主体', '场景', '构图', '光线', '色彩', '风格', '质量约束', '负面约束'],
    avoid: ['不要中英夹杂过长', '不要同时堆叠过多风格标签', '不要把复杂参数语法直接套入中文模型'],
  },
]

export const PROMPT_KNOWLEDGE_RULES: PromptKnowledgeRule[] = [
  {
    id: 'rule-commercial-product-photo',
    type: 'rule',
    name: '商业产品摄影规则',
    description: '用于产品主图、棚拍、包装和广告场景的专业产品摄影标准。',
    appliesTo: ['product', 'poster'],
    tags: ['产品', '商品', '电商', '主图', '白底', '棚拍', '包装', '商业摄影', '材质'],
    aliases: ['产品摄影', '商品图', '白底图', '电商图', '产品棚拍'],
    dimensions: ['主体完整清晰', '材质和边缘可辨', '光线控制稳定', '背景不抢主体', '商品比例可信'],
    positiveFragments: ['商业产品摄影质感', '主体轮廓清晰', '真实材质反射', '柔和棚拍光', '干净背景', '轻微自然投影'],
    negativeFragments: ['产品变形', '杂乱背景', '过度反光', '低清晰度', '错误文字', '主体被裁切'],
    examples: ['香水白底主图', '耳机产品棚拍', '护肤品包装陈列'],
  },
  {
    id: 'rule-premium-poster-layout',
    type: 'rule',
    name: '高级海报版式规则',
    description: '用于广告、活动、课程、社媒封面的高级版式与信息层级控制。',
    appliesTo: ['poster'],
    tags: ['海报', '广告', '高级感', '版式', '封面', '课程', '活动', '社交媒体'],
    aliases: ['高级海报', '广告海报', '主视觉', 'KV', '封面图'],
    dimensions: ['主标题明确', '主体和文字层级清楚', '留白可控', '视觉焦点单一', '适配目标比例'],
    positiveFragments: ['高端商业海报版式', '清晰标题区', '克制留白', '强主视觉', '有秩序的信息层级', '适合移动端传播'],
    negativeFragments: ['文字过多', '排版拥挤', '标题不可读', '廉价促销感', '素材堆砌', '错别字'],
    examples: ['高端香水海报', '课程招生海报', '活动主视觉 KV'],
  },
  {
    id: 'rule-social-cover-clickability',
    type: 'rule',
    name: '社媒封面点击率规则',
    description: '用于小红书、B站、公众号、直播封面的封面吸引力与移动端可读性。',
    appliesTo: ['poster', 'ui-screenshot'],
    tags: ['小红书', 'B站', '公众号', '直播', '封面', '点击率', '标题', '种草'],
    aliases: ['社媒封面', '视频封面', '笔记封面', '直播封面'],
    dimensions: ['标题短而醒目', '主体强记忆点', '移动端可读', '情绪或收益明确', '背景简化'],
    positiveFragments: ['强钩子标题', '清晰主视觉', '移动端高可读性', '生活化真实感', '点击欲强', '视觉反差明确'],
    negativeFragments: ['标题太小', '信息拥挤', '低质拼贴', '营销感过重', '文字乱码', '主体不明确'],
    examples: ['小红书穿搭封面', 'B站教程封面', '直播预约封面'],
  },
  {
    id: 'rule-professional-portrait-photo',
    type: 'rule',
    name: '专业人像摄影规则',
    description: '用于职业头像、证件照、写真、电影感人像和双人人像。',
    appliesTo: ['portrait'],
    tags: ['人像', '头像', '职业照', '证件照', '写真', '电影感', '摄影', '面部'],
    aliases: ['职业头像', '商务头像', '人物写真', '证件照'],
    dimensions: ['面部自然清晰', '姿态可信', '光线修饰但不过度', '背景服务人物', '肤色真实'],
    positiveFragments: ['真实皮肤质感', '自然表情', '柔和主光', '清晰眼神光', '专业摄影构图', '背景干净'],
    negativeFragments: ['五官变形', '过度磨皮', '表情僵硬', '手部错误', '背景杂乱', '低清晰度'],
    examples: ['职业形象照', '标准证件照', '电影剧照人像'],
  },
  {
    id: 'rule-anime-character-design',
    type: 'rule',
    name: '二次元角色设定规则',
    description: '用于二次元、游戏、卡牌、Q版头像和角色三视图的设定完整性。',
    appliesTo: ['anime'],
    tags: ['二次元', '角色', '游戏', '卡牌', '三视图', '立绘', 'Q版', '设定'],
    aliases: ['角色设定', '游戏角色', '动漫角色', 'OC', '立绘'],
    dimensions: ['角色轮廓可识别', '服装和身份一致', '比例稳定', '配色有记忆点', '设定细节服务故事'],
    positiveFragments: ['干净线条', '清晰角色轮廓', '服装细节有设定感', '统一配色方案', '角色辨识度强', '适合游戏或动画设定'],
    negativeFragments: ['肢体错误', '比例漂移', '服装逻辑混乱', '背景抢主体', '面部崩坏', '三视图不一致'],
    examples: ['赛博忍者少女三视图', '游戏角色宣传图', 'Q版头像'],
  },
  {
    id: 'rule-ui-screenshot-realism',
    type: 'rule',
    name: 'UI 截图真实感规则',
    description: '用于 App 首页、SaaS 官网、社交主页和直播间截图的可用界面感。',
    appliesTo: ['ui-screenshot'],
    tags: ['UI', 'App', '官网', 'SaaS', '截图', '界面', '组件', '移动端'],
    aliases: ['App界面', '网页首屏', 'SaaS落地页', '移动端截图'],
    dimensions: ['信息架构清晰', '组件比例可信', '文字区域可读', '交互层级真实', '设备比例合理'],
    positiveFragments: ['真实可用的 UI 组件', '清晰信息层级', '现代产品界面', '一致的组件间距', '高保真截图感', '按钮和卡片层级明确'],
    negativeFragments: ['UI 错位', '组件不可读', '文字乱码', '信息过密', '真实平台商标', '低清晰度'],
    examples: ['健身 App 首页', 'SaaS 官网首屏', '直播间 UI 截图'],
  },
  {
    id: 'rule-infographic-clarity',
    type: 'rule',
    name: '信息图清晰度规则',
    description: '用于时间线、流程图、对比卡片和科普百科信息图的信息层级控制。',
    appliesTo: ['infographic'],
    tags: ['信息图', '科普', '流程', '时间线', '对比', '卡片', '知识', '图标'],
    aliases: ['流程图', '时间线', '知识卡片', '对比图', '科普图'],
    dimensions: ['标题明确', '节点顺序正确', '图标风格统一', '短句说明', '适合收藏转发'],
    positiveFragments: ['清晰中文信息层级', '统一图标系统', '模块化卡片布局', '节点关系明确', '重点突出', '适合社交媒体保存'],
    negativeFragments: ['文字太小', '信息过载', '节点顺序混乱', '图标杂乱', '错别字', '低清晰度'],
    examples: ['AI 生图流程图', '产品对比信息卡', '旅行时间线'],
  },
  {
    id: 'rule-scene-environment-design',
    type: 'rule',
    name: '空间场景设计规则',
    description: '用于室内空间、建筑外观、食品场景和环境概念图的空间可信度。',
    appliesTo: ['scene'],
    tags: ['场景', '空间', '室内', '建筑', '环境', '美食', '真实感', '效果图'],
    aliases: ['室内设计', '建筑外观', '环境设计', '场景图'],
    dimensions: ['空间尺度合理', '材质和光线统一', '透视可信', '功能区域清楚', '氛围服务主题'],
    positiveFragments: ['真实空间尺度', '自然环境光', '材质统一', '透视合理', '空间层次清晰', '氛围完整'],
    negativeFragments: ['比例错误', '家具漂浮', '透视畸变', '材质混乱', '结构不合理', '低清晰度'],
    examples: ['小户型客厅设计', '咖啡店室内效果图', '建筑外观概念图'],
  },
  {
    id: 'rule-food-drink-photography',
    type: 'rule',
    name: '食品饮品摄影规则',
    description: '用于美食摆盘、饮品海报、菜单图、餐饮社媒和商业食物摄影的食欲感与新鲜度控制。',
    appliesTo: ['product', 'scene', 'poster'],
    tags: ['美食', '食物', '饮品', '茶饮', '咖啡', '甜品', '餐饮', '菜单', 'food', 'drink', 'plating'],
    aliases: ['美食摄影', '饮品摄影', '茶饮摄影', '菜品拍摄', '餐饮拍摄', 'food photography'],
    dimensions: ['主体新鲜诱人', '摆盘和配角服务主菜', '蒸汽/冷凝/高光可信', '餐具背景不抢主体', '色泽与质地真实'],
    positiveFragments: ['食欲感强', '新鲜质地清晰', '自然食物高光', '摆盘精致', '餐饮商业摄影质感', '背景和道具克制服务主体'],
    negativeFragments: ['食物塌陷', '颜色发灰', '摆盘凌乱', '油腻脏污', '餐具比例错误', '低清晰度'],
    examples: ['精品咖啡海报', '甜品社媒封面', '餐厅菜单主视觉'],
    outputProfileIds: ['universal-zh', 'dalle-natural-zh', 'flux-descriptive-en', 'domestic-zh-concise'],
  },
  {
    id: 'rule-architecture-interior-visualization',
    type: 'rule',
    name: '建筑室内可视化规则',
    description: '用于室内设计、建筑空间、展厅、办公室和零售场景的空间可信度与材质表达。',
    appliesTo: ['scene'],
    tags: ['室内', '建筑', '空间', '家居', '办公室', '展厅', '零售', 'architecture', 'interior', 'render'],
    aliases: ['建筑可视化', '室内效果图', '空间设计', 'interior render', 'architecture visualization'],
    dimensions: ['透视和垂直线可信', '空间尺度合理', '材质统一', '动线清楚', '自然光与人工光逻辑完整'],
    positiveFragments: ['真实空间尺度', '垂直线控制准确', '材质细节统一', '自然采光与环境光协调', '空间层次清晰', '建筑摄影级构图'],
    negativeFragments: ['透视畸变', '尺度错误', '家具漂浮', '材质混乱', '灯光逻辑错误', '低清晰度'],
    examples: ['精品咖啡店空间图', 'SaaS 办公室效果图', '家居样板间渲染'],
    outputProfileIds: ['universal-zh', 'dalle-natural-zh', 'flux-descriptive-en'],
  },
  {
    id: 'rule-fashion-styling-direction',
    type: 'rule',
    name: '时尚穿搭造型规则',
    description: '用于穿搭封面、时尚大片、lookbook、模特街拍和服饰内容的造型完整性与服装表达。',
    appliesTo: ['portrait', 'poster'],
    tags: ['穿搭', '时尚', '服装', '模特', 'lookbook', '街拍', 'style', 'fashion', 'editorial'],
    aliases: ['穿搭图', '时尚大片', '服装拍摄', 'lookbook', 'fashion styling'],
    dimensions: ['服装轮廓清晰', '搭配逻辑成立', '姿态自然有张力', '材质层次可辨', '背景不削弱造型主体'],
    positiveFragments: ['服装廓形明确', '层次搭配清楚', '时尚编辑感', '姿态自然有张力', '面料质感清晰', '整体造型统一'],
    negativeFragments: ['服装变形', '搭配冲突', '姿态僵硬', '面料糊成一片', '配饰杂乱', '低清晰度'],
    examples: ['小红书穿搭封面', '品牌 lookbook', '街拍时尚大片'],
    outputProfileIds: ['universal-zh', 'dalle-natural-zh', 'flux-descriptive-en', 'domestic-zh-concise'],
  },
  {
    id: 'rule-tech-product-render',
    type: 'rule',
    name: '科技产品渲染规则',
    description: '用于耳机、手机、机器人、智能硬件和 3C 产品的工业设计表达、材质高光和科技感控制。',
    appliesTo: ['product', 'poster'],
    tags: ['科技产品', '硬件', '耳机', '手机', '机器人', '3C', '设备', 'render', '爆炸图', 'tech'],
    aliases: ['产品渲染', '科技渲染', '硬件海报', 'tech render', 'product render'],
    dimensions: ['结构比例可信', '金属玻璃塑料材质清楚', '边缘高光精致', '主辅视角服务卖点', '科技感统一'],
    positiveFragments: ['工业设计比例准确', '边缘高光精致', '金属玻璃材质真实', '科技产品展示台感', '体积光和轮廓光清楚', '高端商业渲染完成度'],
    negativeFragments: ['结构变形', '材质廉价', '反光杂乱', '零件关系错误', '科技感不统一', '低清晰度'],
    examples: ['耳机产品海报', '手机爆炸图', '机器人产品展示'],
    outputProfileIds: ['universal-zh', 'flux-descriptive-en', 'midjourney-style', 'stable-diffusion-style'],
  },
  {
    id: 'rule-game-ui-screenshot',
    type: 'rule',
    name: '游戏界面截图规则',
    description: '用于 HUD、背包、商店、战斗通行证和活动页等游戏 UI 的层级、可读性和世界观一致性。',
    appliesTo: ['ui-screenshot'],
    tags: ['游戏界面', 'HUD', '背包', '商店', '任务面板', 'battle pass', 'game ui', 'ui screenshot'],
    aliases: ['游戏 UI', '游戏截图', 'HUD 界面', '游戏商店', 'game screenshot'],
    dimensions: ['信息层级清晰', '按钮和数值区可读', '图标系统一致', '界面风格服务世界观', '主交互焦点明确'],
    positiveFragments: ['HUD 层级明确', '按钮和数值区清晰', '图标系统统一', '世界观一致的界面语言', '高保真游戏截图感', '活动入口和奖励层级清楚'],
    negativeFragments: ['UI 挤压错位', '图标风格混乱', '文字难读', '功能层级不清', '真实品牌商标', '低清晰度'],
    examples: ['科幻游戏主界面', '手游商城活动页', '战斗通行证截图'],
    outputProfileIds: ['universal-zh', 'stable-diffusion-style', 'domestic-zh-concise'],
  },
  {
    id: 'quality-text-control',
    type: 'quality',
    name: '画面文字控制规则',
    description: '用于所有需要中文标题、少量标签或界面文字的场景，降低文字错误风险。',
    appliesTo: ['poster', 'product', 'ui-screenshot', 'infographic', 'other'],
    tags: ['文字', '标题', '中文', '排版', '标签', '信息层级', '可读性'],
    aliases: ['文字控制', '少文字', '标题清晰', '避免乱码'],
    dimensions: ['文字数量受控', '短句优先', '标题区明确', '避免长段落', '重要文字可后期编辑'],
    positiveFragments: ['少量清晰中文标题占位', '文字区域留白充足', '短标题', '图文层级明确', '可后期替换的文字区'],
    negativeFragments: ['大段文字', '错别字', '文字乱码', '标题不可读', '字体混乱', '文字遮挡主体'],
    examples: ['海报标题', '详情页卖点', '信息图节点文字'],
  },
  {
    id: 'quality-negative-foundation',
    type: 'quality',
    name: '通用负面质量规则',
    description: '用于多数图像提示词的基础质量与失败模式控制。',
    appliesTo: ['poster', 'portrait', 'anime', 'product', 'ui-screenshot', 'infographic', 'scene', 'other'],
    tags: ['负面词', '质量', '高清', '避免错误', '通用', '约束'],
    aliases: ['通用负面词', '质量控制', '基础负面约束'],
    dimensions: ['主体清晰', '结构可信', '无明显伪影', '风格一致', '避免低质量输出'],
    positiveFragments: ['高清细节', '主体明确', '构图稳定', '风格一致', '专业完成度', '干净边缘'],
    negativeFragments: ['低清晰度', '模糊', '结构错误', '多余肢体', '变形', '水印', '乱码文字', '噪点', '过度锐化'],
    examples: ['通用质量增强', '负面提示词补全', '最终 prompt 收尾约束'],
  },
  {
    id: 'rule-brand-identity-system',
    type: 'rule',
    name: '品牌视觉识别规则',
    description: '用于 Logo、品牌情绪板、包装标签、吉祥物和图标设计的识别一致性。',
    appliesTo: ['other', 'product', 'poster'],
    tags: ['品牌', 'Logo', '情绪板', '包装', '图标', '吉祥物', '识别系统'],
    aliases: ['品牌视觉', '品牌设计', 'Logo设计', 'VI', 'IP形象'],
    dimensions: ['核心符号清晰', '色彩系统统一', '可延展到多物料', '小尺寸可识别', '避免侵权相似'],
    positiveFragments: ['统一品牌视觉语言', '清晰核心符号', '可延展图形系统', '有限主色方案', '专业提案板', '小尺寸可识别'],
    negativeFragments: ['真实品牌侵权', '图形过度复杂', '识别度低', '文字乱码', '风格不统一', '廉价模板感'],
    examples: ['Logo 概念提案', '品牌视觉情绪板', 'App 图标设计'],
  },
]

export const PROMPT_INTENT_MAPPINGS: PromptIntentMapping[] = [
  { id: 'intent-premium', phrases: ['高级感', '高端', '精致', '奢华', '质感', 'premium'], categories: ['poster', 'product', 'portrait', 'other'], ruleIds: ['rule-premium-poster-layout', 'rule-commercial-product-photo', 'rule-brand-identity-system'], styleHints: ['高级', '商业', '极简', '电影感'], outputProfileId: 'universal-zh' },
  { id: 'intent-product-main-image', phrases: ['主图', '白底图', '商品图', '电商图', '产品摄影', '棚拍'], categories: ['product'], ruleIds: ['rule-commercial-product-photo', 'quality-negative-foundation'], styleHints: ['写实', '商业摄影'], outputProfileId: 'universal-zh' },
  { id: 'intent-social-seeding', phrases: ['种草', '小红书', '封面', '笔记', '点击率', '直播'], categories: ['poster'], ruleIds: ['rule-social-cover-clickability', 'rule-premium-poster-layout', 'quality-text-control'], styleHints: ['生活方式', '清爽'], outputProfileId: 'universal-zh' },
  { id: 'intent-avatar-portrait', phrases: ['头像', '职业照', '证件照', '人像', '写真', '形象照'], categories: ['portrait'], ruleIds: ['rule-professional-portrait-photo', 'quality-negative-foundation'], styleHints: ['写实', '摄影'], outputProfileId: 'universal-zh' },
  { id: 'intent-anime-character', phrases: ['二次元', '角色设定', '立绘', '卡牌', 'Q版', '游戏角色', '动漫'], categories: ['anime'], ruleIds: ['rule-anime-character-design', 'quality-negative-foundation'], styleHints: ['动漫', '游戏'], outputProfileId: 'universal-zh' },
  { id: 'intent-ui-product', phrases: ['UI', 'App', '首页', '官网', 'SaaS', '界面', '截图'], categories: ['ui-screenshot'], ruleIds: ['rule-ui-screenshot-realism', 'quality-text-control'], styleHints: ['扁平', '现代'], outputProfileId: 'universal-zh' },
  { id: 'intent-infographic', phrases: ['信息图', '流程图', '时间线', '对比', '科普', '知识卡片'], categories: ['infographic'], ruleIds: ['rule-infographic-clarity', 'quality-text-control'], styleHints: ['扁平', '图标'], outputProfileId: 'universal-zh' },
  { id: 'intent-scene-space', phrases: ['室内', '空间', '建筑', '场景', '环境', '效果图', '美食'], categories: ['scene'], ruleIds: ['rule-scene-environment-design', 'quality-negative-foundation'], styleHints: ['写实', '摄影'], outputProfileId: 'universal-zh' },
  { id: 'intent-brand-system', phrases: ['品牌', 'Logo', '图标', '包装', '标签', '吉祥物', '情绪板'], categories: ['other', 'product'], ruleIds: ['rule-brand-identity-system', 'quality-text-control'], styleHints: ['商业设计', '扁平'], outputProfileId: 'universal-zh' },
  { id: 'intent-ecommerce-detail-page', phrases: ['详情页', '商品详情', '淘宝详情', '天猫详情', '京东详情', '卖点图', 'product page', 'detail page'], categories: ['product', 'poster'], ruleIds: ['rule-commercial-product-photo', 'quality-text-control'], styleHints: ['商业摄影', '电商'], outputProfileId: 'universal-zh' },
  { id: 'intent-food-photography', phrases: ['美食摄影', '食物摄影', '饮品摄影', '茶饮海报', '茶饮摄影', '菜品拍摄', '餐饮出片', '菜单图', 'food photography', 'drink photo'], categories: ['product', 'scene', 'poster'], ruleIds: ['rule-food-drink-photography', 'quality-negative-foundation'], styleHints: ['写实', '摄影', '食欲感'], outputProfileId: 'universal-zh' },
  { id: 'intent-architecture-interior', phrases: ['室内设计', '建筑空间', '空间效果图', '家居空间', '展厅设计', '办公室效果图', 'interior design', 'architecture visualization'], categories: ['scene'], ruleIds: ['rule-architecture-interior-visualization', 'quality-negative-foundation'], styleHints: ['写实', '建筑可视化'], outputProfileId: 'universal-zh' },
  { id: 'intent-fashion-styling', phrases: ['穿搭', '时尚穿搭', 'lookbook', '模特街拍', '时尚大片', '服装拍摄', 'fashion styling', 'editorial look'], categories: ['portrait', 'poster'], ruleIds: ['rule-fashion-styling-direction', 'quality-negative-foundation'], styleHints: ['时尚', '编辑感'], outputProfileId: 'universal-zh' },
  { id: 'intent-xiaohongshu-fashion-cover', phrases: ['小红书穿搭', '穿搭封面', 'ootd封面', '种草穿搭', 'lookbook封面'], categories: ['poster', 'portrait'], ruleIds: ['rule-social-cover-clickability', 'rule-fashion-styling-direction', 'quality-text-control'], styleHints: ['时尚', '生活方式'], outputProfileId: 'universal-zh' },
  { id: 'intent-tech-product-render', phrases: ['科技产品', '硬件海报', '产品渲染', '耳机渲染', '手机渲染', '产品爆炸图', 'tech render', 'product render'], categories: ['product', 'poster'], ruleIds: ['rule-tech-product-render', 'quality-negative-foundation'], styleHints: ['科技感', '3d', '商业摄影'], outputProfileId: 'universal-zh' },
  { id: 'intent-game-ui', phrases: ['游戏界面', '游戏UI', 'HUD', '游戏截图', '商店界面', '背包界面', 'battle pass', 'game ui'], categories: ['ui-screenshot'], ruleIds: ['rule-game-ui-screenshot', 'quality-text-control'], styleHints: ['游戏', '科技感'], outputProfileId: 'universal-zh' },
  { id: 'intent-dashboard-screenshot', phrases: ['数据看板', 'dashboard', '管理台', '后台界面', 'BI看板', 'analytics dashboard'], categories: ['ui-screenshot'], ruleIds: ['rule-ui-screenshot-realism', 'quality-text-control'], styleHints: ['数据可视化', '现代'], outputProfileId: 'universal-zh' },
  { id: 'intent-dalle-output', phrases: ['DALL-E', 'dalle', 'OpenAI image', 'gpt image'], categories: ['poster', 'portrait', 'anime', 'product', 'ui-screenshot', 'infographic', 'scene', 'other'], ruleIds: ['quality-negative-foundation'], styleHints: ['自然语言'], outputProfileId: 'dalle-natural-zh' },
  { id: 'intent-flux-output', phrases: ['Flux', 'flux', 'Black Forest Labs'], categories: ['poster', 'portrait', 'anime', 'product', 'ui-screenshot', 'infographic', 'scene', 'other'], ruleIds: ['quality-negative-foundation'], styleHints: ['写实', '材质'], outputProfileId: 'flux-descriptive-en' },
  { id: 'intent-domestic-model-output', phrases: ['即梦', '可灵', '通义万相', '豆包', '国产模型', '中文模型'], categories: ['poster', 'portrait', 'anime', 'product', 'ui-screenshot', 'infographic', 'scene', 'other'], ruleIds: ['quality-negative-foundation'], styleHints: ['中文短句'], outputProfileId: 'domestic-zh-concise' },
  { id: 'intent-english-output', phrases: ['英文', 'english', 'English prompt', 'MJ', 'Midjourney', 'SD', 'Stable Diffusion'], categories: ['poster', 'portrait', 'anime', 'product', 'ui-screenshot', 'infographic', 'scene', 'other'], ruleIds: ['quality-negative-foundation'], styleHints: [], outputProfileId: 'universal-en' },
]

function unique(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)))
}

function uniqueCategories(items: Array<PromptTemplateCategory | undefined>): PromptTemplateCategory[] {
  return Array.from(new Set(items.filter(Boolean) as PromptTemplateCategory[]))
}

function scoreFields(fields: string[], keywords: string[], weight = 1): { score: number; matched: string[] } {
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
  return { score, matched: unique(matched) }
}

function intentFields(intent: PromptIntentMapping): string[] {
  return [intent.id, ...intent.phrases, ...intent.categories, ...intent.ruleIds, ...intent.styleHints, intent.outputProfileId ?? '']
}

function ruleFields(rule: PromptKnowledgeRule): string[] {
  return [
    rule.id,
    rule.name,
    rule.description,
    rule.type,
    ...rule.appliesTo,
    ...rule.tags,
    ...rule.aliases,
    ...rule.dimensions,
    ...rule.positiveFragments,
    ...rule.negativeFragments,
    ...rule.examples,
    ...(rule.outputProfileIds ?? []),
  ]
}

function selectOutputProfile(query: string, intents: RankedResult<PromptIntentMapping>[], requestedId?: string): PromptOutputProfile {
  const queryLower = query.toLowerCase()
  const preferredIntentProfile = intents.find((entry) => entry.item.outputProfileId && !['universal-zh', 'universal-en'].includes(entry.item.outputProfileId))?.item.outputProfileId
    ?? intents.find((entry) => entry.item.outputProfileId)?.item.outputProfileId
  const inferredId = requestedId
    ?? (queryLower.includes('dall-e') || queryLower.includes('dalle') || queryLower.includes('openai image') || queryLower.includes('gpt image') ? 'dalle-natural-zh' : undefined)
    ?? (queryLower.includes('flux') ? 'flux-descriptive-en' : undefined)
    ?? (queryLower.includes('即梦') || queryLower.includes('可灵') || queryLower.includes('通义万相') || queryLower.includes('豆包') || queryLower.includes('国产模型') || queryLower.includes('中文模型') ? 'domestic-zh-concise' : undefined)
    ?? (queryLower.includes('midjourney') || queryLower.includes('mj') ? 'midjourney-style' : undefined)
    ?? (queryLower.includes('stable diffusion') || queryLower.includes('sd') ? 'stable-diffusion-style' : undefined)
    ?? (queryLower.includes('english') || queryLower.includes('英文') ? 'universal-en' : undefined)
    ?? preferredIntentProfile
    ?? 'universal-zh'
  return PROMPT_OUTPUT_PROFILES.find((profile) => profile.id === inferredId) ?? PROMPT_OUTPUT_PROFILES[0]
}

export function searchPromptIntents(query: string, limit = 5): RankedResult<PromptIntentMapping>[] {
  const keywords = extractSearchKeywords(query)
  if (!query.trim() || keywords.length < 1) return []
  return PROMPT_INTENT_MAPPINGS.map((intent) => {
    const result = scoreFields(intentFields(intent), keywords, 4)
    return { item: intent, score: result.score, matchedKeywords: result.matched }
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function searchPromptKnowledge(query: string, options: PromptKnowledgeSearchOptions = {}): PromptKnowledgeContext {
  const keywords = extractSearchKeywords(query)
  const intents = searchPromptIntents(query, 5)
  const visualIntent = options.visualIntent
  const categoryHints = uniqueCategories([
    options.category,
    visualIntent?.category,
    ...intents.flatMap((entry) => entry.item.categories),
    ...(options.templates ?? []).map((template) => template.category),
  ])
  const intentRuleHints = new Set(intents.flatMap((entry) => entry.item.ruleIds))
  const intentOutputProfileHints = new Set(intents.map((entry) => entry.item.outputProfileId).filter(Boolean))
  const templateText = (options.templates ?? []).flatMap((template) => [template.id, template.name, template.description, ...template.tags, ...template.examples])
  const styleText = (options.styles ?? []).flatMap((style) => [style.id, style.name, style.englishKeyword, style.description, ...style.tags, ...style.aliases, ...Object.values(style.visualTraits).filter(Boolean)])
  const scenarioText = (options.templates ?? []).flatMap((template) => [template.scenario ?? '', template.scenarioLabel ?? '', ...(template.scenarioAliases ?? [])])
  const visualIntentText = visualIntent ? [
    visualIntent.subject,
    visualIntent.scenario,
    visualIntent.scenarioLabel,
    visualIntent.purpose,
    visualIntent.platform,
    visualIntent.mood,
    visualIntent.palette,
    visualIntent.aspectRatio,
    visualIntent.realism,
    visualIntent.text.density,
    ...visualIntent.styleHints,
    ...visualIntent.constraints,
    ...visualIntent.negativeHints,
  ].filter(Boolean).join(' ') : ''
  const enrichedQuery = [query, visualIntentText, ...templateText, ...styleText, ...scenarioText, ...categoryHints].join(' ')
  const enrichedKeywords = unique([...keywords, ...extractSearchKeywords(enrichedQuery)])
  const limit = options.limit ?? 5
  const outputProfile = selectOutputProfile(query, intents, options.outputProfileId)
  const rules = PROMPT_KNOWLEDGE_RULES.map((rule) => {
    const result = scoreFields(ruleFields(rule), enrichedKeywords, 2)
    const categoryBonus = categoryHints.some((category) => rule.appliesTo.includes(category)) ? 5 : 0
    const intentBonus = intentRuleHints.has(rule.id) ? 8 : 0
    const visualIntentBonus = visualIntent && ruleFields(rule).join(' ').toLowerCase().includes([visualIntent.purpose, visualIntent.platform, visualIntent.text.density, visualIntent.scenarioLabel].filter(Boolean).join(' ').toLowerCase()) ? 3 : 0
    const generalBonus = rule.type === 'quality' && categoryHints.length ? 1 : 0
    const profileBonus = rule.outputProfileIds?.includes(outputProfile.id) || rule.outputProfileIds?.some((id) => intentOutputProfileHints.has(id)) ? 4 : 0
    return {
      item: rule,
      score: result.score + categoryBonus + intentBonus + visualIntentBonus + generalBonus + profileBonus,
      matchedKeywords: unique([...result.matched, ...categoryHints.filter((category) => rule.appliesTo.includes(category))]),
    }
  })
    .filter((entry) => entry.score >= 4 || intentRuleHints.has(entry.item.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return {
    rules,
    intents,
    outputProfile,
  }
}
