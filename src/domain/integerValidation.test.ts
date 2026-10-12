import { describe, expect, it } from 'vitest';
import { parseIntegerInput } from './integerValidation';

describe('parseIntegerInput', () => {
  it.each([
    ['21', 21],
    ['-8', -8],
    ['+7', 7],
    ['  42  ', 42],
    ['-0', 0],
    ['9007199254740991', Number.MAX_SAFE_INTEGER],
  ])('accepts %s as %d', (input, expected) => {
    expect(parseIntegerInput(input)).toEqual({ ok: true, value: expected });
  });

  it('asks for a value when the field is empty', () => {
    expect(parseIntegerInput('   ').message).toContain('Enter an integer');
  });

  it.each(['2.5', 'word', '1e3', '0x10', '12abc', '--4', 'Infinity', '٣'])(
    'rejects %s as not a plain integer',
    (input) => {
      const result = parseIntegerInput(input);
      expect(result.ok).toBe(false);
      expect(result.message).toContain('digits only');
    },
  );

  it('rejects integers outside the safe range', () => {
    const result = parseIntegerInput('9007199254740992');
    expect(result.ok).toBe(false);
    expect(result.message).toContain('safe integer range');
  });
});
