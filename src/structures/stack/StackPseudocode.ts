import { definePseudocode } from '../../domain/pseudocode';

export const stackCode = {
  push: definePseudocode('Push', [
    ['push.prepare', 'item ← Node(value)'],
    ['push.add', 'append item at top'],
  ]),
  pop: definePseudocode('Pop', [
    ['pop.empty', 'if stack is empty: return UNDERFLOW'],
    ['pop.read', 'item ← top'],
    ['pop.remove', 'remove top; return item.value'],
  ]),
  peek: definePseudocode('Peek', [
    ['peek.empty', 'if stack is empty: return UNDERFLOW'],
    ['peek.read', 'item ← top'],
    ['peek.return', 'return item.value without removing item'],
  ]),
  inspect: definePseudocode('Inspect top to bottom', [
    ['inspect.start', 'output ← []; current ← top'],
    ['inspect.visit', 'for each item toward bottom: append value to output'],
    ['inspect.done', 'return output'],
  ]),
};
