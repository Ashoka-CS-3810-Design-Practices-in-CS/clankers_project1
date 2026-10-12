export const GRAPH_VERTEX_CAPACITY = 12;
export const GRAPH_LABEL_LIMIT = 999;

export type TraversalKind = 'bfs' | 'dfs';

export interface GraphVertex {
  readonly id: string;
  readonly value: number;
}

export interface GraphEdge {
  readonly id: string;
  readonly from: string;
  readonly to: string;
}

export interface GraphFrontier {
  readonly kind: 'queue' | 'stack';
  /** Labels in order: queue front first, or stack bottom first. */
  readonly values: readonly number[];
}

export interface GraphSnapshot {
  readonly vertices: readonly GraphVertex[];
  readonly edges: readonly GraphEdge[];
  readonly frontier?: GraphFrontier;
}

/** Stable, order-independent identifier for an undirected edge. */
export function edgeId(firstId: string, secondId: string): string {
  const [a, b] = [firstId, secondId].sort(
    (left, right) => Number(left.replace('vertex-', '')) - Number(right.replace('vertex-', '')),
  );
  return `edge-${a.replace('vertex-', '')}-${b.replace('vertex-', '')}`;
}

/**
 * Undirected, unweighted graph stored as adjacency lists.
 *
 * Vertex labels are unique integers. Each adjacency list is kept sorted by label so BFS and
 * DFS always explore neighbours in ascending order, which makes every trace deterministic.
 */
export class GraphModel {
  private readonly vertexList: GraphVertex[];
  private readonly adjacency: Map<string, string[]>;
  /** Constant-time lookups so traversal cost matches the displayed O(V + E). */
  private readonly vertexById = new Map<string, GraphVertex>();
  private readonly idByLabel = new Map<number, string>();
  /**
   * Frozen vertex and edge lists shared by every snapshot until the graph changes.
   * BFS and DFS record a snapshot per step without changing the graph, so sharing these
   * lists avoids rebuilding O(V + E) objects at every step.
   */
  private structure: Pick<GraphSnapshot, 'vertices' | 'edges'> | null = null;
  private nextVertexNumber: number;

  constructor(
    vertices: readonly GraphVertex[] = [],
    adjacency: ReadonlyMap<string, readonly string[]> = new Map(),
    nextVertexNumber?: number,
  ) {
    this.vertexList = vertices.map((vertex) => ({ ...vertex }));
    this.vertexList.forEach((vertex) => this.index(vertex));
    this.adjacency = new Map(
      this.vertexList.map((vertex) => [vertex.id, [...(adjacency.get(vertex.id) ?? [])]]),
    );
    this.nextVertexNumber = nextVertexNumber ?? this.inferNextVertexNumber(vertices);
  }

  static fromEdges(
    labels: readonly number[],
    edges: readonly (readonly [number, number])[],
  ): GraphModel {
    const model = new GraphModel();
    labels.forEach((label) => model.addVertex(label));
    edges.forEach(([from, to]) => model.addEdge(from, to));
    return model;
  }

  static sample(): GraphModel {
    return GraphModel.fromEdges(
      [1, 2, 3, 4, 5, 6],
      [
        [1, 2],
        [1, 3],
        [2, 4],
        [3, 5],
        [4, 5],
        [4, 6],
        [5, 6],
      ],
    );
  }

  vertexCount(): number {
    return this.vertexList.length;
  }

  edgeCount(): number {
    let total = 0;
    this.adjacency.forEach((neighbours) => {
      total += neighbours.length;
    });
    return total / 2;
  }

  isEmpty(): boolean {
    return this.vertexList.length === 0;
  }

  vertex(label: number): GraphVertex | null {
    const id = this.idByLabel.get(label);
    return id === undefined ? null : { ...this.byId(id) };
  }

  hasVertex(label: number): boolean {
    return this.vertex(label) !== null;
  }

  hasEdge(firstLabel: number, secondLabel: number): boolean {
    const first = this.vertex(firstLabel);
    const second = this.vertex(secondLabel);
    if (!first || !second) return false;
    return (this.adjacency.get(first.id) ?? []).includes(second.id);
  }

  /** Neighbours of a vertex, ascending by label. */
  neighbours(id: string): readonly GraphVertex[] {
    return (this.adjacency.get(id) ?? []).map((neighbourId) => ({ ...this.byId(neighbourId) }));
  }

  vertices(): readonly GraphVertex[] {
    return this.vertexList.map((vertex) => ({ ...vertex }));
  }

