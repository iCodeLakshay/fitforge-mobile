import { internalMutation } from './_generated/server';
import { v } from 'convex/values';

// ─── Send Expiry Reminders ────────────────────────────────────────────────────
// Runs daily at 9:00 AM IST — notifies members expiring within 7 days
export const sendExpiryReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now       = Date.now();
    const in7Days   = now + 7 * 24 * 60 * 60 * 1000;

    // Find memberships expiring within 7 days that are still active/expiring_soon
    const expiring = await ctx.db
      .query('memberships')
      .withIndex('by_end_date')
      .filter((q) =>
        q.and(
          q.gte(q.field('endDate'), new Date(now).toISOString().split('T')[0]),
          q.lte(q.field('endDate'), new Date(in7Days).toISOString().split('T')[0]),
          q.or(
            q.eq(q.field('status'), 'active'),
            q.eq(q.field('status'), 'expiring_soon'),
          ),
        )
      )
      .collect();

    for (const membership of expiring) {
      const endDate  = new Date(membership.endDate);
      const daysLeft = Math.ceil((endDate.getTime() - now) / 86400000);

      // Create in-app notification for member
      await ctx.db.insert('notifications', {
        userId:  membership.memberId,
        gymId:   membership.gymId,
        type:    'expiry_reminder',
        title:   'Membership Expiring Soon',
        body:    `Your gym membership expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Renew now to keep access.`,
        data:    { membershipId: membership._id, daysLeft },
        isRead:  false,
        sentAt:  now,
        fcmSent: false,
      });

      // Create in-app notification for gym owner
      const member = await ctx.db.get(membership.memberId);
      await ctx.db.insert('notifications', {
        userId:  (await ctx.db.get(membership.gymId))?.ownerId ?? membership.memberId,
        gymId:   membership.gymId,
        type:    'expiry_reminder',
        title:   'Member Renewal Due',
        body:    `${member?.name ?? 'A member'}'s membership expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
        data:    { membershipId: membership._id, memberId: membership.memberId, daysLeft },
        isRead:  false,
        sentAt:  now,
        fcmSent: false,
      });
    }

    console.log(`[sendExpiryReminders] Sent ${expiring.length * 2} notifications`);
  },
});

// ─── Auto-Archive Expired Memberships ────────────────────────────────────────
// Runs weekly on Sunday — archives memberships expired 60+ days ago
export const autoArchiveExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now        = Date.now();
    const cutoff     = now - 60 * 24 * 60 * 60 * 1000; // 60 days ago
    const cutoffDate = new Date(cutoff).toISOString().split('T')[0];

    const oldExpired = await ctx.db
      .query('memberships')
      .withIndex('by_end_date')
      .filter((q) =>
        q.and(
          q.eq(q.field('status'), 'expired'),
          q.lte(q.field('endDate'), cutoffDate),
        )
      )
      .collect();

    let archived = 0;
    for (const m of oldExpired) {
      await ctx.db.patch(m._id, { status: 'archived', updatedAt: now });
      archived++;
    }

    console.log(`[autoArchiveExpired] Archived ${archived} memberships`);
  },
});

// ─── Reset AI Plan Quotas ─────────────────────────────────────────────────────
// Runs on 1st of every month — resets per-gym AI plan generation tracking
// (Quotas are calculated dynamically by counting plans in the current month,
//  so this is a no-op stub — logic lives in convex/plans.ts quota check)
export const resetPlanQuotas = internalMutation({
  args: {},
  handler: async (_ctx) => {
    // Convex uses real-time month-based counting in plans.ts:
    //   count aiPlans where gymId = X and createdAt >= start-of-month
    // No persistent quota counter to reset — this job is kept as a hook
    // for future billing/overage notifications.
    console.log('[resetPlanQuotas] Monthly quota window reset (counted dynamically)');
  },
});
