import { describe, expect, it } from 'vitest';
import { QueueModel } from '../structures/queue/QueueModel';
import { QueueOperations } from '../structures/queue/QueueOperations';
import { StackModel } from '../structures/stack/StackModel';
import { StackOperations } from '../structures/stack/StackOperations';
import {
  allContainerQuestions,
  containerPractice,
  QUEUE_WORDS,
  STACK_WORDS,
} from './containerPractice';
import type { PracticeQuestion } from './practice';

const stackOps = new StackOperations();
const queueOps = new QueueOperations();
const stack = () => StackModel.fromValues([8, 13, 21, 34]); // 34 on top
const queue = () => QueueModel.fromValues([5, 12, 19, 26]); // 5 at the front

function correctLabel(question: PracticeQuestion | undefined): string {
  return question?.options.find((option) => option.id === question.correctOptionId)?.label ?? '';
}

function expectWellFormed(questions: readonly PracticeQuestion[], stepCount: number) {
  expect(questions.length).toBeGreaterThan(0);
  for (const question of questions) {
    expect(question.stepIndex).toBeLessThan(stepCount - 1);
    const ids = question.options.map((option) => option.id);
    const labels = question.options.map((option) => option.label);
    expect(new Set(ids).size).toBe(3);
    expect(new Set(labels).size).toBe(3);
    expect(ids).toContain(question.correctOptionId);
  }
}

describe('stack practice', () => {
  it('teaches LIFO on push: the new value leaves first', () => {
    const result = stackOps.push(stack(), 55);
    const [question] = allContainerQuestions(STACK_WORDS, 'add', 55, result.steps);
    expectWellFormed([question], result.steps.length);
    expect(question.prompt).toBe('After Push 55, which item will Pop take out first?');
    expect(correctLabel(question)).toBe('55: the newest item');
  });

  it('asks for the new top after pop', () => {
    const result = stackOps.pop(stack());
    const [question] = allContainerQuestions(STACK_WORDS, 'remove', undefined, result.steps);
    expectWellFormed([question], result.steps.length);
    expect(correctLabel(question)).toBe('21 becomes the new top');
    expect(question.options.map((o) => o.label)).toContain('8 becomes the new top');
  });

  it('expects an empty stack after popping the last item', () => {
    const result = stackOps.pop(StackModel.fromValues([7]));
    const [question] = allContainerQuestions(STACK_WORDS, 'remove', undefined, result.steps);
    expect(correctLabel(question)).toBe('The stack becomes empty');
  });

  it('checks that peek reads without removing', () => {
    const result = stackOps.peek(stack());
    const [question] = allContainerQuestions(STACK_WORDS, 'peek', undefined, result.steps);
    expect(correctLabel(question)).toBe('34; the stack is unchanged');
  });

  it('inspects from the top down and ends at the bottom', () => {
    const result = stackOps.inspect(stack());
    const questions = allContainerQuestions(STACK_WORDS, 'inspect', undefined, result.steps);
    expectWellFormed(questions, result.steps.length);
    expect(correctLabel(questions[0])).toBe('The top item, 34');
    expect(correctLabel(questions[1])).toBe('Move down to 21; the output becomes [34, 21]');
    expect(correctLabel(questions.at(-1))).toBe('Reach the bottom: inspection is complete');
  });
});

describe('queue practice', () => {
  it('teaches FIFO on enqueue: the front still leaves first', () => {
    const result = queueOps.enqueue(queue(), 40);
    const [question] = allContainerQuestions(QUEUE_WORDS, 'add', 40, result.steps);
    expectWellFormed([question], result.steps.length);
    expect(correctLabel(question)).toBe('5: it has waited the longest');
  });

  it('asks for the new front after dequeue', () => {
    const result = queueOps.dequeue(queue());
    const [question] = allContainerQuestions(QUEUE_WORDS, 'remove', undefined, result.steps);
    expect(correctLabel(question)).toBe('12 becomes the new front');
    expect(question.explanation).toContain('Nothing shifts');
  });

  it('inspects from the front back to the rear', () => {
    const result = queueOps.inspect(queue());
    const questions = allContainerQuestions(QUEUE_WORDS, 'inspect', undefined, result.steps);
    expectWellFormed(questions, result.steps.length);
    expect(correctLabel(questions[0])).toBe('The front item, 5');
    expect(correctLabel(questions.at(-1))).toBe('Reach the rear: inspection is complete');
  });

  it('peeks at the front', () => {
    const result = queueOps.peek(queue());
    const [question] = allContainerQuestions(QUEUE_WORDS, 'peek', undefined, result.steps);
    expect(correctLabel(question)).toBe('5; the queue is unchanged');
  });
});

describe('container practice selection', () => {
  it('asks nothing for an empty container or a blocked operation', () => {
    expect(
      containerPractice(STACK_WORDS, 'remove', undefined, stackOps.pop(new StackModel()).steps),
    ).toEqual([]);
    expect(
      containerPractice(QUEUE_WORDS, 'add', 1, queueOps.enqueue(new QueueModel(), 1).steps),
    ).toEqual([]);
  });

  it('keeps inspect practice to three questions: start, one middle, and the end', () => {
    const chosen = containerPractice(
      STACK_WORDS,
      'inspect',
      undefined,
      stackOps.inspect(stack()).steps,
    );
    expect(chosen).toHaveLength(3);
    expect(chosen[0].correctOptionId).toBe('exit-end');
    expect(chosen.at(-1)?.correctOptionId).toBe('done');
  });

  it('avoids duplicate labels when values repeat', () => {
    const result = stackOps.pop(StackModel.fromValues([4, 4, 4]));
    const [question] = allContainerQuestions(STACK_WORDS, 'remove', undefined, result.steps);
    const labels = question.options.map((o) => o.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
