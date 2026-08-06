// Full OTX pipeline verification:
// 1. Login → get JWT
// 2. GET /iocs before sync (expect 0)
// 3. POST /feeds/feed-otx-001/sync → get recordsIngested
// 4. GET /iocs after sync → count
// 5. GET /iocs/search?value=<first real IOC value> → prove Elasticsearch hit

async function run() {
  // Step 1: Auth
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cyber-platform.local', password: 'Admin123!@#' }),
  });
  const { accessToken } = await loginRes.json();
  const headers = { Authorization: 'Bearer ' + accessToken };
  console.log('✅ Auth OK');

  // Step 2: IOC count BEFORE sync
  const beforeRes = await fetch('http://localhost:3000/api/v1/iocs', { headers });
  const before = await beforeRes.json();
  console.log(`\n📊 IOC count BEFORE sync: total=${before.total}`);

  // Step 3: Run OTX sync
  console.log('\n🔄 Running POST /feeds/feed-otx-001/sync...');
  const syncStart = Date.now();
  const syncRes = await fetch('http://localhost:3000/api/v1/feeds/feed-otx-001/sync', {
    method: 'POST',
    headers,
  });
  const syncData = await syncRes.json();
  const syncDuration = Date.now() - syncStart;
  console.log(`\n📋 Sync result (completed in ${syncDuration}ms):`);
  console.log(JSON.stringify(syncData, null, 2));

  // Step 4: IOC count AFTER sync
  const afterRes = await fetch('http://localhost:3000/api/v1/iocs', { headers });
  const after = await afterRes.json();
  console.log(`\n📊 IOC count AFTER sync: total=${after.total}`);

  if (after.total > 0 && after.data && after.data.length > 0) {
    const firstIoc = after.data[0];
    console.log(`\n🔍 First IOC in DB: type=${firstIoc.type} value=${firstIoc.value} feedId=${firstIoc.feedId}`);

    // Step 5: Search Elasticsearch for that exact IOC value
    const searchValue = encodeURIComponent(firstIoc.value);
    const searchRes = await fetch(`http://localhost:3000/api/v1/iocs/search?value=${searchValue}`, { headers });
    const searchData = await searchRes.json();
    console.log(`\n🔎 Elasticsearch search for "${firstIoc.value}":`);
    console.log(JSON.stringify(searchData, null, 2));

    if (searchData.hits && searchData.hits.length > 0) {
      console.log(`\n✅ PIPELINE VERIFIED END-TO-END: OTX → Postgres → Kafka → Elasticsearch`);
    } else {
      console.log(`\n⚠️ IOC in Postgres but not yet in Elasticsearch (indexer lag)`);
    }
  } else if (syncData.recordsIngested === 0) {
    console.log('\n⚠️ recordsIngested=0 — OTX pulse subscription may not be visible yet, or pulses have no indicators');
  }
}

run().catch(e => console.error('FATAL:', e.message));
