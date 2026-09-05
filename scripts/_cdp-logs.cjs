const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const CHROME = '/home/mrudula/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const PORT = 9333;
const OUT_LOG = '/tmp/wr-cdp-logs.txt';
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

function append(line) {
  fs.appendFileSync(OUT_LOG, line + '\n');
}

async function main() {
  try {
    if (fs.existsSync(OUT_LOG)) fs.unlinkSync(OUT_LOG);
    append('CDP log start: ' + new Date().toISOString());

    const chrome = spawn(CHROME, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      `--remote-debugging-port=${PORT}`,
      '--user-agent=wr-cdp-debug',
      'about:blank',
    ]);

    chrome.stderr.on('data', (d) => append('[chrome-stderr] ' + d.toString().trim()));
    chrome.stdout.on('data', (d) => append('[chrome-stdout] ' + d.toString().trim()));

    await new Promise((r) => setTimeout(r, 800));
    const targets = await listTargets();
    const page = targets.find((t) => t.type === 'page');
    if (!page) throw new Error('no page target found');

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => ws.on('open', r));

    let id = 0;
    const pending = new Map();

    ws.on('message', (buf) => {
      try {
        const msg = JSON.parse(buf.toString());
        // handle responses
        if (msg.id && pending.has(msg.id)) {
          pending.get(msg.id)(msg);
          pending.delete(msg.id);
          return;
        }
        // handle events
        if (msg.method === 'Runtime.consoleAPICalled') {
          const args = (msg.params.args || []).map(a => a.value || a.description).join(' ');
          append(`[console] ${msg.params.type}: ${args}`);
        }
        if (msg.method === 'Runtime.exceptionThrown') {
          append('[exception] ' + (msg.params.exceptionDetails && msg.params.exceptionDetails.text ? msg.params.exceptionDetails.text : JSON.stringify(msg.params)));
        }
        if (msg.method === 'Log.entryAdded') {
          append('[log.entry] ' + JSON.stringify(msg.params.entry));
        }
        if (msg.method === 'Page.loadEventFired') {
          append('[event] Page.loadEventFired @ ' + new Date().toISOString());
        }
      } catch (e) {
        append('[err] parsing ws message ' + e.message);
      }
    });

    function send(method, params = {}) {
      const myId = ++id;
      ws.send(JSON.stringify({ id: myId, method, params }));
      return new Promise((resolve) => pending.set(myId, resolve));
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Log.enable');

    // set mobile viewport
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

    append('Navigating to app to prime localStorage');
    await send('Page.navigate', { url: `${BASE_URL}/app` });
    await new Promise((r) => setTimeout(r, 400));
    await send('Runtime.evaluate', {
      expression: `localStorage.setItem('habbit-dawn-moment-seen', new Date().toISOString().slice(0,10)); localStorage.setItem('habbit_guest_mode','true');`,
    });

    // routes to test rapid tab switching
    const routes = ['/app', '/app/quests', '/app/community', '/app/rewards', '/app/collection', '/app/profile'];

    for (const route of routes) {
      append(`\n-- NAV ${route} --`);
      const t0 = Date.now();
      await send('Page.navigate', { url: `${BASE_URL}${route}` });

      // wait for load event or timeout after 5s
      const loaded = await new Promise((resolve) => {
        const to = setTimeout(() => resolve(false), 5000);
        const check = (msg) => {
          // we already log Page.loadEventFired in event handler; rely on that; but also resolve here via polling
        };
        // simple polling to detect DOM readiness via Runtime.evaluate
        (async function poll() {
          for (let i=0;i<25;i++) {
            try {
              const resp = await send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
              if (resp && resp.result && resp.result.result && resp.result.result.value === 'complete') {
                clearTimeout(to);
                return resolve(true);
              }
            } catch (e) {}
            await new Promise(r => setTimeout(r, 200));
          }
          resolve(false);
        })();
      });
      const t1 = Date.now();
      append(`[timing] navigate ${route} -> ready: ${t1 - t0}ms, readyFlag:${loaded}`);

      // capture any console.error entries in the last 500ms by querying window.__wr_last_errors if app sets it; also capture window.onerror
      try {
        const lastErr = await send('Runtime.evaluate', { expression: 'window.__wr_last_error ? JSON.stringify(window.__wr_last_error) : null', returnByValue: true });
        append('[state] window.__wr_last_error: ' + (lastErr.result && lastErr.result.result && lastErr.result.result.value));
      } catch (e) {}

      await new Promise(r => setTimeout(r, 500));
    }

    append('\nCDP run complete');
    ws.close();
    chrome.kill();
  } catch (e) {
    append('fatal: ' + e.stack);
    process.exit(1);
  }
}

main();
