import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { requireGymOwnerOrMember, requireGymOwner, getAuthUserId } from './auth';

// ─── Mark Attendance (Scanner or Manual) ───────────────────────────────────────
export const mark = mutation({
  args: {
    gymId:        v.id('gyms'),
    memberId:     v.id('users'),
    method:       v.union(v.literal('manual'), v.literal('qr_scan'), v.literal('biometric')),
  },
  handler: async (ctx, args) => {
    const callerId = await requireGymOwnerOrMember(ctx, args.gymId, args.memberId);
    // Find the membership for this gym+member
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_gym_member', (q) => q.eq('gymId', args.gymId).eq('memberId', args.memberId))
      .filter((q) => q.neq(q.field('status'), 'archived'))
      .first();

    if (!membership) {
      throw new Error('No active membership found for this gym');
    }

    if (membership.status === 'expired') {
      throw new Error('Membership is expired. Cannot check-in.');
    }

    // Today's date string for the date field + duplicate check
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    // Check if already checked in today using by_membership_date index
    const existingCheckIn = await ctx.db
      .query('attendance')
      .withIndex('by_membership_date', (q) => q.eq('membershipId', membership._id).eq('date', dateStr))
      .first();

    if (existingCheckIn) {
      throw new Error('Already checked in today');
    }

    const attendanceId = await ctx.db.insert('attendance', {
      membershipId: membership._id,
      gymId:        args.gymId,
      memberId:     args.memberId,
      checkInAt:    Date.now(),
      method:       args.method,
      isOverride:   false,
      date:         dateStr,
      loggedBy:     callerId,
    });

    const user = await ctx.db.get(args.memberId);

    return {
      success: true,
      attendanceId,
      memberName: user?.name,
    };
  },
});

// ─── List Today's Attendance for Gym ───────────────────────────────────────────
export const listToday = query({
  args: { gymId: v.id('gyms') },
  handler: async (ctx, { gymId }) => {
    await requireGymOwner(ctx, gymId);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const attendances = await ctx.db
      .query('attendance')
      .withIndex('by_gym_date', (q) => q.eq('gymId', gymId).eq('date', today))
      .order('desc')
      .collect();

    return Promise.all(
      attendances.map(async (a) => {
        const user = await ctx.db.get(a.memberId);
        return { ...a, user };
      })
    );
  },
});

// ─── List Member's Attendance History ─────────────────────────────────────────
export const listForMember = query({
  args: {},
  handler: async (ctx) => {
    const memberId = await getAuthUserId(ctx);
    return await ctx.db
      .query('attendance')
      .withIndex('by_member', (q) => q.eq('memberId', memberId))
      .order('desc')
      .collect();
  },
});
