import type { VisualizationStep } from '../domain/visualization';
import {
  arrangeOptions,
  chooseQuestions,
  type PracticeOption,
  type PracticeQuestion,
} from './practice';

/**
 * Practice questions shared by Stack and Queue. Both are containers where one end
 * leaves first; they differ only in which end that is (LIFO top versus FIFO front)
 * and in their vocabulary, which `ContainerWords` supplies.
 */

export type ContainerOperation = 'add' | 'remove' | 'peek' | 'inspect';

interface ContainerItem {
  readonly id: string;
  readonly value: number;
}

interface ContainerSnapshot {
  readonly items: readonly ContainerItem[];
}

export interface ContainerWords {
  /** Stack or queue, lower case. */
  readonly noun: string;
  /** Snapshot order is bottom→top for a stack and front→rear for a queue. */
  readonly leavesFromEnd: 'last' | 'first';
  /** The end items leave from: "top" or "front". */
  readonly exitEnd: string;
  /** The other end: "bottom" or "rear". */
  readonly farEnd: string;
  readonly add: string;
  readonly remove: string;
  readonly peek: string;
  /** Direction word while inspecting: "down" for a stack, "back" for a queue. */
  readonly inspectDirection: string;
  readonly rule: string;
}

export const STACK_WORDS: ContainerWords = Object.freeze({
  noun: 'stack',
  leavesFromEnd: 'last',
  exitEnd: 'top',
  farEnd: 'bottom',
  add: 'Push',
  remove: 'Pop',
  peek: 'Peek',
  inspectDirection: 'down',
  rule: 'A stack is last in, first out',
});

export const QUEUE_WORDS: ContainerWords = Object.freeze({
  noun: 'queue',
  leavesFromEnd: 'first',
  exitEnd: 'front',
  farEnd: 'rear',
  add: 'Enqueue',
  remove: 'Dequeue',
  peek: 'Peek front',
  inspectDirection: 'back',
  rule: 'A queue is first in, first out',
});

type Step = VisualizationStep<ContainerSnapshot>;

interface Draft {
  readonly prompt: string;
  readonly options: readonly PracticeOption[];
  readonly correctOptionId: string;
  readonly explanation: string;
  readonly decisive: boolean;
}

/** Items in the order they would leave: the exit end first. */
function leavingOrder(snapshot: ContainerSnapshot, words: ContainerWords): readonly number[] {
  const values = snapshot.items.map((item) => item.value);
  return words.leavesFromEnd === 'last' ? values.reverse() : values;
}

function list(values: readonly number[]): string {
  return `[${values.join(', ')}]`;
}

function addQuestion(words: ContainerWords, value: number, order: readonly number[]): Draft {
  const isStack = words.leavesFromEnd === 'last';
  const first = order[0];
  return {
    prompt: `After ${words.add} ${value}, which item will ${words.remove} take out first?`,
    options: [
      {
        id: 'newest',
        label: isStack ? `${value}: the newest item` : `${value}: it is the newest item`,
      },
      {
        id: 'current-exit',
        label: isStack
          ? `${first}: it was on top before the push`
          : `${first}: it has waited the longest`,
      },
      { id: 'smallest', label: 'Whichever value is smallest' },
    ],
    correctOptionId: isStack ? 'newest' : 'current-exit',
    explanation: isStack
      ? `${words.rule}. Push puts ${value} on top, so the next pop removes ${value}. Values never decide the order.`
      : `${words.rule}. ${value} joins at the rear and waits behind everything already in line, so ${first} still leaves first. Values never decide the order.`,
    decisive: true,
  };
}

function removeQuestion(words: ContainerWords, order: readonly number[]): Draft {
  const [leaving, next] = order;
  const far = order.at(-1);
  const stillThere: PracticeOption = {
    id: 'still-there',
    label: `${leaving} is still the ${words.exitEnd}: ${words.remove} only reads it`,
  };
  const empty: PracticeOption = { id: 'empty', label: `The ${words.noun} becomes empty` };
  let options: PracticeOption[];
  let correct: string;
  if (order.length === 1) {
    options = [
      empty,
      stillThere,
      { id: 'blocked', label: `Nothing: the last item cannot be removed` },
    ];
    correct = 'empty';
  } else {
    const answer = { id: 'next', label: `${next} becomes the new ${words.exitEnd}` };
    const third =
      order.length >= 3 && far !== next
        ? { id: 'far', label: `${far} becomes the new ${words.exitEnd}` }
        : empty;
    options = [answer, third, stillThere];
    correct = 'next';
  }
  const why =
    words.leavesFromEnd === 'last'
      ? 'Pop removes only the top item; the one directly below it becomes the new top. Nothing else moves, so it is O(1).'
      : 'Dequeue removes only the front item; the front index moves forward to the next item. Nothing shifts, so it is O(1).';
  return {
    prompt: `${words.remove} takes out ${leaving}. What is the ${words.noun} left with?`,
    options,
    correctOptionId: correct,
    explanation: why,
    decisive: true,
  };
}

