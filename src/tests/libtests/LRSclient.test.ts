import { LRSClient } from '@/lib/utils/LRSclient';

// Mock the config so the urls the client builds are predictable. kafka is needed because
// importing LRSclient imports kafkaclient, which builds a client from config.kafka on import.
jest.mock('@/lib/config', () => ({
  config: {
    debug: false,
    externalUrl: 'https://simva.example',
    bloomFilterBackupPath: '/tmp',
    bloomFilterBackupFile: 'lrsclient-test.bloom.json',
    kafka: {
      clientId: 'simva-test',
      brokers: ['localhost:9092'],
      groupId: 'simva-test-group',
      topic: 'traces'
    },
    lrs: {
      enabled: false
    }
  }
}));

// kafkaclient opens no connection on import, but it is stubbed so the test never depends on kafka
jest.mock('@/lib/utils/kafkaclient', () => ({
  kafkaClient: {
    sendMessages: jest.fn()
  },
  default: class { /* not used by these tests */ }
}));

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// The js-tracker classes are only used as types and instantiated on login, so a stub is enough
jest.mock('js-tracker', () => ({
  LRSTracker: class {
    STATEMENT_BUILDER_IDS = {
      CONTEXT: {
        ACTIVITIES: {
          PARENT: 'parent',
          GROUPING: 'grouping',
          CATEGORY: 'category'
        }
      }
    };
    async login() { /* not used by these tests */ }
    start() { /* not used by these tests */ }
    async flush() { /* not used by these tests */ }
  },
  JSScormTracker: class { /* not used by these tests */ }
}));

const EXTERNAL_URL = 'https://simva.example';
const PARENT = 'parent';
const GROUPING = 'grouping';

/**
 * Statement builder that mimics the js-tracker one, including the way it appends a relation to
 * contextActivities without checking that it is an object: on an array the relation is attached as a
 * string key and lost by any serialization, which is the defect being guarded against.
 */
class FakeStatementBuilder {
  statement: any;

  constructor(statement: any) {
    this.statement = statement;
  }

  withId(id: string) { this.statement.id = id; return this; }
  withVersion(version: string) { this.statement.version = version; return this; }
  withPlatform(platform: string) { this.statement.platform = platform; return this; }
  withAutorityAccount(name: string, homePage: string) { this.statement.authority = { name, homePage }; return this; }
  withStored(stored: Date) { this.statement.stored = stored; return this; }

  withContextActivity(relation: string, id: string) {
    const contextActivities = this.statement.context.contextActivities;
    if (!contextActivities[relation]) {
      contextActivities[relation] = [];
    }
    contextActivities[relation].push({ id });
    return this;
  }
}

/**
 * Builds a builder over a statement carrying the given contextActivities
 */
function builderWith(contextActivities?: any, extra: any = {}) {
  const statement = {
    actor: { name: 'bob' },
    verb: { id: 'http://adlnet.gov/expapi/verbs/completed' },
    object: { id: `${EXTERNAL_URL}/activities/3` },
    context: {
      registration: '18c01bd5-a384-42ad-a96a-9572d4674b87',
      // js-tracker's ContextStatement always initializes contextActivities to an object
      contextActivities: {}
    },
    ...extra
  };
  if (contextActivities !== undefined) {
    (statement.context as any).contextActivities = contextActivities;
  }
  return new FakeStatementBuilder(statement);
}

