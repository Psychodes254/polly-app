import { PollActionResult } from '@/lib/types/poll-types';
import { AuthenticationError, AuthorizationError } from '@/lib/auth/auth-utils';
import { ValidationError } from '@/lib/validation/poll-validation';

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  DUPLICATE_VOTE_ERROR = 'DUPLICATE_VOTE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface StandardError {
  code: ErrorCode;
  message: string;
  details?: any;
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse<T = any>(error: unknown): PollActionResult<T> {
  let standardError: StandardError;

  if (error instanceof ValidationError) {
    standardError = {
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Validation failed',
      details: error.errors
    };
  } else if (error instanceof AuthenticationError) {
    standardError = {
      code: ErrorCode.AUTHENTICATION_ERROR,
      message: error.message
    };
  } else if (error instanceof AuthorizationError) {
    standardError = {
      code: ErrorCode.AUTHORIZATION_ERROR,
      message: error.message
    };
  } else if (error instanceof Error) {
    // Check for specific database errors
    if (error.message.includes('duplicate') || error.message.includes('already voted')) {
      standardError = {
        code: ErrorCode.DUPLICATE_VOTE_ERROR,
        message: 'You have already voted on this poll'
      };
    } else if (error.message.includes('not found')) {
      standardError = {
        code: ErrorCode.NOT_FOUND_ERROR,
        message: 'Resource not found'
      };
    } else {
      standardError = {
        code: ErrorCode.DATABASE_ERROR,
        message: error.message
      };
    }
  } else {
    standardError = {
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'An unexpected error occurred'
    };
  }

  return {
    success: false,
    error: standardError.message,
    data: standardError as unknown as T
  };
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(data?: T): PollActionResult<T> {
  return {
    success: true,
    data
  };
}

/**
 * Wraps an async operation with standardized error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>
): Promise<PollActionResult<T>> {
  try {
    const result = await operation();
    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse<T>(error);
  }
}