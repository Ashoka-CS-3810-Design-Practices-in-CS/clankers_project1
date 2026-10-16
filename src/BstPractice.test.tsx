import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('BST practice mode', () => {
  it('asks how a two-child node is deleted and reveals the successor step', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Open Binary Search Tree workspace' }));
    await user.click(screen.getByRole('checkbox', { name: 'Practice mode' }));
    await user.click(screen.getByRole('button', { name: 'Load sample' }));
    await user.type(screen.getByLabelText('Tree node value'), '50');
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: '50 = 50: found, so it will be removed' }));
    await user.click(screen.getByRole('button', { name: 'Show the step' }));

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('50 was found. How is it removed?')).toBeVisible();
    await user.click(
      screen.getByRole('button', {
        name: 'Replace it with 60, the smallest value in its right subtree',
      }),
    );
    expect(screen.getByText('Correct.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show the step' }));
    expect(
      screen.getByText('50 was removed and the ordered replacement was linked into its position.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Score: 2 of 2 correct')).toBeInTheDocument();
  });
});
