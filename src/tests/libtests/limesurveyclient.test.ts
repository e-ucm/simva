import axios from 'axios';
import { LimeSurveyClient } from '@/lib/utils/limesurveyclient';

jest.mock('axios', () => jest.fn());

const mockedAxios = axios as unknown as jest.Mock;

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