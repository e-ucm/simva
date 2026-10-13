import { jest, beforeAll, describe, expect, it } from '@jest/globals';

jest.unstable_mockModule('@/lib/db', () => ({
  db: {
    Functions: {
      runViewQuery: jest.fn(),
    },
    Views: {
      Activity: {
        bySurveyId: {
          sql: 'SELECT * FROM v_activities_by_survey_id WHERE survey_id = :survey_id',
          params: {
            survey_id: {
              type: 'number',
              required: true,
            },
          },
        },
      },
    },
  },
}));

jest.unstable_mockModule('@/lib/mappers/activities/LimesurveyActivity', () => ({
  LimesurveyActivity: {
    getType: jest.fn(() => 'limesurvey'),
  },
}));

jest.unstable_mockModule('@/lib/utils/kafkaclient', () => {
  const MockKafkaClient = jest.fn().mockImplementation(() => ({
    connectToProducer: jest.fn(),
    sendMessages: jest.fn(),
  }));
  return { default: MockKafkaClient };
});

jest.unstable_mockModule('@/lib/mappers/Users/User', () => ({
  User: {
    getFromDbData: jest.fn(),
  },
}));

let limesurveyWebhookHandler: typeof import('@/lib/utils/limesurveyWebhook')['limesurveyWebhookHandler'];
let db: any;
let User: jest.Mocked<typeof import('@/lib/mappers/Users/User')['User']>;

beforeAll(async () => {
  db = (await import('@/lib/db')).db;
  User = (await import('@/lib/mappers/Users/User')).User as jest.Mocked<typeof import('@/lib/mappers/Users/User')['User']>;
  limesurveyWebhookHandler = (await import('@/lib/utils/limesurveyWebhook')).limesurveyWebhookHandler;
});

describe('limesurveyWebhookHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the survey view query for LimeSurvey webhooks', async () => {
    (db.Functions.runViewQuery as jest.Mock).mockResolvedValue([]);

    const req: any = {
      body: {
        event: 'beforeSurveyPage',
        event_details: {
          surveyId: 612773,
          lang: 'es',
          token: 'hljx',
        },
      },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await limesurveyWebhookHandler(req, res);

    expect(db.Functions.runViewQuery).toHaveBeenCalledWith(
      db.Views.Activity.bySurveyId,
      { survey_id: 612773 }
    );
    expect(User.getFromDbData).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ message: 'Message treated' });
  });
});