function peekQuestion(words: ContainerWords, order: readonly number[]): Draft {
  const first = order[0];
  const far = order.at(-1);
  return {
    prompt: `What does ${words.peek} return, and what happens to the ${words.noun}?`,
    options: [
      { id: 'read', label: `${first}; the ${words.noun} is unchanged` },
      { id: 'removed', label: `${first}; it is removed from the ${words.noun}` },
      order.length >= 2 && far !== first
        ? { id: 'far', label: `${far}; the ${words.noun} is unchanged` }
        : {
            id: 'needs-remove',
            label: `Nothing until you ${words.remove.toLowerCase()} first`,
          },
    ],
    correctOptionId: 'read',
    explanation: `${words.peek} reads the ${words.exitEnd} item without removing it. It is O(1) and the ${words.noun} does not change.`,
    decisive: true,
  };
}

function inspectQuestion(words: ContainerWords, current: Step, next: Step): Draft {
  const order = leavingOrder(current.snapshot, words);
  const currentId = current.activeNodeIds[0];
  const nextId = next.activeNodeIds[0];
  const valueOf = (id: string | undefined) =>
    current.snapshot.items.find((item) => item.id === id)?.value;
  const done: PracticeOption = {
    id: 'done',
    label: `Reach the ${words.farEnd}: inspection is complete`,
  };

  if (currentId === undefined) {
    const first = order[0];
    const far = order.at(-1);
    return {
      prompt: `Inspect all starts. Which item is inspected first?`,
      options: [
        { id: 'exit-end', label: `The ${words.exitEnd} item, ${first}` },
        order.length >= 2 && far !== first
          ? { id: 'far-end', label: `The ${words.farEnd} item, ${far}` }
          : { id: 'smallest', label: 'The smallest value' },
        { id: 'nothing', label: 'Nothing: inspection only counts the items' },
      ],
      correctOptionId: 'exit-end',
      explanation: `Inspection follows the order items would leave, so it starts at the ${words.exitEnd}. ${words.rule}.`,
      decisive: true,
    };
  }

  const currentValue = valueOf(currentId);
  if (nextId === undefined) {
    return {
      prompt: `${currentValue} has been inspected. What happens next?`,
      options: [
        done,
        { id: 'wrap', label: `Go back to the ${words.exitEnd}, ${order[0]}, and start again` },
        { id: 'repeat', label: `Inspect ${currentValue} again` },
      ],
      correctOptionId: 'done',
      explanation: `${currentValue} is the ${words.farEnd} item, so every item has been inspected exactly once. The output lists them in leaving order.`,
      decisive: true,
    };
  }

  const nextValue = valueOf(nextId);
  return {
    prompt: `${currentValue} has been inspected. What happens next?`,
    options: [
      {
        id: 'move',
        label: `Move ${words.inspectDirection} to ${nextValue}; the output becomes ${list(next.output)}`,
      },
      {
        id: 'move-no-output',
        label: `Move ${words.inspectDirection} to ${nextValue}; the output stays ${list(current.output)}`,
      },
      done,
    ],
    correctOptionId: 'move',
    explanation: `${currentValue} is not the ${words.farEnd} item, so inspection moves ${words.inspectDirection} to ${nextValue} and appends it to the output.`,
    decisive: false,
  };
}

function draftFor(
  words: ContainerWords,
  operation: ContainerOperation,
  value: number | undefined,
  current: Step,
  next: Step,
  index: number,
): Draft | null {
  const order = leavingOrder(current.snapshot, words);
  // Push, pop, and peek are two-step traces: only the first step has a question.
  if (operation !== 'inspect' && index > 0) return null;
  switch (operation) {
    case 'add':
      return value === undefined ? null : addQuestion(words, value, order);
    case 'remove':
      return removeQuestion(words, order);
    case 'peek':
      return peekQuestion(words, order);
    case 'inspect':
      return inspectQuestion(words, current, next);
  }
}

/** Every possible question for a Stack or Queue trace. */
export function allContainerQuestions(
  words: ContainerWords,
  operation: ContainerOperation,
  value: number | undefined,
  steps: readonly Step[],
): readonly PracticeQuestion[] {
  // An empty container has nothing to predict, and blocked operations are one step.
  if (steps.length < 2 || steps[0].snapshot.items.length === 0) return [];
  const questions: PracticeQuestion[] = [];
  for (let index = 0; index < steps.length - 1; index += 1) {
    const draft = draftFor(words, operation, value, steps[index], steps[index + 1], index);
    if (!draft) continue;
    questions.push(
      Object.freeze({ ...draft, stepIndex: index, options: arrangeOptions(draft.options, index) }),
    );
  }
  return Object.freeze(questions);
}

/** The questions practice mode actually asks for a Stack or Queue trace. */
export function containerPractice(
  words: ContainerWords,
  operation: ContainerOperation,
  value: number | undefined,
  steps: readonly Step[],
): readonly PracticeQuestion[] {
  return chooseQuestions(allContainerQuestions(words, operation, value, steps));
}
