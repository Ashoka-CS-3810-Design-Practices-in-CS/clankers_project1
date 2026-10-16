import type { VisualizationStep } from '../../domain/visualization';
import {
  arrangeOptions,
  chooseQuestions,
  type PracticeOption,
  type PracticeQuestion,
} from '../../practice/practice';
import type { PriorityQueueSnapshot } from './PriorityQueueModel';
import type { PriorityQueueResult } from './PriorityQueueOperations';

export type PriorityQueuePracticeOperation = 'insert' | 'extract' | 'peek';

type Step = VisualizationStep<PriorityQueueSnapshot>;

interface Draft {
  readonly prompt: string;
  readonly options: readonly PracticeOption[];
  readonly correctOptionId: string;
  readonly explanation: string;
  readonly decisive: boolean;
}

function indexOf(snapshot: PriorityQueueSnapshot, id: string | undefined): number {
  return id === undefined ? -1 : snapshot.items.findIndex((item) => item.id === id);
}

function at(snapshot: PriorityQueueSnapshot, index: number) {
  return index >= 0 ? snapshot.items[index] : undefined;
}

function sameOrder(left: PriorityQueueSnapshot, right: PriorityQueueSnapshot): boolean {
  return (
    left.items.length === right.items.length &&
    left.items.every((item, index) => item.id === right.items[index].id)
  );
}

/** Insert, first step: where does the new value go before any sifting? */
function placementQuestion(value: number, current: Step): Draft {
  const size = current.snapshot.items.length;
  const parent = at(current.snapshot, Math.floor((size - 1) / 2))!;
  return {
    prompt: `Inserting ${value} into a heap of ${size}. Where is it placed first?`,
    options: [
      {
        id: 'next-leaf',
        label: `At index ${size}, the next open leaf (a child of ${parent.value})`,
      },
      { id: 'root', label: `At the root, index 0, because it might be the new minimum` },
      { id: 'sorted', label: `In sorted position, so the array stays in order` },
    ],
    correctOptionId: 'next-leaf',
    explanation:
      'A heap must stay a complete tree, so a new item always fills the next open slot at the end of the array. Only then does it sift up. The array is never fully sorted; only each parent ≤ its children.',
    decisive: true,
  };
}

/** Extract, first step: what fills the root once the minimum leaves? */
function refillQuestion(current: Step, next: Step): Draft {
  const items = current.snapshot.items;
  const root = items[0];
  if (items.length === 1) {
    return {
      prompt: `Extract min removes ${root.value}, the only item. What is left?`,
      options: [
        { id: 'empty', label: 'The priority queue becomes empty' },
        { id: 'stays', label: `${root.value} stays: the last item cannot be extracted` },
        { id: 'placeholder', label: 'An empty root remains until the next insert' },
      ],
      correctOptionId: 'empty',
      explanation: `${root.value} was both the root and the last item, so removing it empties the heap.`,
      decisive: true,
    };
  }
  const last = items.at(-1)!;
  const left = items[1];
  const right = items[2];
  const smallerChild = right && right.value < left.value ? right : left;
  const promote: PracticeOption =
    smallerChild.id !== last.id
      ? { id: 'promote', label: `Its smaller child, ${smallerChild.value}, moves up into the root` }
      : { id: 'swap-end', label: `${root.value} swaps with the last item and stays in the array` };
  const moved = at(next.snapshot, 0);
  return {
    prompt: `Extract min removes ${root.value} from the root. What fills the root?`,
    options: [
      { id: 'last', label: `The last item, ${last.value}, moves into the root` },
      promote,
      { id: 'hole', label: 'The root stays empty until the next insert' },
    ],
    correctOptionId: 'last',
    explanation: `Moving the last item (${moved?.value ?? last.value}) into the root keeps the tree complete with one move. It is probably too large for the root, so it then sifts down.`,
    decisive: true,
  };
}

/** The next step compares the moving item with its parent (sift-up) or smaller child (sift-down). */
function comparisonQuestion(current: Step, next: Step): Draft {
  const snapshot = next.snapshot;
  const itemIndex = indexOf(snapshot, next.activeNodeIds[0]);
  const otherIndex = indexOf(snapshot, next.matchedNodeIds[0]);
  const item = at(snapshot, itemIndex)!;
  const other = at(snapshot, otherIndex)!;
  const up = otherIndex < itemIndex;

  if (up) {
    const swaps = item.value < other.value;
    const siblingIndex = itemIndex % 2 === 1 ? itemIndex + 1 : itemIndex - 1;
    const sibling = at(snapshot, siblingIndex);
    const root = at(snapshot, 0)!;
    const third: PracticeOption =
      sibling && sibling.id !== item.id
        ? { id: 'sibling', label: `Compare ${item.value} with its sibling, ${sibling.value}` }
        : root.id !== other.id
          ? { id: 'root', label: `Compare ${item.value} with the root, ${root.value}` }
          : { id: 'child', label: `Swap ${item.value} down with a child instead` };
    return {
      prompt: `Sift-up: ${item.value} is at index ${itemIndex}. What happens at the next comparison?`,
      options: [
        {
          id: 'swap',
          label: `Compare with its parent, ${other.value}: swap, because ${item.value} < ${other.value}`,
        },
        { id: 'stop', label: `Compare with its parent, ${other.value}: stop, heap order holds` },
        third,
      ],
      correctOptionId: swaps ? 'swap' : 'stop',
      explanation: swaps
        ? `${item.value} < ${other.value}, so the parent is larger than its child and they swap. Sift-up only ever compares with the parent.`
        : `${item.value} ≥ ${other.value}, so every parent is still ≤ its children and sift-up stops early. It never needs more than one comparison per level: O(log n).`,
      decisive: !swaps,
    };
  }

  const swaps = other.value < item.value;
  const children = [at(snapshot, 2 * itemIndex + 1), at(snapshot, 2 * itemIndex + 2)].filter(
    (child): child is NonNullable<typeof child> => Boolean(child),
  );
  const larger = children.find((child) => child.id !== other.id);
  const third: PracticeOption = larger
    ? {
        id: 'larger-child',
        label: `Compare with its larger child, ${larger.value}: swap with that one`,
      }
    : { id: 'parent', label: `Compare ${item.value} with its parent instead` };
  return {
    prompt: `Sift-down: ${item.value} is at index ${itemIndex}. What happens at the next comparison?`,
    options: [
      {
        id: 'swap',
        label: `Compare with its smaller child, ${other.value}: swap, because ${other.value} < ${item.value}`,
      },
      {
        id: 'stop',
        label: `Compare with its smaller child, ${other.value}: stop, heap order holds`,
      },
      third,
    ],
    correctOptionId: swaps ? 'swap' : 'stop',
    explanation: swaps
      ? `${other.value} < ${item.value}, so they swap. Sift-down always uses the smaller child: whichever child moves up must be ≤ its sibling, or the order would break.`
      : `${item.value} ≤ ${other.value}, the smaller child, so it is ≤ both children and sift-down stops.`,
    decisive: !swaps,
  };
}

