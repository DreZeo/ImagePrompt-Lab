## ADDED Requirements

### Requirement: Strategy chains include scenario-level structure
The system SHALL include matched scenario-level main-track structure in Prompt Agent strategy chains when the user request maps to a supported scenario.

#### Scenario: Scenario template matches request
- **WHEN** the user request matches a main-track scenario template
- **THEN** Prompt Agent SHALL present the recommendation as a strategy chain containing category, scenario, structure strategy, visual language, keyword pack, and applicable professional rules

#### Scenario: Multiple scenario templates match request
- **WHEN** multiple main-track scenario templates match the same user request
- **THEN** Prompt Agent SHALL rank them using local retrieval confidence and show the most relevant strategies without exposing a raw fixed-template dropdown

### Requirement: Scenario details remain strategy-facing
The system SHALL present scenario matches as strategy guidance rather than direct fixed-template choices.

#### Scenario: Retrieval results are displayed
- **WHEN** Prompt Agent displays local retrieval evidence
- **THEN** scenario labels and keyword packs SHALL be user-facing while implementation details such as internal template IDs remain secondary

#### Scenario: Reference insight supports a scenario
- **WHEN** a reference-track insight supports the same scenario as a main-track strategy
- **THEN** Prompt Agent SHALL show it as reference inspiration and MUST NOT treat it as the primary structure template
