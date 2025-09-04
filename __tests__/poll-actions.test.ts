import { createPoll, votePoll, getPollResults, deletePoll, hasUserVoted } from '@/lib/poll-actions';
import { revalidatePath } from 'next/cache';

// Mock Next.js functions
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  })),
}));

// Mocks for Supabase clients
const mockFrom = jest.fn();
const mockRpc = jest.fn();
const mockGetUser = jest.fn();

jest.mock('@/lib/utils/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

jest.mock('@/lib/supabase-client', () => ({
  getSupabaseClient: jest.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
  })),
}));


describe('Poll Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for successful user authentication
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user123' } } });
  });

  describe('createPoll', () => {
    it('should create a poll successfully', async () => {
      const formData = new FormData();
      formData.append('title', 'Test Poll');
      formData.append('description', 'Test Description');
      formData.append('options', JSON.stringify(['Option 1', 'Option 2']));

      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({ data: { id: 'poll123' }, error: null })
          })
        })
      }).mockReturnValueOnce({
        insert: jest.fn().mockResolvedValueOnce({ error: null })
      });

      const result = await createPoll(formData);

      expect(result.error).toBeUndefined();
      expect(result.data?.pollId).toBe('poll123');
      expect(revalidatePath).toHaveBeenCalledWith('/polls');
    });

    it('should throw an error if user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });
      const formData = new FormData();
      const result = await createPoll(formData);
      expect(result.error).toBe('You must be logged in to create a poll.');
    });
  });

  describe('votePoll', () => {
    it('should record a vote successfully', async () => {
      const formData = new FormData();
      formData.append('pollId', 'poll123');
      formData.append('optionId', 'option1');

      mockFrom.mockResolvedValue({ data: null, error: null }); // for checkExistingVote
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
      }).mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      const result = await votePoll(formData);

      expect(result.error).toBeUndefined();
      expect(revalidatePath).toHaveBeenCalledWith('/polls/poll123');
    });

    it('should throw an error if user has already voted', async () => {
        const formData = new FormData();
        formData.append('pollId', 'poll123');
        formData.append('optionId', 'option1');
  
        mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 'vote1' }, error: null })
        });
  
        const result = await votePoll(formData);
        expect(result.error).toBe('You have already voted on this poll');
      });
  });

  describe('deletePoll', () => {
    it('should delete a poll successfully', async () => {
        const formData = new FormData();
        formData.append('pollId', 'poll123');
  
        // Mock for verifyPollOwnership
        mockFrom.mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { creator_id: 'user123' }, error: null })
        });
  
        // Mocks for the delete calls
        mockFrom.mockReturnValue({
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ error: null })
        });
  
        const result = await deletePoll(formData);
  
        expect(result.error).toBeUndefined();
        expect(revalidatePath).toHaveBeenCalledWith('/polls');
      });

      it('should throw an error for unauthorized deletion', async () => {
        const formData = new FormData();
        formData.append('pollId', 'poll123');
    
        // Mock for verifyPollOwnership failing
        mockFrom.mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { creator_id: 'anotherUser' }, error: null })
        });
    
        const result = await deletePoll(formData);
        expect(result.error).toBe('You can only modify your own polls');
      });
  })

  describe('hasUserVoted', () => {
    it('should return true if user has voted', async () => {
        mockRpc.mockResolvedValue({ data: true, error: null });
        const result = await hasUserVoted('poll123');
        expect(result).toBe(true);
      });
  
      it('should return false if user has not voted', async () => {
        mockRpc.mockResolvedValue({ data: false, error: null });
        const result = await hasUserVoted('poll123');
        expect(result).toBe(false);
      });
  })
});
