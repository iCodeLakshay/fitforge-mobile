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
    status:       v.union(
      v.literal('pending_approval'),
      v.literal('active'),
      v.literal('expiring_soon'),
      v.literal('grace_period'),
      v.literal('expired'),
      v.literal('archived'),
    ),
  },
  handler: async (ctx, { membershipId, status }) => {
    const mem = await ctx.db.get(membershipId);
    if (!mem) throw new Error("Membership not found");
    await requireGymOwner(ctx, mem.gymId);

    const allowedTransitions: Record<string, string[]> = {
      pending_approval: ['active', 'archived'],
      active: ['expiring_soon', 'grace_period', 'expired', 'archived'],
      expiring_soon: ['active', 'grace_period', 'expired', 'archived'],
      grace_period: ['active', 'expired', 'archived'],
      expired: ['active', 'archived'],
      archived: ['expired', 'active'],
    };

    const allowed = allowedTransitions[mem.status] ?? [];
    if (!allowed.includes(status)) {
      throw new Error(`Invalid status transition from ${mem.status} to ${status}`);
    }

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

// ─── Request to Join Gym (member self-join via gym code) ─────────────────────
export const requestJoin = mutation({
  args: { gymCode: v.string() },
  handler: async (ctx, { gymCode }) => {
    const callerId = await getAuthUserId(ctx);

    const gym = await ctx.db
      .query('gyms')
      .withIndex('by_gym_code', (q) => q.eq('gymCode', gymCode.toUpperCase()))
      .first();
    if (!gym) throw new Error('Gym not found. Check the code and try again.');

    const existing = await ctx.db
      .query('memberships')
      .withIndex('by_gym_member', (q) => q.eq('gymId', gym._id).eq('memberId', callerId))
      .filter((q) => q.neq(q.field('status'), 'archived'))
      .first();
    if (existing) throw new Error('You already have a membership at this gym.');

    const now = Date.now();
    const today = new Date(now).toISOString().split('T')[0];

    const membershipId = await ctx.db.insert('memberships', {
      gymId:     gym._id,
      memberId:  callerId,
      status:    'pending_approval',
      startDate: today,
      endDate:   today,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert('auditLog', {
      actor:        callerId,
      action:       'request_join',
      gymId:        gym._id,
      resourceType: 'membership',
      resourceId:   membershipId,
      createdAt:    now,
    });

    return { membershipId, gymId: gym._id, gymName: gym.name };
  },
});

// ─── Approve Join Request ─────────────────────────────────────────────────────
export const approveJoin = mutation({
  args: {
    membershipId:     v.id('memberships'),
    subscriptionType: v.string(),
    startDate:        v.string(),
    endDate:          v.string(),
    amountPaid:       v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const mem = await ctx.db.get(args.membershipId);
    if (!mem) throw new Error('Membership not found');
    if (mem.status !== 'pending_approval') throw new Error('Membership is not pending approval');

    const callerId = await requireGymOwner(ctx, mem.gymId);
    const now = Date.now();

    const endDate  = new Date(args.endDate);
    const daysLeft = Math.ceil((endDate.getTime() - now) / 86400000);
    const status   = daysLeft > 7 ? 'active' : daysLeft > 0 ? 'expiring_soon' : 'expired';

    await ctx.db.patch(args.membershipId, {
      status,
      subscriptionType: args.subscriptionType,
      startDate:        args.startDate,
      endDate:          args.endDate,
      amountPaid:       args.amountPaid ? args.amountPaid * 100 : undefined,
      updatedAt:        now,
    });

    if (args.amountPaid && args.amountPaid > 0) {
      await ctx.db.insert('payments', {
        membershipId: args.membershipId,
        gymId:        mem.gymId,
        memberId:     mem.memberId,
        amount:       args.amountPaid * 100,
        currency:     'INR',
        paymentMode:  'cash',
        status:       'paid',
        paidAt:       now,
        recordedBy:   callerId,
        createdAt:    now,
      });
    }

    await ctx.db.insert('auditLog', {
      actor:        callerId,
      action:       'approve_join',
      gymId:        mem.gymId,
      resourceType: 'membership',
      resourceId:   args.membershipId,
      details:      { subscriptionType: args.subscriptionType, endDate: args.endDate },
      createdAt:    now,
    });

    return { success: true };
  },
});

// ─── Reject Join Request ──────────────────────────────────────────────────────
export const rejectJoin = mutation({
  args: {
    membershipId: v.id('memberships'),
    reason:       v.optional(v.string()),
  },
  handler: async (ctx, { membershipId, reason }) => {
    const mem = await ctx.db.get(membershipId);
    if (!mem) throw new Error('Membership not found');
    if (mem.status !== 'pending_approval') throw new Error('Membership is not pending approval');

    const callerId = await requireGymOwner(ctx, mem.gymId);
    const now = Date.now();

    await ctx.db.patch(membershipId, {
      status:    'archived',
      notes:     reason,
      updatedAt: now,
    });

    await ctx.db.insert('auditLog', {
      actor:        callerId,
      action:       'reject_join',
      gymId:        mem.gymId,
      resourceType: 'membership',
      resourceId:   membershipId,
      details:      { reason },
      createdAt:    now,
    });

    return { success: true };
  },
});

// ─── Edit Subscription ────────────────────────────────────────────────────────
export const editSubscription = mutation({
  args: {
    membershipId:     v.id('memberships'),
    subscriptionType: v.string(),
    startDate:        v.string(),
    endDate:          v.string(),
    amountPaid:       v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const mem = await ctx.db.get(args.membershipId);
    if (!mem) throw new Error('Membership not found');

    const callerId = await requireGymOwner(ctx, mem.gymId);
    const now = Date.now();

    const endDate  = new Date(args.endDate);
    const daysLeft = Math.ceil((endDate.getTime() - now) / 86400000);
    const graceEnd = new Date(args.endDate);
    graceEnd.setDate(graceEnd.getDate() + 3);
    let status: string;
    if (daysLeft > 7)  status = 'active';
    else if (daysLeft > 0) status = 'expiring_soon';
    else               status = 'expired';

    await ctx.db.patch(args.membershipId, {
      subscriptionType: args.subscriptionType,
      startDate:        args.startDate,
      endDate:          args.endDate,
      graceEndDate:     graceEnd.toISOString().split('T')[0],
      status,
      amountPaid:       args.amountPaid ? args.amountPaid * 100 : mem.amountPaid,
      updatedAt:        now,
    });

    if (args.amountPaid && args.amountPaid > 0) {
      await ctx.db.insert('payments', {
        membershipId: args.membershipId,
        gymId:        mem.gymId,
        memberId:     mem.memberId,
        amount:       args.amountPaid * 100,
        currency:     'INR',
        paymentMode:  'cash',
        status:       'paid',
        paidAt:       now,
        recordedBy:   callerId,
        createdAt:    now,
      });
    }

    await ctx.db.insert('auditLog', {
      actor:        callerId,
      action:       'edit_subscription',
      gymId:        mem.gymId,
      resourceType: 'membership',
      resourceId:   args.membershipId,
      details:      {
        prev: { subscriptionType: mem.subscriptionType, endDate: mem.endDate },
        next: { subscriptionType: args.subscriptionType, endDate: args.endDate },
      },
      createdAt: now,
    });

    return { success: true };
  },
});

// ─── Edit Member Profile (shadow fields on users table) ───────────────────────
export const editProfile = mutation({
  args: {
    gymId:    v.id('gyms'),
    memberId: v.id('users'),
    name:     v.optional(v.string()),
    dob:      v.optional(v.string()),
    photoUrl: v.optional(v.string()),
  },
  handler: async (ctx, { gymId, memberId, name, dob, photoUrl }) => {
    const callerId = await requireGymOwner(ctx, gymId);
    const now = Date.now();

    const patch: Record<string, any> = {};
    if (name)     patch.name     = name;
    if (dob)      patch.dob      = dob;
    if (photoUrl) patch.photoUrl = photoUrl;

    if (Object.keys(patch).length === 0) return { success: true };

    await ctx.db.patch(memberId, patch);

    await ctx.db.insert('auditLog', {
      actor:        callerId,
      action:       'edit_profile',
      gymId,
      resourceType: 'user',
      resourceId:   memberId,
      details:      patch,
      createdAt:    now,
    });

    return { success: true };
  },
});

// ─── Archive / Unarchive Membership ──────────────────────────────────────────
export const archive = mutation({
  args: { membershipId: v.id('memberships') },
  handler: async (ctx, { membershipId }) => {
    const mem = await ctx.db.get(membershipId);
    if (!mem) throw new Error('Membership not found');
    const callerId = await requireGymOwner(ctx, mem.gymId);
    const now = Date.now();
    await ctx.db.patch(membershipId, { status: 'archived', updatedAt: now });
    await ctx.db.insert('auditLog', {
      actor: callerId, action: 'archive_membership', gymId: mem.gymId,
      resourceType: 'membership', resourceId: membershipId, createdAt: now,
    });
    return { success: true };
  },
});

export const unarchive = mutation({
  args: { membershipId: v.id('memberships') },
  handler: async (ctx, { membershipId }) => {
    const mem = await ctx.db.get(membershipId);
    if (!mem) throw new Error('Membership not found');
    const callerId = await requireGymOwner(ctx, mem.gymId);
    const now = Date.now();
    await ctx.db.patch(membershipId, { status: 'expired', updatedAt: now });
    await ctx.db.insert('auditLog', {
      actor: callerId, action: 'unarchive_membership', gymId: mem.gymId,
      resourceType: 'membership', resourceId: membershipId, createdAt: now,
    });
    return { success: true };
  },
});

// ─── List Pending Approvals ───────────────────────────────────────────────────
export const listPending = query({
  args: { gymId: v.id('gyms') },
  handler: async (ctx, { gymId }) => {
    await requireGymOwner(ctx, gymId);
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_gym_status', (q) => q.eq('gymId', gymId).eq('status', 'pending_approval'))
      .take(50);

    return Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.memberId);
        return { ...m, user };
      })
    );
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
