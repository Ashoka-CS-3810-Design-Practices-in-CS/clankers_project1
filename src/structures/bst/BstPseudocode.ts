import { definePseudocode, type PseudocodeDefinition } from '../../domain/pseudocode';
import type { TraversalOrder } from './BstModel';

const traversals: Record<TraversalOrder, PseudocodeDefinition> = {
  inorder: definePseudocode('Inorder traversal', [
    ['traverse.start', 'output ← []; visit(root): left → node → right'],
    ['traverse.visit', 'append node.value, node.count times, in inorder'],
    ['traverse.done', 'return output'],
  ]),
  preorder: definePseudocode('Preorder traversal', [
    ['traverse.start', 'output ← []; visit(root): node → left → right'],
    ['traverse.visit', 'append node.value, node.count times, in preorder'],
    ['traverse.done', 'return output'],
  ]),
  postorder: definePseudocode('Postorder traversal', [
    ['traverse.start', 'output ← []; visit(root): left → right → node'],
    ['traverse.visit', 'append node.value, node.count times, in postorder'],
    ['traverse.done', 'return output'],
  ]),
};

export const bstCode = {
  insert: definePseudocode('BST insert', [
    ['insert.start', 'current ← root'],
    ['insert.left', 'if value < current.value: continue left', 1],
    ['insert.right', 'if value > current.value: continue right', 1],
    ['insert.equal', 'if value = current.value: select existing node', 1],
    ['insert.count', 'increment existing node.count; return'],
    ['insert.attach', 'attach new leaf at empty child (or root)'],
  ]),
  search: definePseudocode('BST search', [
    ['search.start', 'current ← root'],
    ['search.left', 'if value < current.value: continue left', 1],
    ['search.right', 'if value > current.value: continue right', 1],
    ['search.found', 'if value = current.value: return current', 1],
    ['search.missing', 'return NOT_FOUND when current = null'],
  ]),
  delete: definePseudocode('BST delete', [
    ['delete.start', 'current ← root'],
    ['delete.left', 'if value < current.value: continue left', 1],
    ['delete.right', 'if value > current.value: continue right', 1],
    ['delete.found', 'if value = current.value: inspect count and children', 1],
    ['delete.missing', 'if current = null: return NOT_FOUND'],
    ['delete.count', 'if count > 1: decrement count; return'],
    ['delete.leaf', 'if no children: unlink leaf; return'],
    ['delete.child', 'if one child: replace node with child; return'],
    ['delete.successor', 'if two children: promote inorder successor; reconnect'],
  ]),
  traverse: (order: TraversalOrder) => traversals[order],
};
