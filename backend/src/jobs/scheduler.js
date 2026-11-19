const cron = require('node-cron');
const { sendScheduledLimitReminders } = require('../features/billing/billing.notifications');

// In-process scheduler. Runs inside the API server, so run ONE server
// instance with it enabled (set DISABLE_SCHEDULER=true on any others),
// otherwise every instance sends the same emails.
const TIME_ZONE = 'Europe/London';

// 09:30 and 21:30 UK time, every day (follows GMT/BST automatically).
const PLAN_LIMIT_REMINDER_CRON = '30 9,21 * * *';

function startScheduler() {
  if (process.env.DISABLE_SCHEDULER === 'true') {
    console.log('Scheduler disabled (DISABLE_SCHEDULER=true)');
    return;
  }

  cron.schedule(
    PLAN_LIMIT_REMINDER_CRON,
    async () => {
      try {
        const summary = await sendScheduledLimitReminders();
        console.log('Plan limit reminders:', summary);
      } catch (err) {
        console.error('Plan limit reminder run failed:', err);
      }
    },
    { timezone: TIME_ZONE }
  );

  console.log(`Scheduler started: plan limit reminders at 09:30 and 21:30 ${TIME_ZONE}`);
}

module.exports = { startScheduler, PLAN_LIMIT_REMINDER_CRON, TIME_ZONE };
