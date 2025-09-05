'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseClient } from '@/lib/supabase-client';
import {
  CreatePollInput,
  VotePollInput,
  DeletePollInput,
  PollActionResult,
  PollResult
} from '@/lib/types/poll-types';
import {
  validateCreatePollInput,
  validateVotePollInput,
  validateDeletePollInput,
  assertValidInput
} from '@/lib/validation/poll-validation';
import {
  AuthenticationError,
  verifyPollOwnership,
  checkExistingVote
} from '@/lib/auth/auth-utils';
import { withErrorHandling } from '@/lib/utils/error-utils';
import { createSupabaseServerClient } from '@/lib/utils/supabase/server';

/**
 * Server action to create a new poll.
 * Handles user authentication, input validation, and database insertion.
 * @param {FormData} formData - The form data from the create poll form.
 * @returns {Promise<PollActionResult<{ pollId: string }>>} - The result of the action, containing the new poll ID or an error.
 */
export async function createPoll(formData: FormData): Promise<PollActionResult<{ pollId: string }>> {
  return withErrorHandling(async () => {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError('You must be logged in to create a poll.');
    }

    const input: CreatePollInput = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      creatorId: user.id, // Use authenticated user's ID
      options: JSON.parse(formData.get('options') as string) as string[],
      allowMultipleVotes: formData.get('allowMultipleVotes') === 'true',
      expiresAt: formData.get('expiresAt') as string || undefined
    };

    assertValidInput(input, validateCreatePollInput);

    const validOptions = input.options.filter(option => option.trim() !== '');
    const adminSupabase = getSupabaseClient();

    const { data: pollData, error: pollError } = await adminSupabase
      .from('polls')
      .insert({
        title: input.title.trim(),
        description: input.description?.trim() || null,
        creator_id: input.creatorId,
        allow_multiple_votes: input.allowMultipleVotes || false,
        expires_at: input.expiresAt || null
      })
      .select()
      .single();

    if (pollError) throw new Error(`Failed to create poll: ${pollError.message}`);

    const optionInserts = validOptions.map((option, index) => ({
      poll_id: pollData.id,
      option_text: option.trim(),
      option_order: index,
    }));

    const { error: optionsError } = await adminSupabase.from('poll_options').insert(optionInserts);

    if (optionsError) throw new Error(`Failed to create poll options: ${optionsError.message}`);

    revalidatePath('/polls');
    return { pollId: pollData.id };
  });
}

/**
 * Server action to submit a vote for a poll option.
 * Handles user authentication, input validation, and prevents duplicate votes.
 * @param {FormData} formData - The form data containing poll and option IDs.
 * @returns {Promise<PollActionResult<void>>} - The result of the action.
 */
export async function votePoll(formData: FormData): Promise<PollActionResult<void>> {
  return withErrorHandling(async () => {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError('You must be logged in to vote.');
    }

    const input: VotePollInput = {
      pollId: formData.get('pollId') as string,
      optionId: formData.get('optionId') as string,
      voterId: user.id, // Use authenticated user's ID
      voterIp: formData.get('voterIp') as string || undefined
    };

    assertValidInput(input, validateVotePollInput);

    const hasVoted = await checkExistingVote(input.pollId, input.voterId);
    if (hasVoted) {
      throw new Error('You have already voted on this poll');
    }

    const adminSupabase = getSupabaseClient();
    const { error } = await adminSupabase.from('votes').insert({
      poll_id: input.pollId,
      option_id: input.optionId,
      voter_id: input.voterId,
      voter_ip: input.voterIp || null
    });

    if (error) throw new Error(`Failed to submit vote: ${error.message}`);

    revalidatePath(`/polls/${input.pollId}`);
  });
}

/**
 * Retrieves the results of a poll, including vote counts for each option.
 * @param {string} pollId - The ID of the poll to get results for.
 * @returns {Promise<PollActionResult<PollResult[]>>} - The poll results or an error.
 */
export async function getPollResults(pollId: string): Promise<PollActionResult<PollResult[]>> {
  return withErrorHandling(async () => {
    if (!pollId || pollId.trim() === '') {
      throw new Error('Poll ID is required');
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_poll_results', { poll_uuid: pollId });

    if (error) throw new Error(`Failed to get poll results: ${error.message}`);

    return data || [];
  });
}

/**
 * Server action to delete a poll and all its associated data.
 * Handles user authentication and ownership verification.
 * @param {FormData} formData - The form data containing the poll ID.
 * @returns {Promise<PollActionResult<void>>} - The result of the action.
 */
export async function deletePoll(formData: FormData): Promise<PollActionResult<void>> {
  return withErrorHandling(async () => {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError('You must be logged in to delete a poll.');
    }

    const input: DeletePollInput = {
      pollId: formData.get('pollId') as string,
      userId: user.id // Use authenticated user's ID
    };

    assertValidInput(input, validateDeletePollInput);
    await verifyPollOwnership(input.pollId, input.userId);

    const adminSupabase = getSupabaseClient();
    await adminSupabase.from('votes').delete().eq('poll_id', input.pollId);
    await adminSupabase.from('poll_options').delete().eq('poll_id', input.pollId);
    
    const { error } = await adminSupabase.from('polls').delete().eq('id', input.pollId);
    
    if (error) throw new Error(`Failed to delete poll: ${error.message}`);

    revalidatePath('/polls');
  });
}

/**
 * Checks if the currently authenticated user has voted on a specific poll.
 * @param {string} pollId - The ID of the poll to check.
 * @returns {Promise<boolean>} - True if the user has voted, false otherwise.
 */
export async function hasUserVoted(pollId: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!pollId || !user) {
      return false;
    }

    const adminSupabase = getSupabaseClient();
    const { data, error } = await adminSupabase.rpc('has_user_voted', {
      poll_uuid: pollId,
      user_uuid: user.id,
    });

    if (error) {
      console.error('Error checking if user voted:', error.message);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error checking if user voted:', error);
    return false;
  }
}

/**
 * Gets the total number of votes for a specific poll.
 * @param {string} pollId - The ID of the poll.
 * @returns {Promise<PollActionResult<number>>} - The total vote count or an error.
 */
export async function getTotalVotes(pollId: string): Promise<PollActionResult<number>> {
  return withErrorHandling(async () => {
    if (!pollId || pollId.trim() === '') {
      throw new Error('Poll ID is required');
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_total_votes', { poll_uuid: pollId });

    if (error) throw new Error(`Failed to get total votes: ${error.message}`);

    return data || 0;
  });
}