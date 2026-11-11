import { format, isThisYear, isToday, isYesterday, parseISO } from "date-fns";

/** Calendar-day format of the contract (`"YYYY-MM-DD"`, no time, no time zone). */
const ISO_DAY = "yyyy-MM-dd";

/** Today as a calendar day, by the browser's clock (D5: matches the server's day in the MVP). */
export function todayISO(): string {
  return format(new Date(), ISO_DAY);
}

/** "Today", "Yesterday", "Mon, 9 Nov" or "Mon, 9 Nov 2025" for a `"YYYY-MM-DD"` day. */
export function formatDayLabel(day: string): string {
  // parseISO reads a date-only string as local midnight, so the day never shifts.
  const date = parseISO(day);
  if (Number.isNaN(date.getTime())) return day;
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, isThisYear(date) ? "EEE, d MMM" : "EEE, d MMM yyyy");
}

/** Minutes as the model shows them: "45min", "2h", "1h 05". */
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}min`;
  return rest === 0 ? `${hours}h` : `${hours}h ${String(rest).padStart(2, "0")}`;
}
