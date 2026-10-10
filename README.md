# Clankers DSA Visualizer

Clankers is an interactive algorithm lab for learning data structures one operation at a time. The current Assignment 3 application includes complete Linked List, Stack, Queue, and Priority Queue vertical slices: learners can build each structure, inspect deterministic algorithm steps, control playback, and connect every transition to its time and space complexity.

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

The Stack workspace supports:

- Push, Pop, Peek, and top-to-bottom inspection;
- clear underflow feedback for Pop and Peek on an empty stack;
- duplicate values, signed safe integers, sample data, reset, and a 50-item readability limit;
- stable item identities, immutable snapshots, highlighted top/visited states, operation output, and correct complexity metadata;
- independent state that remains available when switching between Stack and Linked List.

The Queue workspace supports:

- Enqueue, Dequeue, Peek front, and front-to-rear inspection;
- clear underflow feedback for Dequeue and Peek front on an empty queue;
- duplicate values, signed safe integers, sample data, reset, and a 50-item readability limit;
- a horizontal FIFO view with labelled front and rear, explicit enqueue and dequeue directions, and stable `queue-N` identities;
- `O(1)` Dequeue backed by a moving front index rather than `Array.prototype.shift`;
- independent state that remains available when switching between structures.

The Priority Queue workspace supports:

- a binary min-heap where smaller values have higher priority;
- Insert with step-by-step sift-up, Extract min with step-by-step sift-down, and Peek min;
- clear underflow feedback for Extract min and Peek min on an empty priority queue;
- duplicate values, signed safe integers, sample data, reset, and a 50-item readability limit;
- a tree view and the underlying heap array drawn together, with matching highlights and array indices;
- `O(log n)` Insert and Extract min and `O(1)` Peek min, matching the implementation.

Graph and Binary Search Tree remain visible as planned milestones.

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

`npm run check` runs TypeScript validation, ESLint, Prettier checks, unit/component tests, and a production build. The Playwright command runs complete Linked List, Stack, Queue, and Priority Queue flows at desktop and mobile viewport sizes. On a new machine, install the Playwright browser once with `npx playwright install chromium`.

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
├── structures/stack/          Stack model, validation, and operation service
├── structures/queue/          Queue model, validation, and operation service
├── structures/priority-queue/ Min-heap model, validation, and operation service
├── playback/                  Framework-independent state machine and React hook
├── registry/                  Available and planned structures
├── components/                Controls, SVG canvases, navigation, and inspector
├── workspaces/                Structure-specific React orchestration
├── App.tsx                    Structure selection and persistent workspaces
└── styles.css                 Design tokens and responsive application shell
```

- `LinkedListModel` owns list state and wraps `@datastructures-js/linked-list`.
- `StackModel` owns native LIFO storage behind a small class API.
- `QueueModel` owns FIFO storage as an array plus a moving front index, compacting consumed slots so Enqueue and Dequeue stay amortised `O(1)`.
- `LinkedListOperations` runs algorithms against a cloned model and records their steps.
- `StackOperations` uses the same result and snapshot contracts for Push, Pop, Peek, and Inspect all.
- `QueueOperations` follows the same contracts for Enqueue, Dequeue, Peek front, and Inspect all.
- `PriorityQueueModel` owns the binary min-heap and reports each comparison and swap to an optional observer; `PriorityQueueOperations` turns those events into narrated steps without duplicating the heap algorithm.
- `StepRecorder` freezes snapshots and step metadata to prevent later mutations from changing history.
- The playback reducer is independent of React; `usePlayback` only supplies timer lifecycle behavior.
- Each structure has an independent workspace, while navigation, playback controls, and the generic inspector are shared.
- `StructureDefinition` provides a consistent registration point for available and planned data structures.

The UI uses React, native SVG, and ordinary CSS. There is no backend, database, global state library, animation library, graph-layout library, or utility-CSS framework in this milestone.

## Testing strategy

- Domain tests cover linked-list insertion/search/deletion/traversal Stack Push/Pop/Peek/inspection, Queue Enqueue/Dequeue/Peek front/inspection (including FIFO order across compaction), and Priority Queue insert/extract/peek (including heap-order checks after every change and ascending extraction with duplicates), including duplicates, empty cases, validation, capacity, stable IDs, immutable logs, and complexity metadata.
- Playback tests cover boundaries, restart, completion, speed changes, and timer cleanup.
- Component tests cover inline validation, synchronized panels, disabled operations, underflow, structure switching, state preservation, automatic playback, and keyboard order.
- Playwright verifies all four main learner flows on desktop and mobile.

## Roadmap

1. Review shared operation-panel and workspace patterns now that four structures exist.
2. Add Binary Search Tree with a value-driven tree layout.
3. Add Graph traversal with an explicit graph-layout strategy.
4. Expand cross-structure accessibility, performance, and browser evidence.

See [PROJECT_UPDATES.md](PROJECT_UPDATES.md) for the decision log, evidence, assumptions, and known risks.
