import { CustomJsonConnector } from './custom-json.connector';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CustomJsonConnector', () => {
  it('should fetch and parse custom JSON feed items', async () => {
    const mockData = {
      data: {
        indicators: [
          { indicatorType: 'ip', indicatorValue: '8.8.8.8' },
          { indicatorType: 'domain', indicatorValue: 'example.com' },
        ],
      },
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockData });

    const connector = new CustomJsonConnector(
      'https://custom-feed.local/json',
      { Authorization: 'Bearer token' },
      { itemsPath: 'data.indicators', typeField: 'indicatorType', valueField: 'indicatorValue' },
    );

    const result = await connector.fetchIndicators();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      type: 'ip',
      value: '8.8.8.8',
      rawData: mockData.data.indicators[0],
    });
  });

  it('should handle invalid items array', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { notArray: true } });

    const connector = new CustomJsonConnector(
      'https://custom-feed.local/json',
      {},
      { itemsPath: 'data.indicators', typeField: 'type', valueField: 'value' },
    );

    const result = await connector.fetchIndicators();
    expect(result).toEqual([]);
  });
});
