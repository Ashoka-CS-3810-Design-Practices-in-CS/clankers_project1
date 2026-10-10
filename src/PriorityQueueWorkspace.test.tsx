import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

async function openPriorityQueue() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Priority Queue, ready' }));
  return user;
}

async function finishOperation(user: ReturnType<typeof userEvent.setup>) {
  while (!screen.getByRole('button', { name: 'Next' }).hasAttribute('disabled')) {
    await user.click(screen.getByRole('button', { name: 'Next' }));
  }
}

describe('Priority Queue workspace', () => {
  it('shows actionable validation without changing the heap', async () => {
    const user = await openPriorityQueue();
    await user.click(screen.getByRole('button', { name: 'Insert' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter an integer');
    expect(screen.getByLabelText('Current priority queue contains 0 items')).toBeInTheDocument();
  });

  it('narrates sift-up and shows logarithmic complexity during insert', async () => {
    const user = await openPriorityQueue();
    await user.click(screen.getByRole('button', { name: 'Load sample' }));
    await user.type(screen.getByLabelText('Priority value'), '-2');
    await user.click(screen.getByRole('button', { name: 'Insert' }));

    expect(screen.getByText('O(log n)', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Extract min' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('-2 is placed at index 6, the next open leaf.')).toBeInTheDocument();

    await finishOperation(user);
    expect(
      screen.getByText('-2 is at the root, so it is now the highest-priority item.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Current priority queue contains 7 items')).toBeInTheDocument();
  });

  it('explains underflow for extract and peek', async () => {
    const user = await openPriorityQueue();
    await user.click(screen.getByRole('button', { name: 'Extract min' }));
    expect(
      screen.getByText('The priority queue is empty, so there is no minimum to remove.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Result: operation unavailable')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Peek min' }));
    expect(
      screen.getByText('The priority queue is empty, so there is no minimum to inspect.'),
    ).toBeInTheDocument();
  });

  it('extracts the minimum and promotes the next smallest value', async () => {
    const user = await openPriorityQueue();
    await user.click(screen.getByRole('button', { name: 'Load sample' }));
    await user.click(screen.getByRole('button', { name: 'Peek min' }));
    await finishOperation(user);
    expect(screen.getByLabelText('Priority queue output')).toHaveTextContent('1');

    await user.click(screen.getByRole('button', { name: 'Extract min' }));
    await finishOperation(user);
    expect(screen.getByLabelText('Priority queue output')).toHaveTextContent('1');
    expect(screen.getByLabelText('Current priority queue contains 5 items')).toBeInTheDocument();
    expect(screen.getByText('Index 0: value 3, the minimum')).toBeInTheDocument();
  });

  it('preserves heap state while visiting another structure', async () => {
    const user = await openPriorityQueue();
    await user.type(screen.getByLabelText('Priority value'), '42');
    await user.click(screen.getByRole('button', { name: 'Insert' }));
    await finishOperation(user);

    await user.click(screen.getByRole('button', { name: 'Queue, ready' }));
    expect(screen.getByRole('heading', { name: 'Queue' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Priority Queue, ready' }));

    expect(screen.getByLabelText('Current priority queue contains 1 item')).toBeInTheDocument();
    expect(screen.getByText('Index 0: value 42, the minimum')).toBeInTheDocument();
  });
});
