import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const PIXEL_PNG = 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, 'public/icon-192.png')).toString('base64');

  console.log('Creating capture...');
  let ik = randomUUID();
  let res = await fetch('http://127.0.0.1:3005/api/v1/captures', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': ik },
    body: JSON.stringify({ imageBase64: PIXEL_PNG })
  });
  let data = await res.json();
  
  if (data.needsConfirmation) {
    ik = randomUUID();
    res = await fetch('http://127.0.0.1:3005/api/v1/captures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': ik },
      body: JSON.stringify({ imageBase64: PIXEL_PNG, chosenCandidateIndex: 0 })
    });
    data = await res.json();
  }
  console.log('Capture response:', data.id);

  const imageRef = data.imageRef;
  if (!imageRef) return console.log('No imageRef');
  
  console.log('Fetching media:', imageRef);

  const mediaRes = await fetch(`http://127.0.0.1:3005${imageRef}`);
  console.log('Media status:', mediaRes.status);
  console.log('Content-Type:', mediaRes.headers.get('content-type'));

  const buffer = await mediaRes.arrayBuffer();
  const hex = Buffer.from(buffer).slice(0, 8).toString('hex');
  console.log('Magic bytes:', hex);
  console.log('ASCII?:', Buffer.from(buffer).toString('utf8').slice(0, 50));
}

run().catch(console.error);
