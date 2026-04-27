# ImagePrompt Lab 数据集与 AI 工作原理分析

> 分析日期：2026-04-27

---

## 一、系统数据集总览

### 三层数据架构

| 文件 | 行数 | 用途 |
|------|------|------|
| `src/data/promptPresets.ts` | 205 | 轻量扁平风格/模板预设，社交媒体采集 |
| `src/data/structuredPrompts.ts` | 动态增长 | 结构化模板（带插槽、治理）、主轨道场景模板、双轨模板治理、风格封装、意图提取/推荐/校验引擎 |
| `src/data/promptKnowledge.ts` | 390 | 专业知识规则、意图映射、输出配置 |

### 各数据集详细

| 数据集 | 数量 | 说明 |
|--------|------|------|
| 风格预设 (StylePreset) | 50 | 像素艺术→水墨，赛博朋克→浮世绘，覆盖面广 |
| 扁平模板 (TemplatePreset) | 72 | 社交媒体采集，分类见下 |
| 结构化风格 | 50 | 将扁平风格封装为结构化格式，附加分类/标签/视觉特征 |
| 结构化官方模板 | 57 | 主轨道基础模板：带插槽机制、治理信息，支持大类级模板匹配 |
| 主轨道场景模板 | 11 | 主轨道细分模板：覆盖品牌主视觉、电商促销、活动发布、社媒封面、SaaS 首屏、数据看板、食品饮品摄影、科技产品渲染、包装展示、室内建筑空间、流程解释图 |
| 遗留参考模板 | 72 | 参考轨道模板：来自扁平采集数据，仅用于提取参考灵感，不再作为可直接选择模板暴露 |
| 知识规则 | 11 | 覆盖商业摄影、海报版式、社媒封面、人像、二次元、UI截图、信息图、场景、文字控制、负面质量、品牌VI |
| 意图映射 | 10 | 短语→分类→规则关联 |
| 输出配置 | 4 | 通用中文、通用英文、Midjourney 风格、Stable Diffusion 风格 |

### 扁平模板分类分布

| 分类 | 数量 |
|------|------|
| 综合案例 | 42 |
| UI / 截图 | 14 |
| 海报 / 广告 | 9 |
| 人像 / 摄影 | 6 |
| 产品 / 物体 | 1 |

### 结构化基础模板分类分布

| 分类 | 数量 |
|------|------|
| poster | 10 |
| other | 7 |
| infographic | 7 |
| product | 7 |
| ui-screenshot | 7 |
| scene | 7 |
| portrait | 6 |
| anime | 6 |

---

## 二、AI 工作原理

### 整体流程

```
用户输入
   │
   ▼
┌─────────────────────────────────────────────────────┐
│  ① 本地检索 (前端执行，不调用 AI)                      │
│                                                     │
│  extractVisualIntent()    → 意图解析                  │
│  getPromptRecommendations() → 主轨道模板+风格组合推荐    │
│  searchStructuredStyles() → 关键词匹配打分+分类适配     │
│  searchStructuredTemplates() → 主轨道模板检索            │
│  searchLegacyReferenceInsights() → 遗留参考灵感提取      │
│  searchPromptKnowledge() → 专业知识规则匹配             │
│  buildStrategyChains() → 策略链/关键词包组装              │
│                                                     │
│  所有结果打包为 PresetContext                           │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  ② 构建 System Prompt                                │
│                                                     │
│  把 PresetContext 注入给 AI 作为：                      │
│  - 角色设定（视觉总监/美术指导/提示词工程师）              │
│  - 结构化视觉意图 JSON                                 │
│  - 本地知识链（策略链+风格+知识规则+参考灵感）             │
│  - 输出格式要求（JSON + Markdown + Final Prompt）       │
│  - preset-only 约束开关                                │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  ③ 调用 Chat API (OpenAI 兼容接口)                     │
│                                                     │
│  POST /chat/completions                              │
│  { model, messages: [system + history], stream }     │
│                                                     │
│  支持流式 (SSE) 和非流式两种模式                        │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  ④ 前端解析 AI 回复                                    │
│                                                     │
│  parseAssistantComposition()  → 提取 JSON 结构          │
│  validateAssistantComposition() → 校验 ID 有效性       │
│  extractAssistantFinalPrompt() → 提取最终提示词         │
│                                                     │
│  展示：策略链卡片 + 关键词包 + 专业规则 + 参考灵感 + 最终提示词 │
└─────────────────────────────────────────────────────┘
```

### 核心设计理念

AI 不直接生成图片，而是作为**提示词顾问**——先由前端做本地知识检索，把候选风格、主轨道结构模板、知识规则和参考轨道灵感组装成“本地知识链 / 策略链”，再由 AI 分析、组合、输出最终 prompt。用户界面不再暴露原始固定模板下拉选择，而是展示结构策略、视觉语言、关键词包、专业规则和参考灵感；用户手动决定是否将结果应用到主输入栏。

### 双轨模式

