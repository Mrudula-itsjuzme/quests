import autocannon from 'autocannon';
import { loadConfig } from '../api/config.js';

async function run() {
  const config = loadConfig();
  const token = process.env.TEST_TOKEN;
  if (!token) {
    console.error('TEST_TOKEN is required');
    process.exit(1);
  }

  const url = process.env.TARGET_URL || `http://localhost:${config.PORT || 3000}`;
  console.log(`Starting load test against ${url}...`);

  const instance = autocannon({
    url,
    connections: 10,
    pipelining: 1,
    duration: 10,
    headers: {
      Authorization: `Bearer ${token}`
    },
    requests: [
      {
        method: 'GET',
        path: '/api/v1/me'
      },
      {
        method: 'GET',
        path: '/api/v1/quests/active'
      },
      {
        method: 'GET',
        path: '/api/v1/quests/definitions'
      }
    ]
  }, (err, result) => {
    if (err) {
      console.error('Load test failed:', err);
      process.exit(1);
    }
    console.log('\n--- Load Test Results ---');
    console.log(`Total Requests:  ${result.requests.total}`);
    console.log(`Req/Sec (Avg):   ${result.requests.average}`);
    console.log(`Latency (p99):   ${result.latency.p99} ms`);
    console.log(`2xx Responses:   ${result.2xx}`);
    console.log(`Non-2xx / Err:   ${result.non2xx} / ${result.errors}`);
  });

  autocannon.track(instance, { renderProgressBar: true });
}

run();
