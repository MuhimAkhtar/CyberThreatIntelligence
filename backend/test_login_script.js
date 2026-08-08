async function testLogin() {
  const res = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user.admin@nctip.gov',
      password: 'AdminPassword123!',
    }),
  });

  const data = await res.json();
  console.log('HTTP Status:', res.status);
  console.log('Response Body:', data);
  if (data.accessToken) {
    console.log('✅ AUTHENTICATION SUCCESSFUL! JWT ACCESS TOKEN ISSUED!');
  }
}

testLogin().catch(console.error);
