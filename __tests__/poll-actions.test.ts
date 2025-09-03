import { createPoll, votePoll, getPollResults, deletePoll, hasUserVoted } from '@/lib/poll-actions';

// Mock Next.js functions first
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Create mock functions that will be used in the Supabase mock
jest.mock('@supabase/supabase-js', () => {
  const mockSingle = jest.fn();
  const mockEq = jest.fn(() => ({ single: mockSingle })); // Reverted
  const mockSelect = jest.fn(() => ({ eq: mockEq, single: mockSingle })); // Reverted
  const mockInsert = jest.fn(() => ({ select: mockSelect }));
  const mockDelete = jest.fn(() => ({ eq: mockEq }));
  const mockFrom = jest.fn(() => ({
    insert: mockInsert,
    select: mockSelect,
    delete: mockDelete,
  }));
  const mockRpc = jest.fn();

  return {
    createClient: jest.fn(() => ({
      from: mockFrom,
      rpc: mockRpc,
    })),
    __esModule: true,
    mockSingle,
    mockEq,
    mockSelect,
    mockInsert,
    mockDelete,
    mockFrom,
    mockRpc,
  };
});

// Import the mocked functions and the exposed mocks
const { mockSingle, mockEq, mockSelect, mockInsert, mockDelete, mockFrom, mockRpc } = jest.mocked(require('@supabase/supabase-js'));

