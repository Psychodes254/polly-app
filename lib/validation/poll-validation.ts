import { CreatePollInput, VotePollInput, DeletePollInput, ValidationResult } from '@/lib/types/poll-types';

/**
 * Custom error for validation failures.
 */
export class ValidationError extends Error {
  constructor(public errors: string[]) {
    super(`Validation failed: ${errors.join(', ')}`);
    this.name = 'ValidationError';
  }
}

/**
 * Validates the input for creating a new poll.
 * @param {CreatePollInput} input - The poll creation data.
 * @returns {ValidationResult} - The result of the validation, indicating if it's valid and any errors.
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
 * Validates the input for submitting a vote.
 * @param {VotePollInput} input - The vote submission data.
 * @returns {ValidationResult} - The result of the validation.
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
 * Validates the input for deleting a poll.
 * @param {DeletePollInput} input - The poll deletion data.
 * @returns {ValidationResult} - The result of the validation.
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
 * Asserts that the given input is valid according to the provided validator function.
 * Throws a ValidationError if the input is invalid.
 * @param {T} input - The input data to validate.
 * @param {(input: T) => ValidationResult} validator - The function to use for validation.
 */
export function assertValidInput<T>(input: T, validator: (input: T) => ValidationResult): void {
  const result = validator(input);
  if (!result.isValid) {
    throw new ValidationError(result.errors);
  }
}