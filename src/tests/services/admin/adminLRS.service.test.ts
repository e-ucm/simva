import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { getStatements, getMoreStatements, sendStatements } from '@/services/admin/adminLRS.service';
import { lrsclient } from '@/lib/utils/LRSclient';
import { NotImplementedError } from '@/lib/errors/appErrors';

// Mock the LRS client to avoid pulling in the tracker dependencies
jest.mock('@/lib/utils/LRSclient', () => {
  const client = {
    getStatementByQuery: jest.fn(),
    getMoreStatements: jest.fn(),
  };
  return {
    lrsclient: {
      isEnabled: jest.fn(() => true),
      normalizeStatementsQuery: jest.fn((query: any) => {
        if (!query || typeof query !== 'object') {
          return query;
        }
        const agent = query.agent ?? query.actor;
        delete query.actor;
        if (agent === undefined || agent === null || agent === '') {
          delete query.agent;
          return query;
        }
        if (typeof agent === 'string') {
          try {
            query.agent = JSON.parse(agent);
          } catch {
            delete query.agent;
          }
        } else {
          query.agent = agent;
        }
        return query;
      }),
      getLRSClient: jest.fn(() => Promise.resolve(client)),
      sendStatements: jest.fn(),
    }
  };
});

const mockIsEnabled = lrsclient.isEnabled as jest.Mock;
const mockGetLRSClient = lrsclient.getLRSClient as jest.Mock;
const mockSendStatements = lrsclient.sendStatements as jest.Mock;

async function getMockClient(): Promise<{ getStatementByQuery: jest.Mock; getMoreStatements: jest.Mock }> {
  return (await lrsclient.getLRSClient()) as unknown as { getStatementByQuery: jest.Mock; getMoreStatements: jest.Mock };
}

describe('Admin LRS Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsEnabled.mockReturnValue(true);
    mockGetLRSClient.mockClear();
    mockSendStatements.mockReset();
  });

  describe('getStatements', () => {
    it('queries the LRS without injecting scope filters', async () => {
      const client = await getMockClient();
      const lrsResponse = { statements: [{ id: '1', verb: 'completed' }], more: '' };
      client.getStatementByQuery.mockResolvedValue(lrsResponse);

      const result = await getStatements({ verb: 'completed', limit: '10' });

      expect(result).toEqual(lrsResponse);
      expect(client.getStatementByQuery).toHaveBeenCalledTimes(1);
      const passedQuery = client.getStatementByQuery.mock.calls[0][0];
      expect(passedQuery).toMatchObject({ verb: 'completed', limit: '10' });
      expect(passedQuery.activity).toBeUndefined();
      expect(passedQuery.related_activities).toBeUndefined();
      expect(passedQuery.ascending).toBeUndefined();
    });

    it('parses the agent filter into an object before querying the LRS', async () => {
      const client = await getMockClient();
      client.getStatementByQuery.mockResolvedValue({ statements: [], more: '' });

      const query = { agent: JSON.stringify({ account: { name: 'julio', homePage: 'https://eh' } }) };
      await getStatements(query);

      const passedQuery = client.getStatementByQuery.mock.calls[0][0];
      expect(passedQuery.agent).toEqual({ account: { name: 'julio', homePage: 'https://eh' } });
    });

    it('renames the xAPI 1.0.3 actor filter to agent', async () => {
      const client = await getMockClient();
      client.getStatementByQuery.mockResolvedValue({ statements: [], more: '' });

      const query = { actor: { account: { name: 'julio', homePage: 'https://eh' } } };
      await getStatements(query);

      const passedQuery = client.getStatementByQuery.mock.calls[0][0];
      expect(passedQuery.agent).toEqual({ account: { name: 'julio', homePage: 'https://eh' } });
      expect(passedQuery.actor).toBeUndefined();
    });

    it('forwards the more URL to getMoreStatements when provided', async () => {
      const client = await getMockClient();
      const lrsResponse = { statements: [{ id: '2' }], more: '' };
      client.getMoreStatements.mockResolvedValue(lrsResponse);

      const result = await getStatements({ more: 'https://lrs.example/xapi/statements/more/abc' });

      expect(result).toEqual(lrsResponse);
      expect(client.getMoreStatements).toHaveBeenCalledWith('https://lrs.example/xapi/statements/more/abc');
      expect(client.getStatementByQuery).not.toHaveBeenCalled();
    });

    it('throws a NotImplementedError when the LRS integration is not configured', async () => {
      mockIsEnabled.mockReturnValue(false);

      await expect(getStatements({ verb: 'completed' })).rejects.toBeInstanceOf(NotImplementedError);
      expect(mockGetLRSClient).not.toHaveBeenCalled();
    });
  });

  describe('getMoreStatements', () => {
    it('fetches the next batch of statements using the more URL', async () => {
      const client = await getMockClient();
      const lrsResponse = { statements: [{ id: '3' }], more: '' };
      client.getMoreStatements.mockResolvedValue(lrsResponse);

      const result = await getMoreStatements('https://lrs.example/xapi/statements/more/def');

      expect(result).toEqual(lrsResponse);
      expect(client.getMoreStatements).toHaveBeenCalledWith('https://lrs.example/xapi/statements/more/def');
    });

    it('throws a NotImplementedError when the LRS integration is not configured', async () => {
      mockIsEnabled.mockReturnValue(false);

      await expect(getMoreStatements('https://lrs.example/xapi/statements/more/def')).rejects.toBeInstanceOf(NotImplementedError);
      expect(mockGetLRSClient).not.toHaveBeenCalled();
    });
  });

  describe('sendStatements', () => {
    it('forwards the statements to the LRS client', async () => {
      const statements = [{ id: '1', actor: {}, verb: {}, object: {} }];
      mockSendStatements.mockResolvedValue(['1']);

      const result = await sendStatements(statements);

      expect(result).toEqual(['1']);
      expect(mockSendStatements).toHaveBeenCalledWith(statements);
    });

    it('throws a NotImplementedError when the LRS integration is not configured', async () => {
      mockIsEnabled.mockReturnValue(false);

      await expect(sendStatements([{ id: '1' }])).rejects.toBeInstanceOf(NotImplementedError);
      expect(mockSendStatements).not.toHaveBeenCalled();
    });
  });
});