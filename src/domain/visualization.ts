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
  /** 1-based line of the operation's pseudocode that produced this step. */
  readonly line?: number;
}

export interface OperationResult<TModel, TSnapshot> {
  readonly model: TModel;
  readonly steps: readonly VisualizationStep<TSnapshot>[];
  readonly status: OperationStatus;
  readonly complexity: ComplexityInfo;
  readonly operationLabel: string;
  /** Short pseudocode for the operation; steps point into it with `line`. */
  readonly pseudocode?: readonly string[];
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
