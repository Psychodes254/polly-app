'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Database } from '@/types/supabase';

type Poll = Database['public']['Tables']['polls']['Row'];
type PollOption = Database['public']['Tables']['poll_options']['Row'];
type Vote = Database['public']['Tables']['votes']['Row'];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function createPoll(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const creatorId = formData.get('creatorId') as string;
  const options = JSON.parse(formData.get('options') as string) as string[];

  if (!title?.trim()) {
    throw new Error('Poll title is required');
  }

  if (!creatorId) {
    throw new Error('User must be authenticated to create a poll');
  }

  const validOptions = options.filter(option => option.trim() !== '');
  if (validOptions.length < 2) {
    throw new Error('At least 2 valid options are required');
  }

  try {
    // Insert the poll
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert({ title, description, creator_id: creatorId })
      .select()
      .single();

    if (pollError) throw pollError;

    // Insert the options
    const optionInserts = validOptions.map((option, index) => ({
      poll_id: pollData.id,
      option_text: option,
      option_order: index,
    }));

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionInserts);

    if (optionsError) throw optionsError;

    revalidatePath('/polls');
    return { success: true, pollId: pollData.id };
  } catch (error: any) {
    throw new Error(`Failed to create poll: ${error.message}`);
  }
}

export async function votePoll(formData: FormData) {
  const pollId = formData.get('pollId') as string;
  const optionId = formData.get('optionId') as string;
  const voterId = formData.get('voterId') as string;

  if (!pollId || !optionId || !voterId) {
    throw new Error('Poll ID, option ID, and voter ID are required');
  }

  try {
    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('voter_id', voterId)
      .single();

    if (existingVote) {
      throw new Error('You have already voted on this poll');
    }

    // Insert the vote
    const { error } = await supabase
      .from('votes')
      .insert({
        poll_id: pollId,
        option_id: optionId,
        voter_id: voterId,
      });

    if (error) throw error;

    revalidatePath(`/polls/${pollId}`);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to submit vote: ${error.message}`);
  }
}

export async function getPollResults(pollId: string) {
  if (!pollId) {
    throw new Error('Poll ID is required');
  }

  try {
    const { data, error } = await supabase.rpc('get_poll_results', {
      poll_uuid: pollId,
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    throw new Error(`Failed to get poll results: ${error.message}`);
  }
}

export async function deletePoll(formData: FormData) {
  const pollId = formData.get('pollId') as string;
  const userId = formData.get('userId') as string;

  if (!pollId || !userId) {
    throw new Error('Poll ID and user ID are required');
  }

  try {
    // Verify the user owns the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('creator_id')
      .eq('id', pollId)
      .single();

    if (pollError) throw pollError;
    if (poll.creator_id !== userId) {
      throw new Error('You can only delete your own polls');
    }

    // Delete votes first (due to foreign key constraints)
    await supabase.from('votes').delete().eq('poll_id', pollId);
    
    // Delete poll options
    await supabase.from('poll_options').delete().eq('poll_id', pollId);
    
    // Delete the poll
    const { error } = await supabase.from('polls').delete().eq('id', pollId);
    
    if (error) throw error;

    revalidatePath('/polls');
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to delete poll: ${error.message}`);
  }
}

export async function hasUserVoted(pollId: string, userId: string) {
  if (!pollId || !userId) {
    return false;
  }

  try {
    const { data, error } = await supabase.rpc('has_user_voted', {
      poll_uuid: pollId,
      user_uuid: userId,
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error checking if user voted:', error.message);
    return false;
  }
}