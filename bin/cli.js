#!/usr/bin/env node

import { getConfig, resetConfig, setEidDate } from '../src/config.js';
import { render } from '../src/display.js';
import { checkLocation } from '../src/check-location.js';

const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();

async function main() {
  // Handle reset
  if (command === 'reset') {
    resetConfig();
    console.log('\n✅ Config cleared. Run `ramadan` to set up again.\n');
    process.exit(0);
  }

  // Handle eid date setting
  if (command === 'eid') {
    const dateStr = args[1];
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      console.log('\n❌ Please provide a date: ramadan eid YYYY-MM-DD\n');
      process.exit(1);
    }
    setEidDate(dateStr);
    console.log(`\n✅ Eid date set to ${dateStr}\n`);
    process.exit(0);
  }

  // Handle location check
  if (command === 'check') {
    await checkLocation();
    process.exit(0);
  }

  // Get or create config (will prompt on first run)
  const config = await getConfig();

  // Determine which view to show
  const view = command === 'times' ? 'times' : command === 'calendar' ? 'calendar' : 'full';

  render(config, view);
}

main().catch((err) => {
  console.error('\n❌ Something went wrong:', err.message, '\n');
  process.exit(1);
});
