export const BST_CAPACITY = 31;

export type TraversalOrder = 'inorder' | 'preorder' | 'postorder';

export interface BstNodeSnapshot {
  readonly id: string;
  readonly value: number;
  readonly count: number;
  readonly leftId: string | null;
  readonly rightId: string | null;
}

export interface BstSnapshot {
  readonly rootId: string | null;
  readonly nodes: readonly BstNodeSnapshot[];
}

interface MutableBstNode {
  id: string;
  value: number;
  count: number;
  left: MutableBstNode | null;
  right: MutableBstNode | null;
}

export interface BstInsertResult {
  readonly node: BstNodeSnapshot;
  readonly duplicate: boolean;
}

export interface BstDeleteResult {
  readonly removed: BstNodeSnapshot | null;
  readonly decremented: boolean;
  readonly replacementId: string | null;
}

export class BstModel {
  private root: MutableBstNode | null;
  private nextNodeNumber: number;

  constructor(root: MutableBstNode | null = null, nextNodeNumber = 1) {
    this.root = root;
    this.nextNodeNumber = nextNodeNumber;
  }

  static fromValues(values: readonly number[]): BstModel {
    const model = new BstModel();
    values.forEach((value) => model.insert(value));
    return model;
  }

  static sample(): BstModel {
    return BstModel.fromValues([50, 30, 70, 20, 40, 60, 80]);
  }

  size(): number {
    return this.snapshot().nodes.length;
  }

  isEmpty(): boolean {
    return this.root === null;
  }

  has(value: number): boolean {
    return this.pathTo(value).at(-1)?.value === value;
  }

  pathTo(value: number): readonly BstNodeSnapshot[] {
    const path: BstNodeSnapshot[] = [];
    let current = this.root;
    while (current) {
      path.push(this.toSnapshotNode(current));
      if (value === current.value) break;
      current = value < current.value ? current.left : current.right;
    }
    return path;
  }

  insert(value: number): BstInsertResult {
    if (!this.root) {
      this.root = this.createNode(value);
      return { node: this.toSnapshotNode(this.root), duplicate: false };
    }

    let current = this.root;
    while (true) {
      if (value === current.value) {
        current.count += 1;
        return { node: this.toSnapshotNode(current), duplicate: true };
      }
      if (value < current.value) {
        if (current.left) {
          current = current.left;
        } else {
          current.left = this.createNode(value);
          return { node: this.toSnapshotNode(current.left), duplicate: false };
        }
      } else if (current.right) {
        current = current.right;
      } else {
        current.right = this.createNode(value);
        return { node: this.toSnapshotNode(current.right), duplicate: false };
      }
    }
  }

  delete(value: number): BstDeleteResult {
    let parent: MutableBstNode | null = null;
    let current = this.root;
    while (current && current.value !== value) {
      parent = current;
      current = value < current.value ? current.left : current.right;
    }
    if (!current) return { removed: null, decremented: false, replacementId: null };

    const removed = this.toSnapshotNode(current);
    if (current.count > 1) {
      current.count -= 1;
      return { removed, decremented: true, replacementId: current.id };
    }

    if (!current.left || !current.right) {
      const replacement = current.left ?? current.right;
      this.replaceChild(parent, current, replacement);
      return { removed, decremented: false, replacementId: replacement?.id ?? null };
    }

    let successorParent = current;
    let successor = current.right;
    while (successor.left) {
      successorParent = successor;
      successor = successor.left;
    }

    if (successorParent !== current) {
      successorParent.left = successor.right;
      successor.right = current.right;
    }
    successor.left = current.left;
    this.replaceChild(parent, current, successor);
    return { removed, decremented: false, replacementId: successor.id };
  }

  traverse(order: TraversalOrder): readonly BstNodeSnapshot[] {
    const nodes: BstNodeSnapshot[] = [];
    const visit = (node: MutableBstNode | null) => {
      if (!node) return;
      if (order === 'preorder') nodes.push(this.toSnapshotNode(node));
      visit(node.left);
      if (order === 'inorder') nodes.push(this.toSnapshotNode(node));
      visit(node.right);
      if (order === 'postorder') nodes.push(this.toSnapshotNode(node));
    };
    visit(this.root);
    return nodes;
  }

  snapshot(): BstSnapshot {
    const nodes: BstNodeSnapshot[] = [];
    const collect = (node: MutableBstNode | null) => {
      if (!node) return;
      nodes.push(Object.freeze(this.toSnapshotNode(node)));
      collect(node.left);
      collect(node.right);
    };
    collect(this.root);
    return Object.freeze({
      rootId: this.root?.id ?? null,
      nodes: Object.freeze(nodes),
    });
  }

  clone(): BstModel {
    const cloneNode = (node: MutableBstNode | null): MutableBstNode | null =>
      node
        ? {
            id: node.id,
            value: node.value,
            count: node.count,
            left: cloneNode(node.left),
            right: cloneNode(node.right),
          }
        : null;
    return new BstModel(cloneNode(this.root), this.nextNodeNumber);
  }

  private createNode(value: number): MutableBstNode {
    const node = {
      id: `bst-${this.nextNodeNumber}`,
      value,
      count: 1,
      left: null,
      right: null,
    };
    this.nextNodeNumber += 1;
    return node;
  }

  private replaceChild(
    parent: MutableBstNode | null,
    target: MutableBstNode,
    replacement: MutableBstNode | null,
  ): void {
    if (!parent) {
      this.root = replacement;
    } else if (parent.left === target) {
      parent.left = replacement;
    } else {
      parent.right = replacement;
    }
  }

  private toSnapshotNode(node: MutableBstNode): BstNodeSnapshot {
    return {
      id: node.id,
      value: node.value,
      count: node.count,
      leftId: node.left?.id ?? null,
      rightId: node.right?.id ?? null,
    };
  }
}
