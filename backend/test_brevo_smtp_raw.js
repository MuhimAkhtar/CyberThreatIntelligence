const net = require('net');
const tls = require('tls');

async function testSmtpRaw() {
  console.log('=== TESTING REAL BREVO SMTP RELAY WITH EXACT LOGIN USERNAME ===\n');

  const user = process.env.BREVO_SMTP_USER || 'aced0b001@smtp-brevo.com';
  const pass = process.env.BREVO_SMTP_PASS || 'xsmtpsib-placeholder-key';

  return new Promise((resolve, reject) => {
    const socket = net.createConnection(587, 'smtp-relay.brevo.com', () => {
      console.log('1. Connected to smtp-relay.brevo.com:587');
    });

    let step = 0;
    let tlsSocket = null;

    const handleData = (data) => {
      const msg = data.toString();
      console.log(`[SERVER] ${msg.trim()}`);

      if (step === 0 && msg.startsWith('220')) {
        step = 1;
        send('EHLO cyber-platform.local');
      } else if (step === 1 && msg.startsWith('250')) {
        step = 2;
        send('STARTTLS');
      } else if (step === 2 && msg.startsWith('220')) {
        step = 3;
        console.log('2. Initiating STARTTLS Encryption...');
        tlsSocket = tls.connect({
          socket: socket,
          servername: 'smtp-relay.brevo.com',
          rejectUnauthorized: false
        }, () => {
          console.log('3. TLS Encryption Handshake Established!');
          sendTls('EHLO cyber-platform.local');
        });

        tlsSocket.on('data', handleTlsData);
        tlsSocket.on('error', reject);
      }
    };

    const handleTlsData = (data) => {
      const msg = data.toString();
      console.log(`[TLS SERVER] ${msg.trim()}`);

      if (step === 3 && msg.startsWith('250')) {
        step = 4;
        console.log('4. Authenticating with Brevo Login Username aced0b001@smtp-brevo.com...');
        sendTls('AUTH LOGIN');
      } else if (step === 4 && msg.startsWith('334')) {
        step = 5;
        sendTls(Buffer.from(user).toString('base64'));
      } else if (step === 5 && msg.startsWith('334')) {
        step = 6;
        sendTls(Buffer.from(pass).toString('base64'));
      } else if (step === 6) {
        if (msg.startsWith('235')) {
          console.log('\n==================================================');
          console.log('✅ BREVO SMTP AUTHENTICATION SUCCESSFUL! (HTTP 235)');
          console.log('==================================================\n');
          sendTls('QUIT');
          resolve(true);
        } else {
          console.log('\n❌ BREVO SMTP AUTHENTICATION FAILED:', msg);
          sendTls('QUIT');
          resolve(false);
        }
      }
    };

    const send = (cmd) => {
      console.log(`[CLIENT] ${cmd}`);
      socket.write(cmd + '\r\n');
    };

    const sendTls = (cmd) => {
      console.log(`[CLIENT TLS] ${cmd.startsWith('AUTH') || step === 5 || step === 6 ? '***CREDENTIALS***' : cmd}`);
      tlsSocket.write(cmd + '\r\n');
    };

    socket.on('data', handleData);
    socket.on('error', reject);
  });
}

testSmtpRaw().catch(console.error);
