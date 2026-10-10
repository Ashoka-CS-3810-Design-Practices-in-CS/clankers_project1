import { useEffect, useMemo, useState } from 'react';
import { BstCanvas } from '../components/BstCanvas';
import { BstOperationPanel } from '../components/BstOperationPanel';
import { Inspector } from '../components/Inspector';
import { PlaybackControls } from '../components/PlaybackControls';
import { parseIntegerInput } from '../domain/integerValidation';
import type { PlaybackSpeed } from '../playback/playback';
import { usePlayback } from '../playback/usePlayback';
import { BstModel, type TraversalOrder } from '../structures/bst/BstModel';
import { BstOperations, type BstResult } from '../structures/bst/BstOperations';
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
  const playback = usePlayback();
  const { pause } = playback;

  const currentStep = result?.steps[playback.state.index];
  const displayedSnapshot = currentStep?.snapshot ?? model.snapshot();
  const playbackActive = Boolean(result && playback.state.phase !== 'complete');
  const hasSteps = Boolean(result?.steps.length);
  const nodeSummary = useMemo(
    () =>
      `${displayedSnapshot.nodes.length} ${displayedSnapshot.nodes.length === 1 ? 'node' : 'nodes'}`,
    [displayedSnapshot],
  );

  useEffect(() => {
    if (!active) pause();
  }, [active, pause]);

  function begin(nextResult: BstResult) {
    setModel(nextResult.model);
    setResult(nextResult);
    playback.load(nextResult.steps.length);
    setError('');
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
    begin(nextResult);
  }

  function traverse(order: TraversalOrder) {
    begin(operations.traverse(model, order));
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
          operationLabel={result?.operationLabel}
          complexity={result?.complexity}
          status={result?.status}
          step={currentStep}
          outputHeading="Traversal and result output"
          emptyOutputCopy="Search, Delete, or choose a traversal to expose values."
          matchedLabel="Matched node"
        />
      </div>

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
