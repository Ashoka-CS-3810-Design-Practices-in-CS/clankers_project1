import { useEffect, useMemo, useState } from 'react';
import { Inspector } from '../components/Inspector';
import { PlaybackControls } from '../components/PlaybackControls';
import { PracticeBar } from '../components/PracticeBar';
import { PracticePanel } from '../components/PracticePanel';
import { QueueCanvas } from '../components/QueueCanvas';
import { QueueOperationPanel } from '../components/QueueOperationPanel';
import { parseIntegerInput } from '../domain/integerValidation';
import type { PlaybackSpeed } from '../playback/playback';
import { usePlayback } from '../playback/usePlayback';
import {
  containerPractice,
  QUEUE_WORDS,
  type ContainerOperation,
} from '../practice/containerPractice';
import { usePractice } from '../practice/usePractice';
import { QueueModel } from '../structures/queue/QueueModel';
import { QueueOperations, type QueueResult } from '../structures/queue/QueueOperations';
import { validateQueueCapacity } from '../structures/queue/queueValidation';

const operations = new QueueOperations();

interface QueueWorkspaceProps {
  readonly active: boolean;
}

export function QueueWorkspace({ active }: QueueWorkspaceProps) {
  const [model, setModel] = useState(() => new QueueModel());
  const [result, setResult] = useState<QueueResult | null>(null);
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

  function begin(nextResult: QueueResult, operation: ContainerOperation, value?: number) {
    const checkpoints = practice.prepare(() =>
      containerPractice(QUEUE_WORDS, operation, value, nextResult.steps),
    );
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

  function enqueue() {
    const validation = parseIntegerInput(input);
    if (!validation.ok || validation.value === undefined) {
      setError(validation.message ?? 'Enter a valid integer.');
      return;
    }
    const capacity = validateQueueCapacity(model.size());
    if (!capacity.ok) {
      setError(capacity.message ?? 'The queue is at capacity.');
      return;
    }
    begin(operations.enqueue(model, validation.value), 'add', validation.value);
  }

  function loadSample() {
    setModel(QueueModel.sample());
    setResult(null);
    playback.clear();
    setInput('');
    setError('');
  }

  function resetQueue() {
    setModel(new QueueModel());
    setResult(null);
    playback.clear();
    setInput('');
    setError('');
  }

  return (
    <main className="workspace" id={active ? 'main-content' : undefined} hidden={!active}>
      <header className="workspace-header">
        <div>
          <h1>Queue</h1>
          <p>Follow first-in, first-out behavior from the front of the line to the rear.</p>
        </div>
        <div className="model-status" aria-label={`Current queue contains ${itemSummary}`}>
          <strong>{displayedSnapshot.items.length}</strong>
          <span>{displayedSnapshot.items.length === 1 ? 'item' : 'items'}</span>
        </div>
      </header>

      <QueueOperationPanel
        value={input}
        onValueChange={(value) => {
          setInput(value);
          setError('');
        }}
        onEnqueue={enqueue}
        onDequeue={() => begin(operations.dequeue(model), 'remove')}
        onPeek={() => begin(operations.peek(model), 'peek')}
        onInspect={() => begin(operations.inspect(model), 'inspect')}
        onSample={loadSample}
        onReset={resetQueue}
        disabled={playbackActive}
        error={error}
      />

      <PracticeBar
        idPrefix="queue"
        enabled={practice.enabled}
        onToggle={practice.setEnabled}
        disabled={playbackActive}
        score={practice.score}
      />

      <div className="visualizer-grid">
        <section className="canvas-panel" aria-labelledby="queue-canvas-heading">
          <div className="canvas-heading">
            <div>
              <h2 id="queue-canvas-heading">FIFO view</h2>
              <p>Items join at the rear and leave from the front in arrival order.</p>
            </div>
            <span className={`phase-label phase-${playback.state.phase}`}>
              {playback.state.phase}
            </span>
          </div>
          <QueueCanvas snapshot={displayedSnapshot} step={currentStep} />
        </section>
        <Inspector
          operationLabel={result?.operationLabel}
          complexity={result?.complexity}
          status={result?.status}
          step={currentStep}
          outputHeading="Queue output"
          emptyOutputCopy="Dequeue, Peek front, or Inspect all to expose values from the front."
          matchedLabel="Front item"
        />
      </div>

      {activeQuestion && (
        <PracticePanel
          idPrefix="queue"
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
