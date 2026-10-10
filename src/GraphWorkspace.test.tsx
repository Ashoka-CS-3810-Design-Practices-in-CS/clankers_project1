import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

async function openGraph() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Graph, ready' }));
  return user;
}

async function finishOperation(user: ReturnType<typeof userEvent.setup>) {
  while (!screen.getByRole('button', { name: 'Next' }).hasAttribute('disabled')) {
    await user.click(screen.getByRole('button', { name: 'Next' }));
  }
}

// Traversal traces have 20–40 steps, each advanced with a real click, so allow extra time.
describe('Graph workspace', { timeout: 20_000 }, () => {
  it('shows actionable validation without changing the graph', async () => {
    const user = await openGraph();
    await user.click(screen.getByRole('button', { name: 'Add vertex' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a vertex label');

    await user.type(screen.getByLabelText('Vertex'), '1');
    await user.click(screen.getByRole('button', { name: 'BFS' }));
    expect(screen.getByRole('alert')).toHaveTextContent('The graph is empty');
    expect(
      screen.getByLabelText('Current graph contains 0 vertices and 0 edges'),
    ).toBeInTheDocument();
  });

  it('adds vertices and an undirected edge', async () => {
    const user = await openGraph();
    for (const label of ['1', '2']) {
      await user.clear(screen.getByLabelText('Vertex'));
      await user.type(screen.getByLabelText('Vertex'), label);
      await user.click(screen.getByRole('button', { name: 'Add vertex' }));
      await finishOperation(user);
    }
    await user.clear(screen.getByLabelText('Vertex'));
    await user.type(screen.getByLabelText('Vertex'), '2');
    await user.type(screen.getByLabelText('Second vertex (edges)'), '1');
    await user.click(screen.getByRole('button', { name: 'Add edge' }));
    await finishOperation(user);

    expect(
      screen.getByLabelText('Current graph contains 2 vertices and 1 edge'),
    ).toBeInTheDocument();
    expect(screen.getByText('Vertex 1: connected to 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add edge' }));
    expect(screen.getByRole('alert')).toHaveTextContent('already connected');
  });

  it('runs BFS with a visible queue and visit order', async () => {
    const user = await openGraph();
    await user.click(screen.getByRole('button', { name: 'Load sample' }));
    await user.type(screen.getByLabelText('Vertex'), '1');
    await user.click(screen.getByRole('button', { name: 'BFS' }));

    expect(screen.getByText('O(V + E)', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getByText('Queue · front → rear')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'DFS' })).toBeDisabled();

    await finishOperation(user);
    expect(screen.getByLabelText('Visit order')).toHaveTextContent('123456');
  });

  it('runs DFS with a call stack and a different visit order', async () => {
    const user = await openGraph();
    await user.click(screen.getByRole('button', { name: 'Load sample' }));
    await user.type(screen.getByLabelText('Vertex'), '1');
    await user.click(screen.getByRole('button', { name: 'DFS' }));

    expect(screen.getByText('Call stack · bottom → top')).toBeInTheDocument();
    await finishOperation(user);
    expect(screen.getByLabelText('Visit order')).toHaveTextContent('124536');
  });

  it('removes a vertex with its edges and preserves state across structures', async () => {
    const user = await openGraph();
    await user.click(screen.getByRole('button', { name: 'Load sample' }));
    await user.type(screen.getByLabelText('Vertex'), '4');
    await user.click(screen.getByRole('button', { name: 'Remove vertex' }));
    await finishOperation(user);
    expect(
      screen.getByLabelText('Current graph contains 5 vertices and 4 edges'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Stack, ready' }));
    await user.click(screen.getByRole('button', { name: 'Graph, ready' }));
    expect(
      screen.getByLabelText('Current graph contains 5 vertices and 4 edges'),
    ).toBeInTheDocument();
  });
});
