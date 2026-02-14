import adhan from 'adhan';

const { PrayerTimes, CalculationMethod, Coordinates } = adhan;

const METHOD_MAP = {
  NorthAmerica: 'NorthAmerica',
  MuslimWorldLeague: 'MuslimWorldLeague',
  Egyptian: 'Egyptian',
  UmmAlQura: 'UmmAlQura',
  Karachi: 'Karachi',
  MoonsightingCommittee: 'MoonsightingCommittee',
  Singapore: 'Singapore',
  Turkey: 'Turkey',
  Tehran: 'Tehran',
  Dubai: 'Dubai',
  Kuwait: 'Kuwait',
  Qatar: 'Qatar',
};

export function getPrayerTimes(config, date = new Date()) {
  const coordinates = new Coordinates(config.latitude, config.longitude);
  const methodName = METHOD_MAP[config.method] || 'NorthAmerica';
  const params = CalculationMethod[methodName]();

  const times = new PrayerTimes(coordinates, date, params);

  const fmt = (d) =>
    d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  return {
    fajr: fmt(times.fajr),
    sunrise: fmt(times.sunrise),
    dhuhr: fmt(times.dhuhr),
    asr: fmt(times.asr),
    maghrib: fmt(times.maghrib),
    isha: fmt(times.isha),
    suhoorEnds: fmt(times.fajr),
    iftar: fmt(times.maghrib),
  };
}
