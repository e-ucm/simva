import { describe, it, expect } from '@jest/globals';
import validateParams, { ParamSchema } from '@/lib/validateParams';

describe('validateParams', () => {
  it('fills defaults and enforces required', () => {
    const schema: ParamSchema = {
      limit: { type: 'number', required: false, default: 10 },
      q: { type: 'string', required: true },
    };
    const params: Record<string, any> = { };
    expect(() => validateParams(schema, params)).toThrow('Missing required parameter: q');

    const okParams: Record<string, any> = { q: 'test' };
    validateParams(schema, okParams);
    expect(okParams.limit).toBe(10);
    expect(okParams.q).toBe('test');
  });

  it('validates array element types', () => {
    const schema: ParamSchema = {
      roles: { type: 'array', of: 'string', required: true },
    };
    const bad: Record<string, any> = { roles: [1, 2] };
    expect(() => validateParams(schema, bad)).toThrow('roles array values must be string');

    const good: Record<string, any> = { roles: ['a', 'b'] };
    expect(() => validateParams(schema, good)).not.toThrow();
  });
});
