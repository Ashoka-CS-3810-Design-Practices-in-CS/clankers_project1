import type { VisualizationStep } from '../../domain/visualization';
import {
  arrangeOptions,
  chooseQuestions,
  type PracticeOption,
  type PracticeQuestion,
} from '../../practice/practice';
import type { GraphSnapshot, TraversalKind } from './GraphModel';
import type { GraphResult } from './GraphOperations';

type Step = VisualizationStep<GraphSnapshot>;

interface Draft {
  readonly prompt: string;
  readonly options: readonly PracticeOption[];
  readonly correctOptionId: string;
  readonly explanation: string;
  readonly decisive: boolean;
}

function labelOf(snapshot: GraphSnapshot, id: string): number | undefined {
  return snapshot.vertices.find((vertex) => vertex.id === id)?.value;
}

/** Neighbour labels of a vertex label, ascending (the order both searches use). */
function neighbourLabels(snapshot: GraphSnapshot, label: number): number[] {
  const id = snapshot.vertices.find((vertex) => vertex.value === label)?.id;
  const labels = snapshot.edges
    .filter((edge) => edge.from === id || edge.to === id)
    .map((edge) => labelOf(snapshot, edge.from === id ? edge.to : edge.from)!)
    .filter((value) => value !== undefined);
  return labels.sort((left, right) => left - right);
}

function allLabels(snapshot: GraphSnapshot): number[] {
  return snapshot.vertices.map((vertex) => vertex.value).sort((left, right) => left - right);
}

function frontierOf(step: Step): readonly number[] {
  return step.snapshot.frontier?.values ?? [];
}

function uniqueOptions(options: readonly PracticeOption[]): PracticeOption[] {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (seen.has(option.id) || seen.has(option.label)) return false;
    seen.add(option.id);
    seen.add(option.label);
    return true;
  });
}

function visitOption(label: number): PracticeOption {
  return { id: `visit-${label}`, label: `Visit ${label}` };
}

/** BFS: before each dequeue, which vertex is visited next? Then, what happens when the queue empties. */
function bfsDrafts(steps: readonly Step[]): Map<number, Draft> {
  const drafts = new Map<number, Draft>();
  const start = steps[1]?.output[0];
  for (let index = 1; index < steps.length - 1; index += 1) {
    const current = steps[index];
    const next = steps[index + 1];
    const queue = frontierOf(current);
    const visited = current.output;

    if (next.output.length > visited.length) {
      const answer = next.output.at(-1)!;
      const undiscovered = allLabels(current.snapshot).filter(
        (label) => !visited.includes(label) && !queue.includes(label),
      );
      const distractors = [queue.at(-1), queue[1], ...undiscovered].filter(
        (label): label is number => label !== undefined && label !== answer,
      );
      const options = uniqueOptions([
        visitOption(answer),
        ...distractors.map(visitOption),
        { id: 'finished', label: 'Nothing: BFS is finished' },
      ]).slice(0, 3);
      drafts.set(index, {
        prompt: `BFS has visited ${visited.join(', ')}. Which vertex is visited next?`,
        options,
        correctOptionId: `visit-${answer}`,
        explanation: `BFS dequeues from the front. The queue is [${queue.join(', ')}], so ${answer}, which was discovered earliest, is visited next. That is what makes BFS go layer by layer.`,
        decisive: visited.length === 1,
      });
      continue;
    }

    if (index === steps.length - 2 && queue.length === 0) {
      const unreached = allLabels(current.snapshot).filter((label) => !visited.includes(label));
      drafts.set(index, {
        prompt: `The queue is empty. What happens next?`,
        options: uniqueOptions([
          {
            id: 'done',
            label: `BFS is finished: every vertex reachable from ${start} has been visited`,
          },
          unreached.length > 0
            ? { id: 'restart', label: `Continue from ${unreached[0]}, which was never reached` }
            : { id: 'restart', label: `Start a second pass from ${start}` },
          { id: 'revisit', label: `Visit ${visited.at(-1)} again to check its neighbours` },
        ]),
        correctOptionId: 'done',
        explanation:
          unreached.length > 0
            ? `An empty queue means nothing reachable is left. ${unreached.join(', ')} ${unreached.length === 1 ? 'is' : 'are'} in a different component, so BFS from ${start} never reaches ${unreached.length === 1 ? 'it' : 'them'}.`
            : `An empty queue means every vertex reachable from ${start} has been discovered and visited exactly once.`,
        decisive: true,
      });
    }
  }
  return drafts;
}

/**
 * DFS: whenever the search is sitting on a vertex (just visited it, or back from a child),
 * does it go deeper, and where, or backtrack? Asked here because the next step's narration
 * already names the edge it follows.
 */
