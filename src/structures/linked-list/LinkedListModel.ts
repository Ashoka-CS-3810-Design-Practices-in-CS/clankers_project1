import { LinkedList } from '@datastructures-js/linked-list';

export const LINKED_LIST_CAPACITY = 50;

export interface ListItem {
  readonly id: string;
  readonly value: number;
}

export interface LinkedListSnapshot {
  readonly nodes: readonly ListItem[];
}

export class LinkedListModel {
  private readonly list: LinkedList<ListItem>;
  private nextNodeNumber: number;

  constructor(items: readonly ListItem[] = [], nextNodeNumber?: number) {
    this.list = new LinkedList<ListItem>();
    items.forEach((item) => this.list.insertLast({ ...item }));
    this.nextNodeNumber = nextNodeNumber ?? this.inferNextNodeNumber(items);
  }

  static fromValues(values: readonly number[]): LinkedListModel {
    return new LinkedListModel(
      values.map((value, index) => ({ id: `node-${index + 1}`, value })),
      values.length + 1,
    );
  }

  static sample(): LinkedListModel {
    return LinkedListModel.fromValues([8, 13, 21, 34]);
  }

  size(): number {
    return this.list.count();
  }

  isEmpty(): boolean {
    return this.list.isEmpty();
  }

  items(): readonly ListItem[] {
    const values: ListItem[] = [];
    this.list.forEach((node) => values.push({ ...(node.getValue() as ListItem) }));
    return values;
  }

  snapshot(): LinkedListSnapshot {
    const nodes = this.items().map((item) => Object.freeze({ ...item }));
    return Object.freeze({ nodes: Object.freeze(nodes) });
  }

  clone(): LinkedListModel {
    return new LinkedListModel(this.items(), this.nextNodeNumber);
  }

  insertFirst(value: number): ListItem {
    const item = this.createItem(value);
    this.list.insertFirst(item);
    return item;
  }

  insertLast(value: number): ListItem {
    const item = this.createItem(value);
    this.list.insertLast(item);
    return item;
  }

  removeAt(index: number): ListItem | null {
    const removed = this.list.removeAt(index);
    return removed ? ({ ...(removed.getValue() as ListItem) } as ListItem) : null;
  }

  private createItem(value: number): ListItem {
    const item = Object.freeze({ id: `node-${this.nextNodeNumber}`, value });
    this.nextNodeNumber += 1;
    return item;
  }

  private inferNextNodeNumber(items: readonly ListItem[]): number {
    const largestId = items.reduce((largest, item) => {
      const numericId = Number(item.id.replace('node-', ''));
      return Number.isFinite(numericId) ? Math.max(largest, numericId) : largest;
    }, 0);
    return largestId + 1;
  }
}
