import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Every hour at :00 — update membership statuses (active → expiring_soon → grace_period → expired)
crons.hourly('membership-status-updater',
  { minuteUTC: 0 },
  internal.members.updateAllStatuses,
);

// Daily at 9:00 AM IST (03:30 UTC) — send expiry renewal reminders via FCM
crons.daily('expiry-reminders',
  { hourUTC: 3, minuteUTC: 30 },
  internal.scheduled.sendExpiryReminders,
);

// Weekly Sunday 6:30 AM IST (01:00 UTC) — auto-archive memberships expired 60+ days ago
crons.weekly('auto-archive-expired',
  { dayOfWeek: 'sunday', hourUTC: 1, minuteUTC: 0 },
  internal.scheduled.autoArchiveExpired,
);

// Monthly 1st at 12:00 AM IST (18:30 UTC prev day / 00:00 IST) — reset AI plan quotas
crons.monthly('ai-plan-quota-reset',
  { day: 1, hourUTC: 18, minuteUTC: 30 },
  internal.scheduled.resetPlanQuotas,
);

export default crons;
