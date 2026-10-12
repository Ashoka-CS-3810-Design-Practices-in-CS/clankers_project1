import { StepRecorder } from '../../domain/StepRecorder';
import type { ComplexityInfo, OperationResult } from '../../domain/visualization';
import {
  edgeId,
  GraphModel,
  type GraphFrontier,
  type GraphSnapshot,
  type GraphVertex,
} from './GraphModel';

export type GraphResult = OperationResult<GraphModel, GraphSnapshot>;

const COMPLEXITY = {
  addVertex: {
    time: 'O(V)',
    space: 'O(1)',
    explanation:
      'The label is checked against existing vertices, then an empty adjacency list is created.',
  },
  removeVertex: {
    time: 'O(V + E)',
    space: 'O(1)',
    explanation:
      'The vertex is removed from each neighbour’s adjacency list before its own list is discarded.',
  },
  addEdge: {
    time: 'O(V)',
    space: 'O(1)',
    explanation:
      'Each endpoint’s sorted adjacency list is scanned to find the insertion point, at most V − 1 neighbours.',
  },
  removeEdge: {
    time: 'O(V)',
    space: 'O(1)',
    explanation: 'Each endpoint’s adjacency list is scanned once to remove the other endpoint.',
  },
  bfs: {
    time: 'O(V + E)',
    space: 'O(V)',
    explanation:
      'Every reachable vertex is enqueued once and every edge is examined from both ends; the queue and discovered set hold at most V vertices.',
  },
  dfs: {
    time: 'O(V + E)',
    space: 'O(V)',
    explanation:
      'Every reachable vertex is visited once and every edge is examined from both ends; the recursion stack holds at most V vertices.',
  },
} satisfies Record<string, ComplexityInfo>;

export class GraphOperations {
  addVertex(model: GraphModel, label: number): GraphResult {
    const working = model.clone();
    const recorder = new StepRecorder<GraphSnapshot>();
    recorder.record({
      message: `Check that no vertex is already labelled ${label}.`,
      snapshot: working.snapshot(),
    });
    const vertex = working.addVertex(label);
    recorder.record({
      message: `Vertex ${label} is added with no edges yet.`,
      snapshot: working.snapshot(),
      activeNodeIds: [vertex.id],
      visitedNodeIds: [vertex.id],
    });
    return this.result(working, recorder, COMPLEXITY.addVertex, 'Add vertex');
  }

  removeVertex(model: GraphModel, label: number): GraphResult {
    const working = model.clone();
    const recorder = new StepRecorder<GraphSnapshot>();
    const vertex = working.vertex(label) as GraphVertex;
    const neighbours = working.neighbours(vertex.id);
    const incident = neighbours.map((neighbour) => edgeId(vertex.id, neighbour.id));

    recorder.record({
      message:
        neighbours.length === 0
          ? `Vertex ${label} has no edges, so only the vertex itself is removed.`
          : `Vertex ${label} touches ${neighbours.length} ${neighbours.length === 1 ? 'edge' : 'edges'} (to ${listLabels(neighbours)}). Those edges are removed with it.`,
      snapshot: working.snapshot(),
      activeNodeIds: [vertex.id, ...incident],
    });
    working.removeVertex(label);
    recorder.record({
      message: `Vertex ${label} has been removed from the graph.`,
      snapshot: working.snapshot(),
      output: [label],
    });
    return this.result(working, recorder, COMPLEXITY.removeVertex, 'Remove vertex');
  }

  addEdge(model: GraphModel, from: number, to: number): GraphResult {
    const working = model.clone();
    const recorder = new StepRecorder<GraphSnapshot>();
    const first = working.vertex(from) as GraphVertex;
    const second = working.vertex(to) as GraphVertex;

    recorder.record({
      message: `Connect ${from} and ${to}. The graph is undirected, so each joins the other’s adjacency list.`,
      snapshot: working.snapshot(),
      activeNodeIds: [first.id, second.id],
    });
    const edge = working.addEdge(from, to);
    recorder.record({
      message: `Edge ${from}–${to} is added. ${from} now has ${working.neighbours(first.id).length} and ${to} has ${working.neighbours(second.id).length} ${working.neighbours(second.id).length === 1 ? 'neighbour' : 'neighbours'}.`,
      snapshot: working.snapshot(),
      activeNodeIds: [first.id, second.id, edge.id],
      visitedNodeIds: [edge.id],
    });
    return this.result(working, recorder, COMPLEXITY.addEdge, 'Add edge');
  }

