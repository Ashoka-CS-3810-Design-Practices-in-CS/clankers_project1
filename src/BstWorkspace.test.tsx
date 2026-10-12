import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

async function openBst() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Open Binary Search Tree workspace' }));
  return user;
}

async function finishOperation(user: ReturnType<typeof userEvent.setup>) {
  const next = screen.getByRole('button', { name: 'Next' });
  while (!next.hasAttribute('disabled')) await user.click(next);
}

describe('Binary Search Tree workspace', () => {
  it('shows actionable validation without changing the tree', async () => {
    const user = await openBst();
    await user.click(screen.getByRole('button', { name: 'Insert' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter an integer');
    expect(screen.getByLabelText('Current tree contains 0 nodes')).toBeInTheDocument();
  });

  it('keeps the canvas, narration, and complexity synchronized during insert', async () => {
    const user = await openBst();
    await user.type(screen.getByLabelText('Tree node value'), '42');
    await user.click(screen.getByRole('button', { name: 'Insert' }));

    expect(screen.getByText('42 will become the root because the tree is empty.')).toBeVisible();
    expect(screen.getByText('O(n)', { selector: 'dd' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();

    await finishOperation(user);
    expect(screen.getByText('42 was inserted as the root.')).toBeVisible();
    expect(screen.getByText('bst-1', { selector: 'text' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current tree contains 1 node')).toBeInTheDocument();
  });

  it('represents duplicate values with a count on one stable node', async () => {
    const user = await openBst();
    const input = screen.getByLabelText('Tree node value');
    await user.type(input, '42');
    await user.click(screen.getByRole('button', { name: 'Insert' }));
    await finishOperation(user);
    await user.click(screen.getByRole('button', { name: 'Insert' }));
    await finishOperation(user);

    expect(screen.getByText('×2', { selector: 'text' })).toBeInTheDocument();
    expect(screen.getByText('bst-1', { selector: 'text' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current tree contains 1 node')).toBeInTheDocument();
  });

  it('reports search misses and traversal orders', async () => {
    const user = await openBst();
    await user.click(screen.getByRole('button', { name: 'Load sample' }));
    await user.type(screen.getByLabelText('Tree node value'), '99');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await finishOperation(user);
    expect(screen.getByText('Result: target not found')).toBeVisible();

    for (const [operation, expected] of [
      ['Inorder', '20304050607080'],
      ['Preorder', '50302040706080'],
      ['Postorder', '20403060807050'],
    ] as const) {
      await user.click(screen.getByRole('button', { name: operation }));
      await finishOperation(user);
      expect(screen.getByLabelText('Traversal and result output')).toHaveTextContent(expected);
    }
  });

  it('deletes a two-child root and preserves state across workspaces', async () => {
    const user = await openBst();
    await user.click(screen.getByRole('button', { name: 'Load sample' }));
    await user.type(screen.getByLabelText('Tree node value'), '50');
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await finishOperation(user);

    expect(screen.getByLabelText('Current tree contains 6 nodes')).toBeInTheDocument();
    expect(screen.getByLabelText('Traversal and result output')).toHaveTextContent('50');
    expect(screen.getByText('60', { selector: 'text' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Stack, ready' }));
    await user.click(screen.getByRole('button', { name: 'Binary Search Tree, ready' }));
    expect(screen.getByLabelText('Current tree contains 6 nodes')).toBeInTheDocument();
  });
});
