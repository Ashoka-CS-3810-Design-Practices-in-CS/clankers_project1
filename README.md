# Clankers DSA Visualizer

Clankers is an interactive algorithm lab for learning data structures one operation at a time. The current milestone delivers a complete linked-list vertical slice for Assignment 3: learners can build a list, inspect deterministic algorithm steps, control playback, and connect each transition to its time and space complexity.

## Current scope

The Linked List workspace supports:

- insertion at the head and tail;
- first-match search and deletion, including duplicate values;
- full traversal with visible output;
- sample data and reset actions;
- signed safe integers and a 50-node readability limit;
- play, pause, previous, next, restart, and playback speed controls;
- immutable snapshots, stable node identities, narration, visited/active states, and per-operation complexity;
- keyboard access, screen-reader status updates, reduced-motion preferences, and responsive desktop/mobile layouts.

Graph, Binary Search Tree, Priority Queue, Stack, and Queue are visible in the structure registry as planned milestones. They are intentionally not implemented yet.

## Run locally

Requirements: a current Node.js LTS release and npm.

```bash
npm install
npm run dev
```

Vite prints the local address after startup.

## Verification commands

```bash
npm run check
npm run test:e2e
```

`npm run check` runs TypeScript validation, ESLint, Prettier checks, unit/component tests, and a production build. The Playwright command runs the complete linked-list smoke flow at desktop and mobile viewport sizes. On a new machine, install the Playwright browser once with `npx playwright install chromium`.

Useful individual commands:

```bash
npm run typecheck
npm run lint
npm run format
npm run test
npm run test:watch
npm run build
```

## Architecture

The code separates algorithm behavior from rendering so the same deterministic steps can be tested without a browser.

```text
src/
├── domain/                    Shared visualization contracts and StepRecorder
├── structures/linked-list/    Model, validation, and operation service
├── playback/                  Framework-independent state machine and React hook
├── registry/                  Available and planned structures
├── components/                Controls, SVG canvas, navigation, and inspector
├── App.tsx                    Workspace orchestration
└── styles.css                 Design tokens and responsive application shell
```

- `LinkedListModel` owns list state and wraps `@datastructures-js/linked-list`.
- `LinkedListOperations` runs algorithms against a cloned model and records their steps.
- `StepRecorder` freezes snapshots and step metadata to prevent later mutations from changing history.
- The playback reducer is independent of React; `usePlayback` only supplies timer lifecycle behavior.
- `StructureDefinition` provides a consistent registration point for later data structures.

The UI uses React, native SVG, and ordinary CSS. There is no backend, database, global state library, animation library, graph-layout library, or utility-CSS framework in this milestone.

## Testing strategy

- Domain tests cover insertion, duplicate handling, first-match search/deletion, empty and missing cases, validation, capacity, traversal, stable IDs, immutable logs, and complexity metadata.
- Playback tests cover boundaries, restart, completion, speed changes, and timer cleanup.
- Component tests cover inline validation, synchronized panels, disabled operations, automatic playback, and keyboard order.
- Playwright verifies the main learner flow on desktop and mobile.

## Roadmap

1. Extract the shared visualizer shell after validating it with a second structure.
2. Add Stack and Queue using the shared contracts and playback engine.
3. Add Priority Queue and Binary Search Tree with structure-specific SVG layouts.
4. Add Graph traversal with an explicit graph-layout strategy.
5. Expand cross-structure accessibility, performance, and browser evidence.

See [PROJECT_UPDATES.md](PROJECT_UPDATES.md) for the decision log, evidence, assumptions, and known risks.
