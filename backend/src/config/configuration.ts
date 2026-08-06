export default () => ({
  port: parseInt(process.env.API_PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'CHANGE_ME',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  },
  nvd: {
    apiKey: process.env.NVD_API_KEY || '',
    baseUrl: 'https://services.nvd.nist.gov/rest/json/cves/2.0',
  },
  misp: {
    baseUrl: process.env.MISP_BASE_URL || '',
    apiKey: process.env.MISP_API_KEY || '',
  },
  otx: {
    apiKey: process.env.OTX_API_KEY || '',
    baseUrl: 'https://otx.alienvault.com/api/v1',
  },
  feeds: {
    syncEnabled: process.env.FEED_SYNC_ENABLED === 'true',
  },
});
