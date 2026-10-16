import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

afterEach(() => {
  vi.useRealTimers();
});

describe('App', () => {
  it('shows actionable validation without changing the list', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Open Linked List workspace' }));
    await user.click(screen.getByRole('button', { name: 'Insert head' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter an integer');
    expect(screen.getByLabelText('Current list contains 0 nodes')).toBeInTheDocument();
  });

  it('keeps the canvas, narration, and complexity synchronized', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Open Linked List workspace' }));
    await user.type(screen.getByLabelText('Node value'), '21');
    await user.click(screen.getByRole('button', { name: 'Insert head' }));

    expect(screen.getByText('Prepare to insert 21 before the current head.')).toBeInTheDocument();
    expect(screen.getAllByText('O(1)', { selector: 'dd' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Traverse' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      screen.getByText('21 is now the head. Its next reference points to the previous first node.'),
    ).toBeInTheDocument();
    expect(screen.getByText('node-1', { selector: 'text' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Traverse' })).toBeEnabled();
  });

  it('supports keyboard navigation through the operation controls', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Open Linked List workspace' }));
    await user.tab();
    expect(screen.getByRole('link', { name: 'Skip to visualizer' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Return to home page' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: /Linked List/ })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: /Stack/ })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Queue, ready' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Binary Search Tree, ready' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Priority Queue, ready' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Graph, ready' })).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText('Node value')).toHaveFocus();
  });

  it('advances playback automatically and cleans up timers', async () => {
    vi.useFakeTimers();
    const { unmount } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open Linked List workspace' }));
    fireEvent.click(screen.getByRole('button', { name: 'Load sample' }));
    fireEvent.click(screen.getByRole('button', { name: 'Traverse' }));
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));

    act(() => vi.advanceTimersByTime(950));
    expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
