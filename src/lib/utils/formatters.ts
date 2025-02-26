/**
 * Utility functions for formatting dates, times, and durations
 */

/**
 * Format a date string to a readable format
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid date';
    
    // Format: Jan 15, 2023
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (err) {
    console.error('Date formatting error:', err);
    return 'Error';
  }
}

/**
 * Format a duration in minutes to a readable format
 * @param minutes - Duration in minutes
 * @returns Formatted duration string (e.g., "2d 5h", "3h 30m", "45m")
 */
export function formatDuration(minutes: number): string {
  if (minutes === undefined || minutes === null || isNaN(minutes)) return 'N/A';
  
  // Round to nearest minute
  minutes = Math.round(minutes);
  
  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const remainingMinutes = minutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${remainingMinutes}m`;
}

/**
 * Format a number as a percentage
 * @param value - Value to format as percentage
 * @param total - Total value (denominator)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, total: number, decimals = 0): string {
  if (total === 0 || isNaN(value) || isNaN(total)) return '0%';
  
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format a number with thousand separators
 * @param value - Number to format
 * @returns Formatted number string with thousand separators
 */
export function formatNumber(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  
  return value.toLocaleString('en-US');
} 