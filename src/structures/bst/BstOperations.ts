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

const PSEUDOCODE = {
  insert: [
    'if root = null: root ← new Node(value); return',
    'node ← root',
    'loop:',
    '  if value = node.value: node.count ← node.count + 1; return',
    '  if value < node.value:',
    '    if node.left = null: node.left ← new Node(value); return',
    '    node ← node.left',
    '  else:',
    '    if node.right = null: node.right ← new Node(value); return',
    '    node ← node.right',
  ],
  search: [
    'node ← root',
    'while node ≠ null:',
    '  if value = node.value: return node',
    '  if value < node.value: node ← node.left',
    '  else: node ← node.right',
    'return not found',
  ],
  delete: [
    'node ← search(value)  // walk left or right',
    'if node = null: return',
    'if node.count > 1: node.count ← node.count − 1; return',
    'if node has no children: unlink it from its parent',
    'else if node has one child: link that child to its parent',
    'else: succ ← smallest node in node.right',
    '      put succ in node’s place',
  ],
  inorder: [
    'inorder(root)',
    'function inorder(node):',
    '  if node = null: return',
    '  inorder(node.left)',
    '  visit(node)',
    '  inorder(node.right)',
  ],
  preorder: [
    'preorder(root)',
    'function preorder(node):',
    '  if node = null: return',
    '  visit(node)',
    '  preorder(node.left)',
    '  preorder(node.right)',
  ],
  postorder: [
    'postorder(root)',
    'function postorder(node):',
    '  if node = null: return',
    '  postorder(node.left)',
    '  postorder(node.right)',
    '  visit(node)',
  ],
} satisfies Record<string, readonly string[]>;

const VISIT_LINE: Record<TraversalOrder, number> = { inorder: 5, preorder: 4, postorder: 6 };

/** Pseudocode line for one comparison on a search path. */
function comparisonLine(
  value: number,
  nodeValue: number,
  equal: number,
  left: number,
  right: number,
) {
  if (value === nodeValue) return equal;
  return value < nodeValue ? left : right;
}

export class BstOperations {
  insert(model: BstModel, value: number): BstResult {
    const working = model.clone();
    const recorder = new StepRecorder<BstSnapshot>();
    const path = working.pathTo(value);
    const visited: string[] = [];
    recorder.record({
      message: working.isEmpty()
        ? `${value} will become the root because the tree is empty.`
        : `Start at the root and find the ordered position for ${value}.`,
      snapshot: working.snapshot(),
      line: working.isEmpty() ? 1 : 2,
    });

    path.forEach((node) => {
      visited.push(node.id);
      recorder.record({
        message:
          value === node.value
            ? `${value} already exists, so increase this node’s count.`
            : `${value} is ${value < node.value ? 'smaller' : 'larger'} than ${node.value}. Continue ${value < node.value ? 'left' : 'right'}.`,
        snapshot: working.snapshot(),
        activeNodeIds: [node.id],
        visitedNodeIds: visited,
        matchedNodeIds: value === node.value ? [node.id] : [],
        line: comparisonLine(value, node.value, 4, 5, 8),
      });
    });

    const inserted = working.insert(value);
    const parent = path.at(-1);
    recorder.record({
      message: inserted.duplicate
        ? `${value} now appears ${inserted.node.count} times in this node.`
        : `${value} was inserted as ${path.length === 0 ? 'the root' : 'a leaf'}.`,
      snapshot: working.snapshot(),
      activeNodeIds: [inserted.node.id],
      visitedNodeIds: [...visited, inserted.node.id],
      matchedNodeIds: [inserted.node.id],
      line: inserted.duplicate ? 4 : !parent ? 1 : value < parent.value ? 6 : 9,
    });
    return this.result(
      working,
      recorder,
      'success',
      COMPLEXITY.insert,
      'Insert',
      PSEUDOCODE.insert,
    );
  }

