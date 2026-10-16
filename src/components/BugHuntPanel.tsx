import { useEffect, useRef } from 'react';
import type { BugChallenge, FlagVerdict } from '../practice/bugHunt';
import type { BugView } from '../practice/useBugHunt';

interface BugHuntPanelProps<TModel, TSnapshot> {
  /** Unique per workspace, because every workspace stays mounted. */
  readonly idPrefix: string;
  readonly challenge: BugChallenge<TModel, TSnapshot>;
  readonly currentIndex: number;
  readonly flagged: number | null;
  readonly verdict: FlagVerdict | null;
  readonly view: BugView;
  readonly onFlag: () => void;
  readonly onShow: (view: BugView) => void;
  readonly onNext: () => void;
  readonly onExit: () => void;
}

const VERDICT_TITLE: Record<FlagVerdict, string> = {
  exact: 'Correct.',
  early: 'Too early.',
  late: 'Too late.',
};

export function BugHuntPanel<TModel, TSnapshot>({
  idPrefix,
  challenge,
  currentIndex,
  flagged,
  verdict,
  view,
  onFlag,
  onShow,
  onNext,
  onExit,
}: BugHuntPanelProps<TModel, TSnapshot>) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingId = `${idPrefix}-bug-heading`;
  const divergenceStep = challenge.divergence + 1;
  const { scenario } = challenge;

  useEffect(() => {
    headingRef.current?.focus();
  }, [challenge]);

  return (
    <section className="practice-card bug-card" aria-labelledby={headingId}>
      <h2 id={headingId} ref={headingRef} tabIndex={-1}>
        Spot the bug
      </h2>
      <p className="practice-prompt">
        {scenario.setup}. This version has one bug in its code. Step through it and flag the first
        step that goes wrong. The pseudocode shows the buggy code.
      </p>

      {flagged === null ? (
        <div className="bug-actions">
          <button type="button" className="practice-continue" onClick={onFlag}>
            Flag step {currentIndex + 1} as the first wrong step
          </button>
          <button type="button" className="quiet-button" onClick={onExit}>
            Exit
          </button>
        </div>
      ) : (
        <>
          <div className="practice-feedback" role="status" aria-live="polite">
            <p className={verdict === 'exact' ? 'feedback-correct' : 'feedback-wrong'}>
              <strong>{verdict ? VERDICT_TITLE[verdict] : ''}</strong>{' '}
              {verdict === 'exact'
                ? `Step ${divergenceStep} is where the run first goes wrong.`
                : verdict === 'early'
                  ? `Step ${flagged + 1} is still correct. The bug first shows at step ${divergenceStep}.`
                  : `The bug showed earlier, at step ${divergenceStep}.`}{' '}
              {scenario.explanation}
            </p>
          </div>
          <dl className="bug-diff">
            <div>
              <dt>Buggy line {scenario.buggyLine}</dt>
              <dd>
                <code>{scenario.buggyCode.trim()}</code>
              </dd>
            </div>
            <div>
              <dt>Fixed</dt>
              <dd>
                <code>{challenge.fixedCode.trim()}</code>
              </dd>
            </div>
          </dl>
          <div className="bug-actions">
            <button
              type="button"
              className="practice-continue"
              onClick={() => onShow(view === 'buggy' ? 'correct' : 'buggy')}
            >
              {view === 'buggy' ? 'Show the correct run' : 'Show the buggy run'}
            </button>
            <button type="button" className="quiet-button" onClick={onNext}>
              Next bug
            </button>
            <button type="button" className="quiet-button" onClick={onExit}>
              Done
            </button>
          </div>
          <p className="bug-view-note">
            Showing the {view} run at step {divergenceStep}. Use Previous and Next to compare.
          </p>
        </>
      )}
    </section>
  );
}
