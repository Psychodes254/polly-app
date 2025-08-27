'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Navbar() {
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
        <Link href="/create-poll">
          <Button variant="outline">Create Poll</Button>
        </Link>
        <Link href="/auth/signin">
          <Button>Sign In</Button>
        </Link>
      </div>
    </nav>
  );
}