import { useEffect, useMemo, useState } from 'react';
import { Inspector } from '../components/Inspector';
import { PlaybackControls } from '../components/PlaybackControls';
import { PracticeBar } from '../components/PracticeBar';
import { PracticePanel } from '../components/PracticePanel';
import { PriorityQueueCanvas } from '../components/PriorityQueueCanvas';
import { PriorityQueueOperationPanel } from '../components/PriorityQueueOperationPanel';
import { parseIntegerInput } from '../domain/integerValidation';
import type { PlaybackSpeed } from '../playback/playback';
import { usePlayback } from '../playback/usePlayback';
import { usePractice } from '../practice/usePractice';
import {
  priorityQueuePractice,
  type PriorityQueuePracticeOperation,
} from '../structures/priority-queue/PriorityQueuePractice';
import { PriorityQueueModel } from '../structures/priority-queue/PriorityQueueModel';
import {
  PriorityQueueOperations,
  type PriorityQueueResult,
} from '../structures/priority-queue/PriorityQueueOperations';
import { validatePriorityQueueCapacity } from '../structures/priority-queue/priorityQueueValidation';

const operations = new PriorityQueueOperations();

interface PriorityQueueWorkspaceProps {
  readonly active: boolean;
}

export function PriorityQueueWorkspace({ active }: PriorityQueueWorkspaceProps) {
  const [model, setModel] = useState(() => new PriorityQueueModel());
  const [result, setResult] = useState<PriorityQueueResult | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const practice = usePractice();
  const playback = usePlayback();
  const { pause } = playback;

  const currentStep = result?.steps[playback.state.index];
  const displayedSnapshot = currentStep?.snapshot ?? model.snapshot();
  const playbackActive = Boolean(result && playback.state.phase !== 'complete');
  const hasSteps = Boolean(result?.steps.length);
  const activeQuestion = practice.questionAt(playback.state.phase, playback.state.index);
  const itemSummary = useMemo(
    () =>
      `${displayedSnapshot.items.length} ${displayedSnapshot.items.length === 1 ? 'item' : 'items'}`,
    [displayedSnapshot],
  );

  useEffect(() => {
    if (!active) pause();
  }, [active, pause]);

  function begin(
    nextResult: PriorityQueueResult,
    operation: PriorityQueuePracticeOperation,
    value?: number,
  ) {
    const checkpoints = practice.prepare(() => priorityQueuePractice(operation, value, nextResult));
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

  function insert() {
    const validation = parseIntegerInput(input);
    if (!validation.ok || validation.value === undefined) {
      setError(validation.message ?? 'Enter a valid integer.');
      return;
    }
    const capacity = validatePriorityQueueCapacity(model.size());
    if (!capacity.ok) {
      setError(capacity.message ?? 'The priority queue is at capacity.');
      return;
    }
    begin(operations.insert(model, validation.value), 'insert', validation.value);
  }

  function loadSample() {
    setModel(PriorityQueueModel.sample());
    setResult(null);
    playback.clear();
    setInput('');
    setError('');
  }

  function resetPriorityQueue() {
    setModel(new PriorityQueueModel());
    setResult(null);
    playback.clear();
    setInput('');
    setError('');
  }

  return (
    <main className="workspace" id={active ? 'main-content' : undefined} hidden={!active}>
      <header className="workspace-header">
        <div>
          <h1>Priority Queue</h1>
          <p>Watch a binary min-heap keep the smallest value at the root after every change.</p>
        </div>
        <div className="model-status" aria-label={`Current priority queue contains ${itemSummary}`}>
          <strong>{displayedSnapshot.items.length}</strong>
          <span>{displayedSnapshot.items.length === 1 ? 'item' : 'items'}</span>
        </div>
      </header>

      <PriorityQueueOperationPanel
        value={input}
        onValueChange={(value) => {
          setInput(value);
          setError('');
        }}
        onInsert={insert}
        onExtract={() => begin(operations.extractMin(model), 'extract')}
        onPeek={() => begin(operations.peekMin(model), 'peek')}
        onSample={loadSample}
        onReset={resetPriorityQueue}
        disabled={playbackActive}
        error={error}
      />

      <PracticeBar
        idPrefix="priority-queue"
        enabled={practice.enabled}
        onToggle={practice.setEnabled}
        disabled={playbackActive}
        score={practice.score}
      />

      <div className="visualizer-grid">
        <section className="canvas-panel" aria-labelledby="pq-canvas-heading">
          <div className="canvas-heading">
            <div>
              <h2 id="pq-canvas-heading">Min-heap view</h2>
              <p>
                The tree and its array are the same data. Index i has children 2i + 1 and 2i + 2.
              </p>
            </div>
            <span className={`phase-label phase-${playback.state.phase}`}>
              {playback.state.phase}
            </span>
          </div>
          <PriorityQueueCanvas snapshot={displayedSnapshot} step={currentStep} />
        </section>
        <Inspector
          operationLabel={result?.operationLabel}
          complexity={result?.complexity}
          status={result?.status}
          step={currentStep}
          outputHeading="Priority queue output"
          emptyOutputCopy="Extract min or Peek min to expose the highest-priority value."
          matchedLabel="Compared / minimum"
        />
      </div>

      {activeQuestion && (
        <PracticePanel
          idPrefix="priority-queue"
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
