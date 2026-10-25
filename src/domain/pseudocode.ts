export type PseudocodeLineId = `${string}.${string}`;

export interface PseudocodeLine {
  readonly id: PseudocodeLineId;
  readonly text: string;
  readonly indent: number;
}

export interface PseudocodeDefinition {
  readonly title: string;
  readonly lines: readonly PseudocodeLine[];
}

/** Semantic keys survive changes to display order and wording. */
export function definePseudocode(
  title: string,
  lines: readonly (readonly [PseudocodeLineId, string, number?])[],
): PseudocodeDefinition {
  const ids = new Set(lines.map(([id]) => id));
  if (ids.size !== lines.length) throw new Error(`Duplicate pseudocode line in ${title}`);
  return Object.freeze({
    title,
    lines: Object.freeze(
      lines.map(([id, text, indent = 0]) => Object.freeze({ id, text, indent })),
    ),
  });
}
