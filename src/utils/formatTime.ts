/**
 * Time and date formatting utilities for StudyPilot AI.
 */

/**
 * Formats minutes into human-readable hours and minutes (e.g. 45 mins, 1 hr 15 mins).
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? '' : 's'}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr${hours === 1 ? '' : 's'}`;
  }
  return `${hours} hr${hours === 1 ? '' : 's'} ${remainingMinutes} min${remainingMinutes === 1 ? '' : 's'}`;
}

/**
 * Formats an ISO date string into a friendly date string (e.g. "Oct 28, 2026").
 */
export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/**
 * Returns days remaining until a target exam date.
 */
export function daysUntil(dateString: string): number {
  try {
    const target = new Date(dateString);
    const today = new Date();
    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}
