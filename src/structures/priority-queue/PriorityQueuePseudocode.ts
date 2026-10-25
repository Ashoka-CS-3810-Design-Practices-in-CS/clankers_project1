import { definePseudocode } from '../../domain/pseudocode';

export const heapCode = {
  insert: definePseudocode('Min-heap insert', [
    ['insert.start', 'i ← heap.size'],
    ['insert.place', 'append value at index i'],
    ['insert.compare', 'compare heap[i] with heap[parent(i)]', 1],
    ['insert.swap', 'if smaller: swap with parent; i ← parent(i)', 1],
    ['insert.stop', 'otherwise: stop; heap order holds', 1],
    ['insert.root', 'if i = 0: stop at root'],
  ]),
  extractMin: definePseudocode('Extract minimum', [
    ['extract.empty', 'if heap is empty: return UNDERFLOW'],
    ['extract.read', 'minimum ← heap[0]'],
    ['extract.replace', 'move last item to root; shrink heap; i ← 0'],
    ['extract.compare', 'compare heap[i] with its smaller child', 1],
    ['extract.swap', 'if child is smaller: swap; i ← child index', 1],
    ['extract.stop', 'otherwise: stop; return minimum', 1],
    ['extract.leaf', 'if no children: return minimum'],
    ['extract.only', 'if only one item: remove root; return minimum'],
  ]),
  peekMin: definePseudocode('Peek minimum', [
    ['peek.empty', 'if heap is empty: return UNDERFLOW'],
    ['peek.read', 'minimum ← heap[0]'],
    ['peek.return', 'return minimum without removing it'],
  ]),
};
