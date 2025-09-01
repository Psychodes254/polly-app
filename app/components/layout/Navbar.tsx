'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';

export default function Navbar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <nav className="border-b py-4 px-6 flex justify-between items-center">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-xl font-bold">Polly</Link>
        <div className="hidden md:flex gap-4">
          <Link href="/polls" className="hover:text-neutral-600 transition-colors">
            Polls
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme} 
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
        {user ? (
          <>
            <Link href="/create-poll">
              <Button variant="outline">Create Poll</Button>
            </Link>
            <Button onClick={handleSignOut}>Sign Out</Button>
          </>
        ) : (
          <>
            <Link href="/auth/signin">
              <Button>Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline">Sign Up</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
