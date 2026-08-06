async function main() {
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cyber-platform.local', password: 'AdminPassword123!' }),
  });
  const { accessToken } = await loginRes.json();

  const testRes = await fetch('http://localhost:3000/api/v1/siem/connectors/77777777-8888-9999-aaaa-bbbbccccdddd/test', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  console.log('=== LIVE SPLUNK HEC TEST RESPONSE ===');
  console.log(await testRes.json());

  const fwdRes = await fetch('http://localhost:3000/api/v1/siem/connectors/77777777-8888-9999-aaaa-bbbbccccdddd/forward', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ alertIds: [] })
  });
  console.log('=== LIVE SPLUNK HEC ALERT FORWARD RESPONSE ===');
  console.log(await fwdRes.json());
}

main().catch(console.error);
