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
    const complete = { phase: 'complete' as const, index: 2, total: 3, speed: 1 as const };
    expect(playbackReducer(complete, { type: 'previous' })).toMatchObject({
      phase: 'paused',
      index: 1,
    });
  });

  it('restarts without changing playback speed', () => {
    const state = { phase: 'complete' as const, index: 3, total: 4, speed: 2 as const };
    expect(playbackReducer(state, { type: 'restart' })).toEqual({
      phase: 'paused',
      index: 0,
      total: 4,
      speed: 2,
    });
  });

  it('does not move beyond either boundary', () => {
    const loaded = playbackReducer(initialPlaybackState, { type: 'load', total: 3 });
    expect(playbackReducer(loaded, { type: 'previous' }).index).toBe(0);
    const complete = { ...loaded, phase: 'complete' as const, index: 2 };
    expect(playbackReducer(complete, { type: 'next' }).index).toBe(2);
  });
});
