import type { VisualizationStep } from '../../domain/visualization';
import {
  arrangeOptions,
  chooseQuestions,
  type PracticeOption,
  type PracticeQuestion,
} from '../../practice/practice';
import type { BstNodeSnapshot, BstSnapshot, TraversalOrder } from './BstModel';
import type { BstResult } from './BstOperations';

export type BstPracticeOperation = 'insert' | 'search' | 'delete' | TraversalOrder;

type Step = VisualizationStep<BstSnapshot>;

interface Draft {
  readonly prompt: string;
  readonly options: readonly PracticeOption[];
  readonly correctOptionId: string;
  readonly explanation: string;
  readonly decisive: boolean;
}

const ORDERS: readonly TraversalOrder[] = ['inorder', 'preorder', 'postorder'];
const ORDER_LABEL: Record<TraversalOrder, string> = {
  inorder: 'Inorder',
  preorder: 'Preorder',
  postorder: 'Postorder',
};
const ORDER_RULE: Record<TraversalOrder, string> = {
  inorder:
    'Inorder visits the left subtree, then the node, then the right subtree, so values come out sorted.',
  preorder: 'Preorder visits a node before either subtree: node, left, right.',
  postorder: 'Postorder visits both subtrees before the node: left, right, node.',
};

function nodeById(snapshot: BstSnapshot, id: string | null | undefined) {
  return id ? snapshot.nodes.find((node) => node.id === id) : undefined;
}

function parentOf(snapshot: BstSnapshot, id: string): BstNodeSnapshot | undefined {
  return snapshot.nodes.find((node) => node.leftId === id || node.rightId === id);
}

/** Node ids in traversal order, computed from a snapshot. */
export function traversalIds(snapshot: BstSnapshot, order: TraversalOrder): readonly string[] {
  const ids: string[] = [];
  const visit = (id: string | null) => {
    const node = nodeById(snapshot, id);
    if (!node) return;
    if (order === 'preorder') ids.push(node.id);
    visit(node.leftId);
    if (order === 'inorder') ids.push(node.id);
    visit(node.rightId);
    if (order === 'postorder') ids.push(node.id);
  };
  visit(snapshot.rootId);
  return ids;
}

function uniqueByLabel(options: readonly PracticeOption[]): PracticeOption[] {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (seen.has(option.label) || seen.has(option.id)) return false;
    seen.add(option.label);
    seen.add(option.id);
    return true;
  });
}

type WalkKind = 'search' | 'insert' | 'delete';

/**
 * The next step compares the target with a node. Distractors test the BST rule itself
 * (smaller goes left, larger goes right, equal stops) rather than the arithmetic.
 */
function comparisonQuestion(kind: WalkKind, target: number, current: Step, next: Step): Draft {
  const node = nodeById(next.snapshot, next.activeNodeIds[0])!;
  const atRoot = current.activeNodeIds.length === 0;
  const verb = { search: 'Searching for', insert: 'Inserting', delete: 'Deleting' }[kind];
  const found = {
    search: `${target} = ${node.value}: found, the search stops`,
    insert: `${target} = ${node.value}: it already exists, so its count goes up`,
    delete: `${target} = ${node.value}: found, so it will be removed`,
  }[kind];
  const prompt = atRoot
    ? `${verb} ${target}. The walk starts at the root, ${node.value}. What does the first comparison decide?`
    : `${verb} ${target}. The walk reaches ${node.value}. What does that comparison decide?`;

  if (target === node.value) {
    return {
      prompt,
      options: [
        { id: 'found', label: found },
        {
          id: 'equal-right',
          label: `${target} = ${node.value}: equal values go right, keep walking`,
        },
        {
          id: 'equal-left',
          label: `${target} = ${node.value}: equal values go left, keep walking`,
        },
      ],
      correctOptionId: 'found',
      explanation:
        kind === 'insert'
          ? `${target} equals ${node.value}. This tree keeps one node per value and counts duplicates, so the walk stops here.`
          : `${target} equals ${node.value}, so the walk stops here. Each value has exactly one node in this tree.`,
      decisive: true,
    };
  }

  const smaller = target < node.value;
  const sign = smaller ? '<' : '>';
  const wrongSign = smaller ? '>' : '<';
  const side = smaller ? 'left' : 'right';
  const otherSide = smaller ? 'right' : 'left';
  return {
    prompt,
    options: [
      { id: 'rule', label: `${target} ${sign} ${node.value}, so go ${side}` },
      { id: 'reversed', label: `${target} ${sign} ${node.value}, so go ${otherSide}` },
      { id: 'misread', label: `${target} ${wrongSign} ${node.value}, so go ${otherSide}` },
    ],
    correctOptionId: 'rule',
    explanation: `${target} is ${smaller ? 'smaller' : 'larger'} than ${node.value}. Every smaller value lives in the left subtree and every larger one in the right, so the walk goes ${side} and never looks at ${node.value}'s ${otherSide} subtree.`,
    decisive: false,
  };
}

