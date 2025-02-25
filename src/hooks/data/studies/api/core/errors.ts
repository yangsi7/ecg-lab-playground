import { SupabaseError, RPCError } from '../../../types/utils';

// Re-export base errors
export { SupabaseError, RPCError };

// Hook-specific errors
export class QueryError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'QueryError';
  }
}

export class MutationError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MutationError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Error utilities
export function isSupabaseError(error: unknown): error is SupabaseError {
  return error instanceof SupabaseError;
}

export function isRPCError(error: unknown): error is RPCError {
  return error instanceof RPCError;
}

export function isQueryError(error: unknown): error is QueryError {
  return error instanceof QueryError;
}

export function isMutationError(error: unknown): error is MutationError {
  return error instanceof MutationError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
} 