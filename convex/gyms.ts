import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId, requireGymOwner } from './auth';

// ─── Generate gym code ────────────────────────────────────────────────────────
function generateGymCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GYM-';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ─── Create Gym ───────────────────────────────────────────────────────────────
export const create = mutation({
  args: {
    name:    v.string(),
    city:    v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ownerId = await getAuthUserId(ctx);
    await ctx.db.patch(ownerId, { role: 'owner' });

    // Generate unique code
    let gymCode: string;
    let attempt = 0;
    do {
      gymCode = generateGymCode();
      attempt++;
      if (attempt > 20) throw new Error('Failed to generate a unique gym code');
    } while (await ctx.db.query('gyms').withIndex('by_gym_code', (q) => q.eq('gymCode', gymCode)).first());

    const gymId = await ctx.db.insert('gyms', {
      ownerId,
      name:          args.name,
      city:          args.city,
      address:       args.address,
      gymCode,
      fitforgePlan:  'free',
      isActive:      true,
      createdAt:     Date.now(),
    });
    return { gymId, gymCode };
  },
});

// ─── Get Gym ──────────────────────────────────────────────────────────────────
export const get = query({
  args: { gymId: v.id('gyms') },
  handler: async (ctx, { gymId }) => ctx.db.get(gymId),
});

// ─── Get Gym by Code ─────────────────────────────────────────────────────────
export const getByCode = query({
  args: { gymCode: v.string() },
  handler: async (ctx, { gymCode }) =>
    ctx.db.query('gyms').withIndex('by_gym_code', (q) => q.eq('gymCode', gymCode)).first(),
});

// ─── Get Gyms by Owner ────────────────────────────────────────────────────────
export const listByOwner = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await getAuthUserId(ctx);
    return ctx.db.query('gyms').withIndex('by_owner', (q) => q.eq('ownerId', ownerId)).collect();
  }
});

// ─── Owner Dashboard ──────────────────────────────────────────────────────────
export const getDashboard = query({
  args: { gymId: v.id('gyms') },
  handler: async (ctx, { gymId }) => {
    await requireGymOwner(ctx, gymId);
    const gym = await ctx.db.get(gymId);
    if (!gym) throw new Error('Gym not found');

    const now       = Date.now();
    const todayDate = new Date(now).toISOString().split('T')[0];

    // Active / expiring member counts
    const allMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_gym', (q) => q.eq('gymId', gymId))
      .collect();

    const activeMembers   = allMemberships.filter((m) => m.status === 'active').length;
    const expiringSoon    = allMemberships.filter((m) => m.status === 'expiring_soon');
    const graceMembers    = allMemberships.filter((m) => m.status === 'grace_period');
    const pendingApproval = allMemberships.filter((m) => m.status === 'pending_approval');

    // Today's check-ins (real-time)
    const todayAttendance = await ctx.db
      .query('attendance')
      .withIndex('by_gym_date', (q) => q.eq('gymId', gymId).eq('date', todayDate))
      .collect();

    // Revenue this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthPayments = await ctx.db
      .query('payments')
      .withIndex('by_gym', (q) => q.eq('gymId', gymId))
      .filter((q) =>
        q.and(
          q.eq(q.field('status'), 'paid'),
          q.gte(q.field('paidAt'), monthStart.getTime()),
        )
      )
      .collect();

    const monthRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);

    // Last 5 check-ins
    const recentAttendance = await ctx.db
      .query('attendance')
      .withIndex('by_gym_date', (q) => q.eq('gymId', gymId))
      .order('desc')
      .take(5);

    // Collect member names for recent check-ins
    const recentWithNames = await Promise.all(
      recentAttendance.map(async (a) => {
        const member = await ctx.db.get(a.memberId);
        return { ...a, memberName: member?.name ?? 'Unknown' };
      })
    );

    // Members expiring in next 7 days (for renewal section)
    const renewalAlerts = await Promise.all(
      [...expiringSoon, ...graceMembers].slice(0, 10).map(async (m) => {
        const member = await ctx.db.get(m.memberId);
        const endDate = new Date(m.endDate);
        const daysLeft = Math.ceil((endDate.getTime() - now) / 86400000);
        return {
          membershipId: m._id,
          memberId:     m.memberId,
          memberName:   member?.name ?? 'Unknown',
          status:       m.status,
          daysLeft,
          endDate:      m.endDate,
        };
      })
    );

    return {
      gym,
      stats: {
        activeMembers,
        todayCheckIns:    todayAttendance.length,
        expiringSoon:     expiringSoon.length,
        pendingApproval:  pendingApproval.length,
        monthRevenue:     monthRevenue / 100, // convert paise → rupees
      },
      renewalAlerts: renewalAlerts.sort((a, b) => a.daysLeft - b.daysLeft),
      recentAttendance: recentWithNames,
    };
  },
});

// ─── Update Gym ───────────────────────────────────────────────────────────────
export const update = mutation({
  args: {
    gymId:        v.id('gyms'),
    name:         v.optional(v.string()),
    address:      v.optional(v.string()),
    city:         v.optional(v.string()),
    phone:        v.optional(v.string()),
    email:        v.optional(v.string()),
    openingTime:  v.optional(v.string()),
    closingTime:  v.optional(v.string()),
    logoUrl:      v.optional(v.string()),
  },
  handler: async (ctx, { gymId, ...fields }) => {
    await requireGymOwner(ctx, gymId);
    await ctx.db.patch(gymId, fields);
    return { success: true };
  },
});

// ─── Regenerate Gym Code ──────────────────────────────────────────────────────
export const regenerateCode = mutation({
  args: { gymId: v.id('gyms') },
  handler: async (ctx, { gymId }) => {
    await requireGymOwner(ctx, gymId);
    let gymCode: string;
    do {
      gymCode = generateGymCode();
    } while (await ctx.db.query('gyms').withIndex('by_gym_code', (q) => q.eq('gymCode', gymCode)).first());
    await ctx.db.patch(gymId, { gymCode });
    return { gymCode };
  },
});
