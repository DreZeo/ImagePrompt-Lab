## Why

Prompt Agent currently exposes retrieved templates as first-class choices, which makes the assistant feel like it is selecting from a mixed-quality template library rather than building a professional visual strategy. Legacy collected templates vary in quality, include placeholders and source-specific artifacts, and can pollute AI context when treated as reusable templates.

This change reframes the agent around a dual-track knowledge model: stable generation uses generic structured templates and built-in rules, while collected templates are downgraded to filtered reference material that can contribute keywords or inspiration without being directly exposed or copied.

## What Changes

- Replace visible “template candidate” retrieval UI with strategy-chain and keyword-pack presentation.
- Use generic structured templates, visual styles, and prompt knowledge rules as the default main-track context for Prompt Agent.
- Treat legacy collected templates as a reference-only side track, excluded from default visible template choices.
- Add quality-aware filtering for legacy collected templates so placeholders and contaminated examples do not enter main recommendations.
- Rename user-facing copy from template/preset-centric wording to knowledge-chain, structure-strategy, visual-language, and local-knowledge wording.
- Preserve user-created templates as user assets, but present AI recommendations as strategies rather than raw template IDs.

## Capabilities

### New Capabilities
- `prompt-agent-knowledge-chain`: Defines how Prompt Agent builds and presents strategy chains from structured templates, visual styles, knowledge rules, and filtered reference examples.

### Modified Capabilities

## Impact

- Affects Prompt Agent retrieval context construction in `src/lib/chatApi.ts`.
- Affects structured template aggregation and search in `src/data/structuredPrompts.ts`.
- Affects prompt knowledge and recommendation presentation in `src/data/promptKnowledge.ts` if keyword-pack shaping needs additional metadata.
- Affects Prompt Agent UI in `src/components/PromptAgentModal.tsx`.
- May affect prompt recommendation cards in `src/components/InputBar.tsx` if they continue to expose template-first recommendations.
- No new external dependencies are expected.
