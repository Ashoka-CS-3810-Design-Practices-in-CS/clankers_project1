import { useCallback, useEffect, useReducer } from 'react';
import { initialPlaybackState, playbackReducer, type PlaybackSpeed } from './playback';

export function usePlayback() {
  const [state, dispatch] = useReducer(playbackReducer, initialPlaybackState);
  const load = useCallback(
    (total: number, checkpoints?: readonly number[]) =>
      dispatch({ type: 'load', total, checkpoints }),
    [],
  );
  const resolve = useCallback(() => dispatch({ type: 'resolve' }), []);
  const seek = useCallback((index: number) => dispatch({ type: 'seek', index }), []);
  const play = useCallback(() => dispatch({ type: 'play' }), []);
  const pause = useCallback(() => dispatch({ type: 'pause' }), []);
  const next = useCallback(() => dispatch({ type: 'next' }), []);
  const previous = useCallback(() => dispatch({ type: 'previous' }), []);
  const restart = useCallback(() => dispatch({ type: 'restart' }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);
  const setSpeed = useCallback((speed: PlaybackSpeed) => dispatch({ type: 'speed', speed }), []);

  useEffect(() => {
    if (state.phase !== 'playing') return;
    const timer = window.setTimeout(() => dispatch({ type: 'tick' }), 900 / state.speed);
    return () => window.clearTimeout(timer);
  }, [state.index, state.phase, state.speed]);

  return {
    state,
    load,
    resolve,
    seek,
    play,
    pause,
    next,
    previous,
    restart,
    clear,
    setSpeed,
  };
}
