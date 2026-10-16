import { StepRecorder } from '../../domain/StepRecorder';
import type { BugScenario } from '../../practice/bugHunt';
import { LinkedListModel, type LinkedListSnapshot } from './LinkedListModel';
import { LinkedListOperations } from './LinkedListOperations';

const operations = new LinkedListOperations();

function snapshotOf(values: readonly { id: string; value: number }[]): LinkedListSnapshot {
  return Object.freeze({ nodes: Object.freeze(values.map((node) => Object.freeze({ ...node }))) });
}

/** Delete unlinks the match and the node after it: prev.next skips two nodes. */
const deleteSkipsTwo: BugScenario<LinkedListModel, LinkedListSnapshot> = {
  id: 'list-delete-skips-two',
  setup: 'Delete 13 from the sample list 8 → 13 → 21 → 34',
  explanation:
    'The unlink jumps two nodes ahead, so 21 is lost along with 13. prev.next must point to the node directly after the one being removed.',
  buggyLine: 6,
  buggyCode: 'else: prev.next ← current.next.next',
  start: () => LinkedListModel.sample(),
  correct: (model) => operations.deleteFirstMatch(model, 13),
  buggySteps: (model, correct) => {
    const nodes = model.items();
    const last = correct.steps.at(-1)!;
    const recorder = new StepRecorder<LinkedListSnapshot>();
    recorder.record({
      message: '13 was removed. The remaining nodes stay in order.',
      snapshot: snapshotOf(nodes.filter((node) => node.value !== 13 && node.value !== 21)),
      visitedNodeIds: last.visitedNodeIds,
      line: 6,
    });
    return [...correct.steps.slice(0, -1), ...recorder.steps()];
  },
};

/** Search starts one node too late and never compares the head. */
const searchSkipsHead: BugScenario<LinkedListModel, LinkedListSnapshot> = {
  id: 'list-search-skips-head',
  setup: 'Search for 8 in the sample list 8 → 13 → 21 → 34',
  explanation:
    'The walk starts at head.next, so the head is never compared and a value stored there is reported missing. The walk must start at head itself.',
  buggyLine: 1,
  buggyCode: 'current ← head.next',
  start: () => LinkedListModel.sample(),
  correct: (model) => operations.search(model, 8),
  buggySteps: (model) => {
    const snapshot = model.snapshot();
    const recorder = new StepRecorder<LinkedListSnapshot>();
    const visited: string[] = [];
    recorder.record({
      message: 'Search from the head for the first node containing 8.',
      snapshot,
      line: 1,
    });
    for (const node of model.items().slice(1)) {
      visited.push(node.id);
      recorder.record({
        message: `${node.value} does not match 8.`,
        snapshot,
        activeNodeIds: [node.id],
        visitedNodeIds: visited,
        line: 3,
      });
    }
    recorder.record({
      message: 'No node contains 8. The list is unchanged.',
      snapshot,
      visitedNodeIds: visited,
      line: 5,
    });
    return recorder.steps();
  },
};

export const LINKED_LIST_BUGS = [deleteSkipsTwo, searchSkipsHead] as const;
