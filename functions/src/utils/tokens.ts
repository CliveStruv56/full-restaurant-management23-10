/**
 * Token Generation Utilities
 *
 * Provides cryptographically secure token generation for invitation system
 */

import * as crypto from 'crypto';

/**
 * Generate a cryptographically secure random token
 *
 * Returns a 64-character hex string (32 bytes)
 * This provides 2^256 possible values, making brute force attacks impossible
 *
 * @returns {string} 64-character hex token
 */
export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calculate expiration time for invitation
 *
 * @param hoursFromNow Number of hours until expiration (default: 72)
 * @returns ISO 8601 timestamp
 */
export function calculateExpirationTime(hoursFromNow: number = 72): string {
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + hoursFromNow);
  return expirationDate.toISOString();
}

/**
 * Check if an invitation has expired
 *
 * @param expiresAt ISO 8601 timestamp
 * @returns true if expired, false otherwise
 */
export function isInvitationExpired(expiresAt: string): boolean {
  const expirationDate = new Date(expiresAt);
  const now = new Date();
  return now > expirationDate;
}

/**
 * Format a date for human-readable display in emails
 *
 * @param isoDate ISO 8601 timestamp
 * @returns Human-readable date string (e.g., "October 28, 2025 at 3:30 PM")
 */
export function formatDateForEmail(isoDate: string): string {
  const date = new Date(isoDate);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  return date.toLocaleString('en-US', options);
}
