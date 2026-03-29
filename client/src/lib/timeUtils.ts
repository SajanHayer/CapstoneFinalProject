/**
 * Formats time remaining with days displayed when duration > 24 hours
 * @param diffMs - Time difference in milliseconds
 * @returns Formatted string (e.g., "2d 3:45:20" or "03:45:20")
 */
export function formatTimeRemaining(diffMs: number): string {
  if (diffMs <= 0) {
    return "00:00:00";
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
