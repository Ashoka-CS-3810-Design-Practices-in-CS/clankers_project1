import { PseudocodePanel } from '../components/PseudocodePanel';
import { useEffect, useMemo, useState } from 'react';
import { Inspector } from '../components/Inspector';
import { PlaybackControls } from '../components/PlaybackControls';
import { PracticeBar } from '../components/PracticeBar';
import { PracticePanel } from '../components/PracticePanel';
import { StackCanvas } from '../components/StackCanvas';
import { StackOperationPanel } from '../components/StackOperationPanel';
import { parseIntegerInput } from '../domain/integerValidation';
import type { PlaybackSpeed } from '../playback/playback';
import { usePlayback } from '../playback/usePlayback';
import {
  containerPractice,
  STACK_WORDS,
  type ContainerOperation,
} from '../practice/containerPractice';
import { usePractice } from '../practice/usePractice';
import { StackModel } from '../structures/stack/StackModel';
import { StackOperations, type StackResult } from '../structures/stack/StackOperations';
import { validateStackCapacity } from '../structures/stack/stackValidation';

const operations = new StackOperations();

interface StackWorkspaceProps {
  readonly active: boolean;
}

export function StackWorkspace({ active }: StackWorkspaceProps) {
  const [model, setModel] = useState(() => new StackModel());
  const [result, setResult] = useState<StackResult | null>(null);
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

  function begin(nextResult: StackResult, operation: ContainerOperation, value?: number) {
    const checkpoints = practice.prepare(() =>
      containerPractice(STACK_WORDS, operation, value, nextResult.steps),
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

  function push() {
    const validation = parseIntegerInput(input);
    if (!validation.ok || validation.value === undefined) {
      setError(validation.message ?? 'Enter a valid integer.');
      return;
    }
    const capacity = validateStackCapacity(model.size());
    if (!capacity.ok) {
      setError(capacity.message ?? 'The stack is at capacity.');
      return;
    }
    begin(operations.push(model, validation.value), 'add', validation.value);
  }

  function loadSample() {
    setModel(StackModel.sample());
    setResult(null);
    playback.clear();
    setInput('');
    setError('');
  }

  function resetStack() {
    setModel(new StackModel());
    setResult(null);
    playback.clear();
    setInput('');
    setError('');
  }

  return (
    <main className="workspace" id={active ? 'main-content' : undefined} hidden={!active}>
      <header className="workspace-header">
        <div>
          <h1>Stack</h1>
          <p>Follow last-in, first-out behavior from the top item to the bottom.</p>
        </div>
        <div className="model-status" aria-label={`Current stack contains ${itemSummary}`}>
          <strong>{displayedSnapshot.items.length}</strong>
          <span>{displayedSnapshot.items.length === 1 ? 'item' : 'items'}</span>
        </div>
      </header>

      <StackOperationPanel
        value={input}
        onValueChange={(value) => {
          setInput(value);
          setError('');
        }}
        onPush={push}
        onPop={() => begin(operations.pop(model), 'remove')}
        onPeek={() => begin(operations.peek(model), 'peek')}
        onInspect={() => begin(operations.inspect(model), 'inspect')}
        onSample={loadSample}
        onReset={resetStack}
        disabled={playbackActive}
        error={error}
      />

      <PracticeBar
        idPrefix="stack"
        enabled={practice.enabled}
        onToggle={practice.setEnabled}
        disabled={playbackActive}
        score={practice.score}
      />

      <div className="visualizer-grid bounded-learning-stage">
        <section className="canvas-panel" aria-labelledby="stack-canvas-heading">
          <div className="canvas-heading">
            <div>
              <h2 id="stack-canvas-heading">LIFO view</h2>
              <p>New items enter and leave through the top of the stack.</p>
            </div>
            <span className={`phase-label phase-${playback.state.phase}`}>
              {playback.state.phase}
            </span>
          </div>
          <StackCanvas snapshot={displayedSnapshot} step={currentStep} />
        </section>
        <div className="learning-panels">
          <PseudocodePanel
            definition={result?.pseudocode}
            steps={result?.steps ?? []}
            index={playback.state.index}
          />
          <Inspector
            operationLabel={result?.operationLabel}
            complexity={result?.complexity}
            status={result?.status}
            step={currentStep}
            outputHeading="Operation output"
            emptyOutputCopy="Pop, Peek, or Inspect all to expose values from the top."
            matchedLabel="Top item"
          />
        </div>
      </div>

      {activeQuestion && (
        <PracticePanel
          idPrefix="stack"
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