describe('Poll Actions', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('createPoll', () => {
    it('should create a poll successfully', async () => {
      const formData = new FormData();
      formData.append('title', 'Test Poll');
      formData.append('description', 'Test Description');
      formData.append('options', JSON.stringify(['Option 1', 'Option 2']));
      formData.append('creatorId', 'user123'); // Changed from userId to creatorId

      // Mock successful poll creation
      mockFrom.mockReturnValueOnce({ // First call to from('polls')
        insert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: { id: 'poll123' },
              error: null
            })
          })
        })
      });

      // Mock successful options creation for second call to from('poll_options')
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValueOnce({
          data: null,
          error: null
        })
      });

      const result = await createPoll(formData);

      expect(result.success).toBe(true);
      expect(result.pollId).toBe('poll123');
      expect(mockFrom).toHaveBeenCalledWith('polls');
      expect(mockFrom).toHaveBeenCalledWith('poll_options');
    });

    it('should handle missing title', async () => {
      const formData = new FormData();
      formData.append('description', 'Test Description');
      formData.append('options', JSON.stringify(['Option 1', 'Option 2']));
      formData.append('creatorId', 'user123');

      await expect(createPoll(formData)).rejects.toThrow('Poll title is required');
    });

    it('should handle database errors', async () => {
      const formData = new FormData();
      formData.append('title', 'Test Poll');
      formData.append('description', 'Test Description');
      formData.append('options', JSON.stringify(['Option 1', 'Option 2']));
      formData.append('creatorId', 'user123');

      // Mock database error for poll insertion
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      await expect(createPoll(formData)).rejects.toThrow('Failed to create poll: Database error');
    });
  });

  describe('votePoll', () => {
    it('should record a vote successfully', async () => {
      const formData = new FormData();
      formData.append('pollId', 'poll123');
      formData.append('optionId', 'option123');
      formData.append('voterId', 'user123'); // Changed from userId to voterId

      // Mock no existing vote
      mockFrom.mockReturnValueOnce({ // First call to from('votes') for select
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnThis(), // Chain eq calls
          single: jest.fn().mockResolvedValueOnce({
            data: null,
            error: null
          })
        })
      });

      // Mock successful vote insertion
      mockFrom.mockReturnValueOnce({ // Second call to from('votes') for insert
        insert: jest.fn().mockResolvedValueOnce({
          data: null,
          error: null
        })
      });

      const result = await votePoll(formData);

      expect(result.success).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('votes');
    });

    it('should handle missing parameters', async () => {
      const formData = new FormData();
      formData.append('pollId', 'poll123');
      // Missing optionId and voterId

      await expect(votePoll(formData)).rejects.toThrow('Poll ID, option ID, and voter ID are required');
    });

    it('should handle database errors', async () => {
      const formData = new FormData();
      formData.append('pollId', 'poll123');
      formData.append('optionId', 'option123');
      formData.append('voterId', 'user123'); // Changed from userId to voterId

      // Mock existing vote
      mockFrom.mockReturnValueOnce({ // First call to from('votes') for select
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnThis(), // Chain eq calls
          single: jest.fn().mockResolvedValueOnce({
            data: { id: 'existingVote123' },
            error: null
          })
        })
      });

      // Mock database error for vote insertion (this part of the mock might not be hit if existingVote is found)
      // However, if the error is from the insert, we need to mock it.
      mockFrom.mockReturnValueOnce({ // Second call to from('votes') for insert
        insert: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Database error during insert' }
        })
      });

      await expect(votePoll(formData)).rejects.toThrow('Failed to submit vote: You have already voted on this poll');
    });
  });

  describe('getPollResults', () => {
    it('should return poll results successfully', async () => {
      const mockRpcData = {
        poll: {
          id: 'poll123',
          title: 'Test Poll',
          description: 'Test Description',
          created_by: 'user123'
        },
        options: [
          { id: 'option1', text: 'Option 1', poll_id: 'poll123' },
          { id: 'option2', text: 'Option 2', poll_id: 'poll123' }
        ],
        vote_counts: [
          { option_id: 'option1', vote_count: 5 },
          { option_id: 'option2', vote_count: 3 }
        ]
      };

      // Mock RPC call for get_poll_results
      mockRpc.mockResolvedValueOnce({
        data: mockRpcData,
        error: null
      });

      const result = await getPollResults('poll123');

      expect(result).toEqual(mockRpcData);
    });

    it('should handle poll not found', async () => {
      // Mock RPC call for get_poll_results returning an error
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Poll not found' }
      });

      await expect(getPollResults('nonexistent')).rejects.toThrow('Failed to get poll results: Poll not found');
    });
  });

  describe('deletePoll', () => {
    it('should delete a poll successfully', async () => {
      const formData = new FormData();
      formData.append('pollId', 'poll123');
      formData.append('userId', 'user123');

      // Mock poll ownership check
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: { created_by: 'user123' },
              error: null
            })
          })
        })
      });

      // Mock successful deletion of votes
      mockFrom.mockReturnValueOnce({
        delete: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockResolvedValueOnce({
            data: {},
            error: null
          })
        })
      });

      // Mock successful deletion of poll_options
      mockFrom.mockReturnValueOnce({
        delete: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockResolvedValueOnce({
            data: {},
            error: null
          })
        })
      });

      // Mock successful deletion of poll
      mockFrom.mockReturnValueOnce({
        delete: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockResolvedValueOnce({
            data: {},
            error: null
          })
        })
      });

      const result = await deletePoll(formData);

      expect(result.success).toBe(true);
    });

    it('should prevent unauthorized deletion', async () => {
      const formData = new FormData();
      formData.append('pollId', 'poll123');
      formData.append('userId', 'user456'); // Different user

      // Mock poll ownership check
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: { created_by: 'user123' }, // Different owner
              error: null
            })
          })
        })
      });

      await expect(deletePoll(formData)).rejects.toThrow('Failed to delete poll: You can only delete your own polls');
    });

    it('should handle missing fields', async () => {
      const formData = new FormData();
      // Missing pollId and userId

      await expect(deletePoll(formData)).rejects.toThrow('Poll ID and user ID are required');
    });
  });

  describe('hasUserVoted', () => {
    it('should return true when user has voted', async () => {
      // Mock RPC call for has_user_voted returning true
      mockRpc.mockResolvedValueOnce({
        data: true,
        error: null
      });

      const result = await hasUserVoted('poll123', 'user123');

      expect(result).toBe(true);
    });

    it('should return false when user has not voted', async () => {
      // Mock RPC call for has_user_voted returning false
      mockRpc.mockResolvedValueOnce({
        data: false,
        error: null
      });

      const result = await hasUserVoted('poll123', 'user123');

      expect(result).toBe(false);
    });

    it('should handle missing parameters', async () => {
      const result = await hasUserVoted('', 'user123');

      expect(result).toBe(false); // hasUserVoted returns false directly for missing params
    });

    it('should handle database errors', async () => {
      // Mock RPC call for has_user_voted returning an error
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const result = await hasUserVoted('poll123', 'user123');

      expect(result).toBe(false); // hasUserVoted returns false on error
    });
  });
});