import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto py-12 px-4">
      <section className="flex flex-col md:flex-row items-center justify-between gap-8 py-12">
        <div className="max-w-xl space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Create and Share Polls with <span className="text-blue-600">Polly</span>
          </h1>
          <p className="text-lg text-neutral-600">
            A modern polling application that makes it easy to create, share, and analyze polls. Get instant feedback from your audience.
          </p>
          <div className="flex gap-4">
            <Link href="/create-poll">
              <Button size="lg">Create a Poll</Button>
            </Link>
            <Link href="/polls">
              <Button variant="outline" size="lg">View Polls</Button>
            </Link>
          </div>
        </div>
        <div className="relative w-full max-w-md aspect-square">
          <Image
            src="/globe.svg"
            alt="Polling illustration"
            fill
            className="object-contain"
            priority
          />
        </div>
      </section>

      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-blue-600 text-xl font-bold">1</span>
              </div>
              <CardTitle>Create a Poll</CardTitle>
              <CardDescription>Design your poll with multiple options</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">
                Easily create polls with our intuitive interface. Add as many options as you need and provide a clear description.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-blue-600 text-xl font-bold">2</span>
              </div>
              <CardTitle>Share with Others</CardTitle>
              <CardDescription>Distribute your poll to your audience</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">
                Share your poll with friends, colleagues, or the public. Get responses from anyone with the link.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-blue-600 text-xl font-bold">3</span>
              </div>
              <CardTitle>Analyze Results</CardTitle>
              <CardDescription>View real-time voting results</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">
                Watch as votes come in and analyze the results with our visual charts and statistics.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 bg-neutral-50 rounded-xl p-8">
        <h2 className="text-3xl font-bold text-center mb-6">Ready to get started?</h2>
        <p className="text-center text-neutral-600 max-w-2xl mx-auto mb-8">
          Join thousands of users who are already creating and sharing polls with Polly.
        </p>
        <div className="flex justify-center">
          <Link href="/auth/signup">
            <Button size="lg">Sign Up for Free</Button>
          </Link>
        </div>
      </section>

      <footer className="py-8 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}