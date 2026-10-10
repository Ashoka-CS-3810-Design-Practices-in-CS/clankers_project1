export const STACK_CAPACITY = 50;

export interface StackItem {
  readonly id: string;
  readonly value: number;
}

export interface StackSnapshot {
  readonly items: readonly StackItem[];
}

export class StackModel {
  private readonly stack: StackItem[];
  private nextItemNumber: number;

  constructor(items: readonly StackItem[] = [], nextItemNumber?: number) {
    this.stack = items.map((item) => ({ ...item }));
    this.nextItemNumber = nextItemNumber ?? this.inferNextItemNumber(items);
  }

  static fromValues(values: readonly number[]): StackModel {
    return new StackModel(
      values.map((value, index) => ({ id: `stack-${index + 1}`, value })),
      values.length + 1,
    );
  }

  static sample(): StackModel {
    return StackModel.fromValues([8, 13, 21, 34]);
  }

  size(): number {
    return this.stack.length;
  }

  isEmpty(): boolean {
    return this.stack.length === 0;
  }

  items(): readonly StackItem[] {
    return this.stack.map((item) => ({ ...item }));
  }

  snapshot(): StackSnapshot {
    const items = this.items().map((item) => Object.freeze({ ...item }));
    return Object.freeze({ items: Object.freeze(items) });
  }

  clone(): StackModel {
    return new StackModel(this.items(), this.nextItemNumber);
  }

  push(value: number): StackItem {
    const item = Object.freeze({ id: `stack-${this.nextItemNumber}`, value });
    this.nextItemNumber += 1;
    this.stack.push(item);
    return item;
  }

  pop(): StackItem | null {
    const item = this.stack.pop();
    return item ? { ...item } : null;
  }

  peek(): StackItem | null {
    const item = this.stack.at(-1);
    return item ? { ...item } : null;
  }

  private inferNextItemNumber(items: readonly StackItem[]): number {
    const largestId = items.reduce((largest, item) => {
      const numericId = Number(item.id.replace('stack-', ''));
      return Number.isFinite(numericId) ? Math.max(largest, numericId) : largest;
    }, 0);
    return largestId + 1;
  }
}
