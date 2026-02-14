import prompts from 'prompts';
import chalk from 'chalk';
import { getPrayerTimes } from './prayer.js';

const TIMEZONE_METHODS = {
  'america': 'NorthAmerica',
  'europe': 'MuslimWorldLeague',
  'africa': 'Egyptian',
  'asia/dubai': 'UmmAlQura',
  'asia/riyadh': 'UmmAlQura',
  'asia/karachi': 'Karachi',
  'asia/kolkata': 'Karachi',
  'asia/dhaka': 'Karachi',
  'asia/singapore': 'Singapore',
  'asia/kuala': 'Singapore',
  'asia/jakarta': 'Singapore',
  'asia/istanbul': 'Turkey',
};

function guessMethod(lat, lng) {
  // Rough geographic guess
  if (lng > -130 && lng < -30) return 'NorthAmerica';
  if (lng > -15 && lng < 40 && lat > 35) return 'MuslimWorldLeague';
  if (lng > -20 && lng < 55 && lat < 35 && lat > -35) return 'Egyptian';
  if (lng > 35 && lng < 60 && lat > 10 && lat < 45) return 'UmmAlQura';
  if (lng > 60 && lng < 100) return 'Karachi';
  if (lng > 95 && lng < 145) return 'Singapore';
  return 'MuslimWorldLeague';
}

async function geocode(query) {
  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=5`,
      { headers: { 'User-Agent': 'ramadan-cal/1.0' }, signal: AbortSignal.timeout(8000) }
    );
    const data = await res.json();
    return data.map((r) => ({
      name: r.display_name.split(',').slice(0, 3).join(','),
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
  } catch {
    return [];
  }
}

export async function checkLocation() {
  console.log('');
  console.log(chalk.bold.cyan('🌍 Check Prayer Times'));
  console.log(chalk.dim('Type any city or country to check prayer times.\n'));

  while (true) {
    const { query } = await prompts({
      type: 'text',
      name: 'query',
      message: 'City or country (or "quit" to exit)',
    });

    if (!query || query.toLowerCase() === 'quit' || query.toLowerCase() === 'q') {
      console.log(chalk.dim('\n👋 Done.\n'));
      break;
    }

    console.log(chalk.dim(`\n   Searching for "${query}"...`));
    const results = await geocode(query);

    if (results.length === 0) {
      console.log(chalk.red('   Could not find that location. Try again.\n'));
      continue;
    }

    let selected;

    if (results.length === 1) {
      selected = results[0];
      console.log(chalk.dim(`   Found: ${selected.name}`));
    } else {
      const { pick } = await prompts({
        type: 'select',
        name: 'pick',
        message: 'Which location?',
        choices: results.map((r, i) => ({ title: r.name, value: i })),
      });

      if (pick === undefined) continue;
      selected = results[pick];
    }

    const method = guessMethod(selected.lat, selected.lng);
    const config = {
      latitude: selected.lat,
      longitude: selected.lng,
      method,
    };

    const times = getPrayerTimes(config);

    console.log('');
    console.log(chalk.bold(`   🕌 Prayer Times — ${selected.name.split(',')[0]}`));
    console.log(chalk.dim(`   ${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)} · Method: ${method}`));
    console.log('');
    console.log(`   Fajr      ${chalk.white(times.fajr)}     Maghrib   ${chalk.white(times.maghrib)}`);
    console.log(`   Sunrise   ${chalk.white(times.sunrise)}     Isha      ${chalk.white(times.isha)}`);
    console.log(`   Dhuhr     ${chalk.white(times.dhuhr)}`);
    console.log(`   Asr       ${chalk.white(times.asr)}`);
    console.log('');
    console.log(`   🍽️  Suhoor ends: ${chalk.bold.yellow(times.suhoorEnds)} · Iftar: ${chalk.bold.green(times.iftar)}`);
    console.log('');
  }
}
