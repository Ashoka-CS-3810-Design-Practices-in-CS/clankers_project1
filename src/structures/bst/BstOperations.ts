import { bstCode } from './BstPseudocode';
import { StepRecorder } from '../../domain/StepRecorder';
import type { ComplexityInfo, OperationResult } from '../../domain/visualization';
import { BstModel, type BstSnapshot, type TraversalOrder } from './BstModel';

export type BstResult = OperationResult<BstModel, BstSnapshot>;

const COMPLEXITY = {
  insert: {
    time: 'O(n)',
    space: 'O(1)',
    explanation: 'The search follows one branch. A skewed tree may require visiting every node.',
  },
  search: {
    time: 'O(n)',
    space: 'O(1)',
    explanation: 'Ordered comparisons follow one branch, but a skewed tree can have linear height.',
  },
  delete: {
    time: 'O(n)',
    space: 'O(1)',
    explanation: 'Finding the node and any inorder successor follows at most the tree height.',
  },
  traverse: {
    time: 'O(n)',
    space: 'O(n)',
    explanation: 'Every node is visited and the traversal order is retained for display.',
  },
} satisfies Record<string, ComplexityInfo>;

export class BstOperations {
  insert(model: BstModel, value: number): BstResult {
    const working = model.clone();
    const recorder = new StepRecorder<BstSnapshot>(bstCode.insert);
    const path = working.pathTo(value);
    const visited: string[] = [];
    recorder.record({
      pseudocodeLineId: 'insert.start',
      message: working.isEmpty()
        ? `${value} will become the root because the tree is empty.`
        : `Start at the root and find the ordered position for ${value}.`,
      snapshot: working.snapshot(),
    });

    path.forEach((node) => {
      visited.push(node.id);
      recorder.record({
        pseudocodeLineId:
          value === node.value
            ? 'insert.equal'
            : value < node.value
              ? 'insert.left'
              : 'insert.right',
        message:
          value === node.value
            ? `${value} already exists, so increase this node’s count.`
            : `${value} is ${value < node.value ? 'smaller' : 'larger'} than ${node.value}. Continue ${value < node.value ? 'left' : 'right'}.`,
        snapshot: working.snapshot(),
        activeNodeIds: [node.id],
        visitedNodeIds: visited,
        matchedNodeIds: value === node.value ? [node.id] : [],
      });
    });

    const inserted = working.insert(value);
    recorder.record({
      pseudocodeLineId: inserted.duplicate ? 'insert.count' : 'insert.attach',
      message: inserted.duplicate
        ? `${value} now appears ${inserted.node.count} times in this node.`
        : `${value} was inserted as ${path.length === 0 ? 'the root' : 'a leaf'}.`,
      snapshot: working.snapshot(),
      activeNodeIds: [inserted.node.id],
      visitedNodeIds: [...visited, inserted.node.id],
      matchedNodeIds: [inserted.node.id],
    });
    return this.result(working, recorder, 'success', COMPLEXITY.insert, 'Insert');
  }

  search(model: BstModel, value: number): BstResult {
    const working = model.clone();
    const recorder = new StepRecorder<BstSnapshot>(bstCode.search);
    const path = working.pathTo(value);
    const visited: string[] = [];
    recorder.record({
      pseudocodeLineId: 'search.start',
      message: `Search from the root for ${value} using ordered comparisons.`,
      snapshot: working.snapshot(),
    });

    for (const node of path) {
      visited.push(node.id);
      const matched = node.value === value;
      recorder.record({
        pseudocodeLineId: matched
          ? 'search.found'
          : value < node.value
            ? 'search.left'
            : 'search.right',
        message: matched
          ? `Found ${value}${node.count > 1 ? ` with a count of ${node.count}` : ''}.`
          : `${value} is ${value < node.value ? 'smaller' : 'larger'} than ${node.value}. Continue ${value < node.value ? 'left' : 'right'}.`,
        snapshot: working.snapshot(),
        activeNodeIds: [node.id],
        visitedNodeIds: visited,
        matchedNodeIds: matched ? [node.id] : [],
        output: matched ? [node.value] : [],
      });
      if (matched) return this.result(working, recorder, 'success', COMPLEXITY.search, 'Search');
    }

    recorder.record({
      pseudocodeLineId: 'search.missing',
      message: `The required child is empty, so ${value} is not in the tree.`,
      snapshot: working.snapshot(),
      visitedNodeIds: visited,
    });
    return this.result(working, recorder, 'not-found', COMPLEXITY.search, 'Search');
  }

