/**
 * Formatting utility functions
 * Collection of functions for formatting data for display
 */

/**
 * Format speed from m/s to km/h
 * @param ms - Speed in m/s
 * @returns Formatted speed string or "-" if invalid
 */
export const formatKmh = (ms?: number) => {
  if (ms == null) return "-";
  return `${(ms * 3.6).toFixed(1)} km/h`;
};

/**
 * Get color based on consistency score
 * @param score - Consistency score (-1 to 1)
 * @returns Hex color code
 */
export const scoreColor = (score?: number) => {
  if (score == null) return "#94a3b8"; // Gray
  if (score > 0.7) return "#16a34a"; // Green
  if (score > 0.3) return "#f59e0b"; // Yellow
  return "#ef4444"; // Red
};

/**
 * Generate array of 24 hours (00-23)
 * Used for API requests
 */
export const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
