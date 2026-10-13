import { jest, beforeAll, describe, expect, it } from '@jest/globals';

jest.unstable_mockModule('axios', () => ({ default: jest.fn() }));

let LimeSurveyClient: typeof import('@/lib/utils/limesurveyclient')['LimeSurveyClient'];
let mockedAxios: jest.Mock;

beforeAll(async () => {
  mockedAxios = (await import('axios')).default as unknown as jest.Mock;
  LimeSurveyClient = (await import('@/lib/utils/limesurveyclient')).LimeSurveyClient;
});

describe('LimeSurveyClient survey date normalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('converts LimeSurvey date strings to ISO format and keeps nullable dates null', async () => {
    mockedAxios.mockResolvedValueOnce({
      data: {
        result: 'session-key'
      }
    });

    mockedAxios.mockResolvedValueOnce({
      data: {
        result: [
          {
            sid: 123,
            gsid: 1,
            surveyls_title: 'Test Survey',
            startdate: '2026-05-13 12:20:28',
            expires: null,
            active: 'Y'
          }
        ]
      }
    });

    const client = new LimeSurveyClient({
      url: 'http://example.test',
      username: 'user',
      password: 'pass',
      debug: false
    });

    const surveys = await client.getSurveyList();

    expect(surveys).toHaveLength(1);
    expect(surveys[0].startdate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(surveys[0].expires).toBeNull();
    expect(mockedAxios).toHaveBeenCalledTimes(2);
  });
});