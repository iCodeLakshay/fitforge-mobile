import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // ─── USERS ─────────────────────────────────────────────────────────────────
  users: defineTable({
    phone:      v.string(),             // E.164: +919876543210
    name:       v.optional(v.string()),
    email:      v.optional(v.string()),
    photoUrl:   v.optional(v.string()),
    dob:        v.optional(v.string()), // YYYY-MM-DD
    gender:     v.optional(v.string()), // male|female|other
    role:       v.union(v.literal('owner'), v.literal('member')),
    isActive:   v.boolean(),
    fcmToken:   v.optional(v.string()), // Firebase push token
    createdAt:  v.number(),             // Unix ms
  })
    .index('by_phone', ['phone'])
    .index('by_role',  ['role']),

  // ─── OTP SESSIONS ─────────────────────────────────────────────────────────
  otpSessions: defineTable({
    phone:      v.string(),
    otpHash:    v.string(),             // bcrypt hash of 6-digit OTP
    expiresAt:  v.number(),             // Unix ms
    isUsed:     v.boolean(),
    attempts:   v.number(),             // max 3 verify attempts
  })
    .index('by_phone',   ['phone'])
    .index('by_expires', ['expiresAt']),

  // ─── GYMS ─────────────────────────────────────────────────────────────────
  gyms: defineTable({
    ownerId:              v.id('users'),
    name:                 v.string(),
    address:              v.optional(v.string()),
    city:                 v.optional(v.string()),
    pincode:              v.optional(v.string()),
    phone:                v.optional(v.string()),
    email:                v.optional(v.string()),
    logoUrl:              v.optional(v.string()),
    gymCode:              v.string(),   // GYM-RK92X (8-char unique)
    openingTime:          v.optional(v.string()), // HH:MM
    closingTime:          v.optional(v.string()),
    fitforgePlan:         v.union(
                            v.literal('free'),
                            v.literal('pro'),
                            v.literal('pro_plus'),
                          ),
    planExpiresAt:        v.optional(v.number()),
    razorpayCustomerId:   v.optional(v.string()),
    isActive:             v.boolean(),
    createdAt:            v.number(),
  })
    .index('by_gym_code', ['gymCode'])
    .index('by_owner',    ['ownerId']),

  // ─── GYM STAFF ────────────────────────────────────────────────────────────
  gymStaff: defineTable({
    gymId:    v.id('gyms'),
    userId:   v.id('users'),
    role:     v.union(v.literal('trainer'), v.literal('front_desk')),
    isActive: v.boolean(),
    addedAt:  v.number(),
  })
    .index('by_gym',  ['gymId'])
    .index('by_user', ['userId']),

  // ─── MEMBERSHIPS ──────────────────────────────────────────────────────────
  memberships: defineTable({
    gymId:            v.id('gyms'),
    memberId:         v.id('users'),
    status:           v.string(), // pending_approval|active|expiring_soon|grace_period|expired|archived
    subscriptionType: v.optional(v.string()), // monthly|quarterly|half_yearly|yearly|custom
    amountPaid:       v.optional(v.number()),
    startDate:        v.string(), // YYYY-MM-DD
    endDate:          v.string(), // YYYY-MM-DD
    graceEndDate:     v.optional(v.string()),
    addedBy:          v.optional(v.id('users')), // who enrolled member
    notes:            v.optional(v.string()),
    memberNumber:     v.optional(v.string()), // GYM sequential number
    joiningDate:      v.optional(v.string()), // YYYY-MM-DD (original join)
    createdAt:        v.number(),
    updatedAt:        v.number(),
  })
    .index('by_gym',        ['gymId'])
    .index('by_member',     ['memberId'])
    .index('by_gym_status', ['gymId', 'status'])
    .index('by_gym_member', ['gymId', 'memberId'])
    .index('by_end_date',   ['endDate']),

  // ─── ATTENDANCE ───────────────────────────────────────────────────────────
  attendance: defineTable({
    membershipId:   v.id('memberships'),
    gymId:          v.id('gyms'),
    memberId:       v.id('users'),
    checkInAt:      v.number(),  // Unix ms
    checkOutAt:     v.optional(v.number()),
    sessionMinutes: v.optional(v.number()),
    loggedBy:       v.optional(v.id('users')), // staff/owner who manually logged
    method:         v.union(v.literal('manual'), v.literal('qr_scan'), v.literal('biometric')),
    isOverride:     v.boolean(),
    overrideNote:   v.optional(v.string()),
    date:           v.string(),  // YYYY-MM-DD (for calendar queries)
  })
    .index('by_gym_date',  ['gymId', 'date'])
    .index('by_member',    ['memberId', 'checkInAt'])
    .index('by_membership_date', ['membershipId', 'date']),

  // ─── MEMBER HEALTH PROFILES ───────────────────────────────────────────────
  memberHealthProfiles: defineTable({
    membershipId:       v.id('memberships'),
    gymId:              v.id('gyms'),
    memberId:           v.id('users'),
    // Physical
    weightKg:           v.optional(v.number()),
    heightCm:           v.optional(v.number()),
    age:                v.optional(v.number()),
    gender:             v.optional(v.string()),
    bmi:                v.optional(v.number()),
    // Goals
    physiqueGoal:       v.optional(v.string()), // weight_loss|muscle_gain|maintain_tone|athletic
    activityLevel:      v.optional(v.string()), // sedentary|lightly_active|active|very_active
    gymDaysPerWeek:     v.optional(v.number()),
    equipmentAvailable: v.optional(v.array(v.string())), // dumbbells|barbell|machines|bodyweight
    fitnessLevel:       v.optional(v.string()),           // beginner|intermediate|advanced
    // Diet
    dietaryPreference:  v.optional(v.string()), // vegetarian|non_veg|vegan|eggetarian
    foodAllergies:      v.optional(v.string()),
    appetiteSize:       v.optional(v.string()),  // small|medium|large
    mealFrequency:      v.optional(v.number()),  // 2-6
    // Medical
    medicalConditions:  v.optional(v.string()),
    injuryNotes:        v.optional(v.string()),
    updatedAt:          v.number(),
  })
    .index('by_membership', ['membershipId'])
    .index('by_gym_member', ['gymId', 'memberId']),

  // ─── AI PLANS ─────────────────────────────────────────────────────────────
  aiPlans: defineTable({
    membershipId:       v.id('memberships'),
    gymId:              v.id('gyms'),
    memberId:           v.id('users'),
    generatedBy:        v.id('users'),   // owner/staff who triggered
    planType:           v.union(v.literal('meal'), v.literal('workout'), v.literal('combined')),
    weekStartDate:      v.string(),      // YYYY-MM-DD (Monday)
    status:             v.union(
                          v.literal('generating'),
                          v.literal('draft'),
                          v.literal('delivered'),
                          v.literal('archived'),
                        ),
    content:            v.optional(v.any()),  // Structured JSON plan from Claude
    pdfUrl:             v.optional(v.string()),
    generationNumber:   v.number(),           // Nth plan for this member this month
    promptSnapshot:     v.optional(v.any()),  // Health profile snapshot used
    errorMessage:       v.optional(v.string()),
    generatedAt:        v.optional(v.number()),
    deliveredAt:        v.optional(v.number()),
    createdAt:          v.number(),
  })
    .index('by_membership',  ['membershipId'])
    .index('by_gym_member',  ['gymId', 'memberId'])
    .index('by_gym',         ['gymId', 'createdAt']),

  // ─── PAYMENTS ─────────────────────────────────────────────────────────────
  payments: defineTable({
    membershipId:         v.id('memberships'),
    gymId:                v.id('gyms'),
    memberId:             v.id('users'),
    amount:               v.number(),     // in paise (INR smallest unit)
    currency:             v.string(),     // INR
    paymentMode:          v.optional(v.string()), // cash|online|upi|card|razorpay_link
    razorpayOrderId:      v.optional(v.string()),
    razorpayPaymentId:    v.optional(v.string()),
    razorpayLinkId:       v.optional(v.string()),
    razorpayLinkUrl:      v.optional(v.string()),
    status:               v.string(),    // pending|paid|failed|refunded|partial
    paidAt:               v.optional(v.number()),
    recordedBy:           v.optional(v.id('users')),
    notes:                v.optional(v.string()),
    renewalPeriod:        v.optional(v.string()), // YYYY-MM-DD to YYYY-MM-DD
    createdAt:            v.number(),
  })
    .index('by_gym',        ['gymId', 'createdAt'])
    .index('by_membership', ['membershipId'])
    .index('by_status',     ['gymId', 'status']),

  // ─── SESSIONS ─────────────────────────────────────────────────────────────────
  sessions: defineTable({
    userId:    v.id('users'),
    token:     v.string(),    // random 64-char hex
    expiresAt: v.number(),    // Unix ms (+30 days)
    createdAt: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_user',  ['userId']),

  // ─── AUDIT LOG ────────────────────────────────────────────────────────────────
  auditLog: defineTable({
    actor:        v.id('users'),
    action:       v.string(),
    gymId:        v.optional(v.id('gyms')),
    resourceType: v.string(),
    resourceId:   v.string(),
    details:      v.optional(v.any()),
    createdAt:    v.number(),
  })
    .index('by_gym',   ['gymId', 'createdAt'])
    .index('by_actor', ['actor', 'createdAt']),

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────
  notifications: defineTable({
    userId:    v.id('users'),
    gymId:     v.optional(v.id('gyms')),
    type:      v.string(), // expiry_reminder|payment_due|plan_delivered|check_in|system
    title:     v.optional(v.string()),
    body:      v.optional(v.string()),
    data:      v.optional(v.any()),  // deep link data
    isRead:    v.boolean(),
    sentAt:    v.number(),
    fcmSent:   v.optional(v.boolean()),
  })
    .index('by_user',     ['userId', 'sentAt'])
    .index('by_user_unread', ['userId', 'isRead']),
});
