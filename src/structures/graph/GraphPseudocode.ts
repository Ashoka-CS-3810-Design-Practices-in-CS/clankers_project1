import { definePseudocode } from '../../domain/pseudocode';

export const graphCode = {
  addVertex: definePseudocode('Add vertex', [
    ['vertex.check', 'verify label is unused'],
    ['vertex.add', 'create vertex with empty adjacency list'],
  ]),
  removeVertex: definePseudocode('Remove vertex', [
    ['vertex.find', 'locate vertex and all incident edges'],
    ['vertex.remove', 'remove incident edges from neighbours; remove vertex'],
  ]),
  addEdge: definePseudocode('Add undirected edge', [
    ['edge.find', 'locate both endpoints'],
    ['edge.add', 'insert each endpoint in the other’s sorted adjacency list'],
  ]),
  removeEdge: definePseudocode('Remove undirected edge', [
    ['edge.find', 'locate edge in both adjacency lists'],
    ['edge.remove', 'remove each endpoint from the other’s adjacency list'],
  ]),
  bfs: definePseudocode('Breadth-first search', [
    ['bfs.start', 'discover start; queue ← [start]; output ← []'],
    ['bfs.visit', 'while queue not empty: dequeue vertex; output vertex'],
    ['bfs.skip', 'for each neighbour: if discovered, skip', 1],
    ['bfs.enqueue', 'otherwise: discover neighbour; enqueue neighbour', 1],
    ['bfs.done', 'return output (reachable vertices only)'],
  ]),
  dfs: definePseudocode('Depth-first search', [
    ['dfs.start', 'visited ← {}; output ← []; visit(start)'],
    ['dfs.visit', 'visit(v): mark visited; output v; push call frame', 1],
    ['dfs.skip', 'for each neighbour: if visited, skip', 2],
    ['dfs.descend', 'otherwise: follow edge; call visit(neighbour)', 2],
    ['dfs.resume', 'resume v; continue with next neighbour', 2],
    ['dfs.pop', 'after all neighbours: pop call frame; return', 1],
    ['dfs.done', 'return output (reachable vertices only)'],
  ]),
};
