import functionsFactory, { QueryTemplate } from '@/lib/functions';
import { Sequelize } from 'sequelize';

describe('functions.runViewQuery', () => {
  const mockSequelize = {
    query: jest.fn(async (sql: string, options: any) => [{ ok: true, sql, options }])
  } as unknown as Sequelize;

  const query: QueryTemplate = {
    sql: 'SELECT * FROM user_view WHERE role IN (:roles)',
    params: {
      roles: { type: 'array', of: 'string', required: true },
    },
  };

  it('calls sequelize.query with replacements', async () => {
    const functions = functionsFactory(mockSequelize);
    const res = await functions.runViewQuery(query, { roles: ['admin', 'teacher'] });
    expect(mockSequelize.query).toHaveBeenCalledWith(query.sql, {
      replacements: { roles: ['admin', 'teacher'] },
      type: 'SELECT',
    });
    expect((res[0] as any).ok).toBe(true);
  });

  it('throws on invalid params', async () => {
    const functions = functionsFactory(mockSequelize);
    await expect(functions.runViewQuery(query, { roles: [1, 2] } as any)).rejects.toThrow('roles array values must be string');
  });
});
