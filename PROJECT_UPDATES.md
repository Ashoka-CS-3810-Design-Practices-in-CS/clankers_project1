# Project Updates

## 2026-10-15: Practice mode on all six structures

### Completed changes

- Added an optional **Practice mode** to the Linked List workspace. When it is on, playback holds at up to three key steps of each trace and asks the learner to predict the next step from three options. After answering, the learner sees whether they were right and why, then reveals the step. A running score is shown in the practice bar.
- Questions exist for every Linked List operation: insert at head (one reference changes, O(1)), insert at tail (walk from the head because there is no tail pointer), search and delete (match, no match, or reach null), delete's unlink (only the first match is removed), and traverse (next node and output, or null).
- Practice mode now also covers **Stack** and **Queue**. Questions target LIFO versus FIFO: after a push or enqueue, which item leaves first; after a pop or dequeue, which item is the new top or front; whether peek removes anything; and the order Inspect all follows (top down, or front to rear). One builder, `src/practice/containerPractice.ts`, serves both, with structure-specific wording.
- Practice mode now also covers the **Binary Search Tree** (`BstPractice.ts`). Walk questions test the ordering rule at each comparison (smaller goes left, larger goes right, equal stops), with distractors that reverse the rule or send equal values down a subtree. Decisive questions cover a search that runs into an empty child, where an insert attaches, duplicates raising the count, and all four deletion cases (leaf, one child, two children by inorder successor, lowering a count). Traversal questions ask for the next node, using where the other two orders would be at that point as distractors.
- Practice mode now also covers the **Priority Queue** (`PriorityQueuePractice.ts`). Insert asks where a new value is placed first (the next open leaf, not the root or a sorted position), then predicts each sift-up comparison and the stop at the root. Extract min asks what refills the root (the last item, not the smaller child), then predicts each sift-down comparison against the smaller child, with the larger child as a distractor, and the stop at a leaf. Questions are never asked at a compare step, because its narration already says whether it swaps.
- Practice mode now also covers the **Graph** (`GraphPractice.ts`) for BFS and DFS; adding or removing vertices and edges has nothing to predict. BFS asks which vertex is visited next before each dequeue, with the most recently queued vertex (stack thinking) and undiscovered vertices as distractors, then what an empty queue means, using an unreachable vertex as a distractor when the graph is disconnected. DFS asks, whenever the search sits on a vertex, whether it goes deeper and to which neighbour, or backtracks. Distractors are a later neighbour in label order, a BFS-style jump to a non-neighbour, and revisiting a visited neighbour. DFS questions are asked before the "follow edge" step, because that step's narration names the vertex.
- The practice state and toggle moved into a shared `usePractice` hook and `PracticeBar` component, so each workspace adds practice with a few lines. Element ids are prefixed per workspace because all workspaces stay mounted.
- `playbackReducer` gained `checkpoints`, a `question` phase, and a `resolve` action. Next, Play, and autoplay ticks do not advance past an unresolved checkpoint; Previous still works.

### Architectural decisions

- Answers are graded against the trace that already exists: the correct option for the question at step _k_ is derived from step _k + 1_. No answer key is written by hand and nothing is graded with free text.
- `src/practice/practice.ts` is structure-agnostic (question types, checkpoint selection, option rotation, scoring). Each structure supplies a question builder; the Linked List one is `LinkedListPractice.ts`. Other structures can add practice without changing the reducer or the panel.
- Checkpoints are chosen deterministically: decisive steps (a match, reaching null, a link changing) first, then routine steps spread across the trace, three at most. Options are rotated by step index so the correct answer is not always first. Empty lists ask nothing.
- Distractors target common misconceptions: a stored tail pointer, delete removing every copy, search continuing after a match, traversal looping back to the head.

### Testing evidence

- Unit tests for checkpoint selection, option rotation, scoring, every Linked List question type, and the reducer's checkpoint behaviour; component tests for holding, grading, focus, and the score; a Playwright test (desktop and mobile) that runs a full practice search and audits the question state with axe-core (no violations).

