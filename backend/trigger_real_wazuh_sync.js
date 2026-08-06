async function main() {
  console.log('=== STREAMING SINGLE ALERT TO REAL WAZUH MANAGER 4.10.0 ===\n');

  // 1. Login
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cyber-platform.local', password: 'AdminPassword123!' }),
  });
  const { accessToken } = await loginRes.json();

  // 2. Test Connection
  const testRes = await fetch('http://localhost:3000/api/v1/siem/connectors/9a74a32f-b1a7-4ff0-a398-85169e84d393/test', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log('Live Connection Test Result:', await testRes.json());

  // 3. Forward Alert to Real Wazuh Manager
  const fwdRes = await fetch('http://localhost:3000/api/v1/siem/connectors/9a74a32f-b1a7-4ff0-a398-85169e84d393/forward', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ alertIds: [] }),
  });
  console.log('Live Alert Forwarding Result:', await fwdRes.json());
}

main().catch(console.error);
