import type { StructureDefinition } from '../domain/visualization';

export const STRUCTURES: readonly StructureDefinition[] = Object.freeze([
  {
    id: 'linked-list',
    label: 'Linked List',
    description: 'Follow nodes and references from the head.',
    availability: 'available',
  },
  {
    id: 'stack',
    label: 'Stack',
    description: 'Inspect LIFO operations.',
    availability: 'available',
  },
  {
    id: 'queue',
    label: 'Queue',
    description: 'Inspect FIFO operations.',
    availability: 'available',
  },
  {
    id: 'bst',
    label: 'Binary Search Tree',
    description: 'Trace ordered comparisons.',
    availability: 'available',
  },
  {
    id: 'priority-queue',
    label: 'Priority Queue',
    description: 'Watch heap ordering.',
    availability: 'available',
  },
  { id: 'graph', label: 'Graph', description: 'Explore BFS and DFS.', availability: 'planned' },
]);
