import type { VisualizationStep } from '../../domain/visualization';
import {
  arrangeOptions,
  chooseQuestions,
  type PracticeOption,
  type PracticeQuestion,
} from '../../practice/practice';
import type { LinkedListSnapshot } from './LinkedListModel';
import type { LinkedListResult } from './LinkedListOperations';

export type LinkedListPracticeOperation =
  'insert-head' | 'insert-tail' | 'search' | 'delete' | 'traverse';

type Step = VisualizationStep<LinkedListSnapshot>;

interface Draft {
  readonly prompt: string;
  readonly options: readonly PracticeOption[];
  readonly correctOptionId: string;
  readonly explanation: string;
  readonly decisive: boolean;
}

function valueOf(step: Step | undefined, nodeId: string | undefined): number | undefined {
  if (!step || !nodeId) return undefined;
  return step.snapshot.nodes.find((node) => node.id === nodeId)?.value;
}

function indexOf(step: Step, nodeId: string): number {
  return step.snapshot.nodes.findIndex((node) => node.id === nodeId);
}

function formatOutput(values: readonly number[]): string {
  return `[${values.join(', ')}]`;
}

/** Search and delete share the comparison walk; only the wording of a match differs. */
function comparisonQuestion(
  operation: 'search' | 'delete',
  target: number,
  current: Step,
  next: Step,
): Draft {
  const nextId = next.activeNodeIds[0];
  const currentValue = valueOf(current, current.activeNodeIds[0]);
  const verb = operation === 'search' ? 'Searching for' : 'Deleting the first';
  const prompt =
    currentValue === undefined
      ? `${verb} ${target}. The walk starts at the head. What happens next?`
      : `${verb} ${target}. What happens at the next step?`;
  const notFound: PracticeOption = {
    id: 'not-found',
    label:
      operation === 'search'
        ? `Reach null: ${target} is not in the list`
        : `Reach null: nothing is removed`,
  };

  if (nextId === undefined) {
    return {
      prompt,
      options: [
        notFound,
        { id: 'restart', label: 'Go back to the head and check every node again' },
        {
          id: 'stop-last',
          label: `Stop at the last node, ${currentValue}: it must be the answer`,
        },
      ],
      correctOptionId: 'not-found',
      explanation: `${currentValue}'s next reference is null, so there is nothing left to compare. ${
        operation === 'search' ? `${target} is not in the list.` : 'The list is unchanged.'
      }`,
      decisive: true,
    };
  }

  const nextValue = valueOf(next, nextId);
  const matched = next.matchedNodeIds.includes(nextId);
  const subject = currentValue === undefined ? 'the head' : 'the next node';
  return {
    prompt,
    options: [
      { id: 'no-match', label: `Compare ${subject}, ${nextValue}: no match, keep walking` },
      {
        id: 'match',
        label:
          operation === 'search'
            ? `Compare ${subject}, ${nextValue}: match, the search stops`
            : `Compare ${subject}, ${nextValue}: match, this node will be removed`,
      },
      notFound,
    ],
    correctOptionId: matched ? 'match' : 'no-match',
    explanation: matched
      ? `${nextValue} equals ${target}, so the walk stops at this first match. It never looks further, even if another ${target} comes later.`
      : `${nextValue} is not ${target}, so the walk follows the next reference to the following node.`,
    decisive: matched,
  };
}

function unlinkQuestion(target: number, current: Step): Draft {
  const matchedId = current.matchedNodeIds[0];
  const position = indexOf(current, matchedId);
  const after = current.snapshot.nodes[position + 1]?.value;
  const before = current.snapshot.nodes[position - 1]?.value;
  const correctLabel =
    position === 0
      ? `Unlink ${target}: the head moves to ${after ?? 'null, so the list becomes empty'}`
      : `Unlink ${target}: ${before}.next now points to ${after ?? 'null'}`;
  return {
    prompt: `${target} was found. What does Delete do next?`,
    options: [
      { id: 'unlink', label: correctLabel },
      { id: 'delete-all', label: `Keep walking and remove every other ${target} as well` },
      { id: 'cut', label: `Cut the list here: ${target} and every node after it are removed` },
    ],
    correctOptionId: 'unlink',
    explanation:
      'Delete removes only the first match. One reference changes to skip the node, and every other node keeps its order.',
    decisive: true,
  };
}

function traverseQuestion(current: Step, next: Step): Draft {
  const nextId = next.activeNodeIds[0];
  const currentValue = valueOf(current, current.activeNodeIds[0]);
  const prompt =
    currentValue === undefined
      ? 'Traversal starts at the head. What happens next?'
      : `Traversal has visited ${currentValue}. What happens next?`;
  const end: PracticeOption = { id: 'end', label: 'Reach null: the traversal is complete' };

  if (nextId === undefined) {
    const head = current.snapshot.nodes[0]?.value;
    return {
      prompt,
      options: [
        end,
        { id: 'loop', label: `Go back to the head, ${head}, and visit it again` },
        { id: 'repeat', label: `Visit ${currentValue} again` },
      ],
      correctOptionId: 'end',
      explanation: `${currentValue}'s next reference is null, which marks the end of a singly linked list. Traversal is complete.`,
      decisive: true,
    };
  }

  const nextValue = valueOf(next, nextId);
  const subject = currentValue === undefined ? 'the head' : 'the next node';
  return {
    prompt,
    options: [
      {
        id: 'visit',
        label: `Visit ${subject}, ${nextValue}; the output becomes ${formatOutput(next.output)}`,
      },
      {
        id: 'visit-no-output',
        label: `Visit ${subject}, ${nextValue}; the output stays ${formatOutput(current.output)}`,
      },
      end,
    ],
    correctOptionId: 'visit',
    explanation: `The current node's next reference is not null, so traversal moves to ${nextValue} and appends it to the output.`,
    decisive: false,
  };
}

