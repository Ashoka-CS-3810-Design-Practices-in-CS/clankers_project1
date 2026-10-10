import { describe, expect, it } from 'vitest';
import { edgeId, GRAPH_VERTEX_CAPACITY, GraphModel } from './GraphModel';
import { GraphOperations } from './GraphOperations';
import {
  parseVertexLabel,
  validateExistingEdge,
  validateExistingVertex,
  validateNewEdge,
  validateNewVertex,
} from './graphValidation';

const operations = new GraphOperations();
const labels = (model: GraphModel) => model.vertices().map((vertex) => vertex.value);

describe('GraphModel', () => {
  it('stores undirected edges in both adjacency lists, sorted by label', () => {
    const model = GraphModel.fromEdges(
      [5, 1, 3],
      [
        [5, 3],
        [5, 1],
      ],
    );
    const five = model.vertex(5)!;
    expect(model.neighbours(five.id).map((vertex) => vertex.value)).toEqual([1, 3]);
    expect(model.hasEdge(3, 5)).toBe(true);
    expect(model.hasEdge(1, 3)).toBe(false);
    expect(model.edgeCount()).toBe(2);
  });

  it('uses the same edge id regardless of direction', () => {
    expect(edgeId('vertex-2', 'vertex-10')).toBe(edgeId('vertex-10', 'vertex-2'));
    expect(edgeId('vertex-2', 'vertex-10')).toBe('edge-2-10');
  });

  it('removes a vertex together with its incident edges', () => {
    const model = GraphModel.sample();
    const removed = model.removeVertex(4);
    expect(removed).toHaveLength(3);
    expect(model.hasVertex(4)).toBe(false);
    expect(model.edgeCount()).toBe(4);
    expect(model.hasEdge(5, 6)).toBe(true);
  });

  it('keeps stable ids after removal and cloning', () => {
    const model = GraphModel.fromEdges([1, 2, 3], []);
    model.removeVertex(2);
    const clone = model.clone();
    const added = clone.addVertex(7);
    expect(added.id).toBe('vertex-4');
    expect(labels(model)).toEqual([1, 3]);
  });

  it('rejects duplicates, self-loops and repeated edges', () => {
    const model = GraphModel.fromEdges([1, 2], [[1, 2]]);
    expect(() => model.addVertex(1)).toThrow();
    expect(() => model.addEdge(1, 1)).toThrow();
    expect(() => model.addEdge(2, 1)).toThrow();
  });

  it('returns deeply immutable snapshots', () => {
    const snapshot = GraphModel.sample().snapshot({ kind: 'queue', values: [1] });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.vertices)).toBe(true);
    expect(Object.isFrozen(snapshot.edges)).toBe(true);
    expect(Object.isFrozen(snapshot.frontier?.values)).toBe(true);
    expect(snapshot.edges.every(Object.isFrozen)).toBe(true);
  });
});

describe('GraphOperations', () => {
  it('visits the sample level by level with BFS', () => {
    const result = operations.bfs(GraphModel.sample(), 1);
    expect(result.steps.at(-1)?.output).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.complexity).toMatchObject({ time: 'O(V + E)', space: 'O(V)' });
    expect(result.steps[0].snapshot.frontier).toEqual({ kind: 'queue', values: [1] });
    expect(result.steps.at(-1)?.snapshot.frontier?.values).toEqual([]);
  });

  it('goes as deep as possible first with DFS', () => {
    const result = operations.dfs(GraphModel.sample(), 1);
    expect(result.steps.at(-1)?.output).toEqual([1, 2, 4, 5, 3, 6]);
    expect(result.complexity).toMatchObject({ time: 'O(V + E)', space: 'O(V)' });
    const deepest = Math.max(
      ...result.steps.map((step) => step.snapshot.frontier?.values.length ?? 0),
    );
    expect(deepest).toBe(5);
  });

  it('highlights the traversal tree edges in the final step', () => {
    const result = operations.bfs(GraphModel.sample(), 1);
    const edges = result.steps.at(-1)!.visitedNodeIds.filter((id) => id.startsWith('edge-'));
    expect(edges).toHaveLength(5);
  });

  it('reports vertices that cannot be reached from the start', () => {
    const model = GraphModel.fromEdges([1, 2, 3], [[1, 2]]);
    const bfs = operations.bfs(model, 1);
    const dfs = operations.dfs(model, 1);
    expect(bfs.steps.at(-1)?.output).toEqual([1, 2]);
    expect(bfs.steps.at(-1)?.message).toContain('1 vertex is not reachable');
    expect(dfs.steps.at(-1)?.output).toEqual([1, 2]);
  });

  it('traverses a single vertex', () => {
    const model = GraphModel.fromEdges([8], []);
    expect(operations.bfs(model, 8).steps.at(-1)?.output).toEqual([8]);
    expect(operations.dfs(model, 8).steps.at(-1)?.output).toEqual([8]);
  });

  it('adds and removes vertices and edges without mutating the committed model', () => {
    const model = GraphModel.sample();
    const before = model.snapshot();

    expect(operations.addVertex(model, 9).model.hasVertex(9)).toBe(true);
    expect(operations.addEdge(model, 1, 6).model.hasEdge(1, 6)).toBe(true);
    expect(operations.removeEdge(model, 1, 2).model.hasEdge(1, 2)).toBe(false);
    const removed = operations.removeVertex(model, 4);
    expect(removed.model.hasVertex(4)).toBe(false);
    expect(removed.steps[0].activeNodeIds).toHaveLength(4);
    expect(removed.complexity.time).toBe('O(V + E)');

    expect(model.snapshot()).toEqual(before);
  });

  it('generates deterministic immutable step logs', () => {
    const first = operations.dfs(GraphModel.sample(), 3);
    const second = operations.dfs(GraphModel.sample(), 3);
    expect(first.steps).toEqual(second.steps);
    expect(Object.isFrozen(first.steps)).toBe(true);
    expect(first.steps.every(Object.isFrozen)).toBe(true);
  });
});

describe('graph validation', () => {
  it('parses labels within the readable range', () => {
    expect(parseVertexLabel('12').value).toBe(12);
    expect(parseVertexLabel('').ok).toBe(false);
    expect(parseVertexLabel('1000').ok).toBe(false);
    expect(parseVertexLabel('-999').ok).toBe(true);
  });

  it('enforces unique labels and the vertex limit', () => {
    const model = GraphModel.sample();
    expect(validateNewVertex(model, 1).ok).toBe(false);
    expect(validateNewVertex(model, 7).ok).toBe(true);

    const full = GraphModel.fromEdges(
      Array.from({ length: GRAPH_VERTEX_CAPACITY }, (_, index) => index + 1),
      [],
    );
    expect(validateNewVertex(full, 99).ok).toBe(false);
  });

  it('explains missing vertices and edges', () => {
    const model = GraphModel.sample();
    expect(validateExistingVertex(new GraphModel(), 1).message).toContain('empty');
    expect(validateExistingVertex(model, 9).message).toContain('not in the graph');
    expect(validateNewEdge(model, 1, 1).message).toContain('Self-loops');
    expect(validateNewEdge(model, 1, 2).message).toContain('already connected');
    expect(validateNewEdge(model, 1, 6).ok).toBe(true);
    expect(validateExistingEdge(model, 1, 6).message).toContain('no edge');
  });
});
