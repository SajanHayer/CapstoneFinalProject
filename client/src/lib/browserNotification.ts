/**
 * Utility for sending browser notifications
 * Handles permission requests and sends desktop notifications
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("Browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

export function sendNotification(
  title: string,
  options?: NotificationOptions,
): Notification | null {
  if (!("Notification" in window)) {
    console.warn("Browser does not support notifications");
    return null;
  }

  if (Notification.permission !== "granted") {
    console.warn("Notification permission not granted");
    return null;
  }

  return new Notification(title, {
    icon: "/vite.svg", // Using your app's icon, adjust path if needed
    ...options,
  });
}

/**
 * Send a notification and ensure permission is requested first
 */
export async function sendNotificationWithPermission(
  title: string,
  options?: NotificationOptions,
): Promise<Notification | null> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return null;
  }

  return sendNotification(title, options);
}
