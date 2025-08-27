'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Default mock data for a single poll
const defaultPoll = {
  id: '1',
  title: 'Favorite Programming Language',
  description: 'What is your favorite programming language?',
  options: ['JavaScript', 'Python', 'Java', 'C#', 'Go'],
  votes: {
    'JavaScript': 15,
    'Python': 12,
    'Java': 8,
    'C#': 5,
    'Go': 2,
  },
  createdBy: 'John Doe',
  createdAt: '2023-05-15',
};

// Default polls for fallback
const defaultPolls = [
  defaultPoll,
  {
    id: '2',
    title: 'Best Frontend Framework',
    description: 'Which frontend framework do you prefer?',
    options: ['React', 'Vue', 'Angular', 'Svelte'],
    votes: { 'React': 20, 'Vue': 8, 'Angular': 6, 'Svelte': 4 },
    createdBy: 'Jane Smith',
    createdAt: '2023-05-10',
  },
  {
    id: '3',
    title: 'Preferred Database',
    description: 'What database do you use most often?',
    options: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite', 'Redis'],
    votes: { 'PostgreSQL': 10, 'MySQL': 8, 'MongoDB': 5, 'SQLite': 3, 'Redis': 1 },
    createdBy: 'Alex Johnson',
    createdAt: '2023-05-05',
  },
];

export default function PollPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [poll, setPoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  
  useEffect(() => {
    // Load poll data from localStorage or use default
    try {
      // First check localStorage for custom polls
      const storedPolls = localStorage.getItem('polls');
      let allPolls = [...defaultPolls];
      
      if (storedPolls) {
        const parsedPolls = JSON.parse(storedPolls);
        // Add stored polls, avoiding duplicates
        parsedPolls.forEach((newPoll: any) => {
          if (!allPolls.some(p => p.id === newPoll.id)) {
            allPolls.push(newPoll);
          }
        });
      }
      
      // Find the requested poll
      const foundPoll = allPolls.find(p => p.id === params.id);
      
      if (foundPoll) {
        setPoll(foundPoll);
      } else {
        console.error('Poll not found');
        // Redirect to polls list if poll not found
        setTimeout(() => router.push('/polls'), 1000);
      }
    } catch (error) {
      console.error('Error loading poll data:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  const handleVote = () => {
    if (!poll || !selectedOption) return;
    
    try {
      // Create a copy of the poll to update
      const updatedPoll = { ...poll };
      
      // Initialize votes object if it doesn't exist
      if (!updatedPoll.votes) {
        updatedPoll.votes = {};
      }
      
      // Increment vote count for selected option
      updatedPoll.votes[selectedOption] = (updatedPoll.votes[selectedOption] || 0) + 1;
      
      // Update poll in state
      setPoll(updatedPoll);
      
      // Update poll in localStorage
      const storedPolls = JSON.parse(localStorage.getItem('polls') || '[]');
      const allPolls = [...defaultPolls];
      
      // Add stored polls, replacing the updated one
      let updatedInStorage = false;
      
      storedPolls.forEach((storedPoll: any) => {
        if (storedPoll.id === updatedPoll.id) {
          // Replace with updated poll
          allPolls.push(updatedPoll);
          updatedInStorage = true;
        } else if (!allPolls.some(p => p.id === storedPoll.id)) {
          // Add other stored polls that aren't in default polls
          allPolls.push(storedPoll);
        }
      });
      
      // If the poll wasn't in storage yet, add it
      if (!updatedInStorage && !defaultPolls.some(p => p.id === updatedPoll.id)) {
        allPolls.push(updatedPoll);
      }
      
      // Save back to localStorage
      localStorage.setItem('polls', JSON.stringify(allPolls));
      
      console.log(`Voted for ${selectedOption} in poll ${params.id}`);
      setHasVoted(true);
    } catch (error) {
      console.error('Error saving vote:', error);
      alert('Failed to save your vote. Please try again.');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p>Loading poll...</p>
      </div>
    );
  }
  
  // Show error state if poll not found
  if (!poll) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p>Poll not found. Redirecting to polls list...</p>
      </div>
    );
  }

  // Calculate total votes
  const totalVotes = poll.votes ? Object.values(poll.votes).reduce((sum: number, count: any) => sum + (typeof count === 'number' ? count : 0), 0) : 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          <CardDescription>{poll.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasVoted ? (
            // Show results if user has voted
            <div className="space-y-4">
              <h3 className="font-medium">Results:</h3>
              {poll.options.map((option: string) => {
                const voteCount = poll.votes && poll.votes[option] ? poll.votes[option] : 0;
                const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                
                return (
                  <div key={option} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{option}</span>
                      <span>{voteCount} votes ({percentage}%)</span>
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
            </div>
          ) : (
            // Show voting options if user hasn't voted
            <div className="space-y-4">
              <h3 className="font-medium">Cast your vote:</h3>
              <div className="space-y-2">
                {poll.options.map((option: string) => (
                  <div 
                    key={option}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedOption === option ? 'border-blue-500 bg-blue-50' : 'hover:bg-neutral-50'}`}
                    onClick={() => setSelectedOption(option)}
                  >
                    {option}
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
          <p className="text-xs text-neutral-500">Created by {poll.createdBy} on {poll.createdAt}</p>
        </CardFooter>
      </Card>
    </div>
  );
}