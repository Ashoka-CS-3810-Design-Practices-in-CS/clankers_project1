import { describe, expect, it } from 'vitest';
import { initialPlaybackState, playbackReducer } from './playback';

describe('playbackReducer', () => {
  it('loads a trace in a paused state', () => {
    expect(playbackReducer(initialPlaybackState, { type: 'load', total: 4 })).toMatchObject({
      phase: 'paused',
      index: 0,
      total: 4,
    });
  });

  it('moves forward and completes at the final step', () => {
    let state = playbackReducer(initialPlaybackState, { type: 'load', total: 2 });
    state = playbackReducer(state, { type: 'play' });
    state = playbackReducer(state, { type: 'tick' });
    expect(state).toMatchObject({ phase: 'complete', index: 1 });
  });

  it('pauses when moving backward from completion', () => {
    const complete = {
      phase: 'complete' as const,
      index: 2,
      total: 3,
      speed: 1 as const,
      checkpoints: [],
    };
    expect(playbackReducer(complete, { type: 'previous' })).toMatchObject({
      phase: 'paused',
      index: 1,
    });
  });

  it('restarts without changing playback speed', () => {
    const state = {
      phase: 'complete' as const,
      index: 3,
      total: 4,
      speed: 2 as const,
      checkpoints: [],
    };
    expect(playbackReducer(state, { type: 'restart' })).toEqual({
      phase: 'paused',
      index: 0,
      total: 4,
      speed: 2,
      checkpoints: [],
    });
  });

  it('does not move beyond either boundary', () => {
    const loaded = playbackReducer(initialPlaybackState, { type: 'load', total: 3 });
    expect(playbackReducer(loaded, { type: 'previous' }).index).toBe(0);
    const complete = { ...loaded, phase: 'complete' as const, index: 2 };
    expect(playbackReducer(complete, { type: 'next' }).index).toBe(2);
  });

  describe('practice checkpoints', () => {
    const loaded = playbackReducer(initialPlaybackState, {
      type: 'load',
      total: 5,
      checkpoints: [1, 3, 4, -1],
    });

    it('keeps only checkpoints that have a following step', () => {
      expect(loaded.checkpoints).toEqual([1, 3]);
    });

    it('holds Next at a checkpoint until the question is resolved', () => {
      let state = playbackReducer(loaded, { type: 'next' });
      expect(state).toMatchObject({ index: 1, phase: 'paused' });
      state = playbackReducer(state, { type: 'next' });
      expect(state).toMatchObject({ index: 1, phase: 'question' });
      expect(playbackReducer(state, { type: 'next' })).toBe(state);
      expect(playbackReducer(state, { type: 'play' })).toBe(state);
      state = playbackReducer(state, { type: 'resolve' });
      expect(state).toMatchObject({ index: 1, phase: 'paused', checkpoints: [3] });
      expect(playbackReducer(state, { type: 'next' }).index).toBe(2);
    });

    it('stops autoplay at a checkpoint', () => {
      let state = playbackReducer(loaded, { type: 'play' });
      state = playbackReducer(state, { type: 'tick' });
      state = playbackReducer(state, { type: 'tick' });
      expect(state).toMatchObject({ index: 1, phase: 'question' });
    });

    it('lets the learner step back from a question and keeps it pending', () => {
      let state = playbackReducer({ ...loaded, index: 1 }, { type: 'next' });
      state = playbackReducer(state, { type: 'previous' });
      expect(state).toMatchObject({ index: 0, phase: 'paused', checkpoints: [1, 3] });
    });

    it('ignores resolve outside a question', () => {
      expect(playbackReducer(loaded, { type: 'resolve' })).toBe(loaded);
    });
  });
});
