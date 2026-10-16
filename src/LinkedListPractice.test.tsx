import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

async function startSearch(target: string) {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Open Linked List workspace' }));
  await user.click(screen.getByRole('checkbox', { name: 'Practice mode' }));
  await user.click(screen.getByRole('button', { name: 'Load sample' }));
  await user.type(screen.getByLabelText('Node value'), target);
  await user.click(screen.getByRole('button', { name: 'Search' }));
  return user;
}

describe('Linked List practice mode', () => {
  it('holds playback at each checkpoint until the learner answers', async () => {
    const user = await startSearch('21');

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'Predict the next step' })).toHaveFocus();
    expect(screen.getByText('Step 1 of 4 · answer the question to continue')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Reach null: 21 is not in the list' }));
    expect(screen.getByText('Not quite.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reach null/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Show the step' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Show the step' }));
    expect(screen.getByText('8 does not match 21.')).toBeInTheDocument();
    expect(screen.getByText('Score: 0 of 1 correct')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Predict the next step' })).toBeNull();
  });

  it('scores a full run and reaches the match', async () => {
    const user = await startSearch('21');
    const answers = [
      'Compare the head, 8: no match, keep walking',
      'Compare the next node, 13: no match, keep walking',
      'Compare the next node, 21: match, the search stops',
    ];
    for (const answer of answers) {
      await user.click(screen.getByRole('button', { name: 'Next' }));
      await user.click(screen.getByRole('button', { name: answer }));
      expect(screen.getByText('Correct.')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Show the step' }));
    }
    expect(screen.getByText('Found 21. The search stops at the first match.')).toBeInTheDocument();
    expect(screen.getByText('Score: 3 of 3 correct')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeEnabled();
  });

  it('plays normally when practice mode is off', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Open Linked List workspace' }));
    await user.click(screen.getByRole('button', { name: 'Load sample' }));
    await user.type(screen.getByLabelText('Node value'), '21');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.queryByRole('heading', { name: 'Predict the next step' })).toBeNull();
    expect(screen.getByText('8 does not match 21.')).toBeInTheDocument();
  });
});
