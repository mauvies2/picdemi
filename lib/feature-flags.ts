/**
 * Feature Flags
 *
 * Centralized feature flag management.
 * In the future, this can be enhanced to:
 * - Read from environment variables
 * - Read from database/user preferences
 * - Support A/B testing
 * - Support gradual rollouts
 */

/**
 * Feature flag for AI Matching functionality
 * Set to false to disable AI matching feature across the application
 */
export const FEATURE_FLAGS = {
  AI_MATCHING: false, // Disabled - Coming soon
} as const;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature];
}
