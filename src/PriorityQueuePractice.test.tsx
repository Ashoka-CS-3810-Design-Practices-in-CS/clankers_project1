import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('Priority Queue practice mode', () => {
  it('asks what refills the root on extract min', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Open Priority Queue workspace' }));
    await user.click(screen.getByRole('checkbox', { name: 'Practice mode' }));
    await user.click(screen.getByRole('button', { name: 'Load sample' }));
    await user.click(screen.getByRole('button', { name: 'Extract min' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(
      screen.getByText('Extract min removes 1 from the root. What fills the root?'),
    ).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Its smaller child, 3, moves up into the root' }),
    );
    expect(screen.getByText('Not quite.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show the step' }));
    expect(
      screen.getByText('Remove 1 and move the last item, 9, into the root.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Score: 0 of 1 correct')).toBeInTheDocument();
  });
});
