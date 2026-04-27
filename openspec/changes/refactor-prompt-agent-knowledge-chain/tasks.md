## 1. Retrieval Model

- [x] 1.1 Add source-role helpers that separate official/user structured templates from legacy collected reference examples.
- [x] 1.2 Update structured template search so main-track recommendations exclude placeholder-only and reference-only legacy templates by default.
- [x] 1.3 Add reference-track extraction that summarizes eligible legacy examples into traits, keywords, strengths, and risks instead of full template choices.
- [x] 1.4 Preserve internal template, style, and rule IDs for validation while keeping strategy-facing data separate from raw source data.

## 2. Prompt Agent Context

- [x] 2.1 Update `buildPresetContext` to return strategy-chain data composed from intent, structure strategy, visual language, knowledge rules, and optional references.
- [x] 2.2 Update Prompt Agent system prompt wording to explain main-track knowledge and reference-only legacy examples.
- [x] 2.3 Keep local-only behavior internally compatible with `presetOnly` while presenting it as a local-knowledge constraint.
- [x] 2.4 Ensure no placeholder-only legacy template can enter the Prompt Agent main-track context.

## 3. Strategy Chain UI

- [x] 3.1 Replace the visible template candidate section in `PromptAgentModal` with strategy-chain cards.
- [x] 3.2 Show keyword packs for structure, composition, visual language, quality constraints, and negative guidance.
- [x] 3.3 Rename user-facing labels from template/preset wording to local-knowledge, structure-strategy, visual-language, and professional-rule wording.
- [x] 3.4 Move raw IDs, scores, and provenance into secondary evidence display or remove them from the default panel.

## 4. Recommendation Entry Points

- [x] 4.1 Review `InputBar` prompt recommendations and adjust any template-first wording or behavior that conflicts with strategy-chain presentation.
- [x] 4.2 Ensure user-created templates still participate as personal assets without turning Prompt Agent back into a raw template picker.
- [x] 4.3 Keep the separate preset/template library browsable for users who intentionally open it.

## 5. Validation

- [x] 5.1 Verify Prompt Agent displays strategy chains for common poster, product, UI, portrait, and infographic requests.
- [x] 5.2 Verify local-only mode does not invent local source IDs when no suitable local knowledge matches.
- [x] 5.3 Verify placeholder-only legacy examples are not surfaced in main recommendations.
- [x] 5.4 Run the project build and fix only issues introduced by this change.

