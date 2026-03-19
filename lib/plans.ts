/**
 * Photographer subscription plans configuration
 */

export type PlanId = "free" | "amateur" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  price: number | null; // null for free plan
  priceInterval: "month" | "year" | null;
  description: string;
  storageGB: number | null; // null for unlimited
  maxEvents: number | null; // null for unlimited
  salesFeePercent: number;
  allowCustomBundles: boolean;
  features: string[];
  popular?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: null,
    priceInterval: null,
    description: "Perfect for getting started and testing Picdemi",
    storageGB: 1,
    maxEvents: 3,
    salesFeePercent: 15,
    allowCustomBundles: false,
    features: [
      "1GB storage",
      "Up to 3 events",
      "Manual talent tagging",
      "Default pricing bundles only",
      "Basic search & analytics",
      "15% sales fee",
    ],
  },
  {
    id: "amateur",
    name: "Amateur",
    price: 9.99,
    priceInterval: "month",
    description: "For active creators who publish events regularly",
    storageGB: 20,
    maxEvents: 10,
    salesFeePercent: 10,
    allowCustomBundles: true,
    features: [
      "20GB storage",
      "Up to 10 events",
      "AI-assisted talent tagging",
      "Advanced analytics",
      "Custom pricing bundles",
      "Priority in search results",
      "Email support",
      "10% sales fee",
    ],
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 29.99,
    priceInterval: "month",
    description: "For professional photographers and studios",
    storageGB: 100,
    maxEvents: null, // Unlimited
    salesFeePercent: 8,
    allowCustomBundles: true,
    features: [
      "100GB storage included",
      "Unlimited events",
      "Add +100GB for $10/mo",
      "Full AI auto-tagging",
      "Advanced analytics & insights",
      //   "Priority indexing & search boost",
      "API access",
      "Priority support",
      "8% sales fee",
    ],
  },
];

export function getPlanById(id: PlanId): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}

export function formatPlanPrice(plan: Plan): string {
  if (plan.price === null) {
    return "Free";
  }
  return `$${plan.price}/${plan.priceInterval === "month" ? "mo" : "yr"}`;
}
