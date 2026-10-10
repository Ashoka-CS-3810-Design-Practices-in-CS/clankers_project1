# Project Updates

## 2026-10-10: Assignment 3 application foundation

### Completed changes

- Created the `anurag` delivery branch and split the implementation into independently pushed sections.
- Scaffolded React, TypeScript, and Vite without a UI framework.
- Completed the Linked List vertical slice: head/tail insertion, first-match search/delete, traversal, sample data, reset, validation, and a 50-node limit.
- Added deterministic step recording with immutable snapshots, stable node IDs, narration, traversal output, highlighted states, and complexity metadata.
- Added play/pause, previous/next, restart, and speed controls with explicit paused, playing, and complete states.
- Added a structure registry with Graph, Binary Search Tree, Priority Queue, Stack, and Queue marked as planned.
- Added a responsive algorithm-lab interface with keyboard focus, screen-reader announcements, reduced-motion handling, and text equivalents for the SVG state.
- Added unit, component, and desktop/mobile browser tests.
- Added project-local interface-design skills under `.codex/skills` so future work can use the same review standards.

### Dependencies and justification

Runtime dependencies are deliberately small:

- `react` and `react-dom` provide the component model and accessible interface composition.
- `@datastructures-js/linked-list` supplies the linked-list implementation wrapped by the project domain model.

Development dependencies support a typed, reproducible quality loop:

- TypeScript catches contract and state mismatches before runtime.
- Vite supplies the development server and production bundling.
- Vitest and Testing Library verify domain logic and user-observable component behavior.
- Playwright verifies the full workflow at desktop and mobile viewport sizes.
- ESLint and Prettier keep correctness rules and formatting consistent.

No state-management, animation, graph-layout, backend, database, component-library, or utility-CSS dependency was added. The current problem does not justify their runtime and maintenance cost.

### Architectural decisions

- Domain logic is independent of React. Operations return an `OperationResult` rather than changing the interface directly.
- `LinkedListModel` is the single owner of linked-list mutation and hides the external package behind project-specific methods.
- Each stored value receives a stable ID. Values are not identities, so duplicate values remain visually and logically distinguishable.
- Operations use a cloned working model. The committed model and the displayed step can therefore remain synchronized without partially applying an operation.
- `StepRecorder` creates frozen copies of snapshots and metadata. Playback history is deterministic and cannot drift when later state changes.
- Structure-changing controls are disabled until the current operation reaches completion. This prevents overlapping operations from producing model/render divergence.
- Playback is a reducer-driven state machine. Timer creation and cleanup live in a thin hook, leaving transitions directly unit-testable.
- The structure registry defines a common entry point for future modules while avoiding premature inheritance hierarchies before a second implementation reveals the genuinely shared behavior.

### Differences from Assignment 2

Assignment 2 described the broader six-structure product direction. This milestone turns that direction into a working, testable foundation and narrows implementation to one complete vertical slice.

- The design now has executable domain contracts, not only screen-level concepts.
- Animation is represented as deterministic snapshots instead of being coupled to CSS or component timing.
- Duplicate handling required stable item IDs rather than treating a numeric value as a node identity.
- The selected linked-list package does not maintain a tail reference, so tail insertion is documented as `O(n)` rather than assuming `O(1)`.
- A 50-node limit was added for educational readability and bounded snapshot cost; this is a UI constraint, not an algorithmic constraint of linked lists.
- Operations are locked during playback to protect state consistency.
- The initial architecture uses composition and typed contracts. A common abstract base class is deferred until another structure provides evidence for the correct abstraction.
- Accessibility, responsive behavior, automated tests, and measurable acceptance checks are now implementation requirements rather than future design notes.

### UX and accessibility decisions

- The interface follows an algorithm-lab/developer-tool direction: a dark neutral shell, calm high-contrast canvas, monospaced metadata, and restrained semantic colors.
- The desktop workspace keeps navigation, operations, visualization, explanation, complexity, and playback visible together. Narrow layouts stack the inspector and collapse structure navigation into a compact horizontal region.
- Active, visited, found, and removed states use labels and shapes in addition to color.
- SVG content has a programmatic text description of the current list.
- Validation and not-found messages are inline and actionable; status changes are announced to assistive technology.
- Controls are ordinary keyboard-operable buttons and inputs with visible focus treatment.
- Motion is limited to short state transitions and is removed when the operating system requests reduced motion.
- Empty states teach the next available action instead of showing a blank canvas.

### Testing and performance evidence

Evidence recorded on 2026-10-10:

- `npm run check` passed TypeScript, ESLint, Prettier, 25 Vitest tests, and the production build.
- `npm run test:e2e` passed 4 browser checks: the full workflow and reduced-motion behavior in both desktop and mobile Playwright projects.
- The production build emitted approximately 245.81 kB of JavaScript (75.41 kB gzip) and 12.12 kB of CSS (3.49 kB gzip).

The current performance model assumes at most 50 nodes and short educational sessions. Every visualization step stores a full list snapshot, making playback simple and deterministic at the cost of roughly `O(steps × nodes)` snapshot memory. At the enforced limit this tradeoff is acceptable and easier to reason about than replaying mutations. Larger structures may need compact deltas, checkpoints, or streamed step generation.

### Risks, assumptions, and limitations

- Only Linked List is implemented; the other five structures are navigation placeholders.
- Tail insertion is linear with the selected package. Replacing it with a tail-aware model would change both code and displayed complexity.
- Snapshot memory grows quadratically for operations that visit every node and record every intermediate state. The 50-node limit bounds this risk for the current milestone.
- The UI is optimized for education, not benchmarking or very large datasets.
- Playback commits the final model when an operation starts but locks other mutations until playback completes. Future cancellation or operation queues would need a more explicit transaction model.
- Native SVG layout is intentionally simple for a one-dimensional list. Trees and graphs will require separate layout decisions and performance tests.
- Browser automation currently covers Chromium-compatible behavior. Wider browser coverage remains future work.
- There is no persistence, account system, collaboration, analytics, or backend in this phase.

### Next implementation phases

1. Review the linked-list slice with learners and validate whether narration density, speed choices, and state colors are understandable.
2. Implement Stack and Queue to test which shell, operation, and snapshot concepts are truly reusable.
3. Extract proven shared components and service interfaces without forcing structure-specific algorithms into one inheritance tree.
4. Implement Priority Queue and Binary Search Tree, adding layout-specific tests.
5. Select and validate a graph-layout approach before implementing Graph, BFS, and DFS.
6. Add broader browser checks and collect performance measurements for branching structures.
