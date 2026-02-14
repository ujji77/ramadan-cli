import chalk from 'chalk';
import { getPrayerTimes } from './prayer.js';
import { renderCalendar } from './calendar.js';

const DIVIDER = chalk.dim('━'.repeat(38));

function getHijriYear(startDate) {
  // Known anchor: Ramadan 2025 starts ~Feb/Mar 2025 = 1446 AH
  // Ramadan 2026 = 1447, 2027 = 1448, etc.
  const year = startDate.getFullYear();
  if (year <= 2025) return 1446;
  return 1446 + (year - 2025);
}

function daysBetween(a, b) {
  const msPerDay = 86400000;
  const aStart = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bStart = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bStart - aStart) / msPerDay);
}

function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function render(config, view = 'full') {
  const start = new Date(config.ramadanStartDate + 'T00:00:00');
  const today = new Date();
  const hijriYear = getHijriYear(start);

  const endDate = config.eidDate
    ? new Date(config.eidDate + 'T00:00:00')
    : new Date(start.getTime() + 30 * 86400000);

  const totalDays = daysBetween(start, endDate);
  const currentDay = daysBetween(start, today) + 1;
  const daysRemaining = totalDays - currentDay;

  const output = [];

  // ── STATE A: Before Ramadan ──
  if (currentDay < 1) {
    const daysUntil = Math.abs(currentDay) + 1;
    output.push('');
    output.push(chalk.bold.cyan(`🌙 Ramadan ${hijriYear} has not started yet`));
    output.push('');
    output.push(`📅 Starts: ${chalk.white(formatDate(start))}`);
    output.push(`⏳ ${chalk.bold.yellow(daysUntil)} days to go`);
    output.push('');
    output.push(chalk.dim('May Allah allow us to reach Ramadan 🤲'));
    output.push('');
    console.log(output.join('\n'));
    return;
  }

  // ── STATE C: After Ramadan ──
  if (currentDay > totalDays) {
    output.push('');
    output.push(chalk.bold.cyan(`🌙 Ramadan ${hijriYear} has ended`));
    output.push('');
    output.push(chalk.bold.yellow('🎉 Eid Mubarak!'));
    output.push(`📅 Ramadan was ${formatDate(start)} — ${formatDate(endDate)}`);
    output.push(`✅ ${totalDays} days completed`);
    output.push('');
    output.push(chalk.dim('Taqabbal Allahu minna wa minkum 🤲'));
    output.push('');
    console.log(output.join('\n'));
    return;
  }

  // ── STATE B: During Ramadan ──
  const times = getPrayerTimes(config, today);

  // Header
  output.push('');
  output.push(chalk.bold.cyan(`🌙 Ramadan ${hijriYear}`));
  output.push(DIVIDER);

  // Progress
  output.push(`📅 ${chalk.white(`${currentDay} Ramadan ${hijriYear}`)} — Day ${chalk.bold(currentDay)} of ${totalDays}`);
  output.push(`⏳ ${chalk.bold.yellow(daysRemaining)} days remaining`);

  // Prayer times
  if (view === 'full' || view === 'times') {
    output.push('');
    output.push(`🕌 Prayer Times ${chalk.dim(`(${config.city})`)}`);
    output.push(`   Fajr     ${chalk.white(times.fajr)}     Maghrib  ${chalk.white(times.maghrib)}`);
    output.push(`   Sunrise  ${chalk.white(times.sunrise)}     Isha     ${chalk.white(times.isha)}`);
    output.push(`   Dhuhr    ${chalk.white(times.dhuhr)}`);
    output.push(`   Asr      ${chalk.white(times.asr)}`);
    output.push('');
    output.push(`🍽️  Suhoor ends: ${chalk.bold.yellow(times.suhoorEnds)} · Iftar: ${chalk.bold.green(times.iftar)}`);
  }

  // Calendar
  if (view === 'full' || view === 'calendar') {
    output.push('');
    output.push(DIVIDER);
    output.push(renderCalendar(start, currentDay, totalDays));
    output.push(DIVIDER);
  }

  // Eid prompt
  if (!config.eidDate && currentDay >= 28) {
    output.push('');
    output.push(chalk.yellow('⚠️  Day 28+ — Has Eid been announced?'));
    output.push(chalk.dim('   Run: ramadan eid YYYY-MM-DD'));
  }

  output.push('');
  console.log(output.join('\n'));
}
