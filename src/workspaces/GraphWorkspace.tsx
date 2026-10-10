import { useEffect, useState } from 'react';
import { GraphCanvas } from '../components/GraphCanvas';
import { GraphOperationPanel } from '../components/GraphOperationPanel';
import { Inspector } from '../components/Inspector';
import { PlaybackControls } from '../components/PlaybackControls';
import type { ValidationResult } from '../domain/visualization';
import type { PlaybackSpeed } from '../playback/playback';
import { usePlayback } from '../playback/usePlayback';
import { GraphModel } from '../structures/graph/GraphModel';
import { GraphOperations, type GraphResult } from '../structures/graph/GraphOperations';
import {
  parseVertexLabel,
  validateExistingEdge,
  validateExistingVertex,
  validateNewEdge,
  validateNewVertex,
} from '../structures/graph/graphValidation';

const operations = new GraphOperations();

interface GraphWorkspaceProps {
  readonly active: boolean;
}

export function GraphWorkspace({ active }: GraphWorkspaceProps) {
  const [model, setModel] = useState(() => new GraphModel());
  const [result, setResult] = useState<GraphResult | null>(null);
  const [vertexInput, setVertexInput] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [error, setError] = useState('');
  const playback = usePlayback();
  const { pause } = playback;

  const currentStep = result?.steps[playback.state.index];
  const displayedSnapshot = currentStep?.snapshot ?? model.snapshot();
  const playbackActive = Boolean(result && playback.state.phase !== 'complete');
  const hasSteps = Boolean(result?.steps.length);
  const vertexCount = displayedSnapshot.vertices.length;
  const edgeCount = displayedSnapshot.edges.length;

  useEffect(() => {
    if (!active) pause();
  }, [active, pause]);

  function begin(nextResult: GraphResult) {
    setModel(nextResult.model);
    setResult(nextResult);
    playback.load(nextResult.steps.length);
    setError('');
  }

  function fail(validation: ValidationResult<unknown>): boolean {
    if (validation.ok) return false;
    setError(validation.message ?? 'Check the vertex labels and try again.');
    return true;
  }

  function withVertex(
    check: (label: number) => ValidationResult<void>,
    run: (label: number) => GraphResult,
  ) {
    const parsed = parseVertexLabel(vertexInput);
    if (fail(parsed)) return;
    const label = parsed.value as number;
    if (fail(check(label))) return;
    begin(run(label));
  }

  function withEdge(
    check: (from: number, to: number) => ValidationResult<void>,
    run: (from: number, to: number) => GraphResult,
  ) {
    const from = parseVertexLabel(vertexInput);
    if (fail(from)) return;
    const to = parseVertexLabel(targetInput, 'a second vertex');
    if (fail(to)) return;
    if (fail(check(from.value as number, to.value as number))) return;
    begin(run(from.value as number, to.value as number));
  }

  function replaceModel(next: GraphModel) {
    setModel(next);
    setResult(null);
    playback.clear();
    setVertexInput('');
    setTargetInput('');
    setError('');
  }

  return (
    <main className="workspace" id={active ? 'main-content' : undefined} hidden={!active}>
      <header className="workspace-header">
        <div>
          <h1>Graph</h1>
          <p>Build an undirected graph, then compare breadth-first and depth-first search.</p>
        </div>
        <div
          className="model-status graph-status"
          aria-label={`Current graph contains ${vertexCount} ${vertexCount === 1 ? 'vertex' : 'vertices'} and ${edgeCount} ${edgeCount === 1 ? 'edge' : 'edges'}`}
        >
          <strong>{vertexCount}</strong>
          <span>{vertexCount === 1 ? 'vertex' : 'vertices'}</span>
          <strong>{edgeCount}</strong>
          <span>{edgeCount === 1 ? 'edge' : 'edges'}</span>
        </div>
      </header>

      <GraphOperationPanel
        vertex={vertexInput}
        target={targetInput}
        onVertexChange={(value) => {
          setVertexInput(value);
          setError('');
        }}
        onTargetChange={(value) => {
          setTargetInput(value);
          setError('');
        }}
        onAddVertex={() =>
          withVertex(
            (label) => validateNewVertex(model, label),
            (label) => operations.addVertex(model, label),
          )
        }
        onRemoveVertex={() =>
          withVertex(
            (label) => validateExistingVertex(model, label),
            (label) => operations.removeVertex(model, label),
          )
        }
        onAddEdge={() =>
          withEdge(
            (from, to) => validateNewEdge(model, from, to),
            (from, to) => operations.addEdge(model, from, to),
          )
        }
        onRemoveEdge={() =>
          withEdge(
            (from, to) => validateExistingEdge(model, from, to),
            (from, to) => operations.removeEdge(model, from, to),
          )
        }
        onBfs={() =>
          withVertex(
            (label) => validateExistingVertex(model, label),
            (label) => operations.bfs(model, label),
          )
        }
        onDfs={() =>
          withVertex(
            (label) => validateExistingVertex(model, label),
            (label) => operations.dfs(model, label),
          )
        }
        onSample={() => replaceModel(GraphModel.sample())}
        onReset={() => replaceModel(new GraphModel())}
        disabled={playbackActive}
        error={error}
      />

      <div className="visualizer-grid">
        <section className="canvas-panel" aria-labelledby="graph-canvas-heading">
          <div className="canvas-heading">
            <div>
              <h2 id="graph-canvas-heading">Graph view</h2>
              <p>Vertices sit on a circle in the order they were added; lines are edges.</p>
            </div>
            <span className={`phase-label phase-${playback.state.phase}`}>
              {playback.state.phase}
            </span>
          </div>
          <GraphCanvas snapshot={displayedSnapshot} step={currentStep} />
        </section>
        <Inspector
          operationLabel={result?.operationLabel}
          complexity={result?.complexity}
          status={result?.status}
          step={currentStep}
          outputHeading="Visit order"
          emptyOutputCopy="Run BFS or DFS from the vertex in the first field to see the visit order."
          matchedLabel="Queued / on stack"
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