### Limitations

- The score is per session and is not saved.

## 2026-10-10: Assignment 3 verification and hardening

### Completed changes

- Added a worst-case trace benchmark (`src/performance/`) that generates the most expensive trace each structure allows at its interface limit and fails if any median exceeds one 16 ms frame.
- The benchmark found that Graph BFS and DFS on the complete graph K12 took about 15 ms and 16 ms per trace, close to a full frame. `GraphModel` now shares one frozen vertex list and edge list between snapshots until the graph changes, which brought both under 1 ms.
- `GraphModel` now finds vertices through maps instead of scanning the vertex list, and BFS dequeues with a moving head index instead of `Array.prototype.shift`, so the code matches the displayed `O(V + E)`.
- Integer input is now parsed strictly: an optional sign followed by decimal digits. Inputs such as `1e3`, `0x10`, and `2.5`, which `Number()` used to accept or round, are rejected with a specific message.
- Added an automated WCAG 2.1 A/AA audit with axe-core for every workspace, at desktop and mobile sizes, empty and part-way through a trace.
- The audit found three text colours just below the 4.5:1 contrast minimum (the idle phase label and the empty-state placeholders). They were darkened, and a full sweep of six workspaces in four states at two viewport sizes now reports zero violations.
- Screenshot review showed that on a phone the Binary Search Tree opened scrolled to its left edge, hiding the root and the node being compared; a full heap had the same problem. Both canvases now keep the current node (or the root) in view through a small `useKeepInView` hook, covered by a new Playwright test.
- Added a GitHub Actions workflow that runs `npm run check` and the Playwright suite on every push to `main` and every pull request.

### Worst-case trace measurements

Medians of 31 runs in Node 22 (Vitest), after a warm-up. Snapshot entries count every array element across all recorded snapshots, so shared lists are counted once per step.

| Worst case                               | Steps | Snapshot entries | Median (ms) |
| ---------------------------------------- | ----- | ---------------- | ----------- |
| Linked List: insert tail at 49 nodes     | 51    | 2,500            | 0.51        |
| Linked List: traverse 49 nodes           | 51    | 2,499            | 0.51        |
| Stack: inspect all 50 items              | 52    | 2,600            | 0.37        |
| Queue: inspect all 50 items              | 52    | 2,600            | 0.37        |
| BST: insert into 30-node skewed tree     | 32    | 961              | 0.15        |
| BST: inorder traversal of 31 nodes       | 33    | 1,023            | 0.14        |
| Priority Queue: insert new minimum at 49 | 13    | 649              | 0.14        |
| Priority Queue: extract min at 50        | 13    | 638              | 0.14        |
| Graph: BFS on complete graph K12         | 146   | 12,115           | 0.76        |
| Graph: DFS on complete graph K12         | 158   | 13,315           | 0.51        |

Before the snapshot-sharing change, the two graph traversals took 15.19 ms and 16.20 ms.

### Testing evidence

Evidence recorded on 2026-10-10:

- TypeScript, ESLint, and Prettier checks passed; 142 Vitest tests in 15 files passed; the production build succeeded.
- Playwright passed 30 checks: 15 tests (six learner flows, one reduced-motion check, six accessibility audits, and two keep-in-view checks) on desktop Chrome and a Pixel 7 profile.
- The production build emitted approximately 311.99 kB of JavaScript (88.56 kB gzip) and 17.73 kB of CSS (4.39 kB gzip).

### Remaining limitations

- Automated accessibility checks cover only part of WCAG. A manual screen-reader pass (VoiceOver and NVDA) has not been recorded.
- Only Chromium is tested. Firefox and WebKit projects can be added to `playwright.config.ts` when CI time allows.

## 2026-10-10: Graph vertical slice

### Completed changes

