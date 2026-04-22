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

// ─── Upsert Health Profile (all 15 PRD fields) ───────────────────────────────
export const upsert = mutation({
  args: {
    gymId:              v.id('gyms'),
    memberId:           v.id('users'),
    membershipId:       v.id('memberships'),
    // Physical
    age:                v.optional(v.number()),
    weightKg:           v.optional(v.number()),
    heightCm:           v.optional(v.number()),
    gender:             v.optional(v.string()),
    // Goals
    physiqueGoal:       v.optional(v.string()),
    activityLevel:      v.optional(v.string()),
    gymDaysPerWeek:     v.optional(v.number()),
    equipmentAvailable: v.optional(v.array(v.string())),
    fitnessLevel:       v.optional(v.string()),
    // Diet
    dietaryPreference:  v.optional(v.string()),
    foodAllergies:      v.optional(v.string()),
    appetiteSize:       v.optional(v.string()),
    mealFrequency:      v.optional(v.number()),
    // Medical
    medicalConditions:  v.optional(v.string()),
    injuryNotes:        v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireGymOwnerOrMember(ctx, args.gymId, args.memberId);

    const existing = await ctx.db
      .query('memberHealthProfiles')
      .withIndex('by_gym_member', (q) => q.eq('gymId', args.gymId).eq('memberId', args.memberId))
      .first();

    const bmi =
      args.weightKg && args.heightCm
        ? parseFloat((args.weightKg / Math.pow(args.heightCm / 100, 2)).toFixed(1))
        : undefined;

    const data = {
      gymId:              args.gymId,
      memberId:           args.memberId,
      membershipId:       args.membershipId,
      age:                args.age,
      weightKg:           args.weightKg,
      heightCm:           args.heightCm,
      gender:             args.gender,
      bmi,
      physiqueGoal:       args.physiqueGoal,
      activityLevel:      args.activityLevel,
      gymDaysPerWeek:     args.gymDaysPerWeek,
      equipmentAvailable: args.equipmentAvailable,
      fitnessLevel:       args.fitnessLevel,
      dietaryPreference:  args.dietaryPreference,
      foodAllergies:      args.foodAllergies,
      appetiteSize:       args.appetiteSize,
      mealFrequency:      args.mealFrequency,
      medicalConditions:  args.medicalConditions,
      injuryNotes:        args.injuryNotes,
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