  delete(model: BstModel, value: number): BstResult {
    const working = model.clone();
    const recorder = new StepRecorder<BstSnapshot>(bstCode.delete);
    const path = working.pathTo(value);
    const visited: string[] = [];
    recorder.record({
      pseudocodeLineId: 'delete.start',
      message: `Locate ${value} before changing the tree.`,
      snapshot: working.snapshot(),
    });

    for (const node of path) {
      visited.push(node.id);
      const matched = node.value === value;
      recorder.record({
        pseudocodeLineId: matched
          ? 'delete.found'
          : value < node.value
            ? 'delete.left'
            : 'delete.right',
        message: matched
          ? `Found ${value}. Determine how its children should be reconnected.`
          : `${value} is ${value < node.value ? 'smaller' : 'larger'} than ${node.value}. Continue ${value < node.value ? 'left' : 'right'}.`,
        snapshot: working.snapshot(),
        activeNodeIds: [node.id],
        visitedNodeIds: visited,
        matchedNodeIds: matched ? [node.id] : [],
      });
    }

    const target = path.at(-1);
    if (!target || target.value !== value) {
      recorder.record({
        pseudocodeLineId: 'delete.missing',
        message: `${value} is not in the tree, so nothing was removed.`,
        snapshot: working.snapshot(),
        visitedNodeIds: visited,
      });
      return this.result(working, recorder, 'not-found', COMPLEXITY.delete, 'Delete');
    }

    const deletion = working.delete(value);
    recorder.record({
      pseudocodeLineId: deletion.decremented
        ? 'delete.count'
        : target.leftId && target.rightId
          ? 'delete.successor'
          : deletion.replacementId
            ? 'delete.child'
            : 'delete.leaf',
      message: deletion.decremented
        ? `One ${value} was removed. ${target.count - 1} remain in the node.`
        : deletion.replacementId
          ? `${value} was removed and the ordered replacement was linked into its position.`
          : `${value} was a leaf and was removed directly.`,
      snapshot: working.snapshot(),
      visitedNodeIds: visited.filter((id) => id !== target.id),
      activeNodeIds: deletion.replacementId ? [deletion.replacementId] : [],
      output: [value],
    });
    return this.result(working, recorder, 'success', COMPLEXITY.delete, 'Delete');
  }

  traverse(model: BstModel, order: TraversalOrder): BstResult {
    const working = model.clone();
    const recorder = new StepRecorder<BstSnapshot>(bstCode.traverse(order));
    const visited: string[] = [];
    const output: number[] = [];
    const nodes = working.traverse(order);
    const label = this.orderLabel(order);
    recorder.record({
      pseudocodeLineId: 'traverse.start',
      message: `Begin ${label.toLowerCase()} traversal.`,
      snapshot: working.snapshot(),
    });

    nodes.forEach((node) => {
      visited.push(node.id);
      for (let occurrence = 0; occurrence < node.count; occurrence += 1) output.push(node.value);
      recorder.record({
        pseudocodeLineId: 'traverse.visit',
        message: `Visit ${node.value}${node.count > 1 ? ` and output it ${node.count} times` : ''}.`,
        snapshot: working.snapshot(),
        activeNodeIds: [node.id],
        visitedNodeIds: visited,
        output,
      });
    });

    recorder.record({
      pseudocodeLineId: 'traverse.done',
      message: nodes.length === 0 ? 'The tree is empty.' : `${label} traversal is complete.`,
      snapshot: working.snapshot(),
      visitedNodeIds: visited,
      output,
    });
    return this.result(working, recorder, 'success', COMPLEXITY.traverse, label);
  }

  private orderLabel(order: TraversalOrder): string {
    return { inorder: 'Inorder', preorder: 'Preorder', postorder: 'Postorder' }[order];
  }

  private result(
    model: BstModel,
    recorder: StepRecorder<BstSnapshot>,
    status: BstResult['status'],
    complexity: ComplexityInfo,
    operationLabel: string,
  ): BstResult {
    return Object.freeze({
      model,
      steps: recorder.steps(),
      pseudocode: recorder.pseudocode,
      status,
      complexity: Object.freeze({ ...complexity }),
      operationLabel,
    });
  }
}
