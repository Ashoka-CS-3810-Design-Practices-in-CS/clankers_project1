import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { COMPLEXITY_TABLE } from './registry/complexities';
import { STRUCTURES } from './registry/structures';
import { BstModel } from './structures/bst/BstModel';
import { BST_COMPLEXITY, BstOperations } from './structures/bst/BstOperations';
import { GraphModel } from './structures/graph/GraphModel';
import { GRAPH_COMPLEXITY, GraphOperations } from './structures/graph/GraphOperations';
import { LinkedListModel } from './structures/linked-list/LinkedListModel';
import {
  LINKED_LIST_COMPLEXITY,
  LinkedListOperations,
} from './structures/linked-list/LinkedListOperations';
import { PriorityQueueModel } from './structures/priority-queue/PriorityQueueModel';
import {
  PRIORITY_QUEUE_COMPLEXITY,
  PriorityQueueOperations,
} from './structures/priority-queue/PriorityQueueOperations';
import { QueueModel } from './structures/queue/QueueModel';
import { QUEUE_COMPLEXITY, QueueOperations } from './structures/queue/QueueOperations';
import { StackModel } from './structures/stack/StackModel';
import { STACK_COMPLEXITY, StackOperations } from './structures/stack/StackOperations';

describe('complexity table data', () => {
  it('covers every structure in sidebar order', () => {
    expect(COMPLEXITY_TABLE.map((entry) => entry.id)).toEqual(STRUCTURES.map((s) => s.id));
  });

  it('lists every complexity each structure defines', () => {
    const defined = [
      LINKED_LIST_COMPLEXITY,
      STACK_COMPLEXITY,
      QUEUE_COMPLEXITY,
      BST_COMPLEXITY,
      PRIORITY_QUEUE_COMPLEXITY,
      GRAPH_COMPLEXITY,
    ];
    COMPLEXITY_TABLE.forEach((entry, index) => {
      const listed = new Set(entry.rows.map((row) => row.complexity));
      Object.values(defined[index]).forEach((complexity) => expect(listed).toContain(complexity));
    });
  });

  it('matches what operations report during playback', () => {
    const row = (id: string, operation: string) =>
      COMPLEXITY_TABLE.find((entry) => entry.id === id)!.rows.find(
        (candidate) => candidate.operation === operation,
      )!.complexity;
    const sample = GraphModel.sample();
    const cases = [
      [
        new LinkedListOperations().insertTail(LinkedListModel.sample(), 4).complexity,
        row('linked-list', 'Insert tail'),
      ],
      [new StackOperations().pop(StackModel.sample()).complexity, row('stack', 'Pop')],
      [new QueueOperations().dequeue(QueueModel.sample()).complexity, row('queue', 'Dequeue')],
      [new BstOperations().delete(BstModel.sample(), 50).complexity, row('bst', 'Delete')],
      [
        new PriorityQueueOperations().extractMin(PriorityQueueModel.sample()).complexity,
        row('priority-queue', 'Extract min'),
      ],
      [new GraphOperations().bfs(sample, 1).complexity, row('graph', 'BFS')],
    ] as const;
    cases.forEach(([reported, listed]) => expect(reported).toEqual(listed));
  });
});

describe('Complexities page', () => {
  it('opens from the sidebar below Graph and shows a table for every structure', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Open Graph workspace' }));

    const nav = screen.getByRole('navigation', { name: 'Data structures' });
    const names = within(nav)
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'));
    expect(names.slice(-2)).toEqual(['Graph, active', 'Complexities, reference']);

    await user.click(within(nav).getByRole('button', { name: 'Complexities, reference' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Complexities' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Complexities, active' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getAllByRole('table')).toHaveLength(6);

    const heap = screen.getByRole('region', { name: /Priority Queue complexity table/ });
    const extract = within(heap).getByRole('rowheader', { name: 'Extract min' }).closest('tr')!;
    expect(within(extract).getAllByRole('cell')[0]).toHaveTextContent('O(log n)');
    expect(within(extract).getAllByRole('cell')[1]).toHaveTextContent('O(1)');

    const list = screen.getByRole('region', { name: /Linked List complexity table/ });
    const tail = within(list).getByRole('rowheader', { name: 'Insert tail' }).closest('tr')!;
    expect(tail).toHaveTextContent('does not store a tail pointer');
  });

  it('opens from the landing page and links back to each workspace', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Open the complexity table' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Complexities' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open Queue workspace' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Queue' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: 'Complexities' })).toBeNull();
  });
});
