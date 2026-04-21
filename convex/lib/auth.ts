import { GenericQueryCtx, GenericMutationCtx } from 'convex/server';
import { DataModel } from '../_generated/dataModel';
import { Id } from '../_generated/dataModel';

type AnyCtx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;

// ─── Validate session token → returns user ────────────────────────────────────
export async function requireSession(ctx: AnyCtx, sessionToken: string) {
  const session = await ctx.db
    .query('sessions')
    .withIndex('by_token', (q) => q.eq('token', sessionToken))
    .first();

  if (!session || session.expiresAt < Date.now()) {
    throw new Error('Unauthorized: session expired or invalid');
  }

  const user = await ctx.db.get(session.userId);
  if (!user) throw new Error('Unauthorized: user not found');

  return { user, session };
}

// ─── Require caller is owner of the given gym ─────────────────────────────────
export async function requireGymOwner(
  ctx: AnyCtx,
  sessionToken: string,
  gymId: Id<'gyms'>,
) {
  const { user } = await requireSession(ctx, sessionToken);
  const gym = await ctx.db.get(gymId);
  if (!gym) throw new Error('Gym not found');
  if (gym.ownerId !== user._id) throw new Error('Forbidden: not gym owner');
  return { user, gym };
}

// ─── Require caller is owner, staff, or active member of the given gym ────────
export async function requireGymAccess(
  ctx: AnyCtx,
  sessionToken: string,
  gymId: Id<'gyms'>,
) {
  const { user } = await requireSession(ctx, sessionToken);
  const gym = await ctx.db.get(gymId);
  if (!gym) throw new Error('Gym not found');

  if (gym.ownerId === user._id) {
    return { user, gym, accessRole: 'owner' as const };
  }

  // Check staff
  const staffRows = await ctx.db
    .query('gymStaff')
    .withIndex('by_user', (q) => q.eq('userId', user._id))
    .collect();
  const staff = staffRows.find((s) => s.gymId === gymId && s.isActive);
  if (staff) {
    return { user, gym, accessRole: staff.role as 'trainer' | 'front_desk' };
  }

  // Check membership
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_gym_member', (q) => q.eq('gymId', gymId).eq('memberId', user._id))
    .filter((q) => q.neq(q.field('status'), 'archived'))
    .first();
  if (membership) {
    return { user, gym, accessRole: 'member' as const };
  }

  throw new Error('Forbidden: no access to this gym');
}

// ─── Write an audit entry (only in mutations) ─────────────────────────────────
export async function writeAudit(
  ctx: GenericMutationCtx<DataModel>,
  actor: Id<'users'>,
  action: string,
  resourceType: string,
  resourceId: string,
  gymId?: Id<'gyms'>,
  details?: unknown,
) {
  await ctx.db.insert('auditLog', {
    actor,
    action,
    gymId,
    resourceType,
    resourceId,
    details,
    createdAt: Date.now(),
  });
}
