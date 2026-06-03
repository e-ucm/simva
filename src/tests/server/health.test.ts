import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '@/app';

describe('Health endpoint', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', db: { status: true } });
  });
});
