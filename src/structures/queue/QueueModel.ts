export const QUEUE_CAPACITY = 50;

export interface QueueItem {
  readonly id: string;
  readonly value: number;
}

export interface QueueSnapshot {
  /** Items ordered from front (index 0) to rear (last index). */
  readonly items: readonly QueueItem[];
}

/**
 * FIFO queue backed by an array plus a moving front index.
 *
 * Dequeue advances `frontIndex` instead of calling `Array.prototype.shift`, which would
 * re-index every remaining element. Consumed slots are compacted once they make up at
 * least half of the backing array, so enqueue and dequeue both stay amortised O(1).
 */
export class QueueModel {
  private storage: QueueItem[];
  private frontIndex = 0;
  private nextItemNumber: number;

  constructor(items: readonly QueueItem[] = [], nextItemNumber?: number) {
    this.storage = items.map((item) => ({ ...item }));
    this.nextItemNumber = nextItemNumber ?? this.inferNextItemNumber(items);
  }

  static fromValues(values: readonly number[]): QueueModel {
    return new QueueModel(
      values.map((value, index) => ({ id: `queue-${index + 1}`, value })),
      values.length + 1,
    );
  }

  static sample(): QueueModel {
    return QueueModel.fromValues([5, 12, 19, 26]);
  }

  size(): number {
    return this.storage.length - this.frontIndex;
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  items(): readonly QueueItem[] {
    return this.storage.slice(this.frontIndex).map((item) => ({ ...item }));
  }

  snapshot(): QueueSnapshot {
    const items = this.items().map((item) => Object.freeze({ ...item }));
    return Object.freeze({ items: Object.freeze(items) });
  }

  clone(): QueueModel {
    return new QueueModel(this.items(), this.nextItemNumber);
  }

  enqueue(value: number): QueueItem {
    const item = Object.freeze({ id: `queue-${this.nextItemNumber}`, value });
    this.nextItemNumber += 1;
    this.storage.push(item);
    return { ...item };
  }

  dequeue(): QueueItem | null {
    if (this.isEmpty()) return null;
    const item = this.storage[this.frontIndex];
    this.frontIndex += 1;
    this.compactIfNeeded();
    return { ...item };
  }

  front(): QueueItem | null {
    if (this.isEmpty()) return null;
    return { ...this.storage[this.frontIndex] };
  }

  rear(): QueueItem | null {
    if (this.isEmpty()) return null;
    return { ...this.storage[this.storage.length - 1] };
  }

  private compactIfNeeded(): void {
    if (this.frontIndex * 2 >= this.storage.length) {
      this.storage = this.storage.slice(this.frontIndex);
      this.frontIndex = 0;
    }
  }

  private inferNextItemNumber(items: readonly QueueItem[]): number {
    const largestId = items.reduce((largest, item) => {
      const numericId = Number(item.id.replace('queue-', ''));
      return Number.isFinite(numericId) ? Math.max(largest, numericId) : largest;
    }, 0);
    return largestId + 1;
  }
}
