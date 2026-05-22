## ADDED Requirements

### Requirement: Drill tab requires authentication
The Drill tab SHALL only be accessible to authenticated users. Unauthenticated users SHALL see a login prompt instead of the drill interface.

#### Scenario: Unauthenticated user sees login prompt
- **WHEN** an unauthenticated user opens the Drill tab
- **THEN** a login prompt is shown instead of the drill queue

### Requirement: Drill queue shows openings due for review
The Drill tab SHALL display a queue of openings whose `due_date` is on or before today, ordered by `due_date` ascending.

#### Scenario: Due openings appear in queue
- **WHEN** a logged-in user has openings with due_date ≤ today
- **THEN** those openings appear in the drill queue ordered by due_date

#### Scenario: Empty queue shows call-to-action
- **WHEN** a logged-in user has no openings due for review
- **THEN** an empty state message is shown with a link to Browse to add openings to drill

### Requirement: User can add an opening to drill from Browse
In the Browse tab, authenticated users SHALL see an "Add to Drill" button on each opening. Clicking it SHALL create an `opening_progress` record with default SM-2 values (ease_factor=2.5, interval_days=1, due_date=today).

#### Scenario: Add to Drill creates progress record
- **WHEN** an authenticated user clicks "Add to Drill" on an opening
- **THEN** that opening appears in their drill queue

#### Scenario: Already-added opening shows different state
- **WHEN** an opening already has a progress record for the current user
- **THEN** the "Add to Drill" button shows "In Drill" (disabled or alternate style)

### Requirement: Drill session plays through an opening's moves
When the user starts drilling an opening, the board SHALL show the starting position and prompt the user to play the correct moves one by one.

#### Scenario: Correct move advances position
- **WHEN** the user plays the correct next move for the opening
- **THEN** the board advances to the next position

#### Scenario: Wrong move shows red flash and resets
- **WHEN** the user plays an incorrect move
- **THEN** the board flashes red and returns to the position before the wrong move

#### Scenario: Completing all moves shows grading UI
- **WHEN** the user successfully plays all moves of the opening
- **THEN** grading buttons appear: "Again", "Hard", "Good", "Easy"

### Requirement: SM-2 algorithm updates progress on grading
After the user grades themselves, the system SHALL update `opening_progress` using the SM-2 algorithm.

Grades map to SM-2 quality scores: Again=0, Hard=3, Good=4, Easy=5.

SM-2 rules:
- Quality < 3: repetitions=0, interval_days=1, ease_factor unchanged
- Quality ≥ 3 and repetitions=0: interval_days=1
- Quality ≥ 3 and repetitions=1: interval_days=6
- Quality ≥ 3 and repetitions>1: interval_days = round(prev_interval * ease_factor)
- ease_factor += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02), minimum 1.3
- due_date = today + interval_days

#### Scenario: "Again" resets interval
- **WHEN** the user grades "Again" (quality=0)
- **THEN** interval_days=1, repetitions=0, due_date=tomorrow

#### Scenario: "Easy" on first repetition
- **WHEN** the user grades "Easy" (quality=5) on their first attempt
- **THEN** interval_days=1, repetitions=1, ease_factor increases, due_date=tomorrow

#### Scenario: Repeated "Good" grades grow interval
- **WHEN** the user grades "Good" (quality=4) on repetitions 0, 1, 2 consecutively
- **THEN** intervals are 1, 6, and 6*ease_factor (rounded) days respectively

### Requirement: Drill advances to next opening after grading
After grading, the drill session SHALL automatically advance to the next due opening in the queue.

#### Scenario: Queue advances after grade
- **WHEN** the user submits a grade
- **THEN** the next opening in the queue is shown, or a "Queue complete" message if none remain
