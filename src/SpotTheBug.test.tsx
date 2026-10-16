import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

async function open(structure: string) {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: `Open ${structure} workspace` }));
  return user;
}

describe('Pseudocode panel', () => {
  it('highlights the line that produced each step', async () => {
    const user = await open('Linked List');
    await user.type(screen.getByLabelText('Node value'), '21');
    await user.click(screen.getByRole('button', { name: 'Insert head' }));

    const panel = screen.getByRole('heading', { name: 'Pseudocode' }).parentElement!;
    const current = () => panel.querySelector('[aria-current="step"]')?.textContent;
    expect(current()).toContain('node ← new Node(value)');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(current()).toContain('head ← node');
  });
});

describe('Spot the bug', () => {
  it('grades a correct flag, reveals the fix, and compares runs', async () => {
    const user = await open('Stack');
    await user.click(screen.getByRole('button', { name: 'Load sample' }));
    await user.click(screen.getByRole('button', { name: 'Spot the bug' }));

    expect(screen.getByRole('heading', { name: 'Spot the bug' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Push' })).toBeDisabled();
    expect(screen.getByText('value ← items[0]')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Flag step 1 as the first wrong step' }));
    expect(screen.getByText('Correct.')).toBeInTheDocument();
    expect(screen.getByText('Fixed')).toBeInTheDocument();
    expect(screen.getByText('Score: 1 of 1 correct')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show the correct run' }));
    expect(screen.getByText('34 is at the top and will be removed first.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show the buggy run' }));
    expect(screen.getByText('8 will be popped first.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('heading', { name: 'Spot the bug' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Push' })).toBeEnabled();
    expect(screen.getByLabelText('Current stack contains 4 items')).toBeInTheDocument();
  });

  it('says when a flag is too early and moves on to the next bug', async () => {
    const user = await open('Binary Search Tree');
    await user.click(screen.getByRole('button', { name: 'Spot the bug' }));
    expect(screen.getByText(/Insert 65 into the sample tree/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Flag step 1 as the first wrong step' }));
    expect(screen.getByText('Too early.')).toBeInTheDocument();
    expect(screen.getByText(/The bug first shows at step 2/)).toBeInTheDocument();
    expect(screen.getByText('Score: 0 of 1 correct')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next bug' }));
    expect(screen.getByText(/Delete 50, the root of the sample tree/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Flag step 1 as the first wrong step' }),
    ).toBeEnabled();
  });
});
