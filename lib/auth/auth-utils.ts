import { getSupabaseClient } from '@/lib/supabase-client';
import { PollActionResult } from '@/lib/types/poll-types';

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Validates that a user ID is provided and not empty
 */
export function validateUserId(userId: string | null | undefined): asserts userId is string {
  if (!userId || userId.trim() === '') {
    throw new AuthenticationError('User must be authenticated');
  }
}

/**
 * Verifies that a user owns a specific poll
 */
export async function verifyPollOwnership(pollId: string, userId: string): Promise<void> {
  validateUserId(userId);
  
  const supabase = getSupabaseClient();
  
  const { data: poll, error } = await supabase
    .from('polls')
    .select('creator_id')
    .eq('id', pollId)
    .single();

  if (error) {
    throw new Error(`Failed to verify poll ownership: ${error.message}`);
  }

  if (!poll) {
    throw new Error('Poll not found');
  }

  if (poll.creator_id !== userId) {
    throw new AuthorizationError('You can only modify your own polls');
  }
}

/**
 * Checks if a user has already voted on a poll
 */
export async function checkExistingVote(pollId: string, voterId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('votes')
    .select('id')
    .eq('poll_id', pollId)
    .eq('voter_id', voterId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(`Failed to check existing vote: ${error.message}`);
  }

  return !!data;
}