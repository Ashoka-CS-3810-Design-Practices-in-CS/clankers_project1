import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

async function open(structure: 'Stack' | 'Queue') {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: `Open ${structure} workspace` }));
  await user.click(screen.getByRole('checkbox', { name: 'Practice mode' }));
  await user.click(screen.getByRole('button', { name: 'Load sample' }));
  return user;
}

describe('Stack practice mode', () => {
  it('asks which item pop removes after a push, then reveals the step', async () => {
    const user = await open('Stack');
    await user.type(screen.getByLabelText('Item value'), '55');
    await user.click(screen.getByRole('button', { name: 'Push' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByRole('heading', { name: 'Predict the next step' })).toHaveFocus();
    expect(screen.getByText('After Push 55, which item will Pop take out first?')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Pop' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '55: the newest item' }));
    expect(screen.getByText('Correct.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show the step' }));
    expect(screen.getByText('55 is now at the top of the stack.')).toBeInTheDocument();
    expect(screen.getByText('Score: 1 of 1 correct')).toBeInTheDocument();
  });
});

describe('Queue practice mode', () => {
  it('grades a wrong FIFO answer on dequeue', async () => {
    const user = await open('Queue');
    await user.click(screen.getByRole('button', { name: 'Dequeue' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await user.click(screen.getByRole('button', { name: '26 becomes the new front' }));
    expect(screen.getByText('Not quite.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '12 becomes the new front' })).toHaveClass(
      'is-correct',
    );
    await user.click(screen.getByRole('button', { name: 'Show the step' }));
    expect(screen.getByText('Score: 0 of 1 correct')).toBeInTheDocument();
  });
});
