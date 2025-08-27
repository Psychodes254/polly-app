'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

// Default mock data for polls
const defaultPolls = [
  {
    id: '1',
    title: 'Favorite Programming Language',
    description: 'What is your favorite programming language?',
    options: ['JavaScript', 'Python', 'Java', 'C#', 'Go'],
    votes: { 'JavaScript': 15, 'Python': 12, 'Java': 8, 'C#': 5, 'Go': 2 },
    createdBy: 'John Doe',
    createdAt: '2023-05-15',
  },
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

export default function PollsPage() {
  const [polls, setPolls] = useState(defaultPolls);
  
  useEffect(() => {
    // Load polls from localStorage if available
    try {
      const storedPolls = localStorage.getItem('polls');
      if (storedPolls) {
        const parsedPolls = JSON.parse(storedPolls);
        // Combine default polls with stored polls, avoiding duplicates by ID
        const allPolls = [...defaultPolls];
        parsedPolls.forEach((newPoll: any) => {
          if (!allPolls.some(poll => poll.id === newPoll.id)) {
            allPolls.push(newPoll);
          }
        });
        setPolls(allPolls);
      }
    } catch (error) {
      console.error('Error loading polls from localStorage:', error);
    }
  }, []);
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Available Polls</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {polls.length === 0 ? (
          <p className="col-span-3 text-center py-8 text-neutral-500">No polls available. Create your first poll!</p>
        ) : (
          polls.map((poll) => {
            // Calculate total votes for each poll
            const totalVotes = poll.votes ? 
              Object.values(poll.votes).reduce((sum: number, count: any) => sum + (typeof count === 'number' ? count : 0), 0) : 0;
            
            return (
              <Link href={`/polls/${poll.id}`} key={poll.id}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle>{poll.title}</CardTitle>
                    <CardDescription>{poll.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-neutral-600">
                      {poll.options.length} options • {totalVotes} votes
                    </p>
                  </CardContent>
                  <CardFooter className="text-xs text-neutral-500">
                    <p>Created by {poll.createdBy} on {poll.createdAt}</p>
                  </CardFooter>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}