/** The moving item reached the root (sift-up) or a leaf (sift-down). */
function settledQuestion(operation: PriorityQueuePracticeOperation, current: Step): Draft {
  const snapshot = current.snapshot;
  const index = indexOf(snapshot, current.activeNodeIds[0]);
  const item = at(snapshot, index)!;
  if (operation === 'insert') {
    return {
      prompt: `${item.value} has swapped all the way up to index 0. What happens next?`,
      options: [
        { id: 'stop', label: `Stop: the root has no parent, so ${item.value} is the new minimum` },
        { id: 'sift-down', label: `Sift ${item.value} back down to check its children` },
        { id: 'resort', label: 'Re-sort the whole array to be safe' },
      ],
      correctOptionId: 'stop',
      explanation: `Each swap left a parent ≤ its children, so once ${item.value} is the root the whole heap is in order.`,
      decisive: true,
    };
  }
  return {
    prompt: `${item.value} is at index ${index} and has no children. What happens next?`,
    options: [
      { id: 'stop', label: 'Stop: a leaf has nothing below it, so heap order is restored' },
      index > 0
        ? { id: 'parent', label: `Compare ${item.value} with its parent again` }
        : { id: 'resort', label: 'Re-sort the whole array to be safe' },
      { id: 'move-end', label: `Move ${item.value} back to the end of the array` },
    ],
    correctOptionId: 'stop',
    explanation: `Sift-down ends at a leaf. Every swap on the way kept parents ≤ children, so nothing else needs checking.`,
    decisive: true,
  };
}

function peekQuestion(current: Step): Draft {
  const items = current.snapshot.items;
  const root = items[0];
  const last = items.at(-1)!;
  return {
    prompt: 'What does Peek min return, and what happens to the heap?',
    options: [
      { id: 'read', label: `${root.value}; the heap is unchanged` },
      { id: 'removed', label: `${root.value}; it is removed from the heap` },
      last.id !== root.id
        ? { id: 'last', label: `${last.value}, the last item in the array; the heap is unchanged` }
        : { id: 'needs-extract', label: 'Nothing until you extract first' },
    ],
    correctOptionId: 'read',
    explanation:
      'In a min-heap the minimum is always at the root, index 0, so Peek min reads it in O(1) without changing anything.',
    decisive: true,
  };
}

function draftFor(
  operation: PriorityQueuePracticeOperation,
  value: number | undefined,
  current: Step,
  next: Step,
  index: number,
): Draft | null {
  if (operation === 'peek') return index === 0 ? peekQuestion(current) : null;
  if (index === 0) {
    if (operation === 'insert')
      return value === undefined ? null : placementQuestion(value, current);
    return refillQuestion(current, next);
  }
  // A compare step's own narration already says whether it swaps, so never ask there.
  if (current.matchedNodeIds.length > 0) return null;
  if (next.matchedNodeIds.length > 0) return comparisonQuestion(current, next);
  if (
    next.activeNodeIds[0] !== undefined &&
    next.activeNodeIds[0] === current.activeNodeIds[0] &&
    sameOrder(current.snapshot, next.snapshot)
  ) {
    return settledQuestion(operation, current);
  }
  return null;
}

/** Every possible question for a priority-queue trace. */
export function allPriorityQueueQuestions(
  operation: PriorityQueuePracticeOperation,
  value: number | undefined,
  result: PriorityQueueResult,
): readonly PracticeQuestion[] {
  const { steps } = result;
  // An empty heap has nothing to predict, and blocked operations are one step.
  if (steps.length < 2 || steps[0].snapshot.items.length === 0) return [];
  const questions: PracticeQuestion[] = [];
  for (let index = 0; index < steps.length - 1; index += 1) {
    const draft = draftFor(operation, value, steps[index], steps[index + 1], index);
    if (!draft) continue;
    questions.push(
      Object.freeze({ ...draft, stepIndex: index, options: arrangeOptions(draft.options, index) }),
    );
  }
  return Object.freeze(questions);
}

/** The questions practice mode actually asks for a priority-queue trace. */
export function priorityQueuePractice(
  operation: PriorityQueuePracticeOperation,
  value: number | undefined,
  result: PriorityQueueResult,
): readonly PracticeQuestion[] {
  return chooseQuestions(allPriorityQueueQuestions(operation, value, result));
}
