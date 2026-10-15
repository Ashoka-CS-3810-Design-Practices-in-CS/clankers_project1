import { describe, expect, it } from 'vitest';
import type { PracticeQuestion } from '../../practice/practice';
import { BstModel } from './BstModel';
import { BstOperations } from './BstOperations';
import { allBstQuestions, bstPractice, traversalIds } from './BstPractice';

const operations = new BstOperations();
// 50 at the root; 30 (20, 40) on the left; 70 (60, 80) on the right.
const sample = () => BstModel.sample();

function correctLabel(question: PracticeQuestion | undefined): string {
  return question?.options.find((option) => option.id === question.correctOptionId)?.label ?? '';
}

function expectWellFormed(questions: readonly PracticeQuestion[], stepCount: number) {
  expect(questions.length).toBeGreaterThan(0);
  for (const question of questions) {
    expect(question.stepIndex).toBeLessThan(stepCount - 1);
    const ids = question.options.map((option) => option.id);
    const labels = question.options.map((option) => option.label);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(labels).size).toBe(labels.length);
    expect(question.options.length).toBeGreaterThanOrEqual(2);
    expect(ids).toContain(question.correctOptionId);
  }
}

describe('BST practice: ordered walks', () => {
  it('asks each comparison on the search path and tests the left/right rule', () => {
    const result = operations.search(sample(), 60);
    const questions = allBstQuestions('search', 60, result);
    expectWellFormed(questions, result.steps.length);
    expect(questions.map(correctLabel)).toEqual([
      '60 > 50, so go right',
      '60 < 70, so go left',
      '60 = 60: found, the search stops',
    ]);
    expect(questions[0].options.map((o) => o.label)).toContain('60 > 50, so go left');
  });

  it('stops at an empty child when the value is missing', () => {
    const result = operations.search(sample(), 65);
    const last = allBstQuestions('search', 65, result).at(-1);
    expect(last?.prompt).toBe(
      '65 is larger than 60, and 60 has no right child. What happens next?',
    );
    expect(correctLabel(last)).toBe('Stop: 65 is not in the tree');
    expect(last?.options.map((o) => o.id)).toContain('other-side');
  });

  it('attaches a new value as a leaf on the correct side', () => {
    const result = operations.insert(sample(), 65);
    const last = allBstQuestions('insert', 65, result).at(-1);
    expect(correctLabel(last)).toBe("Attach 65 as 60's right child");
  });

  it('counts duplicates instead of adding a node', () => {
    const result = operations.insert(sample(), 30);
    const questions = allBstQuestions('insert', 30, result);
    expect(correctLabel(questions[1])).toBe('30 = 30: it already exists, so its count goes up');
    expect(correctLabel(questions.at(-1))).toBe("Increase that node's count to 2");
  });
});

describe('BST practice: deletion cases', () => {
  it('replaces a node with two children by its inorder successor', () => {
    const result = operations.delete(sample(), 50);
    const removal = allBstQuestions('delete', 50, result).at(-1);
    expect(correctLabel(removal)).toBe(
      'Replace it with 60, the smallest value in its right subtree',
    );
    expect(removal?.options.map((o) => o.label)).toContain('Replace it with its right child, 70');
  });

  it('removes a leaf by clearing its parent link', () => {
    const removal = allBstQuestions('delete', 20, operations.delete(sample(), 20)).at(-1);
    expect(correctLabel(removal)).toBe("Remove the leaf: 30's left link becomes empty");
  });

  it('links an only child to the parent', () => {
    const model = BstModel.fromValues([50, 30, 20]);
    const removal = allBstQuestions('delete', 30, operations.delete(model, 30)).at(-1);
    expect(correctLabel(removal)).toBe('Link its only child, 20, directly to 50');
  });

  it('lowers the count of a duplicated value', () => {
    const model = BstModel.fromValues([50, 30, 30]);
    const removal = allBstQuestions('delete', 30, operations.delete(model, 30)).at(-1);
    expect(correctLabel(removal)).toBe('Lower the count to 1; the node stays');
  });

  it('reports a missing value without removing anything', () => {
    const last = allBstQuestions('delete', 99, operations.delete(sample(), 99)).at(-1);
    expect(correctLabel(last)).toBe('Stop: 99 is not in the tree, so nothing is removed');
  });
});

describe('BST practice: traversals', () => {
  it('computes the three orders from a snapshot', () => {
    const snapshot = sample().snapshot();
    const values = (order: 'inorder' | 'preorder' | 'postorder') =>
      traversalIds(snapshot, order).map((id) => snapshot.nodes.find((n) => n.id === id)!.value);
    expect(values('inorder')).toEqual([20, 30, 40, 50, 60, 70, 80]);
    expect(values('preorder')).toEqual([50, 30, 20, 40, 70, 60, 80]);
    expect(values('postorder')).toEqual([20, 40, 30, 60, 80, 70, 50]);
  });

  it('uses the other orders as distractors for the first visit', () => {
    const result = operations.traverse(sample(), 'preorder');
    const [first] = allBstQuestions('preorder', undefined, result);
    expectWellFormed([first], result.steps.length);
    expect(correctLabel(first)).toBe('Visit 50');
    expect(first.options.map((o) => o.label)).toEqual(
      expect.arrayContaining(['Visit 50', 'Visit 20']),
    );
  });

  it('asks every visit and ends with completion', () => {
    const result = operations.traverse(sample(), 'postorder');
    const questions = allBstQuestions('postorder', undefined, result);
    expectWellFormed(questions, result.steps.length);
    expect(questions.map(correctLabel).slice(0, 7)).toEqual(
      [20, 40, 30, 60, 80, 70, 50].map((value) => `Visit ${value}`),
    );
    expect(correctLabel(questions.at(-1))).toBe('Postorder traversal is complete');
  });
});

describe('BST practice selection', () => {
  it('asks nothing on an empty tree', () => {
    expect(bstPractice('insert', 5, operations.insert(new BstModel(), 5))).toEqual([]);
    expect(
      bstPractice('inorder', undefined, operations.traverse(new BstModel(), 'inorder')),
    ).toEqual([]);
  });

  it('keeps the decisive deletion question when trimming to three', () => {
    const chosen = bstPractice('delete', 20, operations.delete(sample(), 20));
    expect(chosen).toHaveLength(3);
    expect(chosen.at(-1)?.correctOptionId).toBe('leaf');
  });
});
