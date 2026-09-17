import { loadConfig } from './api/config.js';
try {
  loadConfig(process.env, { isMigration: true });
  console.log("Success with isMigration: true");
} catch (e) {
  console.log("Error with isMigration: true:", e.message);
}

try {
  loadConfig(process.env);
  console.log("Success without options");
} catch (e) {
  console.log("Error without options:", e.message);
}
