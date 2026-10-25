import { definePseudocode } from '../../domain/pseudocode';

export const linkedListCode = {
  insertHead: definePseudocode('Insert at head', [
    ['head.prepare', 'oldHead ← head'],
    ['head.link', 'head ← Node(value, next = oldHead)'],
  ]),
  insertTail: definePseudocode('Insert at tail', [
    ['tail.start', 'current ← head'],
    ['tail.walk', 'while current.next ≠ null: advance current'],
    ['tail.link', 'append Node(value) after tail, or set head if empty'],
  ]),
  search: definePseudocode('Search for first match', [
    ['search.start', 'current ← head'],
    ['search.compare', 'if current.value ≠ value: advance current', 1],
    ['search.found', 'if current.value = value: return current', 1],
    ['search.missing', 'return NOT_FOUND when current = null'],
  ]),
  deleteFirstMatch: definePseudocode('Delete first match', [
    ['delete.start', 'previous ← null; current ← head'],
    ['delete.compare', 'if current.value ≠ value: advance previous, current', 1],
    ['delete.found', 'if current.value = value: stop searching', 1],
    ['delete.unlink', 'bypass current using previous.next (or head); return'],
    ['delete.missing', 'return NOT_FOUND when current = null'],
  ]),
  traverse: definePseudocode('Traverse', [
    ['traverse.start', 'current ← head; output ← []'],
    ['traverse.visit', 'while current ≠ null: output value; advance current'],
    ['traverse.done', 'return output'],
  ]),
};
