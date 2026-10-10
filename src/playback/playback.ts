export const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];
export type PlaybackPhase = 'idle' | 'paused' | 'playing' | 'complete';

export interface PlaybackState {
  readonly phase: PlaybackPhase;
  readonly index: number;
  readonly total: number;
  readonly speed: PlaybackSpeed;
}

export type PlaybackAction =
  | { readonly type: 'load'; readonly total: number }
  | { readonly type: 'play' }
  | { readonly type: 'pause' }
  | { readonly type: 'next' | 'previous' | 'restart' | 'tick' | 'clear' }
  | { readonly type: 'speed'; readonly speed: PlaybackSpeed };

export const initialPlaybackState: PlaybackState = Object.freeze({
  phase: 'idle',
  index: 0,
  total: 0,
  speed: 1,
});

export function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case 'load':
      return {
        ...state,
        phase: action.total <= 1 ? 'complete' : 'paused',
        index: 0,
        total: action.total,
      };
    case 'play':
      return state.total > 1 && state.index < state.total - 1
        ? { ...state, phase: 'playing' }
        : state;
    case 'pause':
      return state.phase === 'playing' ? { ...state, phase: 'paused' } : state;
    case 'next':
    case 'tick': {
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
