/**
 * notifications.ts
 *
 * Thin wrapper around expo-notifications for scheduling and cancelling
 * local event reminders. No push server needed — everything runs on-device.
 *
 * Usage:
 *   await requestNotificationPermission()
 *   await scheduleEventReminder(event, offsetMinutes)
 *   await cancelEventReminder(event.id)
 *   const scheduled = await isEventReminderScheduled(event.id)
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { CampusEvent } from '@/types/domain';

// ── Module-level notification handler (call once at app startup if desired) ──
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Permission ─────────────────────────────────────────────────────────────

/**
 * Requests notification permission on iOS (Android grants automatically
 * on SDK < 33; for SDK ≥ 33 the permission is requested here too).
 *
 * @returns true if permission is granted, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';

  // Android 13+ channel (required for foreground notifications)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('event-reminders', {
      name: 'Event Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C5CFA',
    });
  }
}

// ── Identifier helper ──────────────────────────────────────────────────────

/** Stable notification identifier derived from an event id. */
function reminderIdentifier(eventId: string): string {
  return `event-reminder-${eventId}`;
}

// ── Scheduling ─────────────────────────────────────────────────────────────

/**
 * Parse a CampusEvent's dateLabel + startTime into a JS Date.
 *
 * dateLabel examples: "Jul 10"  |  "10 Jul"  |  "2025-07-10"
 * startTime examples: "10:00 AM"  |  "14:30"
 *
 * Returns null if either field is missing / unparseable.
 */
function parseEventDate(event: CampusEvent): Date | null {
  try {
    const { dateLabel, startTime } = event;
    if (!dateLabel || !startTime) return null;

    const year = new Date().getFullYear();
    // Normalise: "Jul 10" / "10 Jul" → "Jul 10 <year>"
    const datePart = /^\d/.test(dateLabel.trim())
      ? dateLabel.split(' ').reverse().join(' ')   // "10 Jul" → "Jul 10"
      : dateLabel;

    const combined = `${datePart} ${year} ${startTime}`;
    const d = new Date(combined);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Schedule a local notification for an event.
 *
 * - Deduplicates: cancels any existing reminder for the same event first.
 * - Fires `offsetMinutes` before the event start time (default 30 minutes).
 * - Returns the notification identifier string on success, or null if the
 *   event time is in the past / unparseable.
 */
export async function scheduleEventReminder(
  event: CampusEvent,
  offsetMinutes = 30,
): Promise<string | null> {
  const eventDate = parseEventDate(event);
  if (!eventDate) return null;

  const fireAt = new Date(eventDate.getTime() - offsetMinutes * 60 * 1000);
  if (fireAt <= new Date()) return null; // already past

  const identifier = reminderIdentifier(event.id);

  // Cancel any existing reminder for this event (idempotent)
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {/* no-op */});

  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: '🎓 Upcoming Campus Event',
      body: `"${event.title}" starts in ${offsetMinutes} min at ${event.locationName}`,
      data: { eventId: event.id, screen: `/event/${event.id}` },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
    },
  });

  return identifier;
}

// ── Cancellation ───────────────────────────────────────────────────────────

/**
 * Cancel the scheduled reminder for an event.
 * Safe to call even if no reminder exists.
 */
export async function cancelEventReminder(eventId: string): Promise<void> {
  const identifier = reminderIdentifier(eventId);
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {/* no-op */});
}

// ── Query ──────────────────────────────────────────────────────────────────

/**
 * Returns true if a reminder is currently scheduled for the given event.
 */
export async function isEventReminderScheduled(eventId: string): Promise<boolean> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const id  = reminderIdentifier(eventId);
  return all.some(n => n.identifier === id);
}
