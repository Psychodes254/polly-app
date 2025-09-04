This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

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