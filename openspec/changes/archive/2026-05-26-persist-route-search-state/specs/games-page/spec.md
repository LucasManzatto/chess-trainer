## ADDED Requirements

### Requirement: Games route encodes filters and selected game in URL search params
The games route SHALL declare a `validateSearch` schema with fields: `result` (enum: win/loss/draw, nullable, default null), `color` (enum: white/black, nullable, default null), `time_class` (enum: bullet/blitz/rapid/classical, nullable, default null), `eco` (string, default ''), and `gameId` (optional number). All fields SHALL use `.catch(default)` so stale or invalid localStorage values degrade to defaults without throwing.

#### Scenario: Filters survive page refresh
- **WHEN** the user sets result=win, color=white, then refreshes the page
- **THEN** the games list renders with result=win and color=white filters active

#### Scenario: Selected game survives page refresh
- **WHEN** the user selects a game and refreshes the page
- **THEN** the same game is re-selected and loaded on the board (if still present in the filtered list)

#### Scenario: Invalid stored params degrade gracefully
- **WHEN** localStorage contains `time_class=invalid_value` from a previous schema version
- **THEN** `time_class` falls back to null without a runtime error

#### Scenario: Changing filter updates URL
- **WHEN** the user changes the result filter to "win"
- **THEN** the URL updates to include `?result=win` and the games list re-fetches
