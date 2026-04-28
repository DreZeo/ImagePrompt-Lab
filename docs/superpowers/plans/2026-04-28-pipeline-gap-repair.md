# Pipeline Gap Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 AI Agent 与模板系统的三条断层：PresetModal↔AgentModal 联动、Knowledge IDs 结构化解析、structured apply 元数据保留。

**Architecture:** 最小改动原则。不新增组件或 store 字段。通过已有但未接线的 `seedMessage` prop 联动两个 Modal；通过扩展 `PromptAgentMessageArtifacts` 接口保留知识 ID。

**Tech Stack:** React, TypeScript, Tailwind CSS 3

**Testing:** No test framework configured. All verification is visual via `npm run dev`.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/PromptPresetModal.tsx` | Modify (lines 24-28, 74, 153-161) | 添加 `onSendToAgent` prop 和 "AI 优化" 按钮 |
| `src/components/InputBar.tsx` | Modify (lines 476-486) | 接线 seedMessage 通道 |
| `src/lib/promptAgentSession.ts` | Modify (line 12-19) | 扩展 `PromptAgentMessageArtifacts` |
| `src/components/PromptAgentModal.tsx` | Modify (lines 56-75, 320-370) | 提取 Knowledge IDs + 展示 |

---

### Task 1: PromptPresetModal — 添加 `onSendToAgent` prop 和 "AI 优化" 按钮

**Files:**
- Modify: `src/components/PromptPresetModal.tsx` (lines 24-28, 74, 153-161)

- [ ] **Step 1: 扩展 Props 接口**

In `src/components/PromptPresetModal.tsx`, **lines 24-28**, replace:

```typescript
interface PromptPresetModalProps {
  prompt: string
  onApplyPrompt: (prompt: string) => void
  onClose: () => void
}
```

with:

```typescript
interface PromptPresetModalProps {
  prompt: string
  onApplyPrompt: (prompt: string) => void
  onClose: () => void
  onSendToAgent?: (message: string) => void
}
```

- [ ] **Step 2: 解构新 prop**

In `src/components/PromptPresetModal.tsx`, **line 74**, replace:

```typescript
export default function PromptPresetModal({ prompt, onApplyPrompt, onClose }: PromptPresetModalProps) {
```

with:

```typescript
export default function PromptPresetModal({ prompt, onApplyPrompt, onClose, onSendToAgent }: PromptPresetModalProps) {
```

- [ ] **Step 3: 添加 "AI 优化" 按钮到模板卡片**

In `src/components/PromptPresetModal.tsx`, **lines 153-161**, replace:

```tsx
	        <div className="flex items-center gap-1.5 flex-shrink-0">
	          {custom && (
	            <>
	              <button onClick={() => setEditingTemplate(template as TemplateDraft)} className="px-2.5 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors">编辑</button>
	              <button onClick={() => removeCustomTemplate(template as TemplateDraft)} className="px-2.5 py-1.5 rounded-lg text-xs text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">删除</button>
	            </>
	          )}
	          <button onClick={() => insertTemplate(template)} className="px-2.5 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors">插入</button>
	          <button onClick={() => replaceWithTemplate(template)} className="px-2.5 py-1.5 rounded-lg text-xs text-white bg-blue-500 hover:bg-blue-600 transition-colors">替换</button>
	        </div>
```

with:

```tsx
	        <div className="flex items-center gap-1.5 flex-shrink-0">
	          {onSendToAgent && (
	            <button
	              onClick={() => {
	                onSendToAgent(`请基于模板「${template.name}」帮我优化提示词。\n\n模板分类：${TEMPLATE_CATEGORY_LABELS[template.category]}\n模板描述：${template.description}\n槽位：${Object.values(template.slots).map((slot) => slot.label).join('、') || '无'}\n模板内容：${truncateText(template.promptPattern, 200)}`)
	                onClose()
	              }}
	              className="px-2.5 py-1.5 rounded-lg text-xs text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors dark:text-purple-300 dark:bg-purple-500/10 dark:hover:bg-purple-500/20"
	            >
	              AI 优化
	            </button>
	          )}
	          {custom && (
	            <>
	              <button onClick={() => setEditingTemplate(template as TemplateDraft)} className="px-2.5 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors">编辑</button>
	              <button onClick={() => removeCustomTemplate(template as TemplateDraft)} className="px-2.5 py-1.5 rounded-lg text-xs text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">删除</button>
	            </>
	          )}
	          <button onClick={() => insertTemplate(template)} className="px-2.5 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors">插入</button>
	          <button onClick={() => replaceWithTemplate(template)} className="px-2.5 py-1.5 rounded-lg text-xs text-white bg-blue-500 hover:bg-blue-600 transition-colors">替换</button>
	        </div>
```

按钮使用紫色（purple）配色以区分于蓝色的"替换"操作，表示"发送到 AI"的语义。点击后同时调用 `onSendToAgent`（传递模板信息）和 `onClose`（关闭预设面板）。

- [ ] **Step 4: 验证**

Run: `npm run dev`

1. 打开预设面板 → 模板 tab → 确认每个模板卡片右侧有紫色 "AI 优化" 按钮
2. 自定义 tab 的模板也有 "AI 优化" 按钮
3. 不传 `onSendToAgent` 时按钮不显示（向后兼容）
4. 点击 "替换"/"插入" 仍然正常工作

- [ ] **Step 5: Commit**

```bash
git add src/components/PromptPresetModal.tsx
git commit -m "feat: add 'AI optimize' button to preset template cards"
```

---

### Task 2: InputBar — 接线 seedMessage 通道

**Files:**
- Modify: `src/components/InputBar.tsx` (lines 1, 476-486)

这是断层 4 的核心修复。`PromptAgentModal` 已有 `seedMessage` + `onSeedConsumed` props，`InputBar` 已渲染两个 Modal，只需接一根线。

- [ ] **Step 1: 添加 state 和 handler**

In `src/components/InputBar.tsx`, **在现有 state 声明区域**（约 line 56-68 之间，`const dragCounter = useRef(0)` 之后），添加:

```tsx
  const [agentSeedMessage, setAgentSeedMessage] = useState<string | undefined>(undefined)
  const handleSeedConsumed = useCallback(() => setAgentSeedMessage(undefined), [])
```

- [ ] **Step 2: 传递 props 到两个 Modal**

In `src/components/InputBar.tsx`, **lines 476-486**, replace:

```tsx
      {showPromptPresets && (
        <PromptPresetModal
          prompt={prompt}
          onApplyPrompt={setPrompt}
          onClose={() => setShowPromptPresets(false)}
        />
      )}
      <PromptAgentModal
        prompt={prompt}
        onApplyPrompt={setPrompt}
      />
```

with:

```tsx
      {showPromptPresets && (
        <PromptPresetModal
          prompt={prompt}
          onApplyPrompt={setPrompt}
          onClose={() => setShowPromptPresets(false)}
          onSendToAgent={(msg) => {
            setAgentSeedMessage(msg)
            setShowPromptPresets(false)
          }}
        />
      )}
      <PromptAgentModal
        prompt={prompt}
        onApplyPrompt={setPrompt}
        seedMessage={agentSeedMessage}
        onSeedConsumed={handleSeedConsumed}
      />
```

注意 `onSendToAgent` 回调里同时调用了 `setShowPromptPresets(false)`，确保 PresetModal 关闭。这与 Step 3 里模板卡片按钮调用的 `onClose()` 形成双保险。

- [ ] **Step 3: 验证**

Run: `npm run dev`

完整流程测试:
1. 打开预设面板 → 模板 tab
2. 点击任意模板卡片的 "AI 优化" 按钮
3. 预设面板关闭
4. AI Agent 面板自动展开
5. Agent 输入框预填了模板信息（如 "请基于模板「海报品牌视觉」帮我优化提示词..."）
6. 用户可直接发送，或修改后再发送
7. AI 回复中应引用该模板的内容

- [ ] **Step 4: Commit**

```bash
git add src/components/InputBar.tsx
git commit -m "feat: wire seedMessage channel between PresetModal and AgentModal"
```

---

### Task 3: Knowledge IDs 结构化解析

**Files:**
- Modify: `src/lib/promptAgentSession.ts` (lines 12-19)
- Modify: `src/components/PromptAgentModal.tsx` (lines 56-75)

System prompt 要求 LLM 标注 "Used knowledge IDs: rule-xxx, rule-yyy"，但目前只在文本中存在，没有结构化提取。这一步把它解析出来。

- [ ] **Step 1: 扩展 `PromptAgentMessageArtifacts` 接口**

In `src/lib/promptAgentSession.ts`, **lines 12-19**, replace:

```typescript
export interface PromptAgentMessageArtifacts {
  finalPrompt?: string
  presetContext?: PresetContext | null
  composition?: ParsedAssistantComposition | null
  validation?: AssistantCompositionValidation | null
  templateDraft?: TemplateDraft | null
  draftStatus?: string | null
}
```

with:

```typescript
export interface PromptAgentMessageArtifacts {
  finalPrompt?: string
  presetContext?: PresetContext | null
  composition?: ParsedAssistantComposition | null
  validation?: AssistantCompositionValidation | null
  templateDraft?: TemplateDraft | null
  draftStatus?: string | null
  knowledgeIds?: string[]
}
```

- [ ] **Step 2: 在 `buildAssistantArtifacts` 中提取 Knowledge IDs**

In `src/components/PromptAgentModal.tsx`, inside `buildAssistantArtifacts` function（约 lines 56-75）, 在 `return` 语句之前添加提取逻辑。

找到这段（约 line 70-75）:

```typescript
  const templateDraft = composition?.templateDraft && validateTemplateDraft(composition.templateDraft).valid
    ? composition.templateDraft
    : null
  const invalidIds = validation ? [...validation.invalidTemplateIds, ...validation.invalidStyleIds] : []
  return {
    finalPrompt: extractFinalPrompt(content),
    presetContext,
    composition,
    validation,
    templateDraft,
    draftStatus: invalidIds.length ? `已忽略无效预设 ID：${invalidIds.join(', ')}` : null,
  }
```

Replace with:

```typescript
  const templateDraft = composition?.templateDraft && validateTemplateDraft(composition.templateDraft).valid
    ? composition.templateDraft
    : null
  const invalidIds = validation ? [...validation.invalidTemplateIds, ...validation.invalidStyleIds] : []
  const knowledgeMatch = content.match(/Used knowledge IDs:\s*(.+)/i)
  const knowledgeIds = knowledgeMatch
    ? knowledgeMatch[1].split(/[,，;；\s]+/).map((id) => id.trim()).filter((id) => id && id.length > 1)
    : []
  return {
    finalPrompt: extractFinalPrompt(content),
    presetContext,
    composition,
    validation,
    templateDraft,
    draftStatus: invalidIds.length ? `已忽略无效预设 ID：${invalidIds.join(', ')}` : null,
    knowledgeIds,
  }
```

正则 `/Used knowledge IDs:\s*(.+)/i` 匹配 system prompt 要求 LLM 输出的标注行。`.split(/[,，;；\s]+/)` 兼容中英文分隔符。`.filter(id => id && id.length > 1)` 过滤空串和单字符噪声。

- [ ] **Step 3: 在 `renderPresetContext` 中展示 Knowledge IDs**

In `src/components/PromptAgentModal.tsx`, inside `renderPresetContext` function（约 line 307）, 找到 "命中关键词" section 之后，在 `return` 的 JSX 里添加 knowledge IDs 展示。

找到这段（在 `renderPresetContext` 内，"命中关键词" div 之后）:

```tsx
        {topRecommendation && (
```

在这行之前插入:

```tsx
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
```

使用 amber 配色区分于蓝色的"命中关键词"（本地检索）和紫色的"意图解析"，明确标注这是 "LLM 引用知识规则" 而非本地匹配结果。

- [ ] **Step 4: 验证**

Run: `npm run dev`

1. 打开 AI Agent，发送一条消息（如 "帮我做一张咖啡海报"）
2. 等待 AI 回复完成
3. 展开回复下方的 "最终提示词与结构建议"
4. 在 presetContext 区域应该能看到:
   - 蓝色标签: 命中关键词（本地检索）
   - 紫色标签: 意图解析
   - **amber 标签: LLM 引用知识规则**（新增，如果 LLM 标注了的话）
5. 如果 LLM 没有标注 "Used knowledge IDs:"，该区域不显示（优雅降级）

- [ ] **Step 5: Commit**

```bash
git add src/lib/promptAgentSession.ts src/components/PromptAgentModal.tsx
git commit -m "feat: extract and display knowledge IDs from LLM response"
```

---

## Self-Review

**Spec coverage:**
- 断层 4 (PresetModal ↔ AgentModal 联动) → Task 1 + Task 2 ✓
- 断层 2 (Knowledge IDs 结构化解析) → Task 3 ✓
- 断层 1 (filledSlots 丢弃) → 未包含，需设计决策（是否切换到模板渲染），建议单独 plan
- 断层 3 (Output Profile 不可选) → 未包含，需新 UI 设计，建议单独 plan

**Placeholder scan:** 无 TBD/TODO。所有步骤有完整代码。

**Type consistency:**
- `PromptAgentMessageArtifacts.knowledgeIds?: string[]` — Task 3 Step 1 定义，Step 2 写入，Step 3 读取 ✓
- `PromptPresetModalProps.onSendToAgent?: (message: string) => void` — Task 1 Step 1 定义，Step 3 使用 ✓
- `agentSeedMessage: string | undefined` — Task 2 Step 1 定义，Step 2 传递 ✓
