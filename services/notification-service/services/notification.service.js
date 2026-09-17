/**
 * Creates an idempotent notification processor.
 *
 * @param {{ notify: Function, hasNotified: Function, markNotified: Function }} dependencies - Notification dependencies.
 * @returns {{ process: Function }} Notification processor.
 */
function createNotificationProcessor({ notify, hasNotified, markNotified }) {
  async function process(event) {
    if (await hasNotified(event.eventId)) {
      return { status: 'duplicate', eventId: event.eventId };
    }

    await notify(event);
    await markNotified(event.eventId);
    return { status: 'notified', eventId: event.eventId };
  }

  return { process };
}

module.exports = { createNotificationProcessor };
