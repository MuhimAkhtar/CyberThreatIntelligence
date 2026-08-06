const { execSync } = require('child_process');

async function main() {
  console.log('================================================================');
  console.log('1. RAW DOCKER PS OUTPUT (SHOWING ALL RUNNING CONTAINERS)');
  console.log('================================================================');
  const dockerPs = execSync('docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"').toString();
  console.log(dockerPs);

  console.log('================================================================');
  console.log('2. RAW SPLUNK HEC EVENT RESPONSE (https://localhost:8088/services/collector/event)');
  console.log('================================================================');
  const splunkRes = execSync('curl.exe -k -s https://localhost:8088/services/collector/event -H "Authorization: Splunk 11111111-2222-3333-4444-555555555555" -d "{\\"event\\": \\"CTP Security Event Test\\", \\"sourcetype\\": \\"_json\\"}"').toString();
  console.log(splunkRes);

  console.log('\n================================================================');
  console.log('3. RAW WAZUH 4.10.0 REST API JWT AUTH RESPONSE (https://localhost:55000/security/user/authenticate)');
  console.log('================================================================');
  const wazuhAuth = execSync('curl.exe -k -s https://localhost:55000/security/user/authenticate -u wazuh-wui:MyS3cr37P450r.*- -X POST').toString();
  console.log(wazuhAuth);

  console.log('\n================================================================');
  console.log('4. RAW VIRUSTOTAL API V3 FILE SCAN RESPONSE (EICAR SAMPLE 275a021bbfb6...)');
  console.log('================================================================');
  const vtRes = execSync('curl.exe -s https://www.virustotal.com/api/v3/files/275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f -H "x-apikey: 22a771ee9d4c5765f9ba292fc05298462c1b49fd4a7f86c85380e0ab5bed9eda"').toString();
  const parsedVt = JSON.parse(vtRes);
  const truncatedVt = {
    id: parsedVt.data?.id,
    type: parsedVt.data?.type,
    attributes: {
      meaningful_name: parsedVt.data?.attributes?.meaningful_name,
      type_description: parsedVt.data?.attributes?.type_description,
      size: parsedVt.data?.attributes?.size,
      last_analysis_stats: parsedVt.data?.attributes?.last_analysis_stats,
      reputation: parsedVt.data?.attributes?.reputation,
      names: parsedVt.data?.attributes?.names?.slice(0, 5),
    }
  };
  console.log(JSON.stringify(truncatedVt, null, 2));
}

main().catch(console.error);
