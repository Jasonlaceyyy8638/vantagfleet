/**
 * Returns a human-readable time-ago string for the given date.
 * Used for "Last Fleet Sync" and similar timestamps.
 */
export function getTimeAgo(date: Date | string | null | undefined): string {
  if (date == null) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 0) return 'just now';
  if (sec < 45) return 'just now';
  if (sec < 60) return 'less than a minute ago';
  const min = Math.floor(sec / 60);
  if (min === 1) return '1 minute ago';
  if (min < 60) return `${min} minutes ago`;
  const hr = Math.floor(min / 60);
  if (hr === 1) return '1 hour ago';
  if (hr < 24) return `${hr} hours ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return '1 day ago';
  if (day < 7) return `${day} days ago`;
  const week = Math.floor(day / 7);
  if (week === 1) return '1 week ago';
  if (week < 4) return `${week} weeks ago`;
  return d.toLocaleDateString();
}
