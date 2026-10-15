import { describe, expect, it } from 'vitest';
import type { PracticeQuestion } from '../../practice/practice';
import { PriorityQueueModel } from './PriorityQueueModel';
import { PriorityQueueOperations } from './PriorityQueueOperations';
import { allPriorityQueueQuestions, priorityQueuePractice } from './PriorityQueuePractice';

const operations = new PriorityQueueOperations();
// Heap array [1, 3, 8, 7, 5, 9]: 1 at the root, 3 and 8 below it.
const sample = () => PriorityQueueModel.sample();

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

describe('priority queue practice: insert', () => {
  it('places at the next open leaf, sifts up with swaps, and stops at the root', () => {
    const result = operations.insert(sample(), -2);
    const questions = allPriorityQueueQuestions('insert', -2, result);
    expectWellFormed(questions, result.steps.length);
    expect(questions.map(correctLabel)).toEqual([
      'At index 6, the next open leaf (a child of 8)',
      'Compare with its parent, 8: swap, because -2 < 8',
      'Compare with its parent, 1: swap, because -2 < 1',
      'Stop: the root has no parent, so -2 is the new minimum',
    ]);
  });

  it('never asks at a compare step, whose narration already gives the answer', () => {
    const result = operations.insert(sample(), -2);
    for (const question of allPriorityQueueQuestions('insert', -2, result)) {
      expect(result.steps[question.stepIndex].matchedNodeIds).toEqual([]);
    }
  });

  it('expects sift-up to stop early when the parent is smaller', () => {
    const result = operations.insert(sample(), 4);
    const last = allPriorityQueueQuestions('insert', 4, result).at(-1);
    expect(correctLabel(last)).toBe('Compare with its parent, 1: stop, heap order holds');
    expect(last?.decisive).toBe(true);
    expect(last?.options.map((o) => o.label)).toContain('Compare 4 with its sibling, 3');
  });
});

describe('priority queue practice: extract min', () => {
  it('refills the root with the last item, then sifts down by the smaller child', () => {
    const result = operations.extractMin(sample());
    const questions = allPriorityQueueQuestions('extract', undefined, result);
    expectWellFormed(questions, result.steps.length);
    expect(correctLabel(questions[0])).toBe('The last item, 9, moves into the root');
    expect(questions[0].options.map((o) => o.label)).toContain(
      'Its smaller child, 3, moves up into the root',
    );
    expect(correctLabel(questions[1])).toBe(
      'Compare with its smaller child, 3: swap, because 3 < 9',
    );
    expect(questions[1].options.map((o) => o.label)).toContain(
      'Compare with its larger child, 8: swap with that one',
    );
    expect(correctLabel(questions.at(-1))).toBe(
      'Stop: a leaf has nothing below it, so heap order is restored',
    );
  });

  it('handles a heap of one and a heap of two', () => {
    const one = allPriorityQueueQuestions(
      'extract',
      undefined,
      operations.extractMin(PriorityQueueModel.fromValues([1])),
    );
    expect(correctLabel(one[0])).toBe('The priority queue becomes empty');
    const two = allPriorityQueueQuestions(
      'extract',
      undefined,
      operations.extractMin(PriorityQueueModel.fromValues([1, 2])),
    );
    expectWellFormed(two, 3);
    expect(two.at(-1)?.options.map((o) => o.id)).not.toContain('parent');
  });
});

describe('priority queue practice: peek and selection', () => {
  it('peeks at the root without removing it', () => {
    const [question] = allPriorityQueueQuestions('peek', undefined, operations.peekMin(sample()));
    expect(correctLabel(question)).toBe('1; the heap is unchanged');
  });

  it('asks nothing on an empty heap', () => {
    const empty = new PriorityQueueModel();
    expect(priorityQueuePractice('insert', 3, operations.insert(empty, 3))).toEqual([]);
    expect(priorityQueuePractice('extract', undefined, operations.extractMin(empty))).toEqual([]);
  });

  it('keeps the placement and the final stop when trimming to three', () => {
    const chosen = priorityQueuePractice('insert', -2, operations.insert(sample(), -2));
    expect(chosen).toHaveLength(3);
    expect(chosen[0].correctOptionId).toBe('next-leaf');
    expect(chosen.at(-1)?.correctOptionId).toBe('stop');
  });
});
