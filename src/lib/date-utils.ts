
import { parse, set, getDay, addDays, startOfDay } from 'date-fns';

const dayMapping: { [key: string]: number } = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6,
};

/**
 * Calculates the next occurrence of a specific day and time.
 * @param dayOfWeek - The target day of the week (e.g., "Monday").
 * @param timeStr - The target time in "HH:mm" format.
 * @returns A Date object representing the next occurrence.
 */
export function getNextOccurrence(dayOfWeek: string, timeStr: string): Date {
  const targetDay = dayMapping[dayOfWeek];
  if (targetDay === undefined) {
    throw new Error(`Invalid day of the week: ${dayOfWeek}`);
  }

  const now = new Date();
  const today = getDay(now);

  // Parse the time string (e.g., "18:00")
  const time = parse(timeStr, 'HH:mm', new Date());
  const hours = time.getHours();
  const minutes = time.getMinutes();

  // Calculate the difference in days
  let dayDifference = targetDay - today;
  if (dayDifference < 0 || (dayDifference === 0 && now.getHours() >= hours && now.getMinutes() >= minutes)) {
    // If the day is in the past this week, or it's today but the time has already passed
    dayDifference += 7;
  }

  // Get the date of the next occurrence
  const nextDate = addDays(startOfDay(now), dayDifference);

  // Set the time on that date
  const finalDate = set(nextDate, { hours, minutes, seconds: 0, milliseconds: 0 });

  return finalDate;
}
