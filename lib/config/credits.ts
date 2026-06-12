// ============================================
// Credit System Configuration
// ============================================

// Credit plans with monthly quotas and tool-specific costs
export const CREDIT_PLANS = {
  free: {
    monthlyQuota: 100,  // Customizable monthly quota
    toolCredits: {
      'ai-image-generator': 5,
      'video-editor': 3,
      'text-enhancer': 2,
      'code-generator': 2,
      'pdf-merger': 1,
      'default': 1,
    },
  },
  basic: {
    monthlyQuota: 500,
    toolCredits: {
      'ai-image-generator': 3,
      'video-editor': 2,
      'text-enhancer': 1,
      'code-generator': 1,
      'pdf-merger': 1,
      'default': 1,
    },
  },
  pro: {
    monthlyQuota: 2000,
    toolCredits: {
      'ai-image-generator': 2,
      'video-editor': 1,
      'text-enhancer': 0,
      'code-generator': 0,
      'pdf-merger': 0,
      'default': 0,
    },
  },
  enterprise: {
    monthlyQuota: -1,  // -1 indicates unlimited
    toolCredits: {
      'default': 0,  // All tools are free
    },
  },
} as const;

export type PlanType = keyof typeof CREDIT_PLANS;

/**
 * Get the credit cost for a specific tool under a given plan
 * @param plan - The subscription plan type
 * @param toolName - The name of the tool
 * @returns The number of credits required to use the tool
 */
export function getToolCreditCost(plan: PlanType, toolName: string): number {
  const planConfig = CREDIT_PLANS[plan];
  return planConfig.toolCredits[toolName as keyof typeof planConfig.toolCredits]
    ?? planConfig.toolCredits.default;
}

/**
 * Get the monthly quota for a given plan
 * @param plan - The subscription plan type
 * @returns The monthly credit quota (-1 for unlimited)
 */
export function getMonthlyQuota(plan: PlanType): number {
  return CREDIT_PLANS[plan].monthlyQuota;
}

/**
 * Check if a plan has unlimited credits
 * @param plan - The subscription plan type
 * @returns True if the plan has unlimited credits
 */
export function hasUnlimitedCredits(plan: PlanType): boolean {
  return CREDIT_PLANS[plan].monthlyQuota === -1;
}

/**
 * Calculate the next quota reset date (1st of next month)
 * @returns The next quota reset timestamp
 */
export function getNextQuotaResetDate(): Date {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  return nextMonth;
}
