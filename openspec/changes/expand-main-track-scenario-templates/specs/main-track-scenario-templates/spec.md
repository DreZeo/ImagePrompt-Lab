## ADDED Requirements

### Requirement: Main-track templates support scenario metadata
The system SHALL allow main-track structured templates to declare scenario-level metadata that refines broad categories into concrete use cases.

#### Scenario: Template has a scenario
- **WHEN** a structured official template represents a specific use case such as ecommerce sale poster or SaaS landing page
- **THEN** the template SHALL expose scenario metadata that can be used by retrieval and strategy-chain construction

#### Scenario: Template has no scenario
- **WHEN** a structured official template remains intentionally generic
- **THEN** the system SHALL continue to treat it as a valid category-level main-track template

### Requirement: Scenario matching influences main-track retrieval
The system SHALL use scenario keywords, aliases, and visual intent signals to boost matching main-track templates during local retrieval.

#### Scenario: User request includes scenario terms
- **WHEN** the user asks for a specific scenario such as a brand key visual, ecommerce sale poster, SaaS landing page, dashboard screenshot, food photography, or architecture interior
- **THEN** the system SHALL prefer main-track templates whose scenario metadata matches that request

#### Scenario: Scenario terms are absent
- **WHEN** the user request only maps to a broad category
- **THEN** the system SHALL fall back to category-level matching without requiring a scenario match

### Requirement: Main-track scenario library is curated
The system SHALL add scenario templates as curated main-track assets with explicit structure, output hints, negative prompts, and governance metadata.

#### Scenario: New scenario template is added
- **WHEN** a scenario template is added to the main track
- **THEN** it SHALL include enough structured fields to participate in prompt rendering, recommendation scoring, and strategy-chain generation

#### Scenario: Legacy collected template matches a scenario
- **WHEN** a legacy collected template appears relevant to a scenario
- **THEN** the system MUST keep it in the reference track unless it is manually rewritten as a curated main-track template

### Requirement: Scenario depth is documented
The system SHALL document main-track scenario expansion as the preferred path for improving template depth.

#### Scenario: Dataset analysis is updated
- **WHEN** scenario-level main-track templates are added
- **THEN** the dataset/workflow analysis SHALL describe the added scenario coverage and its relationship to dual-track governance
