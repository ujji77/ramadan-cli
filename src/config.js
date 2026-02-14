import Conf from 'conf';
import prompts from 'prompts';
import chalk from 'chalk';

const store = new Conf({
  projectName: 'ramadan-cal',
  schema: {
    city: { type: 'string' },
    country: { type: 'string' },
    ramadanStartDate: { type: 'string' },
    eidDate: { type: 'string', default: '' },
    method: { type: 'string', default: 'NorthAmerica' },
    latitude: { type: 'number' },
    longitude: { type: 'number' },
    timezone: { type: 'string', default: '' },
  },
});

const CALCULATION_METHODS = {
  'North America': 'NorthAmerica',
  'Europe': 'MuslimWorldLeague',
  'Middle East': 'UmmAlQura',
  'Egypt / Africa': 'Egyptian',
  'South Asia': 'Karachi',
  'Southeast Asia': 'Singapore',
  'Turkey': 'Turkey',
};

function guessMethodFromTimezone(tz) {
  if (!tz) return 'MuslimWorldLeague';
  const t = tz.toLowerCase();
  if (t.includes('america')) return 'NorthAmerica';
  if (t.includes('europe') || t.includes('london')) return 'MuslimWorldLeague';
  if (t.includes('asia/dubai') || t.includes('asia/riyadh') || t.includes('asia/qatar') || t.includes('asia/kuwait')) return 'UmmAlQura';
  if (t.includes('africa/cairo') || t.includes('africa')) return 'Egyptian';
  if (t.includes('asia/karachi') || t.includes('asia/dhaka') || t.includes('asia/kolkata')) return 'Karachi';
  if (t.includes('asia/singapore') || t.includes('asia/kuala') || t.includes('asia/jakarta')) return 'Singapore';
  if (t.includes('istanbul') || t.includes('turkey')) return 'Turkey';
  return 'MuslimWorldLeague';
}

