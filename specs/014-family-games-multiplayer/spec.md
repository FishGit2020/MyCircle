# Feature Specification: Family Games — Multiplayer & Enhancements

**Feature Branch**: `014-family-games-multiplayer`
**Created**: 2026-03-25
**Status**: Draft
**Input**: User description: "Multiplayer mini-games (sequence, timer, etc.) for family use, check existed MFE, improve it and add new features."

## Context: Existing Family Games MFE

The `family-games` MFE already ships 12 single-player games: Trivia, Math Challenge, Word Game, Memory Match, Heads Up, Reaction Time, Simon Says, Number Sequence, Color Match, Maze Runner, Anagram, and Dino Run. It has a per-game scoreboard that tracks individual high scores. All games are currently solo experiences with no pass-and-play or competitive modes.

This spec extends the existing MFE — it does **not** create a new one.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Pass-and-Play Tournament (Priority: P1)

A family of 2–6 players sits together on one device. They enter their names, then cycle through a set of games where each player takes a turn. After all rounds are complete, a final leaderboard ranks players by total score and crowns a winner.

**Why this priority**: This is the core "multiplayer" ask. It transforms every existing game into a shared family activity without requiring multiple devices or network connectivity.

**Independent Test**: Open the games hub, tap "Play Together", add 3 player names, pick 2 games, and complete one full rotation. Verify the final leaderboard lists all 3 players with their scores.

**Acceptance Scenarios**:

1. **Given** the games home screen, **When** a user taps "Play Together", **Then** a player-setup screen appears where 2–6 names can be entered before starting.
2. **Given** a tournament in progress, **When** one player finishes their turn, **Then** the screen displays a "Pass to [Next Player]" handoff prompt before the next turn begins.
3. **Given** all rounds are complete, **When** the last player finishes, **Then** a ranked leaderboard shows each player's total score and highlights the winner.
4. **Given** a tournament session, **When** the device is temporarily left idle, **Then** the session can be resumed from where it left off without losing scores.

---

### User Story 2 — Head-to-Head Challenge (Priority: P2)

Two players compete on the same game simultaneously, each taking alternating turns within a shared time limit. The player with the higher score when the timer expires wins the round. This mode is available for score-based games (Trivia, Math, Number Sequence, Anagram).

**Why this priority**: Adds a competitive real-time feel for pairs, the most common family game scenario (parent vs. child, siblings).

**Independent Test**: Start a Head-to-Head Math Challenge with 2 players and a 60-second timer. Verify that when the timer reaches zero, the player with more correct answers is declared the winner.

**Acceptance Scenarios**:

1. **Given** Head-to-Head mode is selected, **When** the round begins, **Then** both players see a shared countdown timer and their individual score tally side by side.
2. **Given** a running Head-to-Head round, **When** a player answers correctly, **Then** their score updates immediately without interrupting the opponent's view.
3. **Given** the timer expires, **When** the round ends, **Then** the system announces the winner (or "Tie!" if scores are equal) with a clear visual celebration.

---

### User Story 3 — Countdown Timer Challenge Game (Priority: P2)

A dedicated "Beat the Clock" game mode where all players race against a shared countdown — e.g., name as many items in a category as possible before the timer hits zero. One player speaks answers aloud while another taps to confirm each one. The team's score is the number of confirmed answers.

**Why this priority**: Adds a new cooperative/party game type that families frequently enjoy (similar to classic party games), complementing the existing solo-skill games.

**Independent Test**: Launch "Beat the Clock", choose the "Animals" category, set a 30-second timer, and confirm 5 answers before time runs out. Verify the score shows 5 at the end.

**Acceptance Scenarios**:

1. **Given** Beat the Clock mode, **When** a round starts, **Then** a large visible countdown timer and a prompt/category are displayed prominently.
2. **Given** the round is running, **When** the confirmer taps "Got it!", **Then** the score increments by 1 and the next prompt appears immediately.
3. **Given** the timer reaches zero, **When** time is up, **Then** the game ends and shows the team's final count along with a best-score comparison.

---

### User Story 4 — Improved Number Sequence Game (Priority: P3)

Enhancements to the existing Number Sequence game: selectable difficulty (Easy / Medium / Hard), a visual hint system that can be toggled, and an animated progress bar showing time remaining per puzzle (instead of a fixed 90-second total).

**Why this priority**: The sequence game is specifically mentioned in the user request. These improvements make it more accessible for younger children (Easy) and more engaging for older players (Hard + time pressure per puzzle).

**Independent Test**: Start Number Sequence on Hard difficulty. Verify puzzles are noticeably more complex, each puzzle has an individual countdown bar, and toggling the hint button reveals/hides the pattern type.

**Acceptance Scenarios**:

1. **Given** the Number Sequence start screen, **When** a player selects "Easy", **Then** only arithmetic sequences (adding/subtracting) are presented.
2. **Given** a puzzle is displayed, **When** the player taps "Hint", **Then** the pattern type (e.g., "+3 each time") is shown, but 5 bonus points are deducted from the potential score.
3. **Given** Hard difficulty, **When** a per-puzzle timer expires without an answer, **Then** the puzzle is marked incorrect and the next one loads immediately.

---

### User Story 5 — Family Leaderboard & Player Profiles (Priority: P3)

A persistent family leaderboard that tracks named player profiles (not tied to login accounts) and their best scores across all games. Players can add, rename, or remove profiles. The leaderboard shows rank, best-game highlights, and total wins.

**Why this priority**: Encourages ongoing engagement — families return to beat their own records. Builds on the existing per-game scoreboard.

**Independent Test**: Create a profile named "Dad", play two games, then view the family leaderboard and confirm "Dad" appears with the correct scores and game highlights.

**Acceptance Scenarios**:

1. **Given** the games home screen, **When** a player opens "Family Leaderboard", **Then** a ranked list of all named profiles is shown with their total wins and top-score game.
2. **Given** a profile exists, **When** that profile achieves a new personal best, **Then** the scoreboard updates and shows a "New Best!" badge on that entry.
3. **Given** a profile, **When** the user selects "Remove", **Then** the profile and all its scores are deleted after a confirmation prompt.

---

### Edge Cases

- What happens when only 1 player name is entered in tournament setup? The system should require a minimum of 2 players and show an inline error.
- What if a player abandons the game mid-turn (e.g., navigates away)? The session should be paused; upon returning, the player can resume or forfeit that turn.
- What happens in Head-to-Head if the game type doesn't support a score (e.g., Maze Runner)? Head-to-Head mode should only be offered for compatible score-based games.
- What if the Beat the Clock category list is exhausted? The system should cycle prompts or display a "no more prompts" message and end the round early.
- What if two players have identical total scores at tournament end? Both are co-winners and displayed with equal rank.

---

## Requirements *(mandatory)*

### Functional Requirements

**Multiplayer Session**

- **FR-001**: System MUST allow 2–6 named players to be registered for a tournament session before any game starts.
- **FR-002**: System MUST present a "Pass to [Player Name]" handoff screen between every player turn so that scores are not seen in advance.
- **FR-003**: System MUST calculate and display a final ranked leaderboard at the end of a full tournament round.
- **FR-004**: System MUST persist the active tournament session locally so it survives accidental navigation away and can be resumed.
- **FR-005**: System MUST allow the host to choose which games are included in a tournament and how many rounds to play.

**Head-to-Head Mode**

- **FR-006**: System MUST support a Head-to-Head mode for games where a numeric score is produced (Trivia, Math, Number Sequence, Anagram, Color Match).
- **FR-007**: System MUST display a shared countdown timer visible to both players simultaneously during a Head-to-Head round.
- **FR-008**: System MUST announce the winner (or tie) clearly at round end with per-player score comparison.

**Beat the Clock Game**

- **FR-009**: System MUST provide a dedicated Beat the Clock game with at least 5 prompt categories (e.g., Animals, Foods, Countries, Colors, Movies).
- **FR-010**: System MUST include a configurable countdown (30 / 60 / 90 seconds) selectable before each round.
- **FR-011**: System MUST allow one player to act as "confirmer" by tapping a large button to count valid answers during the round.

**Number Sequence Improvements**

- **FR-012**: System MUST offer three difficulty levels for Number Sequence: Easy (arithmetic only), Medium (existing mix), Hard (geometric + compound patterns with shorter per-puzzle timers).
- **FR-013**: System MUST provide an optional per-puzzle countdown bar for Medium and Hard difficulties.
- **FR-014**: System MUST include a toggleable hint that reveals the sequence pattern at the cost of a score penalty.

**Family Profiles & Leaderboard**

- **FR-015**: System MUST allow named player profiles to be created, renamed, and deleted without requiring account login.
- **FR-016**: System MUST persist player profiles and their best scores locally, surviving app restarts.
- **FR-017**: System MUST display a combined family leaderboard ranked by total tournament wins, with a per-game best-score breakdown.
- **FR-018**: System MUST highlight a "New Personal Best" indicator when a player beats their own previous high score.

### Key Entities

- **Player Profile**: A named local identity (no login required) with a display name, avatar color, total wins, and a map of game-type to personal-best score.
- **Tournament Session**: A group of 2–6 player profiles, a selected game list, round count, current round index, and per-player accumulated scores for the session.
- **Head-to-Head Round**: Two players, one game type, a shared duration, and each player's score snapshot at the end.
- **Beat the Clock Round**: A category, a duration, a list of prompts, confirmed count, and timestamp.
- **Score Entry**: Player profile reference, game type, score, time taken, difficulty, and date — used by the leaderboard.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A family of 3 players can set up and complete a 3-game tournament in under 10 minutes of total play time.
- **SC-002**: The "Pass to Player" handoff screen prevents the next player from seeing the previous player's score until they explicitly tap to proceed.
- **SC-003**: The final tournament leaderboard is displayed within 1 second of the last player completing their last turn.
- **SC-004**: Beat the Clock round setup (choose category + duration) takes no more than 3 taps from the game selection screen.
- **SC-005**: Player profiles and tournament history persist correctly across at least 10 consecutive app sessions without data loss.
- **SC-006**: The Number Sequence game's Easy difficulty is completable by a child aged 7+ without adult help on at least 70% of first attempts.
- **SC-007**: All multiplayer screens pass accessibility standards — all interactive targets meet minimum touch size, labels are present for screen readers, and color is not the sole differentiator for player identity.

---

## Assumptions

- All multiplayer modes are **same-device, pass-and-play** — no network or Bluetooth required. Real-time networked multiplayer is out of scope.
- Player profiles are stored **locally** (no Firestore sync required). If a user is signed in, profiles may optionally be associated with their account, but this is a stretch goal.
- Beat the Clock prompts are **bundled** in the app (no external API call at runtime). Categories can be extended by adding to a data file.
- The existing 12 games remain available in solo mode unchanged. This spec only adds new modes layered on top.
- Head-to-Head mode uses **alternating turns on one device** (not simultaneous input), as simultaneous dual-input on one touchscreen is impractical for most games.
- The minimum supported player count for tournament and head-to-head modes is **2**; maximum is **6** for tournaments and **2** for head-to-head.
