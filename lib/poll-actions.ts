'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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
  validateUserId,
  verifyPollOwnership,
  checkExistingVote
} from '@/lib/auth/auth-utils';
import { withErrorHandling, createSuccessResponse } from '@/lib/utils/error-utils';

/**
 * Creates a new poll with options
 */
export async function createPoll(formData: FormData): Promise<PollActionResult<{ pollId: string }>> {
  return withErrorHandling(async () => {
    const input: CreatePollInput = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      creatorId: formData.get('creatorId') as string,
      options: JSON.parse(formData.get('options') as string) as string[],
      allowMultipleVotes: formData.get('allowMultipleVotes') === 'true',
      expiresAt: formData.get('expiresAt') as string || undefined
    };

    // Validate input
    assertValidInput(input, validateCreatePollInput);

    const supabase = getSupabaseClient();
    const validOptions = input.options.filter(option => option.trim() !== '');

    // Insert the poll
    const { data: pollData, error: pollError } = await supabase
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

    if (pollError) {
      throw new Error(`Failed to create poll: ${pollError.message}`);
    }

    // Insert the options
    const optionInserts = validOptions.map((option, index) => ({
      poll_id: pollData.id,
      option_text: option.trim(),
      option_order: index,
    }));

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionInserts);

    if (optionsError) {
      throw new Error(`Failed to create poll options: ${optionsError.message}`);
    }

    revalidatePath('/polls');
    return { pollId: pollData.id };
  });
}

/**
 * Submits a vote for a poll option
 */
export async function votePoll(formData: FormData): Promise<PollActionResult<void>> {
  return withErrorHandling(async () => {
    const input: VotePollInput = {
      pollId: formData.get('pollId') as string,
      optionId: formData.get('optionId') as string,
      voterId: formData.get('voterId') as string,
      voterIp: formData.get('voterIp') as string || undefined
    };

    // Validate input
    assertValidInput(input, validateVotePollInput);

    // Check if user has already voted
    const hasVoted = await checkExistingVote(input.pollId, input.voterId);
    if (hasVoted) {
      throw new Error('You have already voted on this poll');
    }

    const supabase = getSupabaseClient();

    // Insert the vote
    const { error } = await supabase
      .from('votes')
      .insert({
        poll_id: input.pollId,
        option_id: input.optionId,
        voter_id: input.voterId,
        voter_ip: input.voterIp || null
      });

    if (error) {
      throw new Error(`Failed to submit vote: ${error.message}`);
    }

    revalidatePath(`/polls/${input.pollId}`);
  });
}

/**
 * Gets poll results with vote counts
 */
export async function getPollResults(pollId: string): Promise<PollActionResult<PollResult[]>> {
  return withErrorHandling(async () => {
    if (!pollId || pollId.trim() === '') {
      throw new Error('Poll ID is required');
    }

    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.rpc('get_poll_results', {
      poll_uuid: pollId,
    });

    if (error) {
      throw new Error(`Failed to get poll results: ${error.message}`);
    }

    return data || [];
  });
}

/**
 * Deletes a poll and all associated data
 */
export async function deletePoll(formData: FormData): Promise<PollActionResult<void>> {
  return withErrorHandling(async () => {
    const input: DeletePollInput = {
      pollId: formData.get('pollId') as string,
      userId: formData.get('userId') as string
    };

    // Validate input
    assertValidInput(input, validateDeletePollInput);

    // Verify ownership
    await verifyPollOwnership(input.pollId, input.userId);

    const supabase = getSupabaseClient();

    // Delete in correct order due to foreign key constraints
    await supabase.from('votes').delete().eq('poll_id', input.pollId);
    await supabase.from('poll_options').delete().eq('poll_id', input.pollId);
    
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', input.pollId);
    
    if (error) {
      throw new Error(`Failed to delete poll: ${error.message}`);
    }

    revalidatePath('/polls');
  });
}

/**
 * Checks if a user has voted on a specific poll
 */
export async function hasUserVoted(pollId: string, userId: string): Promise<boolean> {
  if (!pollId || !userId) {
    return false;
  }

  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.rpc('has_user_voted', {
      poll_uuid: pollId,
      user_uuid: userId,
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
 * Gets the total number of votes for a poll
 */
export async function getTotalVotes(pollId: string): Promise<PollActionResult<number>> {
  return withErrorHandling(async () => {
    if (!pollId || pollId.trim() === '') {
      throw new Error('Poll ID is required');
    }

    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.rpc('get_total_votes', {
      poll_uuid: pollId,
    });

    if (error) {
      throw new Error(`Failed to get total votes: ${error.message}`);
    }

    return data || 0;
  });
}