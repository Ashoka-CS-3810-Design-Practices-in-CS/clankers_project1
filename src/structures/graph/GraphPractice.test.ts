import { describe, expect, it } from 'vitest';
import type { PracticeQuestion } from '../../practice/practice';
import { GraphModel } from './GraphModel';
import { GraphOperations } from './GraphOperations';
import { allGraphQuestions, graphPractice } from './GraphPractice';

const operations = new GraphOperations();
// Vertices 1–6; edges 1–2, 1–3, 2–4, 3–5, 4–5, 4–6, 5–6.
const sample = () => GraphModel.sample();

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

describe('graph practice: BFS', () => {
  it('asks for every visit in queue order and the empty-queue finish', () => {
    const result = operations.bfs(sample(), 1);
    const questions = allGraphQuestions('bfs', result);
    expectWellFormed(questions, result.steps.length);
    expect(questions.map(correctLabel)).toEqual([
      'Visit 2',
      'Visit 3',
      'Visit 4',
      'Visit 5',
      'Visit 6',
      'BFS is finished: every vertex reachable from 1 has been visited',
    ]);
  });

  it('never asks at a visit step, whose narration names the vertex', () => {
    const result = operations.bfs(sample(), 1);
    for (const question of allGraphQuestions('bfs', result)) {
      expect(result.steps[question.stepIndex + 1].output.length).toBeGreaterThanOrEqual(
        result.steps[question.stepIndex].output.length,
      );
      expect(result.steps[question.stepIndex].message).not.toMatch(/^Dequeue/);
    }
  });

  it('offers the unreachable vertex as a distractor in a disconnected graph', () => {
    const graph = GraphModel.fromEdges(
      [1, 2, 3, 7],
      [
        [1, 2],
        [2, 3],
      ],
    );
    const last = allGraphQuestions('bfs', operations.bfs(graph, 1)).at(-1);
    expect(last?.options.map((o) => o.label)).toContain('Continue from 7, which was never reached');
    expect(last?.explanation).toContain('different component');
  });
});

describe('graph practice: DFS', () => {
  it('asks deeper-or-backtrack at each vertex DFS sits on', () => {
    const result = operations.dfs(sample(), 1);
    const questions = allGraphQuestions('dfs', result);
    expectWellFormed(questions, result.steps.length);
    expect(questions.slice(0, 5).map(correctLabel)).toEqual([
      'Go deeper to 2',
      'Go deeper to 4',
      'Go deeper to 5',
      'Go deeper to 3',
      'Backtrack: pop 3 and return to 5',
    ]);
    expect(correctLabel(questions.at(-1))).toBe('Backtrack: pop 1, and the stack is empty');
  });

  it('uses label order and BFS-style jumps as distractors', () => {
    const questions = allGraphQuestions('dfs', operations.dfs(sample(), 1));
    expect(questions[0].options.map((o) => o.label)).toContain('Go deeper to 3');
    expect(questions[1].options.map((o) => o.label)).toContain('Jump to 3');
    expect(questions[4].options.map((o) => o.label)).toContain('Go deeper to 1');
  });

  it('never asks at a step whose narration names the next edge', () => {
    const result = operations.dfs(sample(), 1);
    for (const question of allGraphQuestions('dfs', result)) {
      expect(result.steps[question.stepIndex].message).not.toMatch(/follow edge|skip edge/);
    }
  });
});

describe('graph practice selection', () => {
  it('asks nothing for edits', () => {
    expect(graphPractice('edit', operations.addVertex(sample(), 9))).toEqual([]);
  });

  it('keeps DFS to three: the first move, one middle, and the first backtrack', () => {
    const chosen = graphPractice('dfs', operations.dfs(sample(), 1));
    expect(chosen).toHaveLength(3);
    expect(chosen[0].correctOptionId).toBe('deeper-2');
    expect(chosen.at(-1)?.correctOptionId).toBe('backtrack');
  });
});
