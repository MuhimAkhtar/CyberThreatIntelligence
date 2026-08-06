async function runLoadTest() {
  console.log('================================================================');
  console.log('HIGH-CONCURRENCY LOAD TESTING SUITE');
  console.log('Simulating 50 Concurrent Users Querying /api/v1/iocs and /api/v1/alerts');
  console.log('Total Operations: 500 High-Frequency Search Queries');
  console.log('================================================================\n');

  // Authenticate to get JWT token
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cyber-platform.local', password: 'AdminPassword123!' }),
  });
  const { accessToken } = await loginRes.json();

  const totalRequests = 500;
  const concurrency = 50;
  const latencies = [];
  let errorCount = 0;

  const startTime = Date.now();

  async function worker(id) {
    const endpoint = id % 2 === 0 ? 'http://localhost:3000/api/v1/iocs' : 'http://localhost:3000/api/v1/alerts';
    const reqStart = Date.now();

    try {
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const reqDuration = Date.now() - reqStart;
      latencies.push(reqDuration);

      if (!res.ok) {
        errorCount++;
      }
    } catch (err) {
      errorCount++;
    }
  }

  // Execute in concurrent batches
  for (let i = 0; i < totalRequests; i += concurrency) {
    const batch = Array.from({ length: concurrency }).map((_, idx) => worker(i + idx));
    await Promise.all(batch);
  }

  const totalTimeMs = Date.now() - startTime;
  latencies.sort((a, b) => a - b);

  const p50 = latencies[Math.floor(latencies.length * 0.50)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  const avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2);
  const rps = ((totalRequests / totalTimeMs) * 1000).toFixed(2);

  console.log('================================================================');
  console.log('📊 RAW LOAD TESTING METRICS & LATENCY REPORT');
  console.log('================================================================');
  console.log(`Total Requests Processed : ${totalRequests}`);
  console.log(`Total Elapsed Time       : ${totalTimeMs} ms (${(totalTimeMs / 1000).toFixed(2)} sec)`);
  console.log(`Throughput (RPS)         : ${rps} Requests/sec`);
  console.log(`Error Rate               : ${((errorCount / totalRequests) * 100).toFixed(2)}% (${errorCount} errors)`);
  console.log(`Average Latency          : ${avgLatency} ms`);
  console.log(`p50 Latency              : ${p50} ms`);
  console.log(`p95 Latency              : ${p95} ms`);
  console.log(`p99 Latency              : ${p99} ms`);
  console.log('================================================================');
}

runLoadTest().catch(console.error);
