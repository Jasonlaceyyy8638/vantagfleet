/** Types and constants for admin actions. Kept in a separate file so app/actions/admin.ts can be "use server" (async-only exports). */

export type CustomerRow = {
  id: string;
  name: string;
  usdot_number: string | null;
  stripe_customer_id: string | null;
  status: string;
  created_at: string;
};

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'none';

export type ChargeRow = {
  id: string;
  amount: number;
  currency: string;
  created: number;
  status: string;
  description: string | null;
  refunded: boolean;
  payment_intent: string | null;
};

export type ProfileRow = {
  profile_id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  org_id: string | null;
  org_name: string | null;
  role: string;
};

export type AdminStats = {
  totalRevenue: number;
  activeFleets: number;
  newSignupsThisWeek: number;
};

export type WishlistCounts = { geotab: number; samsara: number };

export type UserRequestRow = {
  id: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
};

export const ORG_FEATURE_KEYS = ['predictive_audit_ai', 'advanced_route_history'] as const;
export type OrgFeatureKey = (typeof ORG_FEATURE_KEYS)[number];

export type OrgTierAndFeatures = { tier: string | null; features: string[] };

/** FMCSA safety rating: Satisfactory, Conditional, Unsatisfactory, or None. */
export type SafetyRating = 'Satisfactory' | 'Conditional' | 'Unsatisfactory' | 'None' | null;

export type CarrierRow = {
  id: string;
  name: string;
  usdot_number: string | null;
  subscriptionStatus: SubscriptionStatus;
  safetyRating: SafetyRating;
};

export type CarrierIntegrationsRow = {
  id: string;
  name: string;
  usdot_number: string | null;
  integrations: string[];
};

export type MotiveDriverRow = {
  id: string;
  name: string;
  org_id: string;
  org_name: string;
  motive_id: string;
};

export type SupportMessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  org_id: string;
  content: string;
  created_at: string;
};

export type SupportConversationRow = {
  org_id: string;
  org_name: string;
  last_at: string;
  last_preview: string | null;
};