/** Search ran off the tree: the required child is empty. */
function notFoundQuestion(kind: 'search' | 'delete', target: number, current: Step): Draft {
  const last = nodeById(current.snapshot, current.activeNodeIds[0])!;
  const side = target < last.value ? 'left' : 'right';
  const other = side === 'left' ? 'right' : 'left';
  return {
    prompt: `${target} is ${side === 'left' ? 'smaller' : 'larger'} than ${last.value}, and ${last.value} has no ${side} child. What happens next?`,
    options: [
      {
        id: 'missing',
        label:
          kind === 'search'
            ? `Stop: ${target} is not in the tree`
            : `Stop: ${target} is not in the tree, so nothing is removed`,
      },
      { id: 'other-side', label: `Try ${last.value}'s ${other} subtree instead` },
      { id: 'closest', label: `Stop at ${last.value}: it is the closest value` },
    ],
    correctOptionId: 'missing',
    explanation: `In a BST, ${target} could only be in ${last.value}'s ${side} subtree. That subtree is empty, so ${target} is not in the tree. There is no need to look anywhere else.`,
    decisive: true,
  };
}

function insertPlacementQuestion(target: number, current: Step): Draft {
  const last = nodeById(current.snapshot, current.activeNodeIds[0])!;
  if (last.value === target) {
    return {
      prompt: `${target} is already in the tree. What does Insert do?`,
      options: [
        { id: 'count', label: `Increase that node's count to ${last.count + 1}` },
        { id: 'new-node', label: `Add a second ${target} node as its right child` },
        { id: 'reject', label: 'Nothing: duplicates are rejected' },
      ],
      correctOptionId: 'count',
      explanation:
        'This tree stores duplicates as a count on the existing node, so its shape does not change and every value keeps one position.',
      decisive: true,
    };
  }
  const side = target < last.value ? 'left' : 'right';
  const other = side === 'left' ? 'right' : 'left';
  return {
    prompt: `${target} is ${side === 'left' ? 'smaller' : 'larger'} than ${last.value}, and ${last.value} has no ${side} child. Where does ${target} go?`,
    options: [
      { id: 'attach', label: `Attach ${target} as ${last.value}'s ${side} child` },
      { id: 'other-side', label: `Attach ${target} as ${last.value}'s ${other} child` },
      { id: 'replace', label: `Replace ${last.value} with ${target}` },
    ],
    correctOptionId: 'attach',
    explanation: `The walk stops at the first empty child on the search path. A new value always becomes a leaf, so existing nodes never move.`,
    decisive: true,
  };
}

function successorOf(snapshot: BstSnapshot, node: BstNodeSnapshot): BstNodeSnapshot | undefined {
  let current = nodeById(snapshot, node.rightId);
  while (current?.leftId) current = nodeById(snapshot, current.leftId);
  return current;
}

