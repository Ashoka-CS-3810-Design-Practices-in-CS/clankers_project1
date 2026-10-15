import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('Graph practice mode', () => {
  it('asks where DFS goes after the start vertex', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /^Graph,/ }));
    await user.click(screen.getByRole('checkbox', { name: 'Practice mode' }));
    await user.click(screen.getByRole('button', { name: 'Load sample' }));
    await user.type(screen.getByLabelText('Vertex'), '1');
    await user.click(screen.getByRole('button', { name: 'DFS' }));

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      screen.getByText('DFS has just visited 1 (order so far: 1). What does it do next?'),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Go deeper to 2' }));
    expect(screen.getByText('Correct.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show the step' }));
    expect(screen.getByText('2 is unvisited, so follow edge 1–2 deeper.')).toBeInTheDocument();
    expect(screen.getByText('Score: 1 of 1 correct')).toBeInTheDocument();
  });
});
