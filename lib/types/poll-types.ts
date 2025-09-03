import { Database } from '@/types/supabase';

// Database types
export type Poll = Database['public']['Tables']['polls']['Row'];
export type PollInsert = Database['public']['Tables']['polls']['Insert'];
export type PollOption = Database['public']['Tables']['poll_options']['Row'];
export type PollOptionInsert = Database['public']['Tables']['poll_options']['Insert'];
export type Vote = Database['public']['Tables']['votes']['Row'];
export type VoteInsert = Database['public']['Tables']['votes']['Insert'];

// Operation input types
export interface CreatePollInput {
  title: string;
  description?: string;
  creatorId: string;
  options: string[];
  allowMultipleVotes?: boolean;
  expiresAt?: string;
}

export interface VotePollInput {
  pollId: string;
  optionId: string;
  voterId: string;
  voterIp?: string;
}

export interface DeletePollInput {
  pollId: string;
  userId: string;
}

// Response types
export interface PollActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PollResult {
  option_id: string;
  option_text: string;
  option_order: number;
  vote_count: number;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}