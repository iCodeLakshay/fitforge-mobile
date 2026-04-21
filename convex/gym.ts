import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const getGym = query({
  args: { gymId: v.id('gyms') },
  handler: async (ctx, { gymId }) => {
    return await ctx.db.get(gymId);
  },
});

export const updateName = mutation({
  args: { gymId: v.id('gyms'), name: v.string() },
  handler: async (ctx, { gymId, name }) => {
    // Optionally check if user is the owner
    await ctx.db.patch(gymId, { name });
  },
});
