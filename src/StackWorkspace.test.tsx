import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

async function openStack() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Stack, ready' }));
  return user;
}

describe('Stack workspace', () => {
  it('shows actionable validation without changing the stack', async () => {
    const user = await openStack();
    await user.click(screen.getByRole('button', { name: 'Push' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter an integer');
    expect(screen.getByLabelText('Current stack contains 0 items')).toBeInTheDocument();
  });

  it('keeps the canvas, narration, and complexity synchronized during push', async () => {
    const user = await openStack();
    await user.type(screen.getByLabelText('Item value'), '-8');
    await user.click(screen.getByRole('button', { name: 'Push' }));

    expect(screen.getByText('Prepare to place -8 above the current top item.')).toBeInTheDocument();
    expect(screen.getAllByText('O(1)', { selector: 'dd' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Peek' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('-8 is now at the top of the stack.')).toBeInTheDocument();
    expect(screen.getByText('stack-1', { selector: 'text' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current stack contains 1 item')).toBeInTheDocument();
  });

  it('explains underflow for pop and peek', async () => {
    const user = await openStack();
    await user.click(screen.getByRole('button', { name: 'Pop' }));

    expect(
      screen.getByText('The stack is empty, so there is no top item to remove.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Result: operation unavailable')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Peek' }));
    expect(
      screen.getByText('The stack is empty, so there is no top item to inspect.'),
    ).toBeInTheDocument();
  });

  it('preserves stack state while visiting another structure', async () => {
    const user = await openStack();
    await user.type(screen.getByLabelText('Item value'), '42');
    await user.click(screen.getByRole('button', { name: 'Push' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await user.click(screen.getByRole('button', { name: 'Linked List, ready' }));
    expect(screen.getByRole('heading', { name: 'Linked List' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Stack, ready' }));

    expect(screen.getByLabelText('Current stack contains 1 item')).toBeInTheDocument();
    expect(screen.getByText('42', { selector: 'text' })).toBeInTheDocument();
  });

  it('reports Peek and Inspect all output from top to bottom', async () => {
    const user = await openStack();
    await user.click(screen.getByRole('button', { name: 'Load sample' }));
    await user.click(screen.getByRole('button', { name: 'Peek' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByLabelText('Operation output')).toHaveTextContent('34');

    await user.click(screen.getByRole('button', { name: 'Inspect all' }));
    while (screen.getByRole('button', { name: 'Next' }).hasAttribute('disabled') === false) {
      await user.click(screen.getByRole('button', { name: 'Next' }));
    }
    expect(screen.getByLabelText('Operation output')).toHaveTextContent('3421138');
  });
});
