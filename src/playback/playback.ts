export const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];
export type PlaybackPhase = 'idle' | 'paused' | 'playing' | 'question' | 'complete';

export interface PlaybackState {
  readonly phase: PlaybackPhase;
  readonly index: number;
  readonly total: number;
  readonly speed: PlaybackSpeed;
  /** Step indexes where practice mode holds playback until the learner answers. */
  readonly checkpoints: readonly number[];
}

export type PlaybackAction =
  | { readonly type: 'load'; readonly total: number; readonly checkpoints?: readonly number[] }
  | { readonly type: 'resolve' }
  | { readonly type: 'play' }
  | { readonly type: 'pause' }
  | { readonly type: 'next' | 'previous' | 'restart' | 'tick' | 'clear' }
  | { readonly type: 'speed'; readonly speed: PlaybackSpeed };

export const initialPlaybackState: PlaybackState = Object.freeze({
  phase: 'idle',
  index: 0,
  total: 0,
  speed: 1,
  checkpoints: Object.freeze([]),
});

function heldAt(state: PlaybackState): boolean {
  return state.checkpoints.includes(state.index);
}

export function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case 'load':
      return {
        ...state,
        phase: action.total <= 1 ? 'complete' : 'paused',
        index: 0,
        total: action.total,
        checkpoints: Object.freeze(
          (action.checkpoints ?? []).filter((index) => index >= 0 && index < action.total - 1),
        ),
      };
    case 'play':
      if (state.phase === 'question') return state;
      if (heldAt(state)) return { ...state, phase: 'question' };
      return state.total > 1 && state.index < state.total - 1
        ? { ...state, phase: 'playing' }
        : state;
    case 'resolve':
      return state.phase === 'question'
        ? {
            ...state,
            phase: 'paused',
            checkpoints: state.checkpoints.filter((index) => index !== state.index),
          }
        : state;
    case 'pause':
      return state.phase === 'playing' ? { ...state, phase: 'paused' } : state;
    case 'next':
    case 'tick': {
      if (state.phase === 'question') return state;
      if (heldAt(state)) return { ...state, phase: 'question' };
      const nextIndex = Math.min(state.index + 1, Math.max(state.total - 1, 0));
      return {
        ...state,
        index: nextIndex,
        phase: nextIndex === state.total - 1 ? 'complete' : state.phase,
      };
    }
    case 'previous': {
      const previousIndex = Math.max(state.index - 1, 0);
      return { ...state, index: previousIndex, phase: state.total > 0 ? 'paused' : 'idle' };
    }
    case 'restart':
      return { ...state, index: 0, phase: state.total <= 1 ? 'complete' : 'paused' };
    case 'speed':
      return { ...state, speed: action.speed };
    case 'clear':
      return { ...initialPlaybackState, speed: state.speed };
  }
}
