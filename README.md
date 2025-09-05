# Polly - A Simple Polling App

This is a full-stack polling application built with Next.js and Supabase. It allows users to create polls, vote on them, and view the results in real-time.

## Tech Stack

-   **Framework:** [Next.js](https://nextjs.org/) (with App Router)
-   **Authentication:** [Supabase Auth](https://supabase.com/auth)
-   **Database:** [Supabase (Postgres)](https://supabase.com/database)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Testing:** [Jest](https://jestjs.io/)

## Features

-   User authentication (Sign up, Sign in)
-   Create, view, edit, and delete polls
-   Vote on polls
-   Real-time poll results
-   Protected routes for authenticated users

## Setup and Installation

To run this project locally, follow these steps:

### 1. Clone the repository

```bash
git clone <repository-url>
cd polly-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1.  Create a new project on [Supabase](https://supabase.com/).
2.  Go to the **SQL Editor** in your Supabase project dashboard.
3.  Run the SQL statements from `supabase/migrations` to create the necessary tables (`polls`, `poll_options`, `votes`).
4.  Go to **Project Settings > API** to find your project URL and API keys.

### 4. Configure Environment Variables

Create a `.env.local` file in the root of the project and add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
SUPABASE_SECRET_KEY=your-supabase-secret-key
```

Replace `your-supabase-project-url` and `your-supabase-secret-key` with the values from your Supabase project.

## How to Run the App Locally

Once the setup is complete, you can run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Testing

To run the tests, use the following command:

```bash
npm test
```

This will run the Jest tests for the application.

## Usage Examples

### Creating a Poll

1.  Sign up for an account or sign in.
2.  Navigate to the "Create Poll" page.
3.  Fill in the title, an optional description, and at least two options.
4.  Click "Create Poll" to submit.

### Voting on a Poll

1.  From the main polls page, click on a poll to view it.
2.  Select an option to vote for.
3.  Click "Submit Vote".
4.  After voting, you will see the poll results.

## Security Vulnerabilities and Remediation

During a recent security review, critical vulnerabilities were identified and have been remediated. This section outlines the issues and the steps taken to fix them.

### 1. Insecure Server Actions - User Impersonation

**Vulnerability:**

The initial implementation of the Next.js Server Actions in `lib/poll-actions.ts` was vulnerable to user impersonation. The `createPoll`, `votePoll`, and `deletePoll` functions received user identity (`creatorId`, `voterId`, `userId`) directly from the client-side `FormData`. A malicious user could easily manipulate this data to perform actions on behalf of other users.

For example, an attacker could have created a poll or cast a vote as any other user by simply providing that user's ID in the form submission.

**Remediation:**

The vulnerability was fixed by enforcing server-side authentication and authorization within the Server Actions:

1.  **Server-Side User Authentication:** The updated Server Actions now use the `@supabase/ssr` library to create a server-side Supabase client. This client securely retrieves the authenticated user's session from the browser's cookies.

2.  **Enforced User Identity:** The `creatorId`, `voterId`, and `userId` are no longer read from the client-side `FormData`. Instead, the functions now rely exclusively on the `user.id` obtained from the secure, server-side session. If no user is authenticated, the actions throw an `AuthenticationError`.

3.  **Client-Side Code Update:** The client-side code in `app/create-poll/page.tsx` and `app/polls/[id]/page.tsx` was refactored to stop sending user IDs in the `FormData`. These pages now call the secure Server Actions.

This ensures that all actions are performed by the currently logged-in user, preventing any possibility of user impersonation.

### 2. Direct Database Access from Client

**Vulnerability:**

Several components, such as `app/create-poll/page.tsx` and `app/polls/[id]/page.tsx`, were making direct calls to the Supabase database from the client-side. This approach is not recommended as it can lead to security risks if Row Level Security (RLS) is not perfectly configured. It also tightly couples the frontend with the database schema.

**Remediation:**

The client-side components were refactored to use the newly secured Server Actions (`createPoll`, `votePoll`, etc.) instead of direct database calls. This change centralizes the application's business logic and data access on the server, providing a more secure and maintainable architecture.
