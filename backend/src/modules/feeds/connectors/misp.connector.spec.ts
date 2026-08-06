import { MispConnector } from './misp.connector';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MispConnector', () => {
  let connector: MispConnector;

  beforeEach(() => {
    jest.clearAllMocks();
    connector = new MispConnector('http://localhost:8443', 'test-api-key');
  });

  it('should return empty array if baseUrl or apiKey is missing', async () => {
    const emptyConnector = new MispConnector('', '');
    const result = await emptyConnector.fetchIndicators();
    expect(result).toEqual([]);
  });

  it('should fetch and map MISP attributes to RawIndicators', async () => {
    const mockAttributes = [
      {
        type: 'ip-src',
        value: '192.168.1.1',
        category: 'Network activity',
        comment: 'Suspicious IP',
        timestamp: 1600000000,
      },
    ];

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        response: {
          Attribute: mockAttributes,
        },
      },
    });

    const result = await connector.fetchIndicators();

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:8443/attributes/restSearch',
      { returnFormat: 'json', limit: 1000 },
      {
        headers: {
          Authorization: 'test-api-key',
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'ip-src',
      value: '192.168.1.1',
      category: 'Network activity',
      comment: 'Suspicious IP',
      tags: [],
      timestamp: new Date(1600000000 * 1000).toISOString(),
      rawData: mockAttributes[0],
    });
  });

  it('should handle errors gracefully', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));
    const result = await connector.fetchIndicators();
    expect(result).toEqual([]);
  });
});
