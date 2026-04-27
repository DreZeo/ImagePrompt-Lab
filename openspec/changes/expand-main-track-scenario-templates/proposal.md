## Why

Prompt Agent now uses a dual-track knowledge chain, but the main-track structured templates still operate mostly at broad category level. This makes requests such as ecommerce sale posters, brand key visuals, SaaS landing pages, food photography, and architecture scenes rely too much on AI inference instead of explicit local strategy structure.

Expanding the main track with scenario-level templates and matching metadata will make strategy chains more precise while keeping the UI free from raw fixed-template selection.

## What Changes

- Add scenario-level metadata to main-track structured templates so large categories can express finer use cases such as brand poster, ecommerce sale poster, event poster, SaaS landing page, dashboard screenshot, food/drink product photo, and interior/architecture scene.
- Add a first wave of high-value main-track scenario templates for common commercial and productized prompt requests.
- Extend visual intent extraction and template scoring so scenario hints influence strategy-chain selection without exposing a raw template dropdown.
- Surface scenario strategy in Prompt Agent as chain language such as category → scenario → structure strategy → keyword pack.
- Keep legacy collected templates reference-only; they may inform traits or keywords but MUST NOT become scenario templates automatically.
- Update the dataset/workflow analysis documentation to describe scenario-level main-track expansion.

## Capabilities

### New Capabilities
- `main-track-scenario-templates`: Defines scenario-level main-track template coverage and how scenario metadata participates in Prompt Agent strategy-chain retrieval.

### Modified Capabilities
- `prompt-agent-knowledge-chain`: Strategy chains SHALL include scenario-level structure when a main-track scenario template matches the user request.

## Impact

- Affects `src/data/structuredPrompts.ts` for template metadata, scenario constants, search scoring, and recommendation reasons.
- Affects `src/lib/chatApi.ts` for strategy-chain construction and system prompt context wording.
- Affects `src/components/PromptAgentModal.tsx` if scenario labels need to appear in strategy-chain cards.
- Affects `docs/dataset-and-ai-workflow-analysis.md` so documentation matches the expanded main-track behavior.
- No external dependencies or backend API changes are expected.
