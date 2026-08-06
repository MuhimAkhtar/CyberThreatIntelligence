import { OtxConnector } from './otx.connector';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OtxConnector', () => {
  let connector: OtxConnector;

  beforeEach(() => {
    jest.clearAllMocks();
    connector = new OtxConnector('test-otx-key');
  });

  it('should return empty array if apiKey is missing', async () => {
    const emptyConnector = new OtxConnector('');
    const result = await emptyConnector.fetchIndicators();
    expect(result).toEqual([]);
  });

  it('should fetch and map OTX pulses to RawIndicators', async () => {
    const mockPulses = [
      {
        description: 'Test Pulse',
        tags: ['malware'],
        indicators: [
          {
            type: 'IPv4',
            indicator: '1.1.1.1',
            created: '2024-01-01T00:00:00Z',
          },
        ],
      },
    ];

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        results: mockPulses,
      },
    });

    const result = await connector.fetchIndicators();

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://otx.alienvault.com/api/v1/pulses/subscribed',
      {
        headers: {
          'X-OTX-API-KEY': 'test-otx-key',
        },
      },
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'IPv4',
      value: '1.1.1.1',
      comment: 'Test Pulse',
      tags: ['malware'],
      timestamp: '2024-01-01T00:00:00Z',
      rawData: mockPulses[0].indicators[0],
    });
  });

  it('should handle errors gracefully', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
    const result = await connector.fetchIndicators();
    expect(result).toEqual([]);
  });
});
