import { limesurveyWebhookHandler } from '@/lib/utils/limesurveyWebhook';
import { db } from '@/lib/db';
import KafkaClient from '@/lib/utils/kafkaclient';
import { User } from '@/lib/mappers/Users/User';

jest.mock('@/lib/db', () => ({
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

jest.mock('@/lib/mappers/activities/LimesurveyActivity', () => ({
  LimesurveyActivity: {
    getType: jest.fn(() => 'limesurvey'),
  },
}));

jest.mock('@/lib/utils/kafkaclient', () => {
  return jest.fn().mockImplementation(() => ({
    connectToProducer: jest.fn(),
    sendMessages: jest.fn(),
  }));
});

jest.mock('@/lib/mappers/Users/User', () => ({
  User: {
    getFromDbData: jest.fn(),
  },
}));

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