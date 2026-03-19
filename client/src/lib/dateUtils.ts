/**
 * Converts a datetime-local string (local time) to UTC ISO string
 * @param localDateTimeString - String from datetime-local input (e.g., "2026-03-18T14:00")
 * @returns ISO string in UTC (e.g., "2026-03-18T19:00:00Z")
 */
export const localToUTC = (localDateTimeString: string): string => {
  // Parse the local datetime string as a Date object
  // Browsers treat this as local time and convert to UTC internally
  const localDate = new Date(localDateTimeString);
  
  // Convert to ISO string (UTC)
  return localDate.toISOString();
};

/**
 * Converts a UTC ISO string to local datetime string for datetime-local input
 * @param utcIsoString - UTC time as ISO string (e.g., "2026-03-18T19:00:00Z")
 * @returns Local datetime string (e.g., "2026-03-18T14:00")
 */
export const utcToLocalDateTimeString = (utcIsoString: string): string => {
  const date = new Date(utcIsoString);
  
  // Get local time components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Converts a UTC ISO string to a local time string for display
 * @param utcIsoString - UTC time as ISO string
 * @returns Formatted local time string (e.g., "Mar 18, 2026 at 2:00 PM")
 */
export const utcToLocalDisplay = (utcIsoString: string): string => {
  const date = new Date(utcIsoString);
  
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

/**
 * Converts a UTC ISO string to local time for time remaining calculation
 * @param utcIsoString - UTC time as ISO string
 * @returns Date object in local time
 */
export const utcToLocalDate = (utcIsoString: string): Date => {
  return new Date(utcIsoString);
};
