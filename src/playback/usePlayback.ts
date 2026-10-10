import { useEffect, useReducer } from 'react';
import {
  initialPlaybackState,
  playbackReducer,
  type PlaybackSpeed,
} from './playback';

export function usePlayback() {
  const [state, dispatch] = useReducer(playbackReducer, initialPlaybackState);

  useEffect(() => {
    if (state.phase !== 'playing') return;
    const timer = window.setTimeout(() => dispatch({ type: 'tick' }), 900 / state.speed);
    return () => window.clearTimeout(timer);
  }, [state.index, state.phase, state.speed]);

  return {
    state,
    load: (total: number) => dispatch({ type: 'load', total }),
    play: () => dispatch({ type: 'play' }),
    pause: () => dispatch({ type: 'pause' }),
    next: () => dispatch({ type: 'next' }),
    previous: () => dispatch({ type: 'previous' }),
    restart: () => dispatch({ type: 'restart' }),
    clear: () => dispatch({ type: 'clear' }),
    setSpeed: (speed: PlaybackSpeed) => dispatch({ type: 'speed', speed }),
  };
}
