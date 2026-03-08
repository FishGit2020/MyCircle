import { describe, it, expect } from 'vitest';
import { Kind } from 'graphql';
import { JSONScalar } from '../../resolvers/shared.js';

describe('JSONScalar', () => {
  it('serialize returns the value as-is', () => {
    expect(JSONScalar.serialize({ a: 1 })).toEqual({ a: 1 });
    expect(JSONScalar.serialize('hello')).toBe('hello');
    expect(JSONScalar.serialize(42)).toBe(42);
    expect(JSONScalar.serialize(null)).toBeNull();
  });

  it('parseValue returns the value as-is', () => {
    expect(JSONScalar.parseValue({ b: 2 })).toEqual({ b: 2 });
    expect(JSONScalar.parseValue([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('parseLiteral handles STRING kind', () => {
    const result = JSONScalar.parseLiteral({ kind: Kind.STRING, value: 'hello' } as any, {});
    expect(result).toBe('hello');
  });

  it('parseLiteral handles INT kind', () => {
    const result = JSONScalar.parseLiteral({ kind: Kind.INT, value: '42' } as any, {});
    expect(result).toBe(42);
  });

  it('parseLiteral handles FLOAT kind', () => {
    const result = JSONScalar.parseLiteral({ kind: Kind.FLOAT, value: '3.14' } as any, {});
    expect(result).toBeCloseTo(3.14);
  });

  it('parseLiteral handles BOOLEAN kind', () => {
    const result = JSONScalar.parseLiteral({ kind: Kind.BOOLEAN, value: true } as any, {});
    expect(result).toBe(true);
  });

  it('parseLiteral handles NULL kind', () => {
    const result = JSONScalar.parseLiteral({ kind: Kind.NULL } as any, {});
    expect(result).toBeNull();
  });

  it('parseLiteral handles LIST kind', () => {
    const result = JSONScalar.parseLiteral(
      {
        kind: Kind.LIST,
        values: [
          { kind: Kind.INT, value: '1' },
          { kind: Kind.STRING, value: 'two' },
        ],
      } as any,
      {},
    );
    expect(result).toEqual([1, 'two']);
  });

  it('parseLiteral handles OBJECT kind', () => {
    const result = JSONScalar.parseLiteral(
      {
        kind: Kind.OBJECT,
        fields: [
          { name: { value: 'key' }, value: { kind: Kind.STRING, value: 'val' } },
          { name: { value: 'num' }, value: { kind: Kind.INT, value: '5' } },
        ],
      } as any,
      {},
    );
    expect(result).toEqual({ key: 'val', num: 5 });
  });
});
