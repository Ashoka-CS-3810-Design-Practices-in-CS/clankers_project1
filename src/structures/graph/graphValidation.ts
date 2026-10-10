import { parseIntegerInput } from '../../domain/integerValidation';
import type { ValidationResult } from '../../domain/visualization';
import { GRAPH_LABEL_LIMIT, GRAPH_VERTEX_CAPACITY, type GraphModel } from './GraphModel';

export function parseVertexLabel(input: string, fieldName = 'a vertex'): ValidationResult<number> {
  if (input.trim().length === 0) {
    return { ok: false, message: `Enter ${fieldName} label before choosing an operation.` };
  }
  const parsed = parseIntegerInput(input);
  if (!parsed.ok || parsed.value === undefined) return parsed;
  if (Math.abs(parsed.value) > GRAPH_LABEL_LIMIT) {
    return {
      ok: false,
      message: `Use a label between -${GRAPH_LABEL_LIMIT} and ${GRAPH_LABEL_LIMIT} so it fits inside the vertex.`,
    };
  }
  return parsed;
}

export function validateNewVertex(model: GraphModel, label: number): ValidationResult<void> {
  if (model.hasVertex(label)) {
    return { ok: false, message: `Vertex ${label} already exists. Vertex labels must be unique.` };
  }
  if (model.vertexCount() >= GRAPH_VERTEX_CAPACITY) {
    return {
      ok: false,
      message: `The visualizer is limited to ${GRAPH_VERTEX_CAPACITY} vertices so every edge stays readable.`,
    };
  }
  return { ok: true };
}

export function validateExistingVertex(model: GraphModel, label: number): ValidationResult<void> {
  if (model.isEmpty()) {
    return { ok: false, message: 'The graph is empty. Add a vertex or load the sample first.' };
  }
  if (!model.hasVertex(label)) {
    return { ok: false, message: `Vertex ${label} is not in the graph.` };
  }
  return { ok: true };
}

export function validateNewEdge(
  model: GraphModel,
  from: number,
  to: number,
): ValidationResult<void> {
  const endpoints = validateEndpoints(model, from, to);
  if (!endpoints.ok) return endpoints;
  if (model.hasEdge(from, to)) {
    return { ok: false, message: `Vertices ${from} and ${to} are already connected.` };
  }
  return { ok: true };
}

export function validateExistingEdge(
  model: GraphModel,
  from: number,
  to: number,
): ValidationResult<void> {
  const endpoints = validateEndpoints(model, from, to);
  if (!endpoints.ok) return endpoints;
  if (!model.hasEdge(from, to)) {
    return { ok: false, message: `There is no edge between ${from} and ${to}.` };
  }
  return { ok: true };
}

function validateEndpoints(model: GraphModel, from: number, to: number): ValidationResult<void> {
  if (from === to) {
    return { ok: false, message: 'Choose two different vertices. Self-loops are not supported.' };
  }
  for (const label of [from, to]) {
    const exists = validateExistingVertex(model, label);
    if (!exists.ok) return exists;
  }
  return { ok: true };
}