- Added a Graph workspace for undirected, unweighted graphs with Add vertex, Remove vertex, Add edge, Remove edge, BFS, DFS, sample data, and reset.
- BFS narrates each dequeue, each newly discovered neighbour, and each neighbour skipped because it was already discovered.
- DFS narrates each visit, each edge followed deeper, each already-visited neighbour skipped, each backtrack, and each pop from the call stack.
- The current BFS queue or DFS call stack is drawn under the graph at every step, and the inspector shows the visit order.
- Traversals report how many vertices are unreachable from the chosen start.
- Moved Graph from planned to available; all six structures are now implemented.
- Added domain, component, desktop, and mobile browser coverage, and extended the keyboard-order test.
- Fixed the Binary Search Tree browser test, which matched the "Queue, ready" button by substring and so also matched "Priority Queue, ready".

### Architecture and design considerations

- `GraphModel` stores adjacency lists keyed by stable `vertex-N` IDs. Labels are unique integers, because a graph vertex is identified by its label rather than by insertion position.
- Adjacency lists are kept sorted by label, so BFS and DFS explore neighbours in ascending order and every trace is reproducible.
- Edge IDs are derived from both vertex IDs in a fixed order, so an undirected edge has one ID however it is referenced. Steps highlight edges by putting those IDs into the existing `activeNodeIds` and `visitedNodeIds` arrays, so no shared contract changed.
- The BFS queue and DFS call stack are stored in the snapshot as an optional `frontier`. Each step therefore carries the algorithm's working state as well as the graph.
- DFS is recursive, matching the textbook definition; recursion depth is bounded by the 12-vertex limit.
- Layout is a circle in insertion order, which needs no graph-layout dependency and keeps vertex positions stable while edges change. The circle grows with the vertex count.

### UX and accessibility decisions

- One field drives vertex operations and traversal starts, and a second field is used only for edges, so most operations need a single input.
- Validation explains duplicate labels, missing vertices, self-loops, existing or missing edges, the label range, and the vertex limit inline.
- The queue or stack is shown as text in order (front to rear, or bottom to top), not only as highlights.
- Vertex and edge states use the shared current, visited, and queued colours; the screen-reader list gives each vertex's neighbours.
- The SVG scales to the panel width, so the full graph stays visible on mobile without horizontal scrolling.

### Testing and performance evidence

Evidence recorded on 2026-10-10:

- TypeScript, ESLint, and Prettier checks passed; 113 Vitest tests passed; the production build succeeded.
- Playwright passed 14 browser checks across desktop and mobile, covering all six structures.
- The production build emitted approximately 311.00 kB of JavaScript (88.14 kB gzip) and 17.73 kB of CSS (4.39 kB gzip).

BFS and DFS run in `O(V + E)` time with `O(V)` auxiliary space. Their traces record a constant number of steps per vertex and per edge end, each holding a full snapshot, so trace memory is `O((V + E) × (V + E))`; the 12-vertex limit (at most 66 edges) bounds this.

### Risks, assumptions, and limitations

- Graphs are undirected and unweighted; there are no self-loops or parallel edges.
- Add edge and Remove edge report `O(V)` because sorted adjacency lists are scanned. A hash-set representation would be faster but would lose the deterministic neighbour order the traces rely on.
- The circular layout can produce crossing edges in dense graphs; positions do not adapt to reduce crossings.
- Component tests for full traversals advance 20 to 40 steps by real clicks, so that test file allows a 20-second timeout.

### Next implementation phases

1. Extract shared operation-panel and workspace patterns now that all six structures exist.
2. Consider directed and weighted graphs with shortest-path algorithms.
3. Collect cross-browser and assistive-technology evidence for all six structures.

## 2026-10-10: Priority Queue vertical slice

### Completed changes

- Added a Priority Queue workspace backed by a binary min-heap, with Insert, Extract min, Peek min, sample data, and reset.
- Insert narrates placement at the next open leaf and every parent comparison and swap during sift-up.
- Extract min narrates removing the root, moving the last item into the root, and every smaller-child comparison and swap during sift-down.
- Added actionable underflow narration for Extract min and Peek min on an empty priority queue.
- Added a native-SVG view that draws the heap as a tree and as its array, with indices and shared highlight states.
- Moved Priority Queue from planned to available in the structure registry and extended the keyboard-order test.
- Added domain, component, desktop, and mobile browser coverage.

