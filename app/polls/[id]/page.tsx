'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '@/types/supabase';

type Poll = Database['public']['Tables']['polls']['Row'];
type PollOption = Database['public']['Tables']['poll_options']['Row'];
type PollResult = {
  option_id: string;
  option_text: string;
  vote_count: number;
  option_order: number;
};

export default function PollPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [results, setResults] = useState<PollResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);

  const fetchPollData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch poll details
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .select('*')
        .eq('id', params.id)
        .single();

      if (pollError) throw new Error('Poll not found');
      setPoll(pollData);

      // Check if user has already voted
      let voted = false;
      if (user) {
        const { data, error } = await supabase.rpc('has_user_voted', {
          poll_uuid: params.id,
          user_uuid: user.id,
        });
        if (error) throw error;
        voted = data;
        setHasVoted(data);
      }

      if (voted) {
        // Fetch poll results
        const { data: resultsData, error: resultsError } = await supabase.rpc('get_poll_results', {
          poll_uuid: params.id,
        });
        if (resultsError) throw resultsError;
        setResults(resultsData);

        const { data: totalVotesData, error: totalVotesError } = await supabase.rpc('get_total_votes', {
          poll_uuid: params.id,
        });
        if (totalVotesError) throw totalVotesError;
        setTotalVotes(totalVotesData);

      } else {
        // Fetch poll options
        const { data: optionsData, error: optionsError } = await supabase
          .from('poll_options')
          .select('*')
          .eq('poll_id', params.id)
          .order('option_order', { ascending: true });

        if (optionsError) throw optionsError;
        setOptions(optionsData);
      }
    } catch (error: any) {
      toast.error(error.message);
      router.push('/polls');
    } finally {
      setLoading(false);
    }
  }, [params.id, router, user]);

  useEffect(() => {
    fetchPollData();
  }, [fetchPollData, hasVoted]);

  const handleVote = async () => {
    if (!user) {
      toast.error('You must be logged in to vote.');
      return;
    }
    if (!selectedOption) {
      toast.error('Please select an option to vote.');
      return;
    }

    try {
      const { error } = await supabase.from('votes').insert({
        poll_id: params.id,
        option_id: selectedOption,
        voter_id: user.id,
      });

      if (error) throw error;

      toast.success('Vote submitted successfully!');
      setHasVoted(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8 px-4 text-center">Loading poll...</div>;
  }

  if (!poll) {
    return <div className="container mx-auto py-8 px-4 text-center">Poll not found.</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          <CardDescription>{poll.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasVoted ? (
            <div className="space-y-4">
              <h3 className="font-medium">Results:</h3>
              {results.sort((a, b) => a.option_order - b.option_order).map((result) => {
                const percentage = totalVotes > 0 ? Math.round((result.vote_count / totalVotes) * 100) : 0;
                return (
                  <div key={result.option_id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{result.option_text}</span>
                      <span>{result.vote_count} votes ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              <p className="text-sm text-neutral-500 pt-2">Total votes: {totalVotes}</p>
              <div className="text-center pt-4">
                <p className="mb-4">Thank you for voting!</p>
                <Link href="/polls">
                  <Button>Back to Polls</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium">Cast your vote:</h3>
              <div className="space-y-2">
                {options.map((option) => (
                  <div
                    key={option.id}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedOption === option.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-neutral-50'}`}
                    onClick={() => setSelectedOption(option.id)}
                  >
                    {option.option_text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {!hasVoted && (
            <Button
              onClick={handleVote}
              disabled={!selectedOption}
              className="w-full"
            >
              Submit Vote
            </Button>
          )}
          <p className="text-xs text-neutral-500">Created on {new Date(poll.created_at!).toLocaleDateString()}</p>
        </CardFooter>
      </Card>
    </div>
  );
}