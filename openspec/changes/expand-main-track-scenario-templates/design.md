## Context

Prompt Agent has already moved from a visible fixed-template picker to a dual-track knowledge-chain model. The main track uses structured official templates, styles, and prompt knowledge rules; the reference track keeps legacy collected templates as filtered inspiration only.

The remaining gap is that main-track templates mostly describe broad categories such as `poster`, `product`, `ui-screenshot`, and `scene`. Users often ask for scenario-specific outputs, for example ecommerce sale posters, brand key visuals, SaaS landing pages, dashboard screenshots, food/drink product photography, and interior architecture scenes. Without explicit scenario metadata, the system can only infer those details indirectly from tags and AI reasoning.

## Goals / Non-Goals

**Goals:**
- Add scenario-level structure to main-track templates without reintroducing raw template selection UI.
- Make scenario hints participate in visual intent extraction, template retrieval, recommendation reasons, and strategy-chain cards.
- Seed the main track with a focused set of high-value scenario templates rather than a large ungoverned template dump.
- Preserve the reference-only boundary for legacy collected templates.
- Update documentation so the dataset analysis reflects scenario-level main-track expansion.

**Non-Goals:**
- Do not turn legacy collected templates into main-track templates automatically.
- Do not add a user-facing fixed-template dropdown to Prompt Agent.
- Do not introduce backend services, databases, or external dependencies.
- Do not redesign the entire prompt knowledge system beyond scenario matching and presentation.

## Decisions

### Scenario metadata lives on structured templates

Add optional scenario metadata to `StructuredPromptTemplate`, such as `scenario`, `scenarioLabel`, or equivalent fields, plus keyword aliases where useful. Keeping metadata on templates avoids a separate registry becoming stale and lets retrieval, rendering, and strategy-chain construction use the same source of truth.

Alternative considered: create a standalone scenario registry. This would centralize labels but would require extra joins and increase the chance of templates and scenarios drifting apart.

### First-wave templates should be curated and commercial

Seed a small set of high-value scenarios across the most common user requests:

- `poster`: brand key visual, ecommerce sale poster, event/release poster, social campaign cover.
- `ui-screenshot`: SaaS landing page hero, analytics/dashboard screenshot.
- `product`: food/drink photography, tech product render, packaging display.
- `scene`: interior/architecture space.
- `infographic`: process explainer / workflow diagram.

This improves coverage where broad category templates are weakest without bloating the dataset.

### Matching remains strategy-first, not template-first

`extractVisualIntent()` and `searchStructuredTemplates()` should recognize scenario words and boost relevant templates, but the UI should display the result as strategy-chain language: category → scenario → structure strategy → keyword pack. Internal template IDs remain secondary evidence.

Alternative considered: expose scenario templates as selectable presets. This would be simpler but would regress to the fixed-template UX the prior change intentionally removed.

### Reference templates remain inspiration only

Legacy collected templates may contribute reference traits, keywords, strengths, and risks, but they must not satisfy scenario-template requirements or become main-track recommendations. This preserves quality control and prevents placeholder/source-contaminated examples from shaping the primary structure.

### Documentation updates are part of the change

The dataset analysis should no longer describe the main-track limitation as merely “57 templates.” It should explain that scenario-level expansion is the path for improving depth while keeping the dual-track governance model intact.

## Risks / Trade-offs

- Scenario taxonomy may become inconsistent → Keep first-wave scenario names small, kebab-case, and tied to explicit labels.
- Search scoring may overfit to scenario terms → Use scenario boosts as additive signals, not hard filters.
- Template count can grow without quality control → Add curated templates with governance metadata and avoid importing legacy data wholesale.
- UI can become crowded → Surface scenario labels inside existing strategy-chain cards instead of adding a new picker.
- Documentation can drift again → Update `docs/dataset-and-ai-workflow-analysis.md` alongside code changes.