### Architecture and design considerations

- `PriorityQueueModel` implements the heap itself rather than adding a dependency, keeping the algorithm visible and testable.
- The model accepts an optional `HeapObserver` that receives placement, comparison, swap, and settled events. Operations record a snapshot for each event, so narration stays in the operation layer and the sift logic exists in exactly one place.
- Smaller values have higher priority. Swaps happen only on strictly smaller values, so equal values do not move unnecessarily.
- `isValidHeap()` is exposed for tests, which assert heap order after every insert and extraction.
- Tree positions are computed from array indices (level `floor(log2(i + 1))`), the same index arithmetic the heap uses. Binary Search Tree keeps its own inorder-rank layout because its shape depends on values rather than array positions.

### UX and accessibility decisions

- The tree and array are drawn together because the array is how heaps are stored, and seeing both explains why a parent at index `i` has children at `2i + 1` and `2i + 2`.
- The root is labelled "min" in text, not by colour alone.
- During comparisons the moving item is marked as current and the item it is compared with is marked as compared, so each swap decision is visible before it happens.
- The screen-reader list gives each index, its value, and its parent index.
- Extract min and Peek min stay enabled on an empty priority queue so learners receive an underflow explanation.

### Testing and performance evidence

Evidence recorded on 2026-10-10:

- TypeScript, ESLint, and Prettier checks passed; 76 Vitest tests passed; the production build succeeded.
- Playwright passed 10 browser checks across desktop and mobile, including the full Priority Queue workflow.
- The production build emitted approximately 279.26 kB of JavaScript (80.68 kB gzip) and 14.27 kB of CSS (3.78 kB gzip).

Insert and Extract min record a constant number of steps per tree level, so a trace holds `O(log n)` snapshots of `O(n)` items each. The 50-item limit keeps the tree at six levels.

### Risks, assumptions, and limitations

- Priority is the value itself. Separate payloads with their own priorities are not modelled.
- Only a min-heap is offered; a max-heap toggle would need its own narration and tests.
- The bottom level of a full 50-item tree is wide, so the canvas scrolls horizontally on small screens.
- Five workspaces are now permanently mounted; this is still cheap at the current item limits but should be revisited before Graph.

### Next implementation phases

1. Extract a shared single-value operation panel from the Stack, Queue, and Priority Queue panels.
2. Implement Graph traversal with an explicit layout strategy.

## 2026-10-10: Binary Search Tree vertical slice

### Completed changes

- Added ordered Insert, Search, Delete, Inorder, Preorder, and Postorder operations with deterministic playback.
- Added stable `bst-N` identities, duplicate counts, signed safe integers, sample/reset actions, and a 31-node visual limit.
- Added a responsive native-SVG tree, comparison-path highlights, textual relationships, output, narration, and worst-case complexity.
- Added domain, component, and desktop/mobile browser coverage; Binary Search Tree is now available in navigation.

### Design decisions

- `BstModel` encapsulates mutable links; operations clone the model and record immutable snapshots before React renders them.
- Duplicates increment one node's count. Delete decrements that count before changing links.
- Two-child deletion transplants the inorder successor and preserves its stable ID.
- Inorder rank sets horizontal position and depth sets vertical position. This avoids a graph-layout dependency and gives deterministic, non-overlapping nodes.
- Insert, Search, and Delete report worst-case `O(n)` because this is an unbalanced BST. Traversals report `O(n)` time and auxiliary space.

### UX, performance, and limits

- The tree scrolls inside its canvas on narrow screens and exposes an SVG description plus a screen-reader node list.
- The 31-node limit bounds tree height, canvas size, and full-snapshot playback memory while keeping five-level examples readable.
- Full snapshots favour clear replay over minimal memory. Skewed trees still require internal scrolling and can demonstrate linear worst-case behavior.
- Interface review corrected wide-tree clipping and changed playback progress from width animation to transform animation.

