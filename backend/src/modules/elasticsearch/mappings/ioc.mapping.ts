export const IOC_INDEX_MAPPING = {
  properties: {
    value: { type: 'keyword' },
    type: { type: 'keyword' },
    feedId: { type: 'keyword' },
    confidenceScore: { type: 'integer' },
    threatSeverity: { type: 'keyword' },
    tags: { type: 'keyword' },
    firstSeenAt: { type: 'date' },
    lastSeenAt: { type: 'date' },
    stixData: { type: 'object', enabled: false }
  }
};