function deleteRemovalQuestion(target: number, current: Step): Draft {
  const snapshot = current.snapshot;
  const node = nodeById(snapshot, current.matchedNodeIds[0])!;
  const parent = parentOf(snapshot, node.id);
  const left = nodeById(snapshot, node.leftId);
  const right = nodeById(snapshot, node.rightId);
  const prompt = `${target} was found. How is it removed?`;
  const keepMarked: PracticeOption = {
    id: 'mark',
    label: 'Mark it as deleted but leave the node in place',
  };

  if (node.count > 1) {
    return {
      prompt: `${target} was found with a count of ${node.count}. What does Delete do?`,
      options: [
        { id: 'decrement', label: `Lower the count to ${node.count - 1}; the node stays` },
        { id: 'remove-all', label: `Remove the node and all ${node.count} copies` },
        { id: 'refuse', label: 'Nothing: a duplicated value cannot be deleted' },
      ],
      correctOptionId: 'decrement',
      explanation:
        'Duplicates are a count, so deleting one copy only lowers the count. The tree keeps its shape.',
      decisive: true,
    };
  }

  if (!left && !right) {
    return {
      prompt,
      options: [
        {
          id: 'leaf',
          label: parent
            ? `Remove the leaf: ${parent.value}'s ${parent.leftId === node.id ? 'left' : 'right'} link becomes empty`
            : 'Remove it: the tree becomes empty',
        },
        keepMarked,
        { id: 'parent-too', label: 'Remove its parent too, so the tree stays balanced' },
      ],
      correctOptionId: 'leaf',
      explanation: `${target} has no children, so nothing needs reconnecting. Its parent's link simply becomes empty.`,
      decisive: true,
    };
  }

  if (!left || !right) {
    const child = (left ?? right)!;
    return {
      prompt,
      options: [
        {
          id: 'link-child',
          label: parent
            ? `Link its only child, ${child.value}, directly to ${parent.value}`
            : `Its only child, ${child.value}, becomes the root`,
        },
        { id: 'drop-subtree', label: `Remove ${target} together with ${child.value}'s subtree` },
        keepMarked,
      ],
      correctOptionId: 'link-child',
      explanation: `${target} has one child, so that child's whole subtree moves up one level. Every value in it was already on the correct side of ${target}'s parent, so order is kept.`,
      decisive: true,
    };
  }

  const successor = successorOf(snapshot, node)!;
  const wrongChild =
    right.id !== successor.id
      ? { id: 'right-child', label: `Replace it with its right child, ${right.value}` }
      : { id: 'left-child', label: `Replace it with its left child, ${left.value}` };
  return {
    prompt,
    options: [
      {
        id: 'successor',
        label: `Replace it with ${successor.value}, the smallest value in its right subtree`,
      },
      wrongChild,
      { id: 'drop-subtree', label: `Remove ${target} and everything below it` },
    ],
    correctOptionId: 'successor',
    explanation: `${target} has two children. Its inorder successor, ${successor.value}, is larger than everything on the left and smaller than everything else on the right, so it can take ${target}'s place without breaking the order.`,
    decisive: true,
  };
}

