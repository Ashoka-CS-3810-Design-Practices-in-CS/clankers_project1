import { StepRecorder } from '../../domain/StepRecorder';
import type { BugScenario } from '../../practice/bugHunt';
import { BstModel, type BstNodeSnapshot, type BstSnapshot } from './BstModel';
import { BstOperations } from './BstOperations';

const operations = new BstOperations();

function freezeSnapshot(rootId: string | null, nodes: readonly BstNodeSnapshot[]): BstSnapshot {
  return Object.freeze({
    rootId,
    nodes: Object.freeze(nodes.map((node) => Object.freeze({ ...node }))),
  });
}

/** Insert with the comparison reversed: larger values go left. */
const insertReversed: BugScenario<BstModel, BstSnapshot> = {
  id: 'bst-insert-reversed',
  setup: 'Insert 65 into the sample tree (root 50)',
  explanation:
    'The comparison is flipped, so larger values walk left. 65 ends up under 20, breaking the rule that everything left of 50 is smaller than 50. Search would never find it.',
  buggyLine: 5,
  buggyCode: '  if value > node.value:',
  start: () => BstModel.sample(),
  correct: (model) => operations.insert(model, 65),
  buggySteps: (model, correct) => {
    const value = 65;
    const snapshot = model.snapshot();
    const byId = new Map(snapshot.nodes.map((node) => [node.id, node]));
    const recorder = new StepRecorder<BstSnapshot>();
    const visited: string[] = [];
    recorder.record({
      message: `Start at the root and find the ordered position for ${value}.`,
      snapshot,
      line: 2,
    });
    let node = byId.get(snapshot.rootId!)!;
    for (;;) {
      visited.push(node.id);
      const goLeft = value > node.value; // the bug
      recorder.record({
        message: `${value} is ${value > node.value ? 'larger' : 'smaller'} than ${node.value}. Continue ${goLeft ? 'left' : 'right'}.`,
        snapshot,
        activeNodeIds: [node.id],
        visitedNodeIds: visited,
        line: goLeft ? 5 : 8,
      });
      const childId = goLeft ? node.leftId : node.rightId;
      if (!childId) break;
      node = byId.get(childId)!;
    }
    const newId = correct.steps.at(-1)!.activeNodeIds[0];
    const goLeft = value > node.value;
    const nodes = snapshot.nodes.map((existing) =>
      existing.id !== node.id ? existing : { ...existing, [goLeft ? 'leftId' : 'rightId']: newId },
    );
    recorder.record({
      message: `${value} was inserted as a leaf.`,
      snapshot: freezeSnapshot(snapshot.rootId, [
        ...nodes,
        { id: newId, value, count: 1, leftId: null, rightId: null },
      ]),
      activeNodeIds: [newId],
      visitedNodeIds: [...visited, newId],
      matchedNodeIds: [newId],
      line: goLeft ? 6 : 9,
    });
    return recorder.steps();
  },
};

/** Delete of a two-child node promotes the left child and drops the right subtree. */
const deleteDropsRight: BugScenario<BstModel, BstSnapshot> = {
  id: 'bst-delete-drops-right',
  setup: 'Delete 50, the root of the sample tree, which has two children',
  explanation:
    'The left child takes 50’s place, and nothing reattaches the right subtree, so 60, 70 and 80 vanish. A node with two children must be replaced by its inorder successor, the smallest value in its right subtree.',
  buggyLine: 6,
  buggyCode: 'else: succ ← node.left  // node.right is never reattached',
  start: () => BstModel.sample(),
  correct: (model) => operations.delete(model, 50),
  buggySteps: (model, correct) => {
    const snapshot = model.snapshot();
    const byId = new Map(snapshot.nodes.map((node) => [node.id, node]));
    const root = byId.get(snapshot.rootId!)!;
    const kept: BstNodeSnapshot[] = [];
    const collect = (id: string | null) => {
      const node = id ? byId.get(id) : undefined;
      if (!node) return;
      kept.push(node);
      collect(node.leftId);
      collect(node.rightId);
    };
    collect(root.leftId);
    const last = correct.steps.at(-1)!;
    const recorder = new StepRecorder<BstSnapshot>();
    recorder.record({
      message: last.message,
      snapshot: freezeSnapshot(root.leftId, kept),
      visitedNodeIds: last.visitedNodeIds,
      activeNodeIds: root.leftId ? [root.leftId] : [],
      output: last.output,
      line: 7,
    });
    return [...correct.steps.slice(0, -1), ...recorder.steps()];
  },
};

export const BST_BUGS = [insertReversed, deleteDropsRight] as const;
