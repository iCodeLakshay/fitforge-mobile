import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { requireGymOwnerOrMember } from './auth';

// ─── Get Health Profile ───────────────────────────────────────────────────────
export const get = query({
  args: {
    gymId:    v.id('gyms'),
    memberId: v.id('users'),
  },
  handler: async (ctx, { gymId, memberId }) => {
    await requireGymOwnerOrMember(ctx, gymId, memberId);
    return await ctx.db
      .query('memberHealthProfiles')
      .withIndex('by_gym_member', (q) => q.eq('gymId', gymId).eq('memberId', memberId))
      .first();
  },
});

// ─── Upsert Health Profile ────────────────────────────────────────────────────
export const upsert = mutation({
  args: {
    gymId:        v.id('gyms'),
    memberId:     v.id('users'),
    membershipId: v.id('memberships'),
    age:          v.number(),
    weightKg:     v.number(),
    heightCm:     v.number(),
    goal:         v.string(),
    dietaryPref:  v.string(),
    medicalCondition: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireGymOwnerOrMember(ctx, args.gymId, args.memberId);
    const existing = await ctx.db
      .query('memberHealthProfiles')
      .withIndex('by_gym_member', (q) => q.eq('gymId', args.gymId).eq('memberId', args.memberId))
      .first();

    const data = {
      gymId:              args.gymId,
      memberId:           args.memberId,
      membershipId:       args.membershipId,
      age:                args.age,
      weightKg:           args.weightKg,
      heightCm:           args.heightCm,
      physiqueGoal:       args.goal,
      dietaryPreference:  args.dietaryPref,
      medicalConditions:  args.medicalCondition,
      updatedAt:          Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert('memberHealthProfiles', data);
    }
  },
});