### Verification

- `npm run check` passed TypeScript, ESLint, Prettier, 74 Vitest tests, and the production build.
- Playwright passed 10 desktop/mobile checks, including the complete BST workflow and reduced-motion coverage.
- Production output is approximately 280.45 kB JavaScript (81.07 kB gzip) and 14.72 kB CSS (3.88 kB gzip).

### Next

1. Implement Priority Queue with a heap-specific model and layout.
2. Select and test a Graph layout before adding BFS and DFS.
3. Reassess persistent mounted workspaces and shared operation-panel extraction.

## 2026-10-10: Queue vertical slice

### Completed changes

- Added a complete Queue workspace with Enqueue, Dequeue, Peek front, Inspect all, sample data, and reset.
- Added actionable underflow narration for Dequeue and Peek front on an empty queue.
- Added stable `queue-N` item IDs, duplicate-value support, signed safe integers, and a 50-item educational limit.
- Added a horizontal native-SVG Queue view with labelled front and rear positions and explicit enqueue and dequeue directions.
- Moved Queue from planned to available in the structure registry; all three workspaces keep independent state.
- Added Queue domain, component, desktop, and mobile browser coverage, and extended the keyboard-order test to include the new navigation item.

### Architecture and design considerations

- `QueueModel` stores items in an array with a moving front index. Dequeue advances the index instead of calling `Array.prototype.shift`, which re-indexes every remaining element. Consumed slots are compacted when they reach half of the backing array, so Enqueue and Dequeue are amortised `O(1)` and the displayed complexity matches the implementation.
- `QueueOperations` reuses the clone-record-result pattern, `OperationResult`, `StepRecorder`, the playback engine, and the generic inspector without changes to shared code.
- Snapshots expose items front to rear, so the canvas and Inspect all output need no reordering.
- The Queue operation panel stays separate from the Stack panel. The two are now structurally almost identical (one value input, one insert action, three read/remove actions, sample and reset), which is the evidence the previous entry asked for before extracting a shared form.

### UX and accessibility decisions

- Front and rear are labelled in text above the items; a single item is labelled "front · rear".
- Dashed arrows on each side show that items leave on the left and join on the right, so direction is not conveyed by position alone.
- The SVG has a front-to-rear text description and an ordered screen-reader list.
- Dequeue and Peek front stay enabled on an empty queue so learners get an underflow explanation rather than a disabled control.
- The canvas reuses the horizontal scroll container from the Linked List view, so long queues scroll inside the panel without page-level overflow on mobile.
- Queue uses its own input label ("Queue value") and output heading ("Queue output") so labels stay unique while all workspaces remain mounted.

### Testing and performance evidence

Evidence recorded on 2026-10-10:

- TypeScript, ESLint, and Prettier checks passed; 58 Vitest tests passed; the production build succeeded.
- Playwright passed 8 browser checks across desktop and mobile, including the full Queue workflow.
- The production build emitted approximately 266.70 kB of JavaScript (78.38 kB gzip) and 13.49 kB of CSS (3.67 kB gzip).

Enqueue, Dequeue, and Peek front record constant-size traces. Inspect all records a snapshot per visited item, giving approximately `O(n²)` snapshot memory, bounded by the 50-item limit as for Stack.

### Risks, assumptions, and limitations

- Amortised `O(1)` relies on the compaction rule; an individual Dequeue that triggers compaction copies the live items. This cost is not animated.
- Inspect all is an educational operation rather than part of a minimal queue interface.
- Three workspaces are now permanently mounted. This is still inexpensive at the 50-item limit but should be revisited before more structures become available.

### Next implementation phases

1. Extract a shared single-value operation panel from the Stack and Queue panels, keeping Linked List separate if its search and delete actions do not fit.
2. Decide whether inactive workspaces should move to a persisted state store.
3. Continue with Priority Queue, Binary Search Tree, and Graph.

