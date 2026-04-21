import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { requireGymOwner } from './auth';

// ─── Record Manual Payment (Cash / UPI outside system) ────────────────────────
export const recordManual = mutation({
  args: {
    gymId:        v.id('gyms'),
    memberId:     v.id('users'),
    membershipId: v.id('memberships'),
    amount:       v.number(), // in Rupees
    paymentMode:  v.string(), // 'cash' or 'upi'
  },
  handler: async (ctx, args) => {
    const callerId = await requireGymOwner(ctx, args.gymId);
    const now = Date.now();
    
    // Insert payment record
    const paymentId = await ctx.db.insert('payments', {
      gymId:        args.gymId,
      memberId:     args.memberId,
      membershipId: args.membershipId,
      amount:       args.amount * 100, // store in paise
      currency:     'INR',
      paymentMode:  args.paymentMode,
      status:       'paid',
      paidAt:       now,
      recordedBy:   callerId,
      createdAt:    now,
    });

    // Update membership status if pending_approval or expired
    const membership = await ctx.db.get(args.membershipId);
    if (membership && (membership.status === 'pending_approval' || membership.status === 'expired')) {
      await ctx.db.patch(membership._id, { 
        status: 'active',
        updatedAt: now 
      });
    }

    return paymentId;
  },
});

// ─── List Payments for a Gym ──────────────────────────────────────────────────
export const listForGym = query({
  args: { gymId: v.id('gyms') },
  handler: async (ctx, { gymId }) => {
    await requireGymOwner(ctx, gymId);
    const payments = await ctx.db
      .query('payments')
      .withIndex('by_gym', (q) => q.eq('gymId', gymId))
      .order('desc')
      .take(50); // limit for now

    return Promise.all(
      payments.map(async (p) => {
        const user = await ctx.db.get(p.memberId);
        return { ...p, user };
      })
    );
  },
});
