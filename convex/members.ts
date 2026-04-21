import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId, requireGymOwner } from './auth';

// ─── Add Member (owner) ───────────────────────────────────────────────────────
export const add = mutation({
  args: {
    gymId:            v.id('gyms'),
    phone:            v.string(),
    name:             v.string(),
    email:            v.optional(v.string()),
    subscriptionType: v.optional(v.string()),
    amountPaid:       v.optional(v.number()),
    startDate:        v.string(),
    endDate:          v.string(),
    notes:            v.optional(v.string()),
    requireApproval:  v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const callerId = await requireGymOwner(ctx, args.gymId);
    
    // Find or create user
    let user = await ctx.db
      .query('users')
      .withIndex('by_phone', (q) => q.eq('phone', args.phone))
      .first();

    if (!user) {
      const uid = await ctx.db.insert('users', {
        phone:     args.phone,
        name:      args.name,
        email:     args.email,
        role:      'member',
        isActive:  true,
        createdAt: Date.now(),
      });
      user = await ctx.db.get(uid);
    } else if (args.name && !user.name) {
      await ctx.db.patch(user._id, { name: args.name });
    }

    if (!user) throw new Error('Failed to create user');

    // Check no active membership in this gym already
    const existing = await ctx.db
      .query('memberships')
      .withIndex('by_gym_member', (q) => q.eq('gymId', args.gymId).eq('memberId', user!._id))
      .filter((q) => q.neq(q.field('status'), 'archived'))
      .first();

    if (existing) throw new Error('Member already enrolled in this gym');

    // Calculate membership status
    const endDate   = new Date(args.endDate);
    const now       = Date.now();
    const daysLeft  = Math.ceil((endDate.getTime() - now) / 86400000);
    let   status: string;
    if (args.requireApproval)  status = 'pending_approval';
    else if (daysLeft > 7)     status = 'active';
    else if (daysLeft > 0)     status = 'expiring_soon';
    else                       status = 'expired';

    const membershipId = await ctx.db.insert('memberships', {
      gymId:            args.gymId,
      memberId:         user._id,
      status,
      subscriptionType: args.subscriptionType,
      amountPaid:       args.amountPaid ? args.amountPaid * 100 : undefined, // store in paise
      startDate:        args.startDate,
      endDate:          args.endDate,
      addedBy:          callerId,
      notes:            args.notes,
      joiningDate:      args.startDate,
      createdAt:        now,
      updatedAt:        now,
    });

    // Record payment if amount provided
    if (args.amountPaid && args.amountPaid > 0) {
      await ctx.db.insert('payments', {
        membershipId,
        gymId:       args.gymId,
        memberId:    user._id,
        amount:      args.amountPaid * 100,
        currency:    'INR',
        paymentMode: 'cash',
        status:      'paid',
        paidAt:      now,
        recordedBy:  callerId,
        createdAt:   now,
      });
    }

    return { membershipId, userId: user._id };
  },
});

// ─── List Members ─────────────────────────────────────────────────────────────
export const list = query({
  args: {
    gymId:  v.id('gyms'),
    status: v.optional(v.string()), // filter by status
  },
  handler: async (ctx, { gymId, status }) => {
    await requireGymOwner(ctx, gymId);
    let memberships = await ctx.db
      .query('memberships')
      .withIndex('by_gym', (q) => q.eq('gymId', gymId))
      .filter((q) => q.neq(q.field('status'), 'archived'))
      .collect();

    if (status) {
      memberships = memberships.filter((m) => m.status === status);
    }

    return Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.memberId);
        return { ...m, user };
      })
    );
  },
});

// ─── Get Member Detail ────────────────────────────────────────────────────────
export const getDetail = query({
  args: {
    gymId:    v.id('gyms'),
    memberId: v.id('users'),
  },
  handler: async (ctx, { gymId, memberId }) => {
    const callerId = await getAuthUserId(ctx);
    const gym = await ctx.db.get(gymId);
    if (!gym || (gym.ownerId !== callerId && callerId !== memberId)) throw new Error("Unauthorized");

    const user = await ctx.db.get(memberId);
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_gym_member', (q) => q.eq('gymId', gymId).eq('memberId', memberId))
      .filter((q) => q.neq(q.field('status'), 'archived'))
      .first();

    if (!user || !membership) return null;

    const healthProfile = await ctx.db
      .query('memberHealthProfiles')
      .withIndex('by_membership', (q) => q.eq('membershipId', membership._id))
      .first();

    // Attendance this month
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const thisMonthAttendance = await ctx.db
      .query('attendance')
      .withIndex('by_member', (q) => q.eq('memberId', memberId))
      .filter((q) => q.gte(q.field('checkInAt'), monthStart.getTime()))
      .collect();

    // AI plans this month
    const monthlyPlans = await ctx.db
      .query('aiPlans')
      .withIndex('by_gym_member', (q) => q.eq('gymId', gymId).eq('memberId', memberId))
      .filter((q) => q.gte(q.field('createdAt'), monthStart.getTime()))
      .collect();

    return {
      user,
      membership,
      healthProfile,
      thisMonthAttendanceDays: thisMonthAttendance.length,
      latestPlan: monthlyPlans.sort((a, b) => b.createdAt - a.createdAt)[0] ?? null,
      plansThisMonth: monthlyPlans.length,
    };
  },
});

// ─── Approve / Update Membership ─────────────────────────────────────────────
export const updateStatus = mutation({
  args: {
    membershipId: v.id('memberships'),
    status:       v.string(),
  },
  handler: async (ctx, { membershipId, status }) => {
    const mem = await ctx.db.get(membershipId);
    if (!mem) throw new Error("Membership not found");
    await requireGymOwner(ctx, mem.gymId);

    await ctx.db.patch(membershipId, { status, updatedAt: Date.now() });
    return { success: true };
  },
});

// ─── Update All Statuses (cron) ───────────────────────────────────────────────
export const updateAllStatuses = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now     = Date.now();
    const active  = await ctx.db
      .query('memberships')
      .filter((q) =>
        q.and(
          q.neq(q.field('status'), 'archived'),
          q.neq(q.field('status'), 'pending_approval'),
        )
      )
      .collect();

    for (const m of active) {
      const endDate     = new Date(m.endDate).getTime();
      const graceEndTs  = m.graceEndDate ? new Date(m.graceEndDate).getTime() : endDate + 3 * 86400000;
      const daysLeft    = Math.ceil((endDate - now) / 86400000);

      let newStatus: string = m.status;
      if (now > graceEndTs)               newStatus = 'expired';
      else if (now > endDate)             newStatus = 'grace_period';
      else if (daysLeft <= 7)             newStatus = 'expiring_soon';
      else                                newStatus = 'active';

      if (newStatus !== m.status) {
        await ctx.db.patch(m._id, { status: newStatus, updatedAt: now });
      }
    }
  },
});

// ─── Member's own subscriptions ───────────────────────────────────────────────
export const mySubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const callerId = await getAuthUserId(ctx);
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_member', (q) => q.eq('memberId', callerId))
      .filter((q) => q.neq(q.field('status'), 'archived'))
      .collect();

    return Promise.all(
      memberships.map(async (m) => {
        const gym = await ctx.db.get(m.gymId);
        return { ...m, gym };
      })
    );
  },
});
