import chalk from 'chalk';

export function renderCalendar(startDate, currentDay, totalDays) {
  const lines = [];

  // Header
  lines.push(chalk.dim(' Su  Mo  Tu  We  Th  Fr  Sa'));

  // What day of the week does Ramadan start? (0 = Sunday)
  const startDow = startDate.getDay();

  // Build cells
  const cells = [];

  // Leading empty cells
  for (let i = 0; i < startDow; i++) {
    cells.push('    ');
  }

  // Day cells
  for (let day = 1; day <= totalDays; day++) {
    if (day < currentDay) {
      // Past days — crossed out
      cells.push(chalk.dim.strikethrough(pad(day)));
    } else if (day === currentDay) {
      // Today — highlighted
      cells.push(chalk.bold.green(`[${day.toString().padStart(2)}]`));
    } else {
      // Future days
      cells.push(pad(day));
    }
  }

  // Render rows of 7
  for (let i = 0; i < cells.length; i += 7) {
    const row = cells.slice(i, i + 7);
    lines.push(row.join(''));
  }

  return lines.join('\n');
}

function pad(day) {
  return ` ${day.toString().padStart(2)} `;
}
