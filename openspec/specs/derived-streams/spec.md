## Purpose

Lets a workspace track content computed from existing source streams as a first-class stream,
while keeping the dependency model simple enough to need no cycle detection.

## Requirements

### Requirement: Derived streams are one level deep
A derived stream's `source_stream_ids` SHALL only reference streams with `origin: source`. A
derived stream SHALL NOT take another derived stream as an input.

#### Scenario: Attempting to chain derived streams
- **WHEN** a user attempts to add a derived stream whose input is another derived stream
- **THEN** the system SHALL reject the addition

### Requirement: Derived streams recompute only on source change
A syncable derived stream SHALL be recomputed only when `/flow:sync` determines that at least one
of its source streams changed. It SHALL NOT have an independent scheduled or pull step of its own.
If none of its sources changed on a given sync, the derived stream SHALL be left unchanged.

#### Scenario: No source changes
- **WHEN** `/flow:sync` runs and none of a derived stream's source streams changed
- **THEN** the derived stream SHALL NOT be recomputed

#### Scenario: A source changes
- **WHEN** `/flow:sync` detects a meaningful change in one of a derived stream's source streams
- **THEN** the derived stream SHALL be recomputed using its recorded transformation recipe, and the
  result SHALL be diffed and summarized the same way a source stream's change would be

### Requirement: Static derived streams compute once
A derived stream added as static SHALL be computed once at add-time and SHALL NOT be recomputed on
subsequent syncs, consistent with `syncable` defaulting to true for derived streams unless
overridden.

#### Scenario: Static derived stream after a later sync
- **WHEN** a derived stream was added as static and a later `/flow:sync` runs
- **THEN** that derived stream SHALL NOT be recomputed, regardless of whether its sources changed