  removeEdge(model: GraphModel, from: number, to: number): GraphResult {
    const working = model.clone();
    const recorder = new StepRecorder<GraphSnapshot>();
    const first = working.vertex(from) as GraphVertex;
    const second = working.vertex(to) as GraphVertex;
    const id = edgeId(first.id, second.id);

    recorder.record({
      message: `Find edge ${from}–${to} in both adjacency lists.`,
      snapshot: working.snapshot(),
      activeNodeIds: [first.id, second.id, id],
    });
    working.removeEdge(from, to);
    recorder.record({
      message: `Edge ${from}–${to} is removed. Both vertices stay in the graph.`,
      snapshot: working.snapshot(),
      activeNodeIds: [first.id, second.id],
    });
    return this.result(working, recorder, COMPLEXITY.removeEdge, 'Remove edge');
  }

  bfs(model: GraphModel, startLabel: number): GraphResult {
    const working = model.clone();
    const recorder = new StepRecorder<GraphSnapshot>();
    const start = working.vertex(startLabel) as GraphVertex;
    const discovered = new Set<string>([start.id]);
    const visited: string[] = [];
    const treeEdges: string[] = [];
    const output: number[] = [];
    // The queue is an array with a moving head index, so each dequeue is O(1).
    // Array.prototype.shift would re-index every remaining entry.
    const queue: GraphVertex[] = [start];
    let head = 0;
    const waiting = () => queue.slice(head);
    const frontier = (): GraphFrontier => ({
      kind: 'queue',
      values: waiting().map((vertex) => vertex.value),
    });

    recorder.record({
      message: `Start BFS at ${startLabel}: mark it discovered and enqueue it.`,
      snapshot: working.snapshot(frontier()),
      matchedNodeIds: [start.id],
    });

    while (head < queue.length) {
      const current = queue[head];
      head += 1;
      visited.push(current.id);
      output.push(current.value);
      recorder.record({
        message: `Dequeue ${current.value} and visit it. Visit order so far: ${output.join(', ')}.`,
        snapshot: working.snapshot(frontier()),
        activeNodeIds: [current.id],
        visitedNodeIds: [...visited, ...treeEdges],
        matchedNodeIds: waiting().map((vertex) => vertex.id),
        output,
      });

      working.neighbours(current.id).forEach((neighbour) => {
        const edge = edgeId(current.id, neighbour.id);
        if (discovered.has(neighbour.id)) {
          recorder.record({
            message: `${neighbour.value} has already been discovered, so it is not enqueued again.`,
            snapshot: working.snapshot(frontier()),
            activeNodeIds: [current.id, edge],
            visitedNodeIds: [...visited, ...treeEdges],
            matchedNodeIds: waiting().map((vertex) => vertex.id),
            output,
          });
          return;
        }
        discovered.add(neighbour.id);
        treeEdges.push(edge);
        queue.push(neighbour);
        recorder.record({
          message: `${neighbour.value} is new: mark it discovered and enqueue it behind the others.`,
          snapshot: working.snapshot(frontier()),
          activeNodeIds: [current.id, edge],
          visitedNodeIds: [...visited, ...treeEdges],
          matchedNodeIds: waiting().map((vertex) => vertex.id),
          output,
        });
      });
    }

    recorder.record({
      message: this.finishMessage('BFS', 'The queue is empty', output, working.vertexCount()),
      snapshot: working.snapshot(frontier()),
      visitedNodeIds: [...visited, ...treeEdges],
      output,
    });
    return this.result(working, recorder, COMPLEXITY.bfs, 'Breadth-first search');
  }