describe('LRSClient.updateMissingTraceElements', () => {
  let client: LRSClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new LRSClient();
    (client as any).lrs = { STATEMENT_BUILDER_IDS: { CONTEXT: { ACTIVITIES: { PARENT, GROUPING, CATEGORY: 'category' } } } };
  });

  describe('context activities', () => {
    // Clients send these unvalidated; none of them may lose the activities added by the client
    const malformed: Record<string, { value: any; seeded: number }> = {
      'an array': { value: [], seeded: 0 },
      'an array of objects': { value: [{ id: `${EXTERNAL_URL}/old` }], seeded: 0 },
      'a single object per relation': { value: { parent: { id: `${EXTERNAL_URL}/old` } }, seeded: 1 },
      'an array per relation': { value: { parent: [{ id: `${EXTERNAL_URL}/old` }] }, seeded: 1 },
      'a string per relation': { value: { parent: 'nonsense' }, seeded: 0 },
      'a null relation': { value: { parent: null }, seeded: 0 },
      'a string instead of an object': { value: 'nonsense', seeded: 0 }
    };

    Object.keys(malformed).forEach(label => {
      it(`keeps the activities when the client sends ${label}`, () => {
        const { value, seeded } = malformed[label];
        const builder = client.updateMissingTraceElements(builderWith(value), 'bob', 1, 2, 3);

        const contextActivities = builder.statement.context.contextActivities;
        expect(Array.isArray(contextActivities)).toBe(false);
        expect(contextActivities).toHaveProperty(PARENT);
        expect(contextActivities).toHaveProperty(GROUPING);
        expect(contextActivities[PARENT]).toHaveLength(seeded + 1);
        expect(contextActivities[GROUPING]).toHaveLength(3);
      });
    });

    it('adds the parent and the groupings of an activity of a session', () => {
      const builder = client.updateMissingTraceElements(builderWith(), 'bob', 1, 2, 3);
      const contextActivities = builder.statement.context.contextActivities;

      expect(contextActivities[PARENT].map((a: any) => a.id)).toEqual([`${EXTERNAL_URL}/activities/3`]);
      expect(contextActivities[GROUPING].map((a: any) => a.id)).toEqual([
        `${EXTERNAL_URL}/simlets/1/sessions/2/activities/3`,
        `${EXTERNAL_URL}/simlets/1/sessions/2`,
        `${EXTERNAL_URL}/simlets/1`
      ]);
    });

    it('adds the parent and the groupings of a session without an activity', () => {
      const builder = client.updateMissingTraceElements(builderWith(), 'bob', 1, 2);
      const contextActivities = builder.statement.context.contextActivities;

      expect(contextActivities[PARENT].map((a: any) => a.id)).toEqual([`${EXTERNAL_URL}/simlets/1`]);
      expect(contextActivities[GROUPING].map((a: any) => a.id)).toEqual([
        `${EXTERNAL_URL}/simlets/1/sessions/2`,
        `${EXTERNAL_URL}/simlets/1`
      ]);
    });

    it('falls back to the admin activities without a simlet and a session', () => {
      const builder = client.updateMissingTraceElements(builderWith(), 'bob');
      const contextActivities = builder.statement.context.contextActivities;

      expect(contextActivities[PARENT].map((a: any) => a.id)).toEqual([`${EXTERNAL_URL}/admin`]);
      expect(contextActivities[GROUPING].map((a: any) => a.id)).toEqual([`${EXTERNAL_URL}/admin`]);
    });

    it('does not duplicate the activities the client already sent', () => {
      const builder = builderWith({
        parent: [{ id: `${EXTERNAL_URL}/activities/3` }],
        grouping: [{ id: `${EXTERNAL_URL}/simlets/1/sessions/2/activities/3` }]
      });
      const updated = client.updateMissingTraceElements(builder, 'bob', 1, 2, 3);
      const contextActivities = updated.statement.context.contextActivities;

      expect(contextActivities[PARENT]).toHaveLength(1);
      expect(contextActivities[GROUPING]).toHaveLength(3);
    });

    it('builds the urls of the test environment when asked to', () => {
      const builder = client.updateMissingTraceElements(builderWith(), 'bob', 1, 2, 3, true);
      const contextActivities = builder.statement.context.contextActivities;

      expect(contextActivities[PARENT][0].id).toEqual(`${EXTERNAL_URL}/test/activities/3`);
      expect(contextActivities[GROUPING][0].id).toEqual(`${EXTERNAL_URL}/test/simlets/1/sessions/2/activities/3`);
    });
  });

  describe('statement elements', () => {
    it('keeps the id the statement already has', () => {
      const builder = client.updateMissingTraceElements(builderWith(undefined, { id: 'client-supplied-id' }), 'bob');

      expect(builder.statement.id).toEqual('client-supplied-id');
    });

    it('keeps the version the statement already has', () => {
      const builder = client.updateMissingTraceElements(builderWith(undefined, { version: '1.0.2' }), 'bob');

      expect(builder.statement.version).toEqual('1.0.2');
    });

    it('completes the elements the statement does not have', () => {
      const builder = client.updateMissingTraceElements(builderWith(), 'bob');

      expect(builder.statement.id).toBeTruthy();
      expect(builder.statement.version).toEqual('1.0.3');
      expect(builder.statement.platform).toEqual(EXTERNAL_URL);
      expect(builder.statement.authority).toEqual({ name: 'bob', homePage: EXTERNAL_URL });
      expect(builder.statement.stored).toBeInstanceOf(Date);
    });

    it('falls back to the lrs manager as the authority without a participant', () => {
      const builder = client.updateMissingTraceElements(builderWith());

      expect(builder.statement.authority.name).toEqual('mylrsmanager');
    });
  });
});

describe('LRSClient.normalizeContextActivities', () => {
  let client: LRSClient;

  beforeEach(() => {
    client = new LRSClient();
  });

  it('turns malformed values into an object keyed by relation', () => {
    expect(client.normalizeContextActivities([])).toEqual({});
    expect(client.normalizeContextActivities([{ id: 'a' }])).toEqual({});
    expect(client.normalizeContextActivities('nonsense')).toEqual({});
    expect(client.normalizeContextActivities(null)).toEqual({});
    expect(client.normalizeContextActivities(undefined)).toEqual({});
    expect(client.normalizeContextActivities({ parent: null })).toEqual({});
    expect(client.normalizeContextActivities({ parent: 'nonsense' })).toEqual({});
    expect(client.normalizeContextActivities({ parent: 7 })).toEqual({});
  });

  it('wraps a single object into an array', () => {
    expect(client.normalizeContextActivities({ parent: { id: 'a' } })).toEqual({ parent: [{ id: 'a' }] });
  });

  it('keeps the relations already expressed as arrays', () => {
    const input = { parent: [{ id: 'a' }], grouping: [{ id: 'b' }, { id: 'c' }] };

    expect(client.normalizeContextActivities(input)).toEqual(input);
  });
});