import { useState } from 'react';
import {
  buildChallenge,
  gradeFlag,
  type BugChallenge,
  type BugScenario,
  type FlagVerdict,
} from './bugHunt';

interface PlaybackApi {
  readonly state: { readonly index: number };
  readonly load: (total: number, checkpoints?: readonly number[]) => void;
  readonly seek: (index: number) => void;
  readonly pause: () => void;
  readonly clear: () => void;
}

export type BugView = 'buggy' | 'correct';

/**
 * Runs spot-the-bug challenges for one workspace. While a challenge is active the workspace
 * shows `displayed` instead of its own trace and keeps its operations locked; the model the
 * learner built is never touched.
 */
export function useBugHunt<TModel, TSnapshot>(
  scenarios: readonly BugScenario<TModel, TSnapshot>[],
  playback: PlaybackApi,
  record: (correct: boolean) => void,
) {
  const [challenge, setChallenge] = useState<BugChallenge<TModel, TSnapshot> | null>(null);
  const [flagged, setFlagged] = useState<number | null>(null);
  const [view, setView] = useState<BugView>('buggy');
  const [nextScenario, setNextScenario] = useState(0);

  const verdict: FlagVerdict | null =
    challenge && flagged !== null ? gradeFlag(flagged, challenge.divergence) : null;
  const displayed = challenge ? (view === 'buggy' ? challenge.buggy : challenge.correct) : null;

  function start() {
    const next = buildChallenge(scenarios[nextScenario % scenarios.length]);
    setNextScenario((value) => value + 1);
    setChallenge(next);
    setFlagged(null);
    setView('buggy');
    playback.load(next.buggy.steps.length);
  }

  function flag() {
    if (!challenge || flagged !== null) return;
    const index = playback.state.index;
    setFlagged(index);
    record(index === challenge.divergence);
    playback.pause();
    playback.seek(challenge.divergence);
  }

  function show(nextView: BugView) {
    if (!challenge) return;
    const trace = nextView === 'buggy' ? challenge.buggy : challenge.correct;
    setView(nextView);
    playback.load(trace.steps.length);
    playback.seek(challenge.divergence);
  }

  function exit() {
    setChallenge(null);
    setFlagged(null);
    setView('buggy');
    playback.clear();
  }

  return {
    active: challenge !== null,
    challenge,
    flagged,
    verdict,
    view,
    displayed,
    /** The buggy line to mark in the pseudocode once the answer is revealed. */
    revealedBuggyLine:
      challenge && flagged !== null && view === 'buggy' ? challenge.scenario.buggyLine : undefined,
    start,
    flag,
    show,
    exit,
  };
}
