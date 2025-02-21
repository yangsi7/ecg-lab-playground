/**
 * Centralized logger configuration using loglevel
 * This provides consistent logging across the application with proper log levels
 */
import log from 'loglevel';

// Set default level based on environment
const level = import.meta.env.DEV ? 'debug' : 'warn';
log.setLevel(level);

// Define logger interface for type safety
export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

// Create a wrapper to ensure consistent logging interface
const logger: Logger = {
  debug(message: string, context?: Record<string, unknown>) {
    log.debug(message, context);
  },
  info(message: string, context?: Record<string, unknown>) {
    log.info(message, context);
  },
  warn(message: string, context?: Record<string, unknown>) {
    log.warn(message, context);
  },
  error(message: string, context?: Record<string, unknown>) {
    log.error(message, context);
  }
};

// Prevent modifications to the logger
Object.freeze(logger);

// Export both named and default for flexibility
export { logger };
export default logger; 