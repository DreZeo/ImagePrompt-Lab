## 1. Scenario Data Model

- [x] 1.1 Add scenario-level metadata types to `StructuredPromptTemplate` in `src/data/structuredPrompts.ts`
- [x] 1.2 Define a small curated scenario taxonomy for poster, product, UI screenshot, scene, and infographic templates
- [x] 1.3 Ensure generic main-track templates remain valid when no scenario metadata is present

## 2. Curated Main-Track Templates

- [x] 2.1 Add scenario templates for brand key visual, ecommerce sale poster, event/release poster, and social campaign cover
- [x] 2.2 Add scenario templates for SaaS landing page hero and analytics/dashboard screenshot
- [x] 2.3 Add scenario templates for food/drink photography, tech product render, packaging display, interior architecture scene, and workflow/process explainer
- [x] 2.4 Add governance, output hints, negative prompts, tags, and slot structure for each new scenario template

## 3. Retrieval And Strategy Chains

- [x] 3.1 Extend visual intent extraction to recognize scenario-specific words and aliases
- [x] 3.2 Update main-track template scoring so scenario matches boost but do not hard-filter recommendations
- [x] 3.3 Include scenario labels and scenario keywords in strategy-chain construction
- [x] 3.4 Keep legacy reference insights excluded from main-track scenario template matching

## 4. Prompt Agent Presentation

- [x] 4.1 Update strategy-chain cards to show scenario-level structure when present
- [x] 4.2 Keep internal template IDs secondary and avoid reintroducing a fixed-template dropdown
- [x] 4.3 Update Prompt Agent wording so scenario details read as strategy guidance, not selectable templates

## 5. Documentation And Verification

- [x] 5.1 Update `docs/dataset-and-ai-workflow-analysis.md` to describe scenario-level main-track expansion
- [x] 5.2 Verify sample requests route to scenario strategies for ecommerce posters, SaaS pages, dashboards, food photos, interiors, and workflow explainers
- [x] 5.3 Run the project build and fix only issues caused by this change
