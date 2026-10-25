import { PseudocodePanel } from '../components/PseudocodePanel';
import { VisualizationZoom } from '../components/VisualizationZoom';
import { useEffect, useMemo, useState } from 'react';
import { Inspector } from '../components/Inspector';
import { LinkedListCanvas } from '../components/LinkedListCanvas';
import { OperationPanel } from '../components/OperationPanel';
import { PlaybackControls } from '../components/PlaybackControls';
import { PracticeBar } from '../components/PracticeBar';
import { PracticePanel } from '../components/PracticePanel';
import { parseIntegerInput } from '../domain/integerValidation';
import type { PlaybackSpeed } from '../playback/playback';
import { usePlayback } from '../playback/usePlayback';
import { usePractice } from '../practice/usePractice';
import { LinkedListModel } from '../structures/linked-list/LinkedListModel';
import {
  LinkedListOperations,
  type LinkedListResult,
} from '../structures/linked-list/LinkedListOperations';
import {
  linkedListPractice,
  type LinkedListPracticeOperation,
} from '../structures/linked-list/LinkedListPractice';
import { validateInsertionCapacity } from '../structures/linked-list/linkedListValidation';

const operations = new LinkedListOperations();
type ValueOperation = 'insert-head' | 'insert-tail' | 'search' | 'delete';

interface LinkedListWorkspaceProps {
  readonly active: boolean;
}

export function LinkedListWorkspace({ active }: LinkedListWorkspaceProps) {
  const [model, setModel] = useState(() => new LinkedListModel());
  const [result, setResult] = useState<LinkedListResult | null>(null);
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
  const nodeSummary = useMemo(
    () =>
      `${displayedSnapshot.nodes.length} ${displayedSnapshot.nodes.length === 1 ? 'node' : 'nodes'}`,
    [displayedSnapshot],
  );

  useEffect(() => {
    if (!active) pause();
  }, [active, pause]);

  function begin(
    nextResult: LinkedListResult,
    operation: LinkedListPracticeOperation,
    value?: number,
  ) {
    const checkpoints = practice.prepare(() => linkedListPractice(operation, value, nextResult));
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
    if (operation === 'insert-head' || operation === 'insert-tail') {
      const capacity = validateInsertionCapacity(model.size());
      if (!capacity.ok) {
        setError(capacity.message ?? 'The list is at capacity.');
        return;
      }
    }

    const value = validation.value;
    const nextResult = {
      'insert-head': () => operations.insertHead(model, value),
      'insert-tail': () => operations.insertTail(model, value),
      search: () => operations.search(model, value),
      delete: () => operations.deleteFirstMatch(model, value),
    }[operation]();
    begin(nextResult, operation, value);
  }

  function loadSample() {
    setModel(LinkedListModel.sample());
    setResult(null);
    playback.clear();
    setInput('');
    setError('');
  }

  function resetList() {
    setModel(new LinkedListModel());
    setResult(null);
    playback.clear();
    setInput('');
    setError('');
  }

  return (
    <main className="workspace" id={active ? 'main-content' : undefined} hidden={!active}>
      <header className="workspace-header">
        <div>
          <h1>Linked List</h1>
          <p>See how values and next references change, one operation at a time.</p>
        </div>
        <div className="model-status" aria-label={`Current list contains ${nodeSummary}`}>
          <strong>{displayedSnapshot.nodes.length}</strong>
          <span>{displayedSnapshot.nodes.length === 1 ? 'node' : 'nodes'}</span>
        </div>
      </header>

      <OperationPanel
        inputId="linked-list-node-value"
        value={input}
        onValueChange={(value) => {
          setInput(value);
          setError('');
        }}
        onInsertHead={() => runValueOperation('insert-head')}
        onInsertTail={() => runValueOperation('insert-tail')}
        onSearch={() => runValueOperation('search')}
        onDelete={() => runValueOperation('delete')}
        onTraverse={() => begin(operations.traverse(model), 'traverse')}
        onSample={loadSample}
        onReset={resetList}
        disabled={playbackActive}
        error={error}
      />

      <PracticeBar
        idPrefix="linked-list"
        enabled={practice.enabled}
        onToggle={practice.setEnabled}
        disabled={playbackActive}
        score={practice.score}
      />

      <div className="visualizer-grid bounded-learning-stage">
        <section className="canvas-panel" aria-labelledby="linked-list-canvas-heading">
          <div className="canvas-heading">
            <div>
              <h2 id="linked-list-canvas-heading">Pointer view</h2>
              <p>Each node stores a value and a reference to the next node.</p>
            </div>
            <span className={`phase-label phase-${playback.state.phase}`}>
              {playback.state.phase}
            </span>
          </div>
          <VisualizationZoom>
            {(zoom) => (
              <LinkedListCanvas snapshot={displayedSnapshot} step={currentStep} zoom={zoom} />
            )}
          </VisualizationZoom>
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
            outputHeading="Traversal output"
            emptyOutputCopy="Run Traverse to collect values from head to null."
          />
        </div>
      </div>

      {activeQuestion && (
        <PracticePanel
          idPrefix="linked-list"
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
