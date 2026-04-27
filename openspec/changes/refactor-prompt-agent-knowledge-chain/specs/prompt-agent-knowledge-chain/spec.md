## ADDED Requirements

### Requirement: Prompt Agent uses a main-track knowledge chain
The system SHALL build Prompt Agent recommendations from a main-track knowledge chain that combines visual intent, generic structured templates, visual styles, and prompt knowledge rules.

#### Scenario: User asks Prompt Agent for prompt help
- **WHEN** the user sends a visual request to Prompt Agent
- **THEN** the system SHALL derive a local knowledge chain containing intent, structure strategy, visual language, and applicable professional rules

#### Scenario: Main-track context is available
- **WHEN** generic structured templates and prompt knowledge rules match the user request
- **THEN** the system SHALL use those matches as the primary basis for the agent context

### Requirement: Legacy collected templates are reference-only
The system SHALL treat legacy collected templates as reference-only material, not as default visible template choices or primary structure templates.

#### Scenario: Legacy template matches user keywords
- **WHEN** a legacy collected template matches the user request
- **THEN** the system SHALL expose it, if at all, as filtered reference evidence or extracted traits rather than a selectable template candidate

#### Scenario: Placeholder legacy template matches user keywords
- **WHEN** a legacy collected template is marked as placeholder-only or otherwise fails quality filtering
- **THEN** the system MUST NOT include it in Prompt Agent main-track recommendations

### Requirement: Prompt Agent presents strategy chains
The system SHALL present AI retrieval results as strategy chains and keyword packs instead of raw template candidate lists.

#### Scenario: Retrieval results are displayed
- **WHEN** Prompt Agent finishes local knowledge retrieval
- **THEN** the UI SHALL show user-facing strategy information such as intent, structure strategy, visual language, keyword pack, and professional rules

#### Scenario: Technical evidence exists
- **WHEN** retrieval uses internal template, style, rule, or reference IDs
- **THEN** the UI SHALL keep those implementation details secondary to the strategy-chain presentation

### Requirement: Local knowledge only mode uses knowledge-chain language
The system SHALL preserve local-only behavior while presenting it as a local knowledge constraint rather than a raw preset/template constraint.

#### Scenario: Local knowledge only is enabled
- **WHEN** the user enables the local-only constraint
- **THEN** Prompt Agent SHALL limit recommendations to listed local knowledge sources and communicate this constraint using local-knowledge wording

#### Scenario: No local knowledge matches
- **WHEN** local-only mode is enabled and no suitable local knowledge is retrieved
- **THEN** Prompt Agent SHALL avoid inventing local source IDs and SHALL tell the user to broaden the request or disable local-only mode

### Requirement: User templates remain personal assets
The system SHALL keep user-created templates available as personal prompt assets while avoiding template-first presentation in Prompt Agent recommendations.

#### Scenario: User template matches request
- **WHEN** a user-created template matches the Prompt Agent request
- **THEN** the system SHALL allow it to inform the strategy chain while presenting the recommendation as a strategy, not merely as a raw template selection

#### Scenario: User opens the template library
- **WHEN** the user intentionally opens the preset or template library
- **THEN** the system MAY continue to expose templates as browsable assets outside the Prompt Agent strategy-chain panel
