/**
 * Mathematical utility functions
 * Collection of mathematical operations used throughout the application
 */

/**
 * Convert degrees to radians
 * @param d - Angle in degrees
 * @returns Angle in radians
 */
export const toRad = (d: number) => (d * Math.PI) / 180;

/**
 * Convert radians to degrees
 * @param r - Angle in radians
 * @returns Angle in degrees
 */
export const toDeg = (r: number) => (r * 180) / Math.PI;

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in meters
 */
export const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + 
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

/**
 * Calculate bearing between two points
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Bearing in degrees (0-360)
 */
export const bearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - 
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

/**
 * Calculate the difference between two angles
 * @param a - First angle in degrees
 * @param b - Second angle in degrees
 * @returns Angle difference in degrees (0-180)
 */
export const angleDiff = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

/**
 * Safely convert a value to a number
 * @param x - Value to convert
 * @returns Number if valid, undefined otherwise
 */
export const coerceNumber = (x: unknown): number | undefined => {
  if (x == null) return undefined;
  const n = Number(x);
  return Number.isFinite(n) ? n : undefined;
};