## 2026-10-10: Stack vertical slice

### Completed changes

- Added a complete Stack workspace with Push, Pop, Peek, Inspect all, sample data, and reset.
- Added actionable underflow narration for empty Pop and Peek operations.
- Added stable Stack item IDs, duplicate-value support, signed safe integers, and a 50-item educational limit.
- Added a vertical native-SVG Stack view with explicit top, current, visited, and top-item states.
- Made Linked List and Stack independently stateful so learners can switch structures without losing either model or operation trace.
- Generalized the operation inspector for structure-specific output headings, empty-state guidance, and result labels.
- Made playback actions stable React callbacks and automatically paused playback when its workspace becomes inactive.
- Added Stack domain, component, desktop, and mobile browser coverage.

### Architecture and design considerations

- `StackModel` encapsulates native array storage instead of adding another runtime dependency. The public API exposes only stack operations and immutable snapshots.
- `StackOperations` follows the existing clone-record-result pattern, proving that `OperationResult`, `VisualizationStep`, `StepRecorder`, and the playback engine are reusable without a common model base class.
- Values and identities remain separate. Duplicate values are safe because visual state targets stable `stack-N` IDs.
- Stack items are stored bottom-to-top internally and reversed only for top-to-bottom visualization and inspection output.
- Structure-specific React orchestration moved into persistent workspace components. This keeps domain types narrow while allowing navigation and shared presentation components to stay generic.
- The Stack operation panel remains separate from the Linked List panel because their actions and instructional copy differ. A generic form abstraction is deferred until Queue shows which patterns are actually shared.
- Stack uses the established algorithm-lab visual system. The canvas changes orientation to express LIFO behavior without changing the shell, semantic colors, focus behavior, or playback language.

### UX and accessibility decisions

- The top item is labeled textually and spatially, not by color alone.
- SVG includes a top-to-bottom text description and an ordered screen-reader equivalent.
- Pop and Peek remain enabled on an empty stack so learners receive an explanation of underflow instead of an unexplained disabled control.
- The Stack canvas scrolls vertically for larger examples and scales to the mobile content width without causing page-level horizontal overflow.
- Switching structures pauses active playback and preserves the current model, step, speed, and narration for both workspaces.
- Operation output adapts to Peek, Pop, and Inspect all rather than reusing linked-list traversal terminology.

### Testing and performance evidence

Evidence recorded on 2026-10-10:

- `npm run check` passed TypeScript, ESLint, Prettier, 39 Vitest tests, and the production build.
- `npm run test:e2e` passed 6 browser checks across desktop and mobile, including full Linked List and Stack workflows plus reduced-motion behavior.
- The Impeccable detector returned no findings after the responsive interface review.
- The production build emitted approximately 255.91 kB of JavaScript (77.09 kB gzip) and 12.88 kB of CSS (3.60 kB gzip).

Push, Pop, and Peek record constant-size traces and retain `O(1)` operation complexity. Inspect all records a snapshot per visited item, so its trace uses approximately `O(n²)` snapshot memory. The 50-item interface limit bounds this deliberate educational tradeoff.

### Risks, assumptions, and limitations

- The visualizer models a conventional array-backed stack; resizing cost is abstracted by JavaScript arrays and not animated.
- Inspect all is an educational operation rather than a mutation normally exposed by minimal stack interfaces.
- Both workspaces remain mounted to preserve state. This is inexpensive for 2 bounded structures but should be revisited as more structures become available.
- A paused trace remains incomplete when the learner returns to a structure, so mutations stay locked until the trace is completed or restarted.
- Large values are valid safe integers but may need more horizontal room than short classroom examples inside SVG items.

### Next implementation phases

1. Implement Queue as the third complete vertical slice.
2. Compare Linked List, Stack, and Queue operation panels before extracting any shared form abstraction.
3. Decide whether inactive workspaces should move to a persisted state store as the available structure count grows.
4. Continue with Priority Queue, Binary Search Tree, and Graph using structure-specific layout strategies.

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
