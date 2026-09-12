## Purpose

Provides a way to answer questions that span the whole workspace rather than one queue item or
stream, without requiring the user to first locate the relevant streams themselves.

## Requirements

### Requirement: Cross-stream research
`/flow:ask` SHALL support deep research across all tracked streams in a workspace for a question
that does not map to a single existing queue item, drawing on stream content, descriptions, and
intents as needed to answer.

#### Scenario: A question spanning multiple streams
- **WHEN** a user asks a question whose answer requires information from several tracked streams
  and no single queue item addresses it
- **THEN** `/flow:ask` SHALL search across the relevant tracked streams and synthesize an answer
