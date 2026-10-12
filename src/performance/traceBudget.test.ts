import { describe, expect, it } from 'vitest';
import { snapshotEntries, worstCases } from './worstCaseTraces';

/**
 * Performance regression guard for trace generation (test P1/P2 in the Assignment 3 report).
 * A trace is generated synchronously when an operation starts, so it must fit well inside
 * one 16 ms frame. The budget is deliberately generous to avoid flaky failures on slow CI
 * machines; measured medians are far below it.
 */
const BUDGET_MS = 16;
const RUNS = 15;

function medianMs(run: () => unknown): number {
  run(); // warm-up
  const samples = Array.from({ length: RUNS }, () => {
    const start = performance.now();
    run();
    return performance.now() - start;
  }).sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)];
}

describe('worst-case trace generation', () => {
  it.each(worstCases().map((testCase) => [testCase.name, testCase] as const))(
    '%s stays within one frame',
    (_name, testCase) => {
      const result = testCase.run();
      expect(result.steps.length).toBeGreaterThan(0);
      expect(medianMs(testCase.run)).toBeLessThan(BUDGET_MS);
    },
  );

  it('keeps every worst-case trace bounded by the interface limits', () => {
    worstCases().forEach((testCase) => {
      const { steps } = testCase.run();
      const entries = steps.reduce((sum, step) => sum + snapshotEntries(step.snapshot), 0);
      expect(steps.length).toBeLessThan(400);
      expect(entries).toBeLessThan(60_000);
    });
  });
});
