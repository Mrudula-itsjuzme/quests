const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const CHROME = '/home/mrudula/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const OUT = '/tmp/wr-screenshots';
const PROFILE = '/tmp/wr-chrome-profile';
const PORT = 9333;
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

function listTargets() {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      http.get(`http://127.0.0.1:${PORT}/json/list`, (res) => {
        let data = '';
        res.on('data', (d) => (data += d));
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', (err) => {
        if (n <= 0) return reject(err);
        setTimeout(() => attempt(n - 1), 300);
      });
    };
    attempt(30);
  });
}

async function main() {
  fs.rmSync(PROFILE, { recursive: true, force: true });
  fs.mkdirSync(PROFILE, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });

  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    'about:blank',
  ]);

  await new Promise((r) => setTimeout(r, 800));
  const targets = await listTargets();
  const page = targets.find((t) => t.type === 'page');
  if (!page) throw new Error('no page target found');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.on('open', r));

  let id = 0;
  const pending = new Map();
  ws.on('message', (buf) => {
    const msg = JSON.parse(buf.toString());
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  function send(method, params = {}) {
    const myId = ++id;
    ws.send(JSON.stringify({ id: myId, method, params }));
    return new Promise((resolve) => pending.set(myId, resolve));
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

  // Prime localStorage on the app origin BEFORE the app's first mount runs,
  // by navigating to a same-origin page first, then setting storage, then
  // navigating again so DawnMoment's useEffect sees it already set.
  await send('Page.navigate', { url: `${BASE_URL}/app` });
  await new Promise((r) => setTimeout(r, 400));
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('habbit-dawn-moment-seen', new Date().toISOString().slice(0,10)); localStorage.setItem('habbit_guest_mode','true');`,
  });
  await send('Page.navigate', { url: `${BASE_URL}/app` });
  await new Promise((r) => setTimeout(r, 1500));

  const routes = [
    ['world', '/app'],
    ['quests', '/app/quests'],
    ['community', '/app/community'],
    ['rewards', '/app/rewards'],
    ['collection', '/app/collection'],
    ['profile', '/app/profile'],
  ];
  const sizes = [
    ['mobile', 390, 844, 2],
    ['desktop', 1440, 900, 1],
  ];

  for (const [sizeName, w, h, scale] of sizes) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: scale, mobile: sizeName === 'mobile' });
    for (const [name, route] of routes) {
      await send('Page.navigate', { url: `${BASE_URL}${route}` });
      await new Promise((r) => setTimeout(r, 1800));
      const resp = await send('Page.captureScreenshot', { format: 'png' });
      if (!resp.result) {
        console.error('capture failed', name, sizeName, JSON.stringify(resp));
        continue;
      }
      fs.writeFileSync(path.join(OUT, `${name}-${sizeName}.png`), Buffer.from(resp.result.data, 'base64'));
      console.log(`shot ${name}-${sizeName}`);
    }
  }

  ws.close();
  chrome.kill();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