function insertTailQuestion(value: number, current: Step, next: Step): Draft {
  const nextId = next.activeNodeIds[0];
  const currentValue = valueOf(current, current.activeNodeIds[0]);
  const linked = next.snapshot.nodes.length > current.snapshot.nodes.length;

  if (linked) {
    const nodes = current.snapshot.nodes;
    const tail = nodes.at(-1)?.value;
    const beforeTail = nodes.at(-2)?.value;
    return {
      prompt: `Inserting ${value} at the tail. ${tail}'s next is null. What happens next?`,
      options: [
        { id: 'link', label: `Set ${tail}.next to the new node ${value}; ${value}.next is null` },
        { id: 'move', label: `Move on to the node after ${tail}` },
        {
          id: 'before-tail',
          label:
            beforeTail === undefined
              ? `Insert ${value} before ${tail}`
              : `Insert ${value} between ${beforeTail} and ${tail}`,
        },
      ],
      correctOptionId: 'link',
      explanation: `${tail} has no next node, so it is the tail. The new node is linked after it, and its own next reference is null.`,
      decisive: true,
    };
  }

  const nextValue = valueOf(next, nextId);
  const atStart = currentValue === undefined;
  return {
    prompt: atStart
      ? `Inserting ${value} at the tail. Where does the walk begin?`
      : `Inserting ${value} at the tail. ${currentValue} has a next node. What happens next?`,
    options: [
      {
        id: 'move',
        label: atStart ? `Start at the head, ${nextValue}` : `Move to the next node, ${nextValue}`,
      },
      { id: 'tail-pointer', label: 'Jump straight to the tail with a stored tail pointer' },
      {
        id: 'attach-now',
        label: atStart
          ? `Attach ${value} before the head`
          : `Attach ${value} after ${currentValue} right now`,
      },
    ],
    correctOptionId: 'move',
    explanation:
      'This list keeps no tail pointer, so insert-at-tail must follow next references from the head until it finds the node whose next is null. That walk is why it costs O(n).',
    decisive: false,
  };
}

function insertHeadQuestion(value: number, current: Step): Draft {
  const oldHead = current.snapshot.nodes[0]?.value;
  return {
    prompt: `Inserting ${value} at the head. What happens next?`,
    options: [
      {
        id: 'link-head',
        label: `${value} becomes the head, and its next points to the old head, ${oldHead}`,
      },
      { id: 'walk', label: `Walk to the tail first, then link ${value}` },
      { id: 'overwrite', label: `Overwrite ${oldHead}'s value with ${value}` },
    ],
    correctOptionId: 'link-head',
    explanation:
      'Insert at head creates one node and changes one reference. It never walks the list, so it is O(1).',
    decisive: true,
  };
}

function draftFor(
  operation: LinkedListPracticeOperation,
  value: number | undefined,
  current: Step,
  next: Step,
): Draft | null {
  switch (operation) {
    case 'search':
      return value === undefined ? null : comparisonQuestion('search', value, current, next);
    case 'delete':
      if (value === undefined) return null;
      return current.matchedNodeIds.length > 0
        ? unlinkQuestion(value, current)
        : comparisonQuestion('delete', value, current, next);
    case 'traverse':
      return traverseQuestion(current, next);
    case 'insert-tail':
      return value === undefined ? null : insertTailQuestion(value, current, next);
    case 'insert-head':
      return value === undefined ? null : insertHeadQuestion(value, current);
  }
}

/** Every possible question for a trace, one per step that has a following step. */
export function allLinkedListQuestions(
  operation: LinkedListPracticeOperation,
  value: number | undefined,
  result: LinkedListResult,
): readonly PracticeQuestion[] {
  const { steps } = result;
  // An empty list has nothing to predict: every operation finishes in one move.
  if (steps.length < 2 || steps[0].snapshot.nodes.length === 0) return [];
  const questions: PracticeQuestion[] = [];
  for (let index = 0; index < steps.length - 1; index += 1) {
    const draft = draftFor(operation, value, steps[index], steps[index + 1]);
    if (!draft) continue;
    questions.push(
      Object.freeze({
        ...draft,
        stepIndex: index,
        options: arrangeOptions(draft.options, index),
      }),
    );
  }
  return Object.freeze(questions);
}

/** The questions practice mode actually asks for this trace. */
export function linkedListPractice(
  operation: LinkedListPracticeOperation,
  value: number | undefined,
  result: LinkedListResult,
): readonly PracticeQuestion[] {
  return chooseQuestions(allLinkedListQuestions(operation, value, result));
}
