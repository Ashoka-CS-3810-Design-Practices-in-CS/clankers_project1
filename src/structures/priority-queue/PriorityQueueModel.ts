export const PRIORITY_QUEUE_CAPACITY = 50;

export interface HeapItem {
  readonly id: string;
  readonly value: number;
}

export interface PriorityQueueSnapshot {
  /** Items in binary-heap array order. Index i has children 2i + 1 and 2i + 2. */
  readonly items: readonly HeapItem[];
}

/**
 * Events emitted while the heap restores its order. Operations use them to record
 * narrated snapshots without re-implementing the heap algorithm.
 */
export type HeapEvent =
  | { readonly kind: 'placed'; readonly item: HeapItem; readonly index: number }
  | {
      readonly kind: 'compare';
      readonly direction: 'up' | 'down';
      readonly item: HeapItem;
      readonly other: HeapItem;
      readonly willSwap: boolean;
    }
  | {
      readonly kind: 'swap';
      readonly direction: 'up' | 'down';
      readonly item: HeapItem;
      readonly other: HeapItem;
    }
  | { readonly kind: 'settled'; readonly item: HeapItem; readonly reason: 'root' | 'leaf' }
  | { readonly kind: 'replaced-root'; readonly removed: HeapItem; readonly moved: HeapItem };

export type HeapObserver = (event: HeapEvent) => void;

const noop: HeapObserver = () => undefined;

export function parentIndex(index: number): number {
  return Math.floor((index - 1) / 2);
}

/**
 * Binary min-heap: the smallest value has the highest priority and is always at the root.
 * Ties keep their current positions because swaps only happen on strictly smaller values.
 */
export class PriorityQueueModel {
  private readonly heap: HeapItem[];
  private nextItemNumber: number;

  constructor(items: readonly HeapItem[] = [], nextItemNumber?: number) {
    this.heap = items.map((item) => ({ ...item }));
    this.nextItemNumber = nextItemNumber ?? this.inferNextItemNumber(items);
  }

  /** Builds a valid heap by inserting values in the given order. */
  static fromValues(values: readonly number[]): PriorityQueueModel {
    const model = new PriorityQueueModel();
    values.forEach((value) => model.insert(value));
    return model;
  }

  static sample(): PriorityQueueModel {
    return PriorityQueueModel.fromValues([7, 3, 9, 1, 5, 8]);
  }

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  items(): readonly HeapItem[] {
    return this.heap.map((item) => ({ ...item }));
  }

  snapshot(): PriorityQueueSnapshot {
    const items = this.items().map((item) => Object.freeze({ ...item }));
    return Object.freeze({ items: Object.freeze(items) });
  }

  clone(): PriorityQueueModel {
    return new PriorityQueueModel(this.items(), this.nextItemNumber);
  }

  peekMin(): HeapItem | null {
    const root = this.heap[0];
    return root ? { ...root } : null;
  }

  insert(value: number, observe: HeapObserver = noop): HeapItem {
    const item = Object.freeze({ id: `pq-${this.nextItemNumber}`, value });
    this.nextItemNumber += 1;
    this.heap.push(item);
    observe({ kind: 'placed', item, index: this.heap.length - 1 });
    this.siftUp(this.heap.length - 1, observe);
    return { ...item };
  }

  extractMin(observe: HeapObserver = noop): HeapItem | null {
    const root = this.heap[0];
    if (!root) return null;

    const last = this.heap.pop() as HeapItem;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      observe({ kind: 'replaced-root', removed: root, moved: last });
      this.siftDown(0, observe);
    }
    return { ...root };
  }

  /** True when every parent is less than or equal to its children. */
  isValidHeap(): boolean {
    return this.heap.every(
      (item, index) => index === 0 || this.heap[parentIndex(index)].value <= item.value,
    );
  }

  private siftUp(start: number, observe: HeapObserver): void {
    let index = start;
    while (index > 0) {
      const parent = parentIndex(index);
      const item = this.heap[index];
      const other = this.heap[parent];
      const willSwap = item.value < other.value;
      observe({ kind: 'compare', direction: 'up', item, other, willSwap });
      if (!willSwap) return;
      this.swap(index, parent);
      observe({ kind: 'swap', direction: 'up', item, other });
      index = parent;
    }
    observe({ kind: 'settled', item: this.heap[0], reason: 'root' });
  }

  private siftDown(start: number, observe: HeapObserver): void {
    let index = start;
    for (;;) {
      const left = 2 * index + 1;
      const right = left + 1;
      const item = this.heap[index];
      if (left >= this.heap.length) {
        observe({ kind: 'settled', item, reason: 'leaf' });
        return;
      }
      const smaller =
        right < this.heap.length && this.heap[right].value < this.heap[left].value ? right : left;
      const other = this.heap[smaller];
      const willSwap = other.value < item.value;
      observe({ kind: 'compare', direction: 'down', item, other, willSwap });
      if (!willSwap) return;
      this.swap(index, smaller);
      observe({ kind: 'swap', direction: 'down', item, other });
      index = smaller;
    }
  }

  private swap(first: number, second: number): void {
    [this.heap[first], this.heap[second]] = [this.heap[second], this.heap[first]];
  }

  private inferNextItemNumber(items: readonly HeapItem[]): number {
    const largestId = items.reduce((largest, item) => {
      const numericId = Number(item.id.replace('pq-', ''));
      return Number.isFinite(numericId) ? Math.max(largest, numericId) : largest;
    }, 0);
    return largestId + 1;
  }
}
