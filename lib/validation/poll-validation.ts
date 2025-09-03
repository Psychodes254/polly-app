import { CreatePollInput, VotePollInput, DeletePollInput, ValidationResult } from '@/lib/types/poll-types';

export class ValidationError extends Error {
  constructor(public errors: string[]) {
    super(`Validation failed: ${errors.join(', ')}`);
    this.name = 'ValidationError';
  }
}

/**
 * Validates poll creation input
 */
export function validateCreatePollInput(input: CreatePollInput): ValidationResult {
  const errors: string[] = [];

  // Validate title
  if (!input.title || input.title.trim() === '') {
    errors.push('Poll title is required');
  } else if (input.title.trim().length > 200) {
    errors.push('Poll title must be 200 characters or less');
  }

  // Validate description
  if (input.description && input.description.length > 1000) {
    errors.push('Poll description must be 1000 characters or less');
  }

  // Validate creator ID
  if (!input.creatorId || input.creatorId.trim() === '') {
    errors.push('Creator ID is required');
  }

  // Validate options
  if (!input.options || !Array.isArray(input.options)) {
    errors.push('Poll options must be provided as an array');
  } else {
    const validOptions = input.options.filter(option => 
      typeof option === 'string' && option.trim() !== ''
    );
    
    if (validOptions.length < 2) {
      errors.push('At least 2 valid options are required');
    }
    
    if (validOptions.length > 10) {
      errors.push('Maximum 10 options are allowed');
    }
    
    // Check for duplicate options
    const uniqueOptions = new Set(validOptions.map(opt => opt.trim().toLowerCase()));
    if (uniqueOptions.size !== validOptions.length) {
      errors.push('Poll options must be unique');
    }
  }

  // Validate expiration date
  if (input.expiresAt) {
    const expirationDate = new Date(input.expiresAt);
    if (isNaN(expirationDate.getTime())) {
      errors.push('Invalid expiration date format');
    } else if (expirationDate <= new Date()) {
      errors.push('Expiration date must be in the future');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates vote input
 */
export function validateVotePollInput(input: VotePollInput): ValidationResult {
  const errors: string[] = [];

  if (!input.pollId || input.pollId.trim() === '') {
    errors.push('Poll ID is required');
  }

  if (!input.optionId || input.optionId.trim() === '') {
    errors.push('Option ID is required');
  }

  if (!input.voterId || input.voterId.trim() === '') {
    errors.push('Voter ID is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates delete poll input
 */
export function validateDeletePollInput(input: DeletePollInput): ValidationResult {
  const errors: string[] = [];

  if (!input.pollId || input.pollId.trim() === '') {
    errors.push('Poll ID is required');
  }

  if (!input.userId || input.userId.trim() === '') {
    errors.push('User ID is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Throws ValidationError if input is invalid
 */
export function assertValidInput<T>(input: T, validator: (input: T) => ValidationResult): void {
  const result = validator(input);
  if (!result.isValid) {
    throw new ValidationError(result.errors);
  }
}