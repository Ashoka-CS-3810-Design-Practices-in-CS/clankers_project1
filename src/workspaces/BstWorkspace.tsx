import { useEffect, useMemo, useState } from 'react';
import { BstCanvas } from '../components/BstCanvas';
import { BstOperationPanel } from '../components/BstOperationPanel';
import { Inspector } from '../components/Inspector';
import { PlaybackControls } from '../components/PlaybackControls';
import { BugHuntPanel } from '../components/BugHuntPanel';
import { PracticeBar } from '../components/PracticeBar';
import { PracticePanel } from '../components/PracticePanel';
import { parseIntegerInput } from '../domain/integerValidation';
import type { PlaybackSpeed } from '../playback/playback';
import { usePlayback } from '../playback/usePlayback';
import { useBugHunt } from '../practice/useBugHunt';
import { usePractice } from '../practice/usePractice';
import { BST_BUGS } from '../structures/bst/BstBugs';
import { BstModel, type TraversalOrder } from '../structures/bst/BstModel';
import { BstOperations, type BstResult } from '../structures/bst/BstOperations';
import { bstPractice, type BstPracticeOperation } from '../structures/bst/BstPractice';
import { validateBstCapacity } from '../structures/bst/bstValidation';

const operations = new BstOperations();
type ValueOperation = 'insert' | 'search' | 'delete';

interface BstWorkspaceProps {
  readonly active: boolean;
}

export function BstWorkspace({ active }: BstWorkspaceProps) {
  const [model, setModel] = useState(() => new BstModel());
  const [result, setResult] = useState<BstResult | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const practice = usePractice();
  const playback = usePlayback();
  const bugHunt = useBugHunt(BST_BUGS, playback, practice.record);
  /** The trace on screen: a spot-the-bug run while one is active, otherwise the learner's own. */
  const shown = bugHunt.displayed ?? result;
  const { pause } = playback;

  const currentStep = shown?.steps[playback.state.index];
  const displayedSnapshot = currentStep?.snapshot ?? model.snapshot();
  const playbackActive = bugHunt.active || Boolean(result && playback.state.phase !== 'complete');
  const hasSteps = Boolean(shown?.steps.length);
  const activeQuestion = practice.questionAt(playback.state.phase, playback.state.index);
  const nodeSummary = useMemo(
    () =>
      `${displayedSnapshot.nodes.length} ${displayedSnapshot.nodes.length === 1 ? 'node' : 'nodes'}`,
    [displayedSnapshot],
  );

  useEffect(() => {
    if (!active) pause();
  }, [active, pause]);

  function begin(nextResult: BstResult, operation: BstPracticeOperation, value?: number) {
    const checkpoints = practice.prepare(() => bstPractice(operation, value, nextResult));
    setModel(nextResult.model);
    setResult(nextResult);
    playback.load(nextResult.steps.length, checkpoints);
    setError('');
  }

  function continueAfterAnswer(correct: boolean) {
    practice.record(correct);
    playback.resolve();
    playback.next();
  }

  function runValueOperation(operation: ValueOperation) {
    const validation = parseIntegerInput(input);
    if (!validation.ok || validation.value === undefined) {
      setError(validation.message ?? 'Enter a valid integer.');
      return;
    }
    const value = validation.value;
    if (operation === 'insert') {
      const capacity = validateBstCapacity(model.size(), model.has(value));
      if (!capacity.ok) {
        setError(capacity.message ?? 'The tree is at capacity.');
        return;
      }
    }

    const nextResult = {
      insert: () => operations.insert(model, value),
      search: () => operations.search(model, value),
      delete: () => operations.delete(model, value),
    }[operation]();
    begin(nextResult, operation, value);
  }

  function traverse(order: TraversalOrder) {
    begin(operations.traverse(model, order), order);
  }

  function loadSample() {
    setModel(BstModel.sample());
    setResult(null);
    playback.clear();
    setInput('');
    setError('');
  }

  function resetTree() {
    setModel(new BstModel());
    setResult(null);
    playback.clear();
    setInput('');
    setError('');
  }

  return (
    <main className="workspace" id={active ? 'main-content' : undefined} hidden={!active}>
      <header className="workspace-header">
        <div>
          <h1>Binary Search Tree</h1>
          <p>Trace ordered comparisons, structural deletion, and three traversal strategies.</p>
        </div>
        <div className="model-status" aria-label={`Current tree contains ${nodeSummary}`}>
          <strong>{displayedSnapshot.nodes.length}</strong>
          <span>{displayedSnapshot.nodes.length === 1 ? 'node' : 'nodes'}</span>
        </div>
      </header>

      <BstOperationPanel
        value={input}
        onValueChange={(value) => {
          setInput(value);
          setError('');
        }}
        onInsert={() => runValueOperation('insert')}
        onSearch={() => runValueOperation('search')}
        onDelete={() => runValueOperation('delete')}
        onTraverse={traverse}
        onSample={loadSample}
        onReset={resetTree}
        disabled={playbackActive}
        error={error}
      />

      <PracticeBar
        idPrefix="bst"
        enabled={practice.enabled}
        onToggle={practice.setEnabled}
        disabled={playbackActive}
        score={practice.score}
        onSpotBug={bugHunt.start}
        spotBugDisabled={playbackActive}
      />

      <div className="visualizer-grid">
        <section className="canvas-panel" aria-labelledby="bst-canvas-heading">
          <div className="canvas-heading">
            <div>
              <h2 id="bst-canvas-heading">Ordered tree view</h2>
              <p>Every left descendant is smaller; every right descendant is larger.</p>
            </div>
            <span className={`phase-label phase-${playback.state.phase}`}>
              {playback.state.phase}
            </span>
          </div>
          <BstCanvas snapshot={displayedSnapshot} step={currentStep} />
        </section>
        <Inspector
          operationLabel={shown?.operationLabel}
          complexity={shown?.complexity}
          pseudocode={shown?.pseudocode}
          buggyLine={bugHunt.revealedBuggyLine}
          status={shown?.status}
          step={currentStep}
          outputHeading="Traversal and result output"
          emptyOutputCopy="Search, Delete, or choose a traversal to expose values."
          matchedLabel="Matched node"
        />
      </div>

      {bugHunt.challenge && (
        <BugHuntPanel
          idPrefix="bst"
          challenge={bugHunt.challenge}
          currentIndex={playback.state.index}
          flagged={bugHunt.flagged}
          verdict={bugHunt.verdict}
          view={bugHunt.view}
          onFlag={bugHunt.flag}
          onShow={bugHunt.show}
          onNext={bugHunt.start}
          onExit={() => {
            bugHunt.exit();
            setResult(null);
          }}
        />
      )}

      {activeQuestion && (
        <PracticePanel
          idPrefix="bst"
          key={activeQuestion.stepIndex}
          question={activeQuestion}
          onContinue={continueAfterAnswer}
        />
      )}

      <PlaybackControls
        state={playback.state}
        hasSteps={hasSteps}
        onPlay={playback.play}
        onPause={playback.pause}
        onPrevious={playback.previous}
        onNext={playback.next}
        onRestart={playback.restart}
        onSpeedChange={(speed: PlaybackSpeed) => playback.setSpeed(speed)}
      />
    </main>
  );
}
