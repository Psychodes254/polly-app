'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '@/types/supabase';

type Poll = Database['public']['Tables']['polls']['Row'] & {
  options_count: number;
  total_votes: number;
};

export default function PollsPage() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPolls = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          poll_options (id),
          votes (id)
        `);

      if (error) throw error;

      const formattedPolls = data.map(poll => ({
        ...poll,
        options_count: poll.poll_options.length,
        total_votes: poll.votes.length,
      }));

      setPolls(formattedPolls);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const handleDelete = async (pollId: string) => {
    if (!window.confirm('Are you sure you want to delete this poll?')) return;

    try {
      // First, delete votes associated with the poll
      const { error: votesError } = await supabase.from('votes').delete().eq('poll_id', pollId);
      if (votesError) throw votesError;

      // Second, delete poll options
      const { error: optionsError } = await supabase.from('poll_options').delete().eq('poll_id', pollId);
      if (optionsError) throw optionsError;

      // Finally, delete the poll itself
      const { error: pollError } = await supabase.from('polls').delete().eq('id', pollId);
      if (pollError) throw pollError;

      toast.success('Poll deleted successfully!');
      fetchPolls(); // Refresh the polls list
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Available Polls</h1>

      {loading ? (
        <div className="text-center">
          <p>Loading polls...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.length === 0 ? (
            <p className="col-span-3 text-center py-8 text-neutral-500">No polls available. Create your first poll!</p>
          ) : (
            polls.map((poll) => (
              <Card key={poll.id} className="h-full flex flex-col">
                <Link href={`/polls/${poll.id}`} className="flex-grow">
                  <CardHeader>
                    <CardTitle>{poll.title}</CardTitle>
                    <CardDescription>{poll.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-neutral-600">
                      {poll.options_count} options • {poll.total_votes} votes
                    </p>
                  </CardContent>
                </Link>
                <CardFooter className="text-xs text-neutral-500 flex justify-between items-center">
                  <p>Created on {new Date(poll.created_at!).toLocaleDateString()}</p>
                  {user && user.id === poll.creator_id && (
                    <div className="flex gap-2">
                      <Link href={`/polls/${poll.id}/edit`}>
                        <Button variant="outline" size="sm">Edit</Button>
                      </Link>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(poll.id)}>Delete</Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}