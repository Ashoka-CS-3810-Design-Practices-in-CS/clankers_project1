import { definePseudocode } from '../../domain/pseudocode';

export const queueCode = {
  enqueue: definePseudocode('Enqueue', [
    ['enqueue.prepare', 'item ← Node(value); locate rear'],
    ['enqueue.add', 'attach item at rear; set front if queue was empty'],
  ]),
  dequeue: definePseudocode('Dequeue', [
    ['dequeue.empty', 'if queue is empty: return UNDERFLOW'],
    ['dequeue.read', 'item ← front'],
    ['dequeue.remove', 'advance front; return item.value'],
  ]),
  peek: definePseudocode('Peek front', [
    ['peek.empty', 'if queue is empty: return UNDERFLOW'],
    ['peek.read', 'item ← front'],
    ['peek.return', 'return item.value without removing item'],
  ]),
  inspect: definePseudocode('Inspect front to rear', [
    ['inspect.start', 'output ← []; current ← front'],
    ['inspect.visit', 'for each item toward rear: append value to output'],
    ['inspect.done', 'return output'],
  ]),
};
