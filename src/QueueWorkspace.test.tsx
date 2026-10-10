import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

async function openQueue() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Queue, ready' }));
  return user;
}

async function finishOperation(user: ReturnType<typeof userEvent.setup>) {
  while (!screen.getByRole('button', { name: 'Next' }).hasAttribute('disabled')) {
    await user.click(screen.getByRole('button', { name: 'Next' }));
  }
}

describe('Queue workspace', () => {
  it('shows actionable validation without changing the queue', async () => {
    const user = await openQueue();
    await user.click(screen.getByRole('button', { name: 'Enqueue' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter an integer');
    expect(screen.getByLabelText('Current queue contains 0 items')).toBeInTheDocument();
  });

  it('keeps the canvas, narration, and complexity synchronized during enqueue', async () => {
    const user = await openQueue();
    await user.type(screen.getByLabelText('Queue value'), '-5');
    await user.click(screen.getByRole('button', { name: 'Enqueue' }));

    expect(
      screen.getByText('The queue is empty, so -5 will become both the front and the rear.'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('O(1)', { selector: 'dd' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Dequeue' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('-5 joined at the rear of the queue.')).toBeInTheDocument();
    expect(screen.getByText('queue-1', { selector: 'text' })).toBeInTheDocument();
    expect(screen.getByText('front · rear', { selector: 'text' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current queue contains 1 item')).toBeInTheDocument();
  });

  it('explains underflow for dequeue and peek front', async () => {
    const user = await openQueue();
    await user.click(screen.getByRole('button', { name: 'Dequeue' }));

    expect(
      screen.getByText('The queue is empty, so there is no front item to remove.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Result: operation unavailable')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Peek front' }));
    expect(
      screen.getByText('The queue is empty, so there is no front item to inspect.'),
    ).toBeInTheDocument();
  });

  it('dequeues the oldest item first', async () => {
    const user = await openQueue();
    await user.click(screen.getByRole('button', { name: 'Load sample' }));
    await user.click(screen.getByRole('button', { name: 'Dequeue' }));
    await finishOperation(user);

    expect(screen.getByLabelText('Queue output')).toHaveTextContent('5');
    expect(screen.getByLabelText('Current queue contains 3 items')).toBeInTheDocument();
    expect(screen.getByText('front', { selector: 'text' })).toBeInTheDocument();
    expect(screen.queryByText('queue-1', { selector: 'text' })).not.toBeInTheDocument();
  });

  it('reports Peek front and Inspect all output from front to rear', async () => {
    const user = await openQueue();
    await user.click(screen.getByRole('button', { name: 'Load sample' }));
    await user.click(screen.getByRole('button', { name: 'Peek front' }));
    await finishOperation(user);
    expect(screen.getByLabelText('Queue output')).toHaveTextContent('5');

    await user.click(screen.getByRole('button', { name: 'Inspect all' }));
    await finishOperation(user);
    expect(screen.getByLabelText('Queue output')).toHaveTextContent('5121926');
  });

  it('preserves queue state while visiting another structure', async () => {
    const user = await openQueue();
    await user.type(screen.getByLabelText('Queue value'), '42');
    await user.click(screen.getByRole('button', { name: 'Enqueue' }));
    await finishOperation(user);

    await user.click(screen.getByRole('button', { name: 'Stack, ready' }));
    expect(screen.getByRole('heading', { name: 'Stack' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Queue, ready' }));

    expect(screen.getByLabelText('Current queue contains 1 item')).toBeInTheDocument();
    expect(screen.getByText('42', { selector: 'text' })).toBeInTheDocument();
  });
});
