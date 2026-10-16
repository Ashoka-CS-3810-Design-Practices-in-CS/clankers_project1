import { describe, expect, it } from 'vitest';
import { StepRecorder } from '../domain/StepRecorder';
import { BST_BUGS } from '../structures/bst/BstBugs';
import { GRAPH_BUGS } from '../structures/graph/GraphBugs';
import { LINKED_LIST_BUGS } from '../structures/linked-list/LinkedListBugs';
import { PRIORITY_QUEUE_BUGS } from '../structures/priority-queue/PriorityQueueBugs';
import { buildChallenge, firstDivergence, gradeFlag, type BugScenario } from './bugHunt';
import { QUEUE_BUGS, STACK_BUGS } from './containerBugs';

function steps(...snapshots: number[]) {
  const recorder = new StepRecorder<number>();
  snapshots.forEach((snapshot) => recorder.record({ message: 'any text', snapshot, line: 1 }));
  return recorder.steps();
}

describe('firstDivergence', () => {
  it('finds the first step whose visible state differs', () => {
    expect(firstDivergence(steps(1, 2, 3), steps(1, 2, 4))).toBe(2);
    expect(firstDivergence(steps(1, 2, 3), steps(9, 2, 3))).toBe(0);
  });

  it('treats a shorter trace as diverging where it ends', () => {
    expect(firstDivergence(steps(1, 2, 3), steps(1, 2))).toBe(2);
  });

  it('ignores narration but not the line that ran', () => {
    const left = new StepRecorder<number>();
    const right = new StepRecorder<number>();
    left.record({ message: 'go right', snapshot: 1, line: 8 });
    right.record({ message: 'go left', snapshot: 1, line: 8 });
    expect(firstDivergence(left.steps(), right.steps())).toBe(1);
    const other = new StepRecorder<number>();
    other.record({ message: 'go right', snapshot: 1, line: 5 });
    expect(firstDivergence(left.steps(), other.steps())).toBe(0);
  });
});

describe('gradeFlag', () => {
  it('grades exact, early, and late flags', () => {
    expect(gradeFlag(3, 3)).toBe('exact');
    expect(gradeFlag(1, 3)).toBe('early');
    expect(gradeFlag(5, 3)).toBe('late');
  });
});

/** Where each bug first shows, checked against the traces by hand. */
const EXPECTED_DIVERGENCE: Record<string, number> = {
  'list-delete-skips-two': 3,
  'list-search-skips-head': 1,
  'stack-pop-bottom': 0,
  'stack-push-bottom': 1,
  'queue-dequeue-rear': 0,
  'queue-enqueue-front': 1,
  'bst-insert-reversed': 1,
  'bst-delete-drops-right': 2,
  'heap-sift-down-larger-child': 2,
  'heap-sift-up-once': 4,
  'graph-bfs-marks-late': 12,
  'graph-dfs-stops-at-dead-end': 11,
};

const ALL: readonly BugScenario<unknown, unknown>[] = [
  ...LINKED_LIST_BUGS,
  ...STACK_BUGS,
  ...QUEUE_BUGS,
  ...BST_BUGS,
  ...PRIORITY_QUEUE_BUGS,
  ...GRAPH_BUGS,
] as unknown as readonly BugScenario<unknown, unknown>[];

describe('bug scenarios', () => {
  it('covers every structure with two bugs each', () => {
    expect(ALL).toHaveLength(12);
    expect(new Set(ALL.map((scenario) => scenario.id)).size).toBe(12);
  });

  it.each(ALL.map((scenario) => [scenario.id, scenario] as const))(
    '%s diverges where expected and ends in a wrong state',
    (id, scenario) => {
      const challenge = buildChallenge(scenario);
      expect(challenge.divergence).toBe(EXPECTED_DIVERGENCE[id]);
      expect(challenge.divergence).toBeLessThan(challenge.buggy.steps.length);

      // Exactly one pseudocode line changes, and it is the one the scenario names.
      const correctCode = challenge.correct.pseudocode!;
      const buggyCode = challenge.buggy.pseudocode!;
      const changed = correctCode.flatMap((line, index) =>
        line === buggyCode[index] ? [] : [index + 1],
      );
      expect(changed).toEqual([scenario.buggyLine]);
      expect(challenge.fixedCode).toBe(correctCode[scenario.buggyLine - 1]);

      // Every buggy step points at a real line, and the run ends somewhere wrong.
      for (const step of challenge.buggy.steps) {
        expect(step.line).toBeGreaterThanOrEqual(1);
        expect(step.line).toBeLessThanOrEqual(buggyCode.length);
      }
      const end = (trace: typeof challenge.correct) => {
        const last = trace.steps.at(-1)!;
        return JSON.stringify([
          last.snapshot,
          last.output,
          last.matchedNodeIds,
          last.visitedNodeIds,
        ]);
      };
      expect(end(challenge.buggy)).not.toBe(end(challenge.correct));
    },
  );

  it('never changes the model the learner starts from', () => {
    for (const scenario of ALL) {
      const challenge = buildChallenge(scenario);
      expect(challenge.buggy.model).toBe(challenge.startModel);
    }
  });
});
