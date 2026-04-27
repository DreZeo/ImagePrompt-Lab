# ImagePrompt Lab 数据集与 AI 工作原理分析

> 分析日期：2026-04-27

---

## 一、系统数据集总览

### 三层数据架构

| 文件 | 行数 | 用途 |
|------|------|------|
| `src/data/promptPresets.ts` | 205 | 轻量扁平风格/模板预设，社交媒体采集 |
| `src/data/structuredPrompts.ts` | 1731 | 结构化模板（带插槽、治理）、风格封装、意图提取/推荐/校验引擎 |
| `src/data/promptKnowledge.ts` | 390 | 专业知识规则、意图映射、输出配置 |

### 各数据集详细

| 数据集 | 数量 | 说明 |
|--------|------|------|
| 风格预设 (StylePreset) | 50 | 像素艺术→水墨，赛博朋克→浮世绘，覆盖面广 |
| 扁平模板 (TemplatePreset) | 72 | 社交媒体采集，分类见下 |
| 结构化风格 | 50 | 将扁平风格封装为结构化格式，附加分类/标签/视觉特征 |
| 结构化官方模板 | 57 | 带插槽机制、治理信息，支持更精确的模板匹配 |
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

### 结构化模板分类分布

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
| photographic | 1 |

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
│  getPromptRecommendations() → 最佳模板+风格组合推荐     │
│  searchStructuredStyles() → 关键词匹配打分+分类适配     │
│  searchStructuredTemplates() → 模板检索               │
│  searchPromptKnowledge() → 专业知识规则匹配             │
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
│  - 本地推荐列表（模板+风格+知识规则）                     │
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
│  展示：推荐摘要 + Markdown + 推荐卡片 + 最终提示词         │
└─────────────────────────────────────────────────────┘
```

### 核心设计理念

AI 不直接生成图片，而是作为**提示词顾问**——先由前端做本地知识检索，把候选风格/模板/规则注入 system prompt，再由 AI 分析、组合、输出最终 prompt。用户手动决定是否将结果应用到主输入栏。

### 关键函数链路

| 步骤 | 函数 | 文件 |
|------|------|------|
| 意图解析 | `extractVisualIntent(query)` | `structuredPrompts.ts` |
| 推荐组合 | `getPromptRecommendations(query, 3, intent)` | `structuredPrompts.ts` |
| 风格搜索 | `searchStructuredStyles(query, category, intent)` | `structuredPrompts.ts` |
| 模板搜索 | `searchStructuredTemplates(query, category, intent)` | `structuredPrompts.ts` |
| 知识搜索 | `searchPromptKnowledge(query, options)` | `promptKnowledge.ts` |
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

### 薄弱点

| 问题 | 详情 |
|------|------|
| **扁平模板质量参差** | 72 个中 42 个标记为"综合案例"，其中 11 个标记为占位符 (isPlaceholderOnly)，实际有价值的模板约 25-30 个 |
| **结构化模板仅 57 个** | 覆盖面足够但深度不足，例如 poster 只有 10 个，缺乏更多细分（电影海报/活动海报/品牌海报） |
| **知识规则仅 11 条** | 缺少"食物摄影"、"建筑空间"、"时尚穿搭"、"科技产品"、"游戏界面"等常见垂直领域的规则 |
| **意图映射只有 10 个** | 意图识别粒度偏粗，很多用户输入可能匹配不到合适的意图 |
| **输出配置只有 4 个** | 缺少 DALL-E、Flux、国产模型等专属输出配置 |
| **数据源偏向** | 模板主要从 Twitter/X 采集，来源单一，语言分布不均（大量日语占位符） |
| **英文风格 promptFragment 质量一般** | 如 `"Use Pixel Art style: Retro game aesthetic."` 过于简略 |

### 建议补充方向

1. **扩充知识规则**：增加 food-photography、architecture-interior、fashion、tech-product、game-UI 等领域规则
2. **补充结构化模板**：特别是商业场景（电商、品牌海报、B端产品图）
3. **丰富意图映射**：增加更多中文口语化短语，提升匹配率
4. **添加 DALL-E / Flux 输出配置**：目前只有 MJ 和 SD 的
5. **清理 isPlaceholderOnly**：72 个扁平模板中有 11 个无效占位符，可筛选或标记
6. **完善风格 promptFragment**：提供更细化的中英双语提示词片段，而非简单的一句话描述