  dfs(model: GraphModel, startLabel: number): GraphResult {
    const working = model.clone();
    const recorder = new StepRecorder<GraphSnapshot>();
    const start = working.vertex(startLabel) as GraphVertex;
    const visitedSet = new Set<string>();
    const visited: string[] = [];
    const treeEdges: string[] = [];
    const output: number[] = [];
    const stack: GraphVertex[] = [];
    const frontier = (): GraphFrontier => ({
      kind: 'stack',
      values: stack.map((vertex) => vertex.value),
    });
    const highlight = () => ({
      visitedNodeIds: [...visited, ...treeEdges],
      matchedNodeIds: stack.map((vertex) => vertex.id),
      output,
    });

    recorder.record({
      message: `Start DFS at ${startLabel}. Each call goes as deep as possible before backtracking.`,
      snapshot: working.snapshot(frontier()),
    });

    const visit = (current: GraphVertex, parent: GraphVertex | null) => {
      visitedSet.add(current.id);
      visited.push(current.id);
      output.push(current.value);
      stack.push(current);
      recorder.record({
        message: `Visit ${current.value} and push it onto the call stack. Visit order so far: ${output.join(', ')}.`,
        snapshot: working.snapshot(frontier()),
        activeNodeIds: [current.id],
        ...highlight(),
      });

      working.neighbours(current.id).forEach((neighbour) => {
        const edge = edgeId(current.id, neighbour.id);
        if (visitedSet.has(neighbour.id)) {
          if (neighbour.id === parent?.id) return;
          recorder.record({
            message: `${neighbour.value} is already visited, so skip edge ${current.value}–${neighbour.value}.`,
            snapshot: working.snapshot(frontier()),
            activeNodeIds: [current.id, edge],
            ...highlight(),
          });
          return;
        }
        treeEdges.push(edge);
        recorder.record({
          message: `${neighbour.value} is unvisited, so follow edge ${current.value}–${neighbour.value} deeper.`,
          snapshot: working.snapshot(frontier()),
          activeNodeIds: [current.id, edge],
          ...highlight(),
        });
        visit(neighbour, current);
        recorder.record({
          message: `Back at ${current.value} after finishing ${neighbour.value}. Check its next neighbour.`,
          snapshot: working.snapshot(frontier()),
          activeNodeIds: [current.id],
          ...highlight(),
        });
      });

      stack.pop();
      recorder.record({
        message: `${current.value} has no unvisited neighbours left, so pop it off the stack.`,
        snapshot: working.snapshot(frontier()),
        activeNodeIds: [current.id],
        ...highlight(),
      });
    };

    visit(start, null);

    recorder.record({
      message: this.finishMessage('DFS', 'The stack is empty', output, working.vertexCount()),
      snapshot: working.snapshot(frontier()),
      visitedNodeIds: [...visited, ...treeEdges],
      output,
    });
    return this.result(working, recorder, COMPLEXITY.dfs, 'Depth-first search');
  }

  private finishMessage(
    name: string,
    emptyFrontier: string,
    output: readonly number[],
    vertexCount: number,
  ): string {
    const unreachable = vertexCount - output.length;
    const base = `${emptyFrontier}. ${name} visited ${output.join(', ')}.`;
    if (unreachable === 0) return base;
    return `${base} ${unreachable} ${unreachable === 1 ? 'vertex is' : 'vertices are'} not reachable from the start.`;
  }

  private result(
    model: GraphModel,
    recorder: StepRecorder<GraphSnapshot>,
    complexity: ComplexityInfo,
    operationLabel: string,
  ): GraphResult {
    return Object.freeze({
      model,
      steps: recorder.steps(),
      status: 'success' as const,
      complexity: Object.freeze({ ...complexity }),
      operationLabel,
    });
  }
}

function listLabels(vertices: readonly GraphVertex[]): string {
  return vertices.map((vertex) => vertex.value).join(', ');
}