function dfsDrafts(steps: readonly Step[]): Map<number, Draft> {
  const drafts = new Map<number, Draft>();
  const start = steps[1]?.output[0];
  let askedFirstBacktrack = false;

  for (let index = 1; index < steps.length - 1; index += 1) {
    const current = steps[index];
    const stack = frontierOf(current);
    const activeId = current.activeNodeIds[0];
    const here = activeId === undefined ? undefined : labelOf(current.snapshot, activeId);
    if (current.activeNodeIds.length !== 1 || here === undefined || stack.at(-1) !== here) {
      continue;
    }

    // Find what happens first: a new vertex is visited, or this vertex is popped.
    let outcome: { kind: 'deeper'; to: number } | { kind: 'backtrack' } | undefined;
    for (let later = index + 1; later < steps.length; later += 1) {
      if (steps[later].output.length > current.output.length) {
        outcome = { kind: 'deeper', to: steps[later].output.at(-1)! };
        break;
      }
      if (frontierOf(steps[later]).length < stack.length) {
        outcome = { kind: 'backtrack' };
        break;
      }
    }
    if (!outcome) continue;

    const visited = current.output;
    const neighbours = neighbourLabels(current.snapshot, here);
    const unvisitedNeighbours = neighbours.filter((label) => !visited.includes(label));
    const visitedNeighbour = neighbours.find((label) => visited.includes(label));
    const farAway = allLabels(current.snapshot).find(
      (label) => !visited.includes(label) && !neighbours.includes(label),
    );
    const parent = stack.at(-2);
    const justVisited = visited.at(-1) === here && steps[index - 1].output.length < visited.length;
    const prompt = justVisited
      ? `DFS has just visited ${here} (order so far: ${visited.join(', ')}). What does it do next?`
      : `DFS is back at ${here}. What does it do next?`;
    const backtrack: PracticeOption = {
      id: 'backtrack',
      label:
        parent === undefined
          ? `Backtrack: pop ${here}, and the stack is empty`
          : `Backtrack: pop ${here} and return to ${parent}`,
    };

    if (outcome.kind === 'deeper') {
      const target = outcome.to;
      const laterNeighbour = unvisitedNeighbours.find((label) => label !== target);
      drafts.set(index, {
        prompt,
        options: uniqueOptions([
          { id: `deeper-${target}`, label: `Go deeper to ${target}` },
          ...(laterNeighbour !== undefined
            ? [{ id: `deeper-${laterNeighbour}`, label: `Go deeper to ${laterNeighbour}` }]
            : []),
          backtrack,
          ...(farAway !== undefined
            ? [{ id: `jump-${farAway}`, label: `Jump to ${farAway}` }]
            : []),
        ]).slice(0, 3),
        correctOptionId: `deeper-${target}`,
        explanation: `DFS checks ${here}'s neighbours in label order (${neighbours.join(', ')}) and follows the first unvisited one, ${target}, straight away. It goes deep before it goes wide.`,
        decisive: index === 1,
      });
      continue;
    }

    drafts.set(index, {
      prompt,
      options: uniqueOptions([
        backtrack,
        ...(visitedNeighbour !== undefined
          ? [{ id: `revisit-${visitedNeighbour}`, label: `Go deeper to ${visitedNeighbour}` }]
          : []),
        farAway !== undefined
          ? { id: `jump-${farAway}`, label: `Jump to ${farAway}` }
          : { id: 'restart', label: `Restart from ${start}` },
      ]),
      correctOptionId: 'backtrack',
      explanation: `Every neighbour of ${here} (${neighbours.join(', ') || 'none'}) is already visited, so ${here} is popped and DFS returns to ${parent ?? 'the caller'}. Revisiting a vertex would loop forever.`,
      decisive: !askedFirstBacktrack,
    });
    askedFirstBacktrack = true;
  }
  return drafts;
}

/** Every possible question for a BFS or DFS trace. Other graph operations have none. */
export function allGraphQuestions(
  kind: TraversalKind | 'edit',
  result: GraphResult,
): readonly PracticeQuestion[] {
  if (kind === 'edit' || result.steps.length < 3) return [];
  const drafts = kind === 'bfs' ? bfsDrafts(result.steps) : dfsDrafts(result.steps);
  return Object.freeze(
    [...drafts.entries()]
      .sort(([left], [right]) => left - right)
      .filter(([, draft]) => draft.options.length >= 2)
      .map(([stepIndex, draft]) =>
        Object.freeze({ ...draft, stepIndex, options: arrangeOptions(draft.options, stepIndex) }),
      ),
  );
}

/** The questions practice mode actually asks for a graph trace. */
export function graphPractice(
  kind: TraversalKind | 'edit',
  result: GraphResult,
): readonly PracticeQuestion[] {
  return chooseQuestions(allGraphQuestions(kind, result));
}
