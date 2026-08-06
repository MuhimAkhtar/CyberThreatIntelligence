async function main() {
  console.log('=== TESTING REAL BREVO REST API & SMTP EMAIL NOTIFICATION SYSTEM ===\n');

  const apiKey = process.env.BREVO_API_KEY || 'xsmtpsib-placeholder-key';

  console.log('1. Dispatching Live Critical SOC Alert via Brevo REST API v3...');
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'National Cyber Threat Intelligence Platform', email: 'muhimakhtar4@gmail.com' },
      to: [{ email: 'muhimakhtar4@gmail.com', name: 'Muheem Akhtar' }],
      subject: '🚨 CRITICAL SOC ALERT: Active APT29 Exfiltration & C2 Incident',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 25px; background-color: #0f172a; color: #f8fafc; border-radius: 10px;">
          <h2 style="color: #ef4444; margin-top: 0;">🚨 National Cyber Threat Intelligence Platform</h2>
          <p style="font-size: 16px;">A critical security incident was processed by <strong>Kimi 3 AI (Modal Cloud)</strong>:</p>
          <ul style="line-height: 1.8;">
            <li><strong>Incident Title</strong>: APT29 Exfiltration & C2 Investigation</li>
            <li><strong>Risk Score</strong>: <span style="color: #ef4444; font-weight: bold; background: #450a0a; padding: 2px 8px; border-radius: 4px;">92 / 100 (CRITICAL)</span></li>
            <li><strong>MITRE ATT&CK Techniques</strong>: T1595, T1059, T1071, T1003</li>
            <li><strong>SIEM Connectors Forwarded</strong>: Real Wazuh Manager 4.10.0 & Real Splunk Enterprise HEC</li>
            <li><strong>VirusTotal Scan Result</strong>: EICAR Malware Sample (65/67 Detections)</li>
          </ul>
          <hr style="border: 1px solid #334155; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 14px;">Automated Security Alert dispatched via Brevo Live SMTP System</p>
        </div>
      `,
    }),
  });

  const responseText = await res.text();
  console.log('HTTP Status Code:', res.status);
  console.log('Response Body:', responseText);

  if (res.status >= 200 && res.status < 300) {
    console.log('\n✅ BREVO LIVE SMTP EMAIL SENT SUCCESSFULLY!');
  } else {
    console.log('\n❌ BREVO API RETURNED ERROR STATUS');
  }
}

main().catch(console.error);
