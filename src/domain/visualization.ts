export type OperationStatus = 'success' | 'not-found' | 'blocked';

export interface ComplexityInfo {
  readonly time: string;
  readonly space: string;
  readonly explanation: string;
}

export interface VisualizationStep<TSnapshot> {
  readonly id: string;
  readonly message: string;
  readonly snapshot: TSnapshot;
  readonly activeNodeIds: readonly string[];
  readonly visitedNodeIds: readonly string[];
  readonly matchedNodeIds: readonly string[];
  readonly output: readonly number[];
}

export interface OperationResult<TModel, TSnapshot> {
  readonly model: TModel;
  readonly steps: readonly VisualizationStep<TSnapshot>[];
  readonly status: OperationStatus;
  readonly complexity: ComplexityInfo;
  readonly operationLabel: string;
}

export interface StructureOperation<TModel, TSnapshot, TInput = void> {
  readonly id: string;
  readonly label: string;
  execute(model: TModel, input: TInput): OperationResult<TModel, TSnapshot>;
}

export interface StructureDefinition {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly availability: 'available' | 'planned';
}

export interface ValidationResult<T> {
  readonly ok: boolean;
  readonly value?: T;
  readonly message?: string;
}
