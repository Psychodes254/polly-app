'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreatePollPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return; // Minimum 2 options
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate form data
    if (!title.trim()) {
      alert('Please enter a poll title');
      setIsSubmitting(false);
      return;
    }
    
    const validOptions = options.filter(option => option.trim() !== '');
    if (validOptions.length < 2) {
      alert('Please provide at least 2 valid options');
      setIsSubmitting(false);
      return;
    }
    
    // This is a placeholder for poll creation logic
    const pollData = {
      id: Date.now().toString(), // Generate a temporary ID
      title,
      description,
      options: validOptions,
      votes: {}, // Initialize empty votes
      createdBy: 'Anonymous User',
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    console.log('Creating poll:', pollData);
    
    // Simulate API call with a timeout
    try {
      // In a real app, you would send the data to your API here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store poll data in localStorage for demo purposes
      // In a real app, this would be handled by a backend API
      const existingPolls = JSON.parse(localStorage.getItem('polls') || '[]');
      localStorage.setItem('polls', JSON.stringify([...existingPolls, pollData]));
      
      // Redirect to polls page after successful creation
      router.push('/polls');
    } catch (error) {
      console.error('Error creating poll:', error);
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