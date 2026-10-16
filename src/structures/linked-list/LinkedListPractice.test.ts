import { describe, expect, it } from 'vitest';
import type { PracticeQuestion } from '../../practice/practice';
import { LinkedListModel } from './LinkedListModel';
import { LinkedListOperations } from './LinkedListOperations';
import { allLinkedListQuestions, linkedListPractice } from './LinkedListPractice';

const operations = new LinkedListOperations();
const sample = () => LinkedListModel.fromValues([8, 13, 21, 34]);

function correctLabel(question: PracticeQuestion): string {
  return question.options.find((option) => option.id === question.correctOptionId)?.label ?? '';
}

function expectWellFormed(questions: readonly PracticeQuestion[], stepCount: number) {
  for (const question of questions) {
    expect(question.stepIndex).toBeGreaterThanOrEqual(0);
    expect(question.stepIndex).toBeLessThan(stepCount - 1);
    const ids = question.options.map((option) => option.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(question.correctOptionId);
    expect(question.options.length).toBeGreaterThanOrEqual(3);
  }
}

describe('linked list practice questions', () => {
  it('asks one question per transition and predicts the comparison outcome for search', () => {
    const result = operations.search(sample(), 21);
    const questions = allLinkedListQuestions('search', 21, result);
    expectWellFormed(questions, result.steps.length);
    expect(questions.map((q) => q.correctOptionId)).toEqual(['no-match', 'no-match', 'match']);
    expect(correctLabel(questions[0])).toBe('Compare the head, 8: no match, keep walking');
    expect(correctLabel(questions[2])).toBe('Compare the next node, 21: match, the search stops');
    expect(questions[2].decisive).toBe(true);
  });

  it('expects "reach null" when the value is missing', () => {
    const result = operations.search(sample(), 99);
    const last = allLinkedListQuestions('search', 99, result).at(-1);
    expect(last?.correctOptionId).toBe('not-found');
    expect(last?.explanation).toContain("34's next reference is null");
  });

  it('teaches that delete unlinks only the first match', () => {
    const model = LinkedListModel.fromValues([5, 8, 5]);
    const result = operations.deleteFirstMatch(model, 5);
    const questions = allLinkedListQuestions('delete', 5, result);
    expectWellFormed(questions, result.steps.length);
    const unlink = questions.at(-1);
    expect(unlink?.correctOptionId).toBe('unlink');
    expect(correctLabel(unlink!)).toBe('Unlink 5: the head moves to 8');
    expect(unlink?.options.map((o) => o.id)).toContain('delete-all');
  });

  it('names the previous node when deleting from the middle', () => {
    const result = operations.deleteFirstMatch(sample(), 13);
    const unlink = allLinkedListQuestions('delete', 13, result).at(-1)!;
    expect(correctLabel(unlink)).toBe('Unlink 13: 8.next now points to 21');
  });

  it('tracks the traversal output and the null at the end', () => {
    const result = operations.traverse(sample());
    const questions = allLinkedListQuestions('traverse', undefined, result);
    expectWellFormed(questions, result.steps.length);
    expect(correctLabel(questions[1])).toBe('Visit the next node, 13; the output becomes [8, 13]');
    expect(questions.at(-1)?.correctOptionId).toBe('end');
  });

  it('walks from the head for insert at tail because there is no tail pointer', () => {
    const result = operations.insertTail(sample(), 55);
    const questions = allLinkedListQuestions('insert-tail', 55, result);
    expectWellFormed(questions, result.steps.length);
    expect(questions[0].options.map((o) => o.id)).toContain('tail-pointer');
    expect(questions[0].correctOptionId).toBe('move');
    expect(correctLabel(questions.at(-1)!)).toBe('Set 34.next to the new node 55; 55.next is null');
  });

  it('asks a single O(1) question for insert at head', () => {
    const result = operations.insertHead(sample(), 3);
    const questions = allLinkedListQuestions('insert-head', 3, result);
    expect(questions).toHaveLength(1);
    expect(correctLabel(questions[0])).toBe(
      '3 becomes the head, and its next points to the old head, 8',
    );
  });

  it('asks nothing on an empty list', () => {
    const empty = new LinkedListModel();
    expect(linkedListPractice('search', 1, operations.search(empty, 1))).toEqual([]);
    expect(linkedListPractice('insert-head', 1, operations.insertHead(empty, 1))).toEqual([]);
  });

  it('limits a long trace to three questions and keeps the decisive one', () => {
    const long = LinkedListModel.fromValues([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const chosen = linkedListPractice('search', 9, operations.search(long, 9));
    expect(chosen).toHaveLength(3);
    expect(chosen.at(-1)?.correctOptionId).toBe('match');
  });

  it('does not always put the correct answer first', () => {
    const questions = allLinkedListQuestions('traverse', undefined, operations.traverse(sample()));
    const positions = questions.map((q) => q.options.findIndex((o) => o.id === q.correctOptionId));
    expect(new Set(positions).size).toBeGreaterThan(1);
  });
});
