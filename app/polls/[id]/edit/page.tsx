'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '@/types/supabase';

type Poll = Database['public']['Tables']['polls']['Row'];
type PollOption = Database['public']['Tables']['poll_options']['Row'];

export default function EditPollPage() {
  const router = useRouter();
  const params = useParams();
  const { id: pollId } = params;
  const { user } = useAuth();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<PollOption[]>([]);
  const [initialOptions, setInitialOptions] = useState<PollOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPoll = useCallback(async () => {
    if (!pollId) return;
    try {
      setLoading(true);
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .single();

      if (pollError) throw new Error('Poll not found');

      if (pollData.creator_id !== user?.id) {
        toast.error('You are not authorized to edit this poll.');
        router.push(`/polls/${pollId}`);
        return;
      }

      setPoll(pollData);
      setTitle(pollData.title);
      setDescription(pollData.description || '');

      const { data: optionsData, error: optionsError } = await supabase
        .from('poll_options')
        .select('*')
        .eq('poll_id', pollId)
        .order('option_order', { ascending: true });

      if (optionsError) throw optionsError;

      setOptions(optionsData);
      setInitialOptions(optionsData);
    } catch (error: any) {
      toast.error(error.message);
      router.push('/polls');
    } finally {
      setLoading(false);
    }
  }, [pollId, user, router]);

  useEffect(() => {
    if (user) {
      fetchPoll();
    }
  }, [user, fetchPoll]);

  const handleAddOption = () => {
    const newOption: PollOption = {
      id: `new-${Date.now()}`,
      poll_id: pollId as string,
      option_text: '',
      option_order: options.length,
      created_at: new Date().toISOString(),
    };
    setOptions([...options, newOption]);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].option_text = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.error('A poll must have at least 2 options.');
      return;
    }
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!title.trim()) {
      toast.error('Please enter a poll title');
      setIsSubmitting(false);
      return;
    }

    const validOptions = options.filter(option => option.option_text.trim() !== '');
    if (validOptions.length < 2) {
      toast.error('Please provide at least 2 valid options');
      setIsSubmitting(false);
      return;
    }

    try {
      // Update poll details
      const { error: pollError } = await supabase
        .from('polls')
        .update({ title, description })
        .eq('id', pollId);

      if (pollError) throw pollError;

      // Determine which options to add, update, or delete
      const optionsToUpdate = options.filter(opt => initialOptions.some(initOpt => initOpt.id === opt.id && initOpt.option_text !== opt.option_text));
      const optionsToAdd = options.filter(opt => !initialOptions.some(initOpt => initOpt.id === opt.id));
      const optionsToDelete = initialOptions.filter(initOpt => !options.some(opt => opt.id === initOpt.id));

      // Perform database operations
      if (optionsToUpdate.length > 0) {
        const updates = optionsToUpdate.map(opt => supabase.from('poll_options').update({ option_text: opt.option_text }).eq('id', opt.id));
        await Promise.all(updates);
      }
      if (optionsToAdd.length > 0) {
        const adds = optionsToAdd.map((opt, index) => ({ poll_id: pollId as string, option_text: opt.option_text, option_order: initialOptions.length + index }));
        await supabase.from('poll_options').insert(adds);
      }
      if (optionsToDelete.length > 0) {
        const deletes = optionsToDelete.map(opt => supabase.from('poll_options').delete().eq('id', opt.id));
        await Promise.all(deletes);
      }

      toast.success('Poll updated successfully!');
      router.push(`/polls/${pollId}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8 px-4 text-center">Loading poll...</div>;
  }

  if (!poll) {
    return <div className="container mx-auto py-8 px-4 text-center">Poll not found or you don't have permission to edit it.</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Poll</CardTitle>
          <CardDescription>Update the details of your poll</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Poll Title</label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description (Optional)</label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">Poll Options</label>
              {options.map((option, index) => (
                <div key={option.id} className="flex gap-2">
                  <Input value={option.option_text} onChange={(e) => handleOptionChange(index, e.target.value)} required />
                  {options.length > 2 && (
                    <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveOption(index)}>✕</Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddOption} className="w-full mt-2">Add Option</Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update Poll'}</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
