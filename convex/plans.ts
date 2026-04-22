import { query, action, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import Anthropic from '@anthropic-ai/sdk';
import { requireGymOwnerOrMember, requireGymOwner, getAuthUserId } from './auth';

export const getPlan = query({
  args: { planId: v.id('aiPlans') },
  handler: async (ctx, { planId }) => {
    const plan = await ctx.db.get(planId);
    if (!plan) return null;
    await requireGymOwnerOrMember(ctx, plan.gymId, plan.memberId);
    return plan;
  },
});

export const listForMember = query({
  args: { gymId: v.id('gyms') },
  handler: async (ctx, { gymId }) => {
    const callerId = await getAuthUserId(ctx);

    const gym = await ctx.db.get(gymId);
    if (!gym) throw new Error('Gym not found');

    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_gym_member', (q) => q.eq('gymId', gymId).eq('memberId', callerId))
      .filter((q) => q.neq(q.field('status'), 'archived'))
      .first();

    if (gym.ownerId !== callerId && !membership) {
      throw new Error('Unauthorized');
    }

    return await ctx.db
      .query('aiPlans')
      .withIndex('by_gym_member', (q) => q.eq('gymId', gymId).eq('memberId', callerId))
      .order('desc')
      .collect();
  },
});

export const generatePlan = action({
  args: {
    gymId:        v.id('gyms'),
    memberId:     v.id('users'),
    membershipId: v.id('memberships'),
    promptData: v.object({
      age:          v.number(),
      weight:       v.number(),
      height:       v.number(),
      goal:         v.string(),
      diet:         v.string(),
      medical:      v.optional(v.string()),
      daysPerWeek:  v.number(),
      experience:   v.string(),
    }),
  },
  handler: async (ctx, args): Promise<string> => {
    const callerId = await ctx.runQuery(internal.auth.requireOwnerAction, { gymId: args.gymId });
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Missing ANTHROPIC_API_KEY. Please add it to your Convex dashboard.");
    }

    const anthropic = new Anthropic({ apiKey });

    const prompt = `
      You are an expert fitness coach and nutritionist. Generate a personalized workout and meal plan.
      
      Client Profile:
      - Age: ${args.promptData.age}
      - Weight: ${args.promptData.weight}kg
      - Height: ${args.promptData.height}cm
      - Goal: ${args.promptData.goal.replace('_', ' ')}
      - Dietary Preference: ${args.promptData.diet}
      - Medical Conditions/Injuries: ${args.promptData.medical || 'None'}
      - Workout Days/Week: ${args.promptData.daysPerWeek}
      - Experience Level: ${args.promptData.experience}
      
      Format your response exactly like this:
      
      <workout_plan>
      (Markdown of the workout plan organized by days)
      </workout_plan>
      
      <meal_plan>
      (Markdown of the meal plan organized by meals)
      </meal_plan>
    `;

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1500,
      temperature: 0.7,
      system: "You are a professional fitness coach generating plans for the FitForge platform. Be encouraging, concise, and structured.",
      messages: [{ role: "user", content: prompt }]
    });

    const text = 'text' in response.content[0] ? response.content[0].text : '';

    const workoutMatch = text.match(/<workout_plan>([\s\S]*?)<\/workout_plan>/);
    const mealMatch = text.match(/<meal_plan>([\s\S]*?)<\/meal_plan>/);

    const workoutPlan = workoutMatch ? workoutMatch[1].trim() : "Plan generation failed.";
    const mealPlan = mealMatch ? mealMatch[1].trim() : "Plan generation failed.";

    // Get today as Monday of current week
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const weekStartDate = monday.toISOString().split('T')[0];

    const planId: string = await ctx.runMutation(internal.plans.savePlan, {
      gymId:          args.gymId,
      memberId:       args.memberId,
      membershipId:   args.membershipId,
      generatedBy:    callerId,
      weekStartDate,
      content: { workoutPlan, mealPlan },
      promptSnapshot: args.promptData,
    });

    return planId;
  },
});

export const savePlan = internalMutation({
  args: {
    gymId:          v.id('gyms'),
    memberId:       v.id('users'),
    membershipId:   v.id('memberships'),
    generatedBy:    v.id('users'),
    weekStartDate:  v.string(),
    content:        v.any(),
    promptSnapshot: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('aiPlans', {
      gymId:            args.gymId,
      memberId:         args.memberId,
      membershipId:     args.membershipId,
      generatedBy:      args.generatedBy,
      planType:         'combined',
      weekStartDate:    args.weekStartDate,
      status:           'delivered',
      content:          args.content,
      promptSnapshot:   args.promptSnapshot,
      generationNumber: 1,
      generatedAt:      Date.now(),
      deliveredAt:      Date.now(),
      createdAt:        Date.now(),
    });
  },
});
