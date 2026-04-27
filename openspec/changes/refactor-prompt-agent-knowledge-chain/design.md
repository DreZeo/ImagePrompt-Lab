## Context

Prompt Agent currently builds a local retrieval context from visual intent, recommendations, structured styles, structured templates, and prompt knowledge rules. The structured template pool includes user templates, official structured templates, and legacy collected templates converted from `TEMPLATE_PRESETS`.

This creates a mixed-quality retrieval surface: official structured templates behave like reusable skeletons, while legacy collected templates are often concrete examples with source-specific wording, placeholders, author signatures, or one-off scenario details. The UI also exposes retrieved templates directly, reinforcing a template-picking mental model instead of a strategy-building mental model.

The desired model is dual-track:

```text
Main track:      generic structured templates + visual styles + prompt knowledge rules
Reference track: legacy collected examples after filtering and summarization
```

The agent should present a chain of visual decisions, not a list of raw templates.

## Goals / Non-Goals

**Goals:**

- Make Prompt Agent default to a stable main track based on generic structured templates, visual styles, and built-in knowledge rules.
- Downgrade legacy collected templates to reference-only material that can provide keywords or inspiration but is not shown as a direct template choice.
- Replace template-first UI with strategy-chain, keyword-pack, visual-language, and professional-rule presentation.
- Filter out placeholder or low-quality legacy examples from AI context unless explicitly allowed as reference evidence.
- Keep user-created templates available as user assets while presenting AI recommendations as strategies.

**Non-Goals:**

- Do not remove the legacy collected template dataset from the repository.
- Do not change image generation APIs or task submission behavior.
- Do not introduce a new external search, vector database, or embedding dependency.
- Do not implement automatic AI-based offline data cleaning in this change.

## Decisions

### Decision 1: Split template sources by role

The template aggregation layer will distinguish main-track templates from reference-track examples.

- Main track includes official structured templates and user-created templates.
- Reference track includes legacy collected templates that pass quality filters.
- Placeholder legacy templates and contaminated examples do not participate in main recommendations.

Alternative considered: keep all templates in one pool and only adjust ranking. This is weaker because low-quality legacy templates can still appear in the visible UI and system prompt when they score well on keywords.

### Decision 2: Present strategy chains instead of template candidates

The UI will translate retrieved evidence into user-facing strategy chains. A strategy chain combines task intent, structure strategy, visual language, keyword pack, professional rules, and optional reference evidence.

Alternative considered: keep the current template and style candidate sections but rename them. Renaming alone does not change the user mental model because raw template IDs and titles would still be visible.

### Decision 3: Keep legacy examples as reference-only evidence

Legacy collected templates can remain valuable as examples of social-media or high-impact prompt structures. They will be summarized as extracted traits such as layout pattern, mood, text density, platform hints, strengths, and risks rather than injected as full prompt templates.

Alternative considered: remove legacy templates from runtime entirely. This is cleaner but loses useful inspiration and makes the existing dataset less valuable.

### Decision 4: Preserve explicit provenance for debugging, hide it by default

The user-facing panel should default to strategy and keyword language. Technical evidence such as source IDs, scores, and template provenance may remain available in an expanded/debug view if needed, but it must not be the primary interaction.

Alternative considered: fully remove source IDs from UI. This improves polish but can make debugging validation and retrieval harder during implementation.

### Decision 5: Keep preset-only semantics but rename the product concept

The existing `presetOnly` behavior maps to a useful “local knowledge only” constraint. The implementation can keep the internal flag while updating copy and validation messages to match the new knowledge-chain vocabulary.

Alternative considered: remove preset-only. This would reduce control for users who want deterministic local-knowledge recommendations.

## Risks / Trade-offs

- Reduced creativity from hiding legacy examples → keep a filtered reference track that contributes inspiration traits without direct copying.
- More UI complexity from strategy-chain presentation → keep the first view compact, with optional evidence expansion.
- Possible mismatch between internal template IDs and strategy output validation → keep IDs internally for validation while avoiding primary exposure in UI.
- Existing recommendation helpers are template-centric → adapt their output or introduce a lightweight strategy view model rather than rewriting all prompt data at once.
- Users may still want raw templates → keep the separate preset/template library for manual browsing, but do not make it the Prompt Agent default retrieval surface.

## Migration Plan

1. Add source-role filtering in the structured prompt retrieval layer so official/user templates drive main-track recommendations and legacy templates become reference-only.
2. Shape retrieved context into strategy-chain data for Prompt Agent while preserving internal IDs for validation.
3. Update Prompt Agent system prompt copy to describe main-track and reference-track behavior.
4. Replace visible template candidate UI with strategy-chain and keyword-pack sections.
5. Update user-facing labels from preset/template wording to local-knowledge, structure-strategy, visual-language, and professional-rule wording.
6. Validate that prompt generation still works with and without local candidates, and that placeholder legacy examples are not surfaced.

Rollback is straightforward: restore the previous template aggregation behavior and UI sections if strategy-chain presentation causes unacceptable regressions.

## Open Questions

- Should reference-track examples be user-toggleable in the first version, or always available after filtering?
- What exact fields should the first strategy-chain view model expose: `intent`, `structure`, `visualLanguage`, `keywords`, `rules`, `references`, or a smaller set?
- Should the manual preset library also distinguish official templates from legacy references, or is this change limited to Prompt Agent retrieval UI?
