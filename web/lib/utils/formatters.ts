/**
 * Utility functions for consistent data formatting across the DAO Portal
 */

/**
 * Format treasury value in USD with appropriate units (K, M, B)
 * @param value - Treasury value in USD
 * @returns Formatted string with appropriate unit
 */
export function formatTreasuryValue(value: number | null | undefined): string {
  if (!value || value < 0) return 'N/A';
  
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  } else {
    return `$${value.toFixed(0)}`;
  }
}

/**
 * Format participation rate (backend already returns percentage values)
 * @param rate - Participation rate as percentage (e.g., 5.47 means 5.47%)
 * @returns Formatted percentage string
 */
export function formatParticipationRate(rate: number | null | undefined): string {
  if (!rate || rate < 0) return 'N/A';
  
  // Backend already returns percentage values, no need to multiply by 100
  return `${rate.toFixed(1)}%`;
}

/**
 * Format member count with locale-specific formatting
 * @param count - Number of members
 * @returns Formatted member count string
 */
export function formatMemberCount(count: number | null | undefined): string {
  if (!count || count < 0) return 'N/A';
  
  return count.toLocaleString();
}

/**
 * Format health score with validation
 * @param score - Health score (0-100)
 * @returns Formatted health score string
 */
export function formatHealthScore(score: number | null | undefined): string {
  if (!score || score < 0 || score > 100) return 'N/A';
  
  return score.toFixed(1);
}

/**
 * Get participation rate color based on threshold values
 * @param rate - Participation rate as percentage
 * @returns CSS class for color indication
 */
export function getParticipationRateColor(rate: number | null | undefined): string {
  if (!rate) return 'bg-gray-300';
  
  if (rate > 10) return 'bg-green-500';
  if (rate > 5) return 'bg-yellow-500';
  return 'bg-red-500';
}
