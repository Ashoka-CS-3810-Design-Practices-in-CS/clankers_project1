import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PseudocodePanel } from './PseudocodePanel';
import { LinkedListModel } from '../structures/linked-list/LinkedListModel';
import { LinkedListOperations } from '../structures/linked-list/LinkedListOperations';
import { PriorityQueueModel } from '../structures/priority-queue/PriorityQueueModel';
import { PriorityQueueOperations } from '../structures/priority-queue/PriorityQueueOperations';
import App from '../App';

describe('PseudocodePanel', () => {
  it('derives active, executed and pending states from the current prefix', async () => {
    const result = new LinkedListOperations().traverse(LinkedListModel.fromValues([1, 2]));
    const panel = (index: number) => (
      <PseudocodePanel definition={result.pseudocode} steps={result.steps} index={index} />
    );
    const { rerender, container } = render(panel(0));
    const state = (value: string) => container.querySelectorAll(`[data-state="${value}"]`).length;
    expect(state('active')).toBe(1);
    expect(state('pending')).toBe(2);
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole('region', { name: 'Scrollable pseudocode' })).toHaveFocus();
    rerender(panel(1));
    expect(state('executed')).toBe(1);
    expect(screen.getByRole('status')).toHaveTextContent('Currently executing: while current');
    rerender(panel(3));
    expect(state('executed')).toBe(2);
    expect(screen.getByRole('status')).toHaveTextContent('Currently executing: return output');
    rerender(panel(0));
    expect(state('executed')).toBe(0);
    expect(state('pending')).toBe(2);
  });

  it('holds the current line through a practice question and reveals the next line only after continuing', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Open Linked List workspace' }));
    await user.click(screen.getByRole('button', { name: 'Load sample' }));
    await user.click(screen.getByRole('checkbox', { name: 'Practice mode' }));
    await user.type(screen.getByLabelText('Node value'), '21');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    const status = within(screen.getByRole('region', { name: 'Operation pseudocode' })).getByRole(
      'status',
    );
    expect(status).toHaveTextContent('current ← head');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(status).toHaveTextContent('current ← head');
    await user.click(screen.getByRole('button', { name: 'Reach null: 21 is not in the list' }));
    expect(status).toHaveTextContent('current ← head');
    await user.click(screen.getByRole('button', { name: 'Show the step' }));
    expect(status).toHaveTextContent('current.value ≠ value');
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(status).toHaveTextContent('current ← head');
  });

  it('marks the heap compare line as done, not pending, once sift-up stops', () => {
    const result = new PriorityQueueOperations().insert(
      PriorityQueueModel.fromValues([1, 2, 3]),
      2,
    );
    const compareIndex = result.steps.findIndex((step) =>
      step.message.startsWith('Compare 2 with its parent 2'),
    );
    const panel = (index: number) => (
      <PseudocodePanel definition={result.pseudocode} steps={result.steps} index={index} />
    );
    const { rerender } = render(panel(compareIndex));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Currently executing: compare heap[i] with heap[parent(i)]',
    );
    rerender(panel(result.steps.length - 1));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Currently executing: otherwise: stop; heap order holds',
    );
    const compareLine = screen
      .getByText('compare heap[i] with heap[parent(i)]')
      .closest('[data-state]');
    expect(compareLine).toHaveAttribute('data-state', 'executed');
  });
});
