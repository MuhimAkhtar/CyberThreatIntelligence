async function testVirusTotal() {
  console.log('=== TESTING LIVE VIRUSTOTAL INTEGRATION WITH USER API KEY ===\n');

  // 1. Login
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cyber-platform.local', password: 'AdminPassword123!' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  console.log('1. Logged in successfully as ADMIN. Token acquired.');

  // 2. Fetch existing case
  const casesRes = await fetch('http://localhost:3000/api/v1/cases', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const casesData = await casesRes.json();
  const caseId = casesData.data?.[0]?.id || 'e2ffff84-d5da-4545-a4b2-6141f9748555';

  // 3. Register EICAR Standard Test Malware Artifact
  const artifactRes = await fetch('http://localhost:3000/api/v1/forensics/artifacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      caseId,
      artifactType: 'MALWARE_BINARY',
      fileName: 'eicar_test_malware.com',
      sha256: '275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f', // EICAR Standard Test File
      description: 'EICAR Standard Test File detected in RAM dump',
    }),
  });
  const artifact = await artifactRes.json();
  console.log(`2. Registered EICAR Artifact. Raw response:`, JSON.stringify(artifact));

  const artifactId = artifact.id;

  // 4. Trigger VirusTotal v3 Live Lookup
  console.log(`\n3. Querying VirusTotal v3 API for artifact ID ${artifactId}...`);
  const vtRes = await fetch(`http://localhost:3000/api/v1/forensics/artifacts/${artifactId}/vt-lookup`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const vtData = await vtRes.json();
  console.log('\n=== LIVE VIRUSTOTAL RESPONSE RETURNED FROM VIRUSTOTAL API v3 ===');
  console.log(JSON.stringify(vtData, null, 2));
}

testVirusTotal().catch(console.error);