async function detectLocation() {
  try {
    const res = await fetch('https://ipapi.co/json/', {
      headers: { 'User-Agent': 'ramadan-cal/1.0' },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (data.latitude && data.longitude) {
      return {
        city: data.city || 'Unknown',
        country: data.country_name || data.country || 'Unknown',
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }
  } catch {
    // Fall through
  }
  return null;
}

function getRamadanStartOptions() {
  // Ramadan 2026 is expected around Feb 17-18
  // Provide a few date options based on likely moon sighting dates
  const year = new Date().getFullYear();
  const candidates = [];

  // Generate options for a reasonable window
  // For 2026: ~Feb 17-18, for 2025: ~Feb 28 - Mar 1
  if (year === 2025) {
    candidates.push(
      { title: 'Friday 28th February 2025', value: '2025-02-28' },
      { title: 'Saturday 1st March 2025', value: '2025-03-01' },
    );
  } else if (year === 2026) {
    candidates.push(
      { title: 'Tuesday 17th February 2026', value: '2026-02-17' },
      { title: 'Wednesday 18th February 2026', value: '2026-02-18' },
    );
  } else if (year === 2027) {
    candidates.push(
      { title: 'Saturday 6th February 2027', value: '2027-02-06' },
      { title: 'Sunday 7th February 2027', value: '2027-02-07' },
    );
  } else {
    // Fallback: ask for manual input
    return null;
  }

  candidates.push({ title: 'Other (enter manually)', value: 'manual' });
  return candidates;
}

export async function getConfig() {
  if (store.get('city') && store.get('ramadanStartDate')) {
    return store.store;
  }

  console.log('\n🌙 Welcome to Ramadan CLI\n');

  // Auto-detect location
  console.log('📍 Detecting your location...');
  const location = await detectLocation();

  let city, country, latitude, longitude, timezone;

  if (location) {
    console.log(`   Found: ${location.city}, ${location.country}\n`);

    const confirm = await prompts({
      type: 'confirm',
      name: 'correct',
      message: `Is ${location.city}, ${location.country} correct?`,
      initial: true,
    });

    if (confirm.correct) {
      city = location.city;
      country = location.country;
      latitude = location.latitude;
      longitude = location.longitude;
      timezone = location.timezone;
    }
  } else {
    console.log('   Could not detect automatically.\n');
  }

  // Manual location if auto-detect failed or was rejected
  if (!city) {
    const manual = await prompts([
      {
        type: 'text',
        name: 'city',
        message: 'What city are you in?',
        validate: (v) => (v.length > 0 ? true : 'Please enter a city'),
      },
      {
        type: 'text',
        name: 'country',
        message: 'What country?',
        validate: (v) => (v.length > 0 ? true : 'Please enter a country'),
      },
    ]);

    if (!manual.city) {
      console.log('\n👋 Setup cancelled.\n');
      process.exit(0);
    }

    city = manual.city;
    country = manual.country;
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Geocode
    console.log('\n📍 Finding coordinates...');
    const coords = await geocodeCity(city, country);
    if (coords) {
      latitude = coords.lat;
      longitude = coords.lng;
      console.log(`   Found: (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`);
    } else {
      console.log('   Could not find coordinates.');
      const coordInput = await prompts([
        { type: 'number', name: 'latitude', message: 'Enter latitude:', float: true },
        { type: 'number', name: 'longitude', message: 'Enter longitude:', float: true },
      ]);
      latitude = coordInput.latitude;
      longitude = coordInput.longitude;
    }
  }

  // Moon sighting date — the only real question
  console.log('');
  const startOptions = getRamadanStartOptions();
  let ramadanStartDate;

  if (startOptions) {
    const response = await prompts({
      type: 'select',
      name: 'startDate',
      message: 'When was the moon sighted for Ramadan?',
      choices: startOptions,
    });

    if (response.startDate === 'manual') {
      const manual = await prompts({
        type: 'text',
        name: 'date',
        message: 'Enter the date (YYYY-MM-DD):',
        validate: (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? true : 'Use format YYYY-MM-DD'),
      });
      ramadanStartDate = manual.date;
    } else {
      ramadanStartDate = response.startDate;
    }
  } else {
    const manual = await prompts({
      type: 'text',
      name: 'date',
      message: 'When did Ramadan start? (YYYY-MM-DD)',
      validate: (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? true : 'Use format YYYY-MM-DD'),
    });
    ramadanStartDate = manual.date;
  }

  if (!ramadanStartDate) {
    console.log('\n👋 Setup cancelled.\n');
    process.exit(0);
  }

  // Eid = 30 days after start
  const startD = new Date(ramadanStartDate + 'T00:00:00');
  const eidD = new Date(startD.getTime() + 30 * 86400000);
  const eidDate = eidD.toISOString().split('T')[0];

  // Auto-detect calculation method from timezone
  const method = guessMethodFromTimezone(timezone);

  // Save everything
  store.set('city', city);
  store.set('country', country);
  store.set('latitude', latitude);
  store.set('longitude', longitude);
  store.set('timezone', timezone || '');
  store.set('method', method);
  store.set('ramadanStartDate', ramadanStartDate);
  store.set('eidDate', eidDate);

  console.log(`\n✅ All set! Eid estimated: ${eidDate}`);
  console.log(`   Prayer method: ${Object.keys(CALCULATION_METHODS).find(k => CALCULATION_METHODS[k] === method) || method}`);
  console.log(`   Run ${chalk.dim('ramadan eid YYYY-MM-DD')} to update Eid when announced.\n`);

  return store.store;
}

async function geocodeCity(city, country) {
  try {
    const query = encodeURIComponent(`${city}, ${country}`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
      headers: { 'User-Agent': 'ramadan-cal/1.0' },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {
    // Fall through
  }
  return null;
}

export function resetConfig() {
  store.clear();
}

export function setEidDate(dateStr) {
  store.set('eidDate', dateStr);
}
