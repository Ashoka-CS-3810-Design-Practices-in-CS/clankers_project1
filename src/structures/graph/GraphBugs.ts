import { StepRecorder } from '../../domain/StepRecorder';
import type { BugScenario } from '../../practice/bugHunt';
import { edgeId, GraphModel, type GraphSnapshot, type GraphVertex } from './GraphModel';
import { GraphOperations } from './GraphOperations';

const operations = new GraphOperations();

/** BFS that marks a vertex only when it is dequeued, so vertices can be queued twice. */
const bfsMarksLate: BugScenario<GraphModel, GraphSnapshot> = {
  id: 'graph-bfs-marks-late',
  setup: 'Run BFS from 1 on the sample graph',
  explanation:
    'Vertices are only marked when they are dequeued, so a vertex already waiting in the queue looks undiscovered and is queued again: 5 and 6 get visited more than once. A vertex must be marked discovered at the moment it is enqueued.',
  buggyLine: 6,
  buggyCode: '      enqueue(n)  // n is only marked when it is dequeued',
  start: () => GraphModel.sample(),
  correct: (model) => operations.bfs(model, 1),
  buggySteps: (model) => {
    const start = model.vertex(1) as GraphVertex;
    const marked = new Set<string>();
    const visited: string[] = [];
    const treeEdges: string[] = [];
    const output: number[] = [];
    const queue: GraphVertex[] = [start];
    let head = 0;
    const waiting = () => queue.slice(head);
    const snapshot = () =>
      model.snapshot({ kind: 'queue', values: waiting().map((vertex) => vertex.value) });
    const recorder = new StepRecorder<GraphSnapshot>();
    recorder.record({
      message: 'Start BFS at 1: mark it discovered and enqueue it.',
      snapshot: snapshot(),
      matchedNodeIds: [start.id],
      line: 1,
    });
    // The cap stops a runaway trace; with this bug the queue still drains on the sample.
    while (head < queue.length && output.length < model.vertexCount() * 3) {
      const current = queue[head];
      head += 1;
      marked.add(current.id);
      visited.push(current.id);
      output.push(current.value);
      recorder.record({
        message: `Dequeue ${current.value} and visit it. Visit order so far: ${output.join(', ')}.`,
        snapshot: snapshot(),
        activeNodeIds: [current.id],
        visitedNodeIds: [...visited, ...treeEdges],
        matchedNodeIds: waiting().map((vertex) => vertex.id),
        output: [...output],
        line: 3,
      });
      for (const neighbour of model.neighbours(current.id)) {
        const edge = edgeId(current.id, neighbour.id);
        const known = marked.has(neighbour.id);
        if (!known) {
          if (!treeEdges.includes(edge)) treeEdges.push(edge);
          queue.push(neighbour);
        }
        recorder.record({
          message: known
            ? `${neighbour.value} has already been discovered, so it is not enqueued again.`
            : `${neighbour.value} is new: mark it discovered and enqueue it behind the others.`,
          snapshot: snapshot(),
          activeNodeIds: [current.id, edge],
          visitedNodeIds: [...visited, ...treeEdges],
          matchedNodeIds: waiting().map((vertex) => vertex.id),
          output: [...output],
          line: known ? 5 : 6,
        });
      }
    }
    recorder.record({
      message: `The queue is empty. BFS visited ${output.join(', ')}.`,
      snapshot: snapshot(),
      visitedNodeIds: [...visited, ...treeEdges],
      output: [...output],
      line: 7,
    });
    return recorder.steps();
  },
};

/** DFS that ends the whole search at the first dead end instead of backtracking. */
const dfsStopsAtDeadEnd: BugScenario<GraphModel, GraphSnapshot> = {
  id: 'graph-dfs-stops-at-dead-end',
  setup: 'Run DFS from 1 on the sample graph',
  explanation:
    'At the first dead end (3) the search ends instead of popping 3 and returning to 5. Vertex 6, which is reachable through 5, is never visited. Backtracking must return to the caller so it can try its remaining neighbours.',
  buggyLine: 6,
  buggyCode: '  end the whole search  // instead of pop v and return',
  start: () => GraphModel.sample(),
  correct: (model) => operations.dfs(model, 1),
  buggySteps: (model, correct) => {
    const firstPop = correct.steps.findIndex((step) => step.line === 6);
    const before = correct.steps[firstPop - 1];
    const deadEnd = correct.steps[firstPop];
    const empty = { ...deadEnd.snapshot, frontier: { kind: 'stack' as const, values: [] } };
    const label = model.vertices().find((vertex) => vertex.id === deadEnd.activeNodeIds[0])?.value;
    const missing = model.vertexCount() - before.output.length;
    const recorder = new StepRecorder<GraphSnapshot>();
    recorder.record({
      message: `${label} has no unvisited neighbours left, so the search ends.`,
      snapshot: empty,
      activeNodeIds: deadEnd.activeNodeIds,
      visitedNodeIds: deadEnd.visitedNodeIds,
      output: before.output,
      line: 6,
    });
    recorder.record({
      message: `The stack is empty. DFS visited ${before.output.join(', ')}. ${missing} ${missing === 1 ? 'vertex is' : 'vertices are'} not reachable from the start.`,
      snapshot: empty,
      visitedNodeIds: deadEnd.visitedNodeIds,
      output: before.output,
      line: 1,
    });
    return [...correct.steps.slice(0, firstPop), ...recorder.steps()];
  },
};

export const GRAPH_BUGS = [bfsMarksLate, dfsStopsAtDeadEnd] as const;
