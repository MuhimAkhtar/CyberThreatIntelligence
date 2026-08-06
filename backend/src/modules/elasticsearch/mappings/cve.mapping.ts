export const CVE_INDEX_MAPPING = {
  properties: {
    cveId: { type: 'keyword' },
    description: { type: 'text' },
    cvssV2Score: { type: 'float' },
    cvssV3Score: { type: 'float' },
    severity: { type: 'keyword' },
    publishedAt: { type: 'date' },
    modifiedAt: { type: 'date' }
  }
};
