import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StackWorkspace } from './workspaces/StackWorkspace';

afterEach(() => vi.useRealTimers());

function startPush() {
  render(<StackWorkspace active />);
  fireEvent.change(screen.getByLabelText('Item value'), { target: { value: '42' } });
  fireEvent.click(screen.getByRole('button', { name: 'Push' }));
}

describe('operation cancellation', () => {
  it('rolls back a paused push and unlocks input, allowing another operation', () => {
    startPush();
    expect(screen.getByRole('button', { name: 'Pop' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel operation' }));
    expect(screen.getByLabelText('Current stack contains 0 items')).toBeInTheDocument();
    expect(screen.getByLabelText('Item value')).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Pop' })).toBeEnabled();
    expect(screen.getByText('No operation loaded')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel operation' })).toBeDisabled();
    expect(
      within(screen.getByRole('region', { name: 'Operation pseudocode' })).queryByRole('status'),
    ).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Push' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByLabelText('Current stack contains 1 item')).toBeInTheDocument();
    expect(screen.getByText('stack-1', { selector: 'text' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel operation' })).toBeDisabled();
  });

  it('cleans up autoplay timers on cancel and direct reset', () => {
    vi.useFakeTimers();
    startPush();
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(vi.getTimerCount()).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel operation' }));
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByLabelText('Current stack contains 0 items')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Push' }));
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(screen.getByRole('button', { name: 'Reset stack' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Reset stack' }));
    expect(vi.getTimerCount()).toBe(0);
    expect(screen.getByLabelText('Item value')).toHaveValue('');
    expect(screen.getByText('Your stack is empty')).toBeInTheDocument();
  });

  it('cancels after intermediate steps and while a practice question is unanswered', () => {
    render(<StackWorkspace active />);
    fireEvent.click(screen.getByRole('button', { name: 'Load sample' }));
    fireEvent.click(screen.getByRole('button', { name: 'Inspect all' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel operation' }));
    expect(screen.queryByLabelText('Operation output')).toBeNull();
    expect(screen.getByLabelText('Current stack contains 4 items')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Practice mode' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pop' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'Predict the next step' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel operation' }));
    expect(screen.queryByRole('heading', { name: 'Predict the next step' })).toBeNull();
    expect(screen.getByLabelText('Current stack contains 4 items')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pop' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset stack' }));
    expect(screen.queryByRole('heading', { name: 'Predict the next step' })).toBeNull();
    expect(screen.getByText('Your stack is empty')).toBeInTheDocument();
  });
});
