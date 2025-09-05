'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { createPoll } from '@/lib/poll-actions';

/**
 * CreatePollPage component allows authenticated users to create new polls.
 * It provides a form for entering a title, description, and multiple options.
 */
export default function CreatePollPage() {
  const router = useRouter();
  const { user } = useAuth();

  // State for managing form inputs and submission status
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Adds a new empty option field to the form.
   */
  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  /**
   * Updates the value of a specific option.
   * @param {number} index - The index of the option to update.
   * @param {string} value - The new value of the option.
   */
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  /**
   * Removes an option field from the form.
   * Ensures a minimum of 2 options are always present.
   * @param {number} index - The index of the option to remove.
   */
  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return; // Minimum 2 options
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  /**
   * Handles the form submission to create a new poll.
   * It performs validation and calls the `createPoll` server action.
   * @param {React.FormEvent} e - The form submission event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Ensure user is logged in
    if (!user) {
      toast.error('You must be logged in to create a poll.');
      setIsSubmitting(false);
      return;
    }

    // Validate poll title
    if (!title.trim()) {
      toast.error('Please enter a poll title');
      setIsSubmitting(false);
      return;
    }

    // Validate poll options
    const validOptions = options.filter(option => option.trim() !== '');
    if (validOptions.length < 2) {
      toast.error('Please provide at least 2 valid options');
      setIsSubmitting(false);
      return;
    }

    // Create FormData to send to the server action
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('options', JSON.stringify(validOptions));
    // The creatorId is now handled securely on the server.

    try {
      // Call the server action to create the poll
      const result = await createPoll(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success('Poll created successfully!');
      router.push(`/polls/${result.data?.pollId}`);
    } catch (error: any) {
      console.error('Failed to create poll:', error);
      toast.error(error.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Create a New Poll</CardTitle>
          <CardDescription>
            Fill out the form below to create a new poll
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Poll Title
              </label>
              <Input
                id="title"
                placeholder="What's your favorite programming language?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (Optional)
              </label>
              <Textarea
                id="description"
                placeholder="Provide more context about your poll"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">
                Poll Options
              </label>
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    required
                  />
                  {options.length > 2 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              <Button 
                type="button" 
                variant="outline"
                onClick={handleAddOption}
                className="w-full mt-2"
              >
                Add Option
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Poll'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
