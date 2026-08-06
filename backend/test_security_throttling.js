async function main() {
  console.log('================================================================');
  console.log('TESTING ZERO-DELAY ASYNCHRONOUS RATE LIMITING (THROTTLING)');
  console.log('Sending 35 Rapid-Fire Concurrent Requests via Promise.all()...');
  console.log('Target: POST http://localhost:3000/api/v1/siem/webhook/ingest (Limit: 30 req/min)');
  console.log('================================================================\n');

  const requests = Array.from({ length: 35 }).map((_, index) =>
    fetch('http://localhost:3000/api/v1/siem/webhook/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Rapid Fire Test Alert ${index + 1}`,
        description: 'Testing rate limiting throttling',
        severity: 'LOW',
        sourceId: 'TEST_RATE_LIMITER',
        sourceType: 'INGEST_TEST',
      }),
    }).then(async res => ({
      index: index + 1,
      status: res.status,
      statusText: res.statusText,
      body: await res.json().catch(() => null),
    }))
  );

  const results = await Promise.all(requests);

  let successCount = 0;
  let throttledCount = 0;

  results.forEach(r => {
    if (r.status === 201 || r.status === 200) {
      successCount++;
    } else if (r.status === 429) {
      throttledCount++;
      console.log(`[REQ #${r.index}] 🛑 HTTP 429 TOO MANY REQUESTS: ${JSON.stringify(r.body)}`);
    } else {
      console.log(`[REQ #${r.index}] HTTP ${r.status}:`, r.body);
    }
  });

  console.log('\n================================================================');
  console.log(`Total Requests Sent: ${results.length}`);
  console.log(`Successful Requests: ${successCount}`);
  console.log(`Throttled (HTTP 429): ${throttledCount}`);
  console.log('================================================================');
}

main().catch(console.error);