  edges(): readonly GraphEdge[] {
    const edges: GraphEdge[] = [];
    const seen = new Set<string>();
    this.vertexList.forEach((vertex) => {
      (this.adjacency.get(vertex.id) ?? []).forEach((neighbourId) => {
        const id = edgeId(vertex.id, neighbourId);
        if (seen.has(id)) return;
        seen.add(id);
        edges.push({ id, from: vertex.id, to: neighbourId });
      });
    });
    return edges;
  }

  snapshot(frontier?: GraphFrontier): GraphSnapshot {
    this.structure ??= {
      vertices: Object.freeze(this.vertices().map((vertex) => Object.freeze({ ...vertex }))),
      edges: Object.freeze(this.edges().map((edge) => Object.freeze({ ...edge }))),
    };
    return Object.freeze({
      vertices: this.structure.vertices,
      edges: this.structure.edges,
      ...(frontier
        ? {
            frontier: Object.freeze({
              kind: frontier.kind,
              values: Object.freeze([...frontier.values]),
            }),
          }
        : {}),
    });
  }

  clone(): GraphModel {
    return new GraphModel(this.vertexList, this.adjacency, this.nextVertexNumber);
  }

  addVertex(label: number): GraphVertex {
    if (this.hasVertex(label)) throw new Error(`Vertex ${label} already exists.`);
    const vertex = Object.freeze({ id: `vertex-${this.nextVertexNumber}`, value: label });
    this.nextVertexNumber += 1;
    this.vertexList.push(vertex);
    this.index(vertex);
    this.structure = null;
    this.adjacency.set(vertex.id, []);
    return { ...vertex };
  }

  /** Removes the vertex and every edge touching it. Returns the removed edge ids. */
  removeVertex(label: number): readonly string[] {
    const vertex = this.vertex(label);
    if (!vertex) return [];
    const removedEdges = (this.adjacency.get(vertex.id) ?? []).map((neighbourId) => {
      const list = this.adjacency.get(neighbourId) ?? [];
      list.splice(list.indexOf(vertex.id), 1);
      return edgeId(vertex.id, neighbourId);
    });
    this.adjacency.delete(vertex.id);
    this.vertexById.delete(vertex.id);
    this.idByLabel.delete(vertex.value);
    this.structure = null;
    this.vertexList.splice(
      this.vertexList.findIndex((candidate) => candidate.id === vertex.id),
      1,
    );
    return removedEdges;
  }

  addEdge(firstLabel: number, secondLabel: number): GraphEdge {
    const first = this.vertex(firstLabel);
    const second = this.vertex(secondLabel);
    if (!first || !second) throw new Error('Both vertices must exist before adding an edge.');
    if (first.id === second.id) throw new Error('Self-loops are not supported.');
    if (this.hasEdge(firstLabel, secondLabel)) throw new Error('That edge already exists.');
    this.insertSorted(first.id, second.id);
    this.insertSorted(second.id, first.id);
    this.structure = null;
    return { id: edgeId(first.id, second.id), from: first.id, to: second.id };
  }

  removeEdge(firstLabel: number, secondLabel: number): boolean {
    if (!this.hasEdge(firstLabel, secondLabel)) return false;
    const first = this.vertex(firstLabel) as GraphVertex;
    const second = this.vertex(secondLabel) as GraphVertex;
    const firstList = this.adjacency.get(first.id) as string[];
    const secondList = this.adjacency.get(second.id) as string[];
    firstList.splice(firstList.indexOf(second.id), 1);
    secondList.splice(secondList.indexOf(first.id), 1);
    this.structure = null;
    return true;
  }

  private insertSorted(ownerId: string, neighbourId: string): void {
    const list = this.adjacency.get(ownerId) as string[];
    const value = this.byId(neighbourId).value;
    const position = list.findIndex((candidate) => this.byId(candidate).value > value);
    list.splice(position === -1 ? list.length : position, 0, neighbourId);
  }

  private byId(id: string): GraphVertex {
    return this.vertexById.get(id) as GraphVertex;
  }

  private index(vertex: GraphVertex): void {
    this.vertexById.set(vertex.id, vertex);
    this.idByLabel.set(vertex.value, vertex.id);
  }

  private inferNextVertexNumber(vertices: readonly GraphVertex[]): number {
    const largestId = vertices.reduce((largest, vertex) => {
      const numericId = Number(vertex.id.replace('vertex-', ''));
      return Number.isFinite(numericId) ? Math.max(largest, numericId) : largest;
    }, 0);
    return largestId + 1;
  }
}
