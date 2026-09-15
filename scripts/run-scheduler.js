async function run() {
  console.log(`[Scheduler] Starting run at ${new Date().toISOString()}`);
  try {
    const schedulerUrl = process.env.SCHEDULER_URL;
    const secret = process.env.CRON_SECRET;
    if (!schedulerUrl || new URL(schedulerUrl).protocol !== 'https:') throw new Error('SCHEDULER_URL must be an absolute HTTPS URL.');
    if (!secret || secret.length < 16) throw new Error('CRON_SECRET must contain at least 16 characters.');
    const response = await fetch(schedulerUrl, {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Scheduler endpoint returned HTTP ${response.status}.`);
    const result = await response.json();
    console.log('[Scheduler] Finished successfully:', JSON.stringify(result));
    process.exit(0);
  } catch (error) {
    console.error('[Scheduler] Failed with error:', error);
    process.exit(1);
  }
}

run();