function traversalQuestion(order: TraversalOrder, current: Step, next: Step, index: number): Draft {
  const snapshot = current.snapshot;
  const orderIds = traversalIds(snapshot, order);
  const visited = new Set(current.visitedNodeIds);
  const valueOf = (id: string) => nodeById(snapshot, id)!.value;
  const nextId = next.activeNodeIds[0];
  const label = ORDER_LABEL[order];
  const complete: PracticeOption = { id: 'complete', label: `${label} traversal is complete` };

  if (nextId === undefined) {
    const currentId = current.activeNodeIds[0];
    const options = uniqueByLabel([
      complete,
      { id: 'root-again', label: `Visit the root, ${valueOf(snapshot.rootId!)}, again` },
      ...(currentId && currentId !== snapshot.rootId
        ? [{ id: 'repeat', label: `Visit ${valueOf(currentId)} again` }]
        : []),
      { id: 'first-again', label: `Go back to ${valueOf(orderIds[0])} and start again` },
    ]).slice(0, 3);
    return {
      prompt: `Every node has been visited. What happens next?`,
      options,
      correctOptionId: 'complete',
      explanation: `${label} traversal visits each node exactly once, so it ends after the last one.`,
      decisive: true,
    };
  }

  // Distractors: where the other two orders would be at this point, then other unvisited nodes.
  const candidates = [
    ...ORDERS.filter((other) => other !== order).map(
      (other) => traversalIds(snapshot, other)[index],
    ),
    ...orderIds.filter((id) => !visited.has(id)),
  ].filter((id): id is string => Boolean(id) && id !== nextId && !visited.has(id!));
  const distractors = [...new Set(candidates)].slice(0, 2);
  const options = uniqueByLabel([
    { id: `visit-${nextId}`, label: `Visit ${valueOf(nextId)}` },
    ...distractors.map((id) => ({ id: `visit-${id}`, label: `Visit ${valueOf(id)}` })),
    complete,
  ]).slice(0, 3);
  const visitedValues = orderIds.filter((id) => visited.has(id)).map(valueOf);
  return {
    prompt:
      visitedValues.length === 0
        ? `${label} traversal starts. Which node is visited first?`
        : `${label} has visited ${visitedValues.join(', ')}. Which node comes next?`,
    options,
    correctOptionId: `visit-${nextId}`,
    explanation: `${ORDER_RULE[order]} So the next node is ${valueOf(nextId)}.`,
    decisive: visitedValues.length === 0,
  };
}

function totalCount(snapshot: BstSnapshot): number {
  return snapshot.nodes.reduce((sum, node) => sum + node.count, 0);
}

/** A walk step: one more node visited and highlighted, and the tree itself unchanged. */
function isComparison(current: Step, next: Step): boolean {
  return (
    next.activeNodeIds.length === 1 &&
    next.visitedNodeIds.length === current.visitedNodeIds.length + 1 &&
    totalCount(next.snapshot) === totalCount(current.snapshot)
  );
}

function draftFor(
  operation: BstPracticeOperation,
  value: number | undefined,
  current: Step,
  next: Step,
  index: number,
): Draft | null {
  if (operation === 'inorder' || operation === 'preorder' || operation === 'postorder') {
    return traversalQuestion(operation, current, next, index);
  }
  if (value === undefined) return null;
  if (isComparison(current, next)) return comparisonQuestion(operation, value, current, next);
  if (operation === 'insert') return insertPlacementQuestion(value, current);
  if (operation === 'delete' && current.matchedNodeIds.length > 0) {
    return deleteRemovalQuestion(value, current);
  }
  return notFoundQuestion(operation, value, current);
}

/** Every possible question for a BST trace, one per step that has a following step. */
export function allBstQuestions(
  operation: BstPracticeOperation,
  value: number | undefined,
  result: BstResult,
): readonly PracticeQuestion[] {
  const { steps } = result;
  // An empty tree has nothing to predict: every operation finishes in one move.
  if (steps.length < 2 || steps[0].snapshot.nodes.length === 0) return [];
  const questions: PracticeQuestion[] = [];
  for (let index = 0; index < steps.length - 1; index += 1) {
    const draft = draftFor(operation, value, steps[index], steps[index + 1], index);
    if (!draft) continue;
    questions.push(
      Object.freeze({ ...draft, stepIndex: index, options: arrangeOptions(draft.options, index) }),
    );
  }
  return Object.freeze(questions);
}

/** The questions practice mode actually asks for a BST trace. */
export function bstPractice(
  operation: BstPracticeOperation,
  value: number | undefined,
  result: BstResult,
): readonly PracticeQuestion[] {
  return chooseQuestions(allBstQuestions(operation, value, result));
}
