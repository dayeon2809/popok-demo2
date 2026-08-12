function pad(value: number) { return String(value).padStart(2, "0"); }
function toDateStr(date: Date) { return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`; }
function addDaysUTC(dateStr: string, count: number) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + count);
  return toDateStr(date);
}
function sundayOffset(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function buildMonthGrid(monthStart: string) {
  const [year, month] = monthStart.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthEnd = `${year}-${pad(month)}-${pad(lastDay)}`;
  const gridStart = addDaysUTC(monthStart, -sundayOffset(monthStart));
  const gridEnd = addDaysUTC(monthEnd, 6 - sundayOffset(monthEnd));
  const days: string[] = [];
  for (let cursor = gridStart; cursor <= gridEnd; cursor = addDaysUTC(cursor, 1)) days.push(cursor);
  return { days, monthEnd, gridStart, gridEnd };
}

export function shiftMonth(monthStart: string, delta: number) {
  const [year, month] = monthStart.split("-").map(Number);
  const total = year * 12 + month - 1 + delta;
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}-01`;
}