```
主轨道（可直接参与推荐）
  57 个结构化基础模板 + 11 个场景级主轨道模板
  ├─ 带插槽、分类、输出提示、负面提示
  ├─ sourceRole = primary
  └─ 用于生成“类别 → 场景 → 结构策略 → 关键词包”的策略链

参考轨道（只做灵感，不直接套用）
  72 个社媒采集扁平模板
  ├─ sourceRole = reference
  ├─ 过滤 isPlaceholderOnly / low quality / inactive
  └─ 提取 traits、keywords、strengths、risks 作为参考灵感
```

### 关键函数链路

| 步骤 | 函数 | 文件 |
|------|------|------|
| 意图解析 | `extractVisualIntent(query)` | `structuredPrompts.ts` |
| 推荐组合 | `getPromptRecommendations(query, 3, intent)` | `structuredPrompts.ts` |
| 风格搜索 | `searchStructuredStyles(query, category, intent)` | `structuredPrompts.ts` |
| 主轨道模板搜索 | `searchStructuredTemplates(query, category, intent)` | `structuredPrompts.ts` |
| 主轨道集合 | `getMainTrackTemplates()` | `structuredPrompts.ts` |
| 参考轨道集合 | `getLegacyReferenceTemplates()` | `structuredPrompts.ts` |
| 参考灵感搜索 | `searchLegacyReferenceInsights(query, category, intent)` | `structuredPrompts.ts` |
| 知识搜索 | `searchPromptKnowledge(query, options)` | `promptKnowledge.ts` |
| 策略链构建 | `buildStrategyChains(recommendations, references, knowledge, visualIntent)` | `chatApi.ts` |
| 上下文构建 | `buildPresetContext(query, presetOnly)` | `chatApi.ts` |
| System Prompt | `buildSystemPrompt(presetContext)` | `chatApi.ts` |
| API 调用 | `callPromptAgent(settings, messages, ...)` | `chatApi.ts` |
| 回复解析 | `parseAssistantComposition(content)` | `structuredPrompts.ts` |

---

## 三、数据集评估

### 优势

- **风格覆盖面广**：50 种风格从经典（油画/水墨）到现代（霓虹/赛博/全息），能满足大多数场景
- **知识规则体系完整**：覆盖了摄影、海报、UI、二次元、信息图等主要方向
- **输出配置分层**：中英文、MJ/SD 不同输出格式都有指导
- **本地检索不依赖 AI**：意图解析、关键词匹配、推荐打分全部在前端完成，AI 仅做"顾问"角色
- **双轨治理降低模板风险**：主轨道只使用结构化官方模板；质量参差的社媒采集模板降级为参考轨道，只提取灵感和关键词
- **主轨道已有场景深度**：在 57 个基础模板上新增 11 个细分场景模板，让电商促销、SaaS 首屏、数据看板、食品摄影、室内空间等高频需求可直接进入场景策略链
- **界面表达更接近知识链**：Prompt Agent 不再展示原始模板下拉列表，而是展示结构策略、视觉语言、关键词包、专业规则和参考灵感

### 薄弱点

| 问题 | 详情 |
|------|------|
| **扁平模板质量参差** | 72 个中 42 个标记为"综合案例"，其中 11 个标记为占位符 (isPlaceholderOnly)。当前已降级为参考轨道，不再直接参与主推荐 |
| **结构化主轨道模板仍有扩展空间** | 当前主轨道由 57 个基础模板和 11 个场景模板组成，已覆盖核心类别与一批高频商业场景；后续仍可继续补充电影海报、更多活动海报、行业落地页、游戏界面等细分模板 |
| **知识规则仅 11 条** | 缺少"食物摄影"、"建筑空间"、"时尚穿搭"、"科技产品"、"游戏界面"等常见垂直领域的规则 |
| **意图映射只有 10 个** | 意图识别粒度偏粗，很多用户输入可能匹配不到合适的意图 |
| **输出配置只有 4 个** | 缺少 DALL-E、Flux、国产模型等专属输出配置 |
| **数据源偏向** | 参考轨道模板主要从 Twitter/X 采集，来源单一，语言分布不均（含日语占位符/低价值内容） |
| **英文风格 promptFragment 质量一般** | 如 `"Use Pixel Art style: Retro game aesthetic."` 过于简略 |

### 建议补充方向

1. **扩充知识规则**：增加 food-photography、architecture-interior、fashion、tech-product、game-UI 等领域规则
2. **继续补充结构化主轨道模板**：在现有 11 个场景模板基础上，继续扩展行业化和平台化场景
3. **丰富意图映射**：增加更多中文口语化短语，提升匹配率
4. **添加 DALL-E / Flux 输出配置**：目前只有 MJ 和 SD 的
5. **继续治理参考轨道**：72 个扁平模板中有 11 个无效占位符，当前已过滤；后续可补充质量标签、来源可信度和可复用片段提取规则
6. **完善风格 promptFragment**：提供更细化的中英双语提示词片段，而非简单的一句话描述