  search(model: BstModel, value: number): BstResult {
    const working = model.clone();
    const recorder = new StepRecorder<BstSnapshot>();
    const path = working.pathTo(value);
    const visited: string[] = [];
    recorder.record({
      message: `Search from the root for ${value} using ordered comparisons.`,
      snapshot: working.snapshot(),
      line: 1,
    });

    for (const node of path) {
      visited.push(node.id);
      const matched = node.value === value;
      recorder.record({
        message: matched
          ? `Found ${value}${node.count > 1 ? ` with a count of ${node.count}` : ''}.`
          : `${value} is ${value < node.value ? 'smaller' : 'larger'} than ${node.value}. Continue ${value < node.value ? 'left' : 'right'}.`,
        snapshot: working.snapshot(),
        activeNodeIds: [node.id],
        visitedNodeIds: visited,
        matchedNodeIds: matched ? [node.id] : [],
        output: matched ? [node.value] : [],
        line: comparisonLine(value, node.value, 3, 4, 5),
      });
      if (matched) {
        return this.result(
          working,
          recorder,
          'success',
          COMPLEXITY.search,
          'Search',
          PSEUDOCODE.search,
        );
      }
    }

    recorder.record({
      message: `The required child is empty, so ${value} is not in the tree.`,
      snapshot: working.snapshot(),
      visitedNodeIds: visited,
      line: 6,
    });
    return this.result(
      working,
      recorder,
      'not-found',
      COMPLEXITY.search,
      'Search',
      PSEUDOCODE.search,
    );
  }

  delete(model: BstModel, value: number): BstResult {
    const working = model.clone();
    const recorder = new StepRecorder<BstSnapshot>();
    const path = working.pathTo(value);
    const visited: string[] = [];
    recorder.record({
      message: `Locate ${value} before changing the tree.`,
      snapshot: working.snapshot(),
      line: 1,
    });

    for (const node of path) {
      visited.push(node.id);
      const matched = node.value === value;
      recorder.record({
        message: matched
          ? `Found ${value}. Determine how its children should be reconnected.`
          : `${value} is ${value < node.value ? 'smaller' : 'larger'} than ${node.value}. Continue ${value < node.value ? 'left' : 'right'}.`,
        snapshot: working.snapshot(),
        activeNodeIds: [node.id],
        visitedNodeIds: visited,
        matchedNodeIds: matched ? [node.id] : [],
        line: 1,
      });
    }

    const target = path.at(-1);
    if (!target || target.value !== value) {
      recorder.record({
        message: `${value} is not in the tree, so nothing was removed.`,
        snapshot: working.snapshot(),
        visitedNodeIds: visited,
        line: 2,
      });
      return this.result(
        working,
        recorder,
        'not-found',
        COMPLEXITY.delete,
        'Delete',
        PSEUDOCODE.delete,
      );
    }

    const deletion = working.delete(value);
    recorder.record({
      message: deletion.decremented
        ? `One ${value} was removed. ${target.count - 1} remain in the node.`
        : deletion.replacementId
          ? `${value} was removed and the ordered replacement was linked into its position.`
          : `${value} was a leaf and was removed directly.`,
      snapshot: working.snapshot(),
      visitedNodeIds: visited.filter((id) => id !== target.id),
      activeNodeIds: deletion.replacementId ? [deletion.replacementId] : [],
      output: [value],
      line: deletion.decremented
        ? 3
        : !target.leftId && !target.rightId
          ? 4
          : target.leftId && target.rightId
            ? 7
            : 5,
    });
    return this.result(
      working,
      recorder,
      'success',
      COMPLEXITY.delete,
      'Delete',
      PSEUDOCODE.delete,
    );
  }

  traverse(model: BstModel, order: TraversalOrder): BstResult {
    const working = model.clone();
    const recorder = new StepRecorder<BstSnapshot>();
    const visited: string[] = [];
    const output: number[] = [];
    const nodes = working.traverse(order);
    const label = this.orderLabel(order);
    recorder.record({
      message: `Begin ${label.toLowerCase()} traversal.`,
      snapshot: working.snapshot(),
      line: 1,
    });

    nodes.forEach((node) => {
      visited.push(node.id);
      for (let occurrence = 0; occurrence < node.count; occurrence += 1) output.push(node.value);
      recorder.record({
        message: `Visit ${node.value}${node.count > 1 ? ` and output it ${node.count} times` : ''}.`,
        snapshot: working.snapshot(),
        activeNodeIds: [node.id],
        visitedNodeIds: visited,
        output,
        line: VISIT_LINE[order],
      });
    });

    recorder.record({
      message: nodes.length === 0 ? 'The tree is empty.' : `${label} traversal is complete.`,
      snapshot: working.snapshot(),
      visitedNodeIds: visited,
      output,
      line: 1,
    });
    return this.result(working, recorder, 'success', COMPLEXITY.traverse, label, PSEUDOCODE[order]);
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
    pseudocode: readonly string[],
  ): BstResult {
    return Object.freeze({
      model,
      steps: recorder.steps(),
      status,
      complexity: Object.freeze({ ...complexity }),
      operationLabel,
      pseudocode: Object.freeze([...pseudocode]),
    });
  }
}
