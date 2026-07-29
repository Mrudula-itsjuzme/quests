import { createRuntime } from '../api/server.js';

async function run() {
  console.log(`[Scheduler] Starting run at ${new Date().toISOString()}`);
  let runtime;
  try {
    runtime = await createRuntime();
    const result = await runtime.engine.runScheduler();
    console.log('[Scheduler] Finished successfully:', JSON.stringify(result));
    process.exit(0);
  } catch (error) {
    console.error('[Scheduler] Failed with error:', error);
    process.exit(1);
  } finally {
    if (runtime && runtime.pool) {
      await runtime.pool.end();
    }
  }
}

run();
