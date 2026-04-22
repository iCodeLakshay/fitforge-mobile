import { mutation, internalAction, internalQuery } from './_generated/server';
import { v } from 'convex/values';

/*
// ─── Send OTP ─────────────────────────────────────────────────────────────────
// Stores a hashed OTP in `otpSessions` then calls MSG91 via an Action.

export const sendOtp = mutation({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) => {
    // Invalidate existing sessions for this phone
    const existing = await ctx.db
      .query('otpSessions')
      .withIndex('by_phone', (q) => q.eq('phone', phone))
      .collect();
    await Promise.all(existing.map((s) => ctx.db.delete(s._id)));

    // DEV: static OTP until DLT + SMS provider is configured
    const otp = '123456';
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const sessionId = await ctx.db.insert('otpSessions', {
      phone,
      otpHash:   otp,
      expiresAt,
      isUsed:    false,
      attempts:  0,
    });

    return { success: true };
  },
});

// ─── Dispatch SMS via MSG91 ───────────────────────────────────────────────────
export const dispatchSms = internalAction({
  args: { phone: v.string(), otp: v.string() },
  handler: async (_ctx, { phone, otp }) => {
    const authKey  = process.env.MSG91_AUTH_KEY!;
    const template = process.env.MSG91_OTP_TEMPLATE_ID!;

    // In development, just log the OTP
    if (!authKey || authKey === 'dev') {
      console.log(`[DEV] OTP for ${phone}: ${otp}`);
      return;
    }

    const res = await fetch(
      `https://api.msg91.com/api/v5/otp?template_id=${template}&mobile=${phone.replace('+', '')}&authkey=${authKey}&otp=${otp}`,
      { method: 'GET' }
    );
    if (!res.ok) {
      console.error('[MSG91] Failed to send SMS', await res.text());
    }
  },
});

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export const verifyOtp = mutation({
  args: { phone: v.string(), otp: v.string() },
  handler: async (ctx, { phone, otp }) => {
    const session = await ctx.db
      .query('otpSessions')
      .withIndex('by_phone', (q) => q.eq('phone', phone))
      .order('desc')
      .first();

    if (!session)                        throw new Error('No OTP found. Request a new one.');
    if (session.isUsed)                  throw new Error('OTP already used.');
    if (Date.now() > session.expiresAt)  throw new Error('OTP expired. Request a new one.');
    if (session.attempts >= 3)           throw new Error('Too many attempts. Request a new OTP.');

    if (session.otpHash !== otp) {
      await ctx.db.patch(session._id, { attempts: session.attempts + 1 });
      throw new Error('Incorrect OTP. Please try again.');
    }

    // Mark session as used
    await ctx.db.patch(session._id, { isUsed: true });

    // Find or create user
    let user = await ctx.db
      .query('users')
      .withIndex('by_phone', (q) => q.eq('phone', phone))
      .first();

    const isNewUser = !user;

    if (!user) {
      const uid = await ctx.db.insert('users', {
        phone,
        role:      'member', // default; owner flow changes via onboarding
        isActive:  true,
        createdAt: Date.now(),
      });
      user = await ctx.db.get(uid);
    }

    if (!user) throw new Error('User creation failed');

    // Check if owner has a gym
    let gymId: string | undefined;
    if (user.role === 'owner') {
      const gym = await ctx.db
        .query('gyms')
        .withIndex('by_owner', (q) => q.eq('ownerId', user!._id))
        .first();
      gymId = gym?._id;
    }

    return {
      userId:    user._id,
      role:      user.role,
      gymId,
      isNewUser,
    };
  },
});
*/



// ─── Store User (Clerk integration) ───────────────────────────────────────────
export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Called storeUser without authentication present");

    const email = (identity.email ?? '').trim() || undefined;
    const fullName = (identity.name ?? '').trim() || undefined;

    // Look up by email (from Google) or phone. We currently keep this in `phone` for legacy schema compatibility.
    const identityStr = email || identity.phoneNumber || identity.subject;

    let user = await ctx.db
      .query('users')
      .withIndex('by_phone', (q) => q.eq('phone', identityStr))
      .first();

    const isNewUser = !user;

    if (!user) {
      const uid = await ctx.db.insert('users', {
        phone: identityStr,
        name: fullName,
        email,
        role: 'member', 
        isActive: true,
        createdAt: Date.now(),
      });
      user = await ctx.db.get(uid);
    } else {
      const patch: { name?: string; email?: string } = {};
      if (!user.name && fullName) patch.name = fullName;
      if (!user.email && email) patch.email = email;

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(user._id, patch);
        user = { ...user, ...patch };
      }
    }

    if (!user) throw new Error('User creation failed');

    let gymId: string | undefined;
    if (user.role === 'owner') {
      const gym = await ctx.db
        .query('gyms')
        .withIndex('by_owner', (q) => q.eq('ownerId', user!._id))
        .first();
      gymId = gym?._id;
    }

    return {
      userId: user._id,
      role: user.role,
      gymId,
      isNewUser,
    };
  },
});

export async function getAuthUserId(ctx: { auth: any, db: any }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  const identityStr = identity.email || identity.phoneNumber || identity.subject;
  const user = await ctx.db.query('users').withIndex('by_phone', (q: any) => q.eq('phone', identityStr)).first();
  if (!user) throw new Error("User not found");
  return user._id;
}

export async function requireGymOwner(ctx: { auth: any, db: any }, gymId: any) {
  const callerId = await getAuthUserId(ctx);
  const gym = await ctx.db.get(gymId);
  if (!gym || gym.ownerId !== callerId) throw new Error("Unauthorized: Must be gym owner");
  return callerId;
}

export async function requireGymOwnerOrMember(ctx: { auth: any, db: any }, gymId: any, memberId: any) {
  const callerId = await getAuthUserId(ctx);
  if (callerId === memberId) return callerId;
  const gym = await ctx.db.get(gymId);
  if (!gym || gym.ownerId !== callerId) throw new Error("Unauthorized: Must be gym owner or the member");
  return callerId;
}

export const requireOwnerAction = internalQuery({
  args: { gymId: v.id('gyms') },
  handler: async (ctx, { gymId }) => {
    return await requireGymOwner(ctx, gymId);
  }
});

