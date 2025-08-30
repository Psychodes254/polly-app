description: Core rules, conventions, and architectural guidelines for the Polling App with QR Code Sharing project in Trae IDE.
globs:
  alwaysApply: true
---

## Project Overview: Polling App with QR Code Sharing
You are an expert full-stack developer working on the Polling App codebase inside **Trae IDE**.  
Your primary goal is to build a web application that allows users to register, create polls, and share them via unique links and QR codes for others to vote on.

Follow these **rules, patterns, and conventions** to maintain **code quality, consistency, and scalability** throughout the project.

---

## Technology Stack
This project uses the following technologies.  
🚫 Do not introduce new libraries or frameworks unless explicitly instructed.

- **Language**: TypeScript  
- **Framework**: Next.js (App Router)  
- **Database & Authentication**: Supabase  
- **Styling**: Tailwind CSS with shadcn/ui components  
- **State Management**: Prefer Server Components for server state. Use `useState` or `useReducer` for local UI state inside Client Components.  
- **API Communication**: Use Next.js Server Actions for mutations (poll creation, voting). Fetch data directly in Server Components using the Supabase client.  
- **Utility Libraries**: Use a QR code generator like `qrcode.react` for poll sharing.  

---

## Architecture & Code Style

- **Directory Structure**
  - `/app` → Next.js routes and pages.  
  - `/components/ui` → shadcn/ui primitives.  
  - `/components` → reusable custom components.  
  - `/lib` → Supabase client setup, utility functions, Server Actions.  
  - `/types` → shared TypeScript type definitions.  

- **Component Design**
  - Prefer **Server Components** for fetching + rendering.  
  - Use **Client Components** (`"use client"`) only when interactivity is required (form inputs, event listeners, hooks).  

- **Naming Conventions**
  - Components: **PascalCase** (e.g., `CreatePollForm.tsx`).  
  - Utility & Server Action functions: **camelCase** (e.g., `submitVote.ts`).  
  - Types: **PascalCase** with `.ts` (e.g., `Poll.ts`).  

- **Error Handling**
  - Wrap Supabase interactions inside `try/catch`.  
  - Use `error.tsx` in route segments for UI error boundaries.  

- **Secrets & API Keys**
  - ❌ Never hardcode secrets.  
  - ✅ Use environment variables from `.env.local`:  
    - `NEXT_PUBLIC_SUPABASE_URL`  
    - `SUPABASE_SECRET_KEY`  

---

## Code Patterns to Follow
- ✅ Use **forms that call Server Actions** for data submission.  
- ✅ Fetch data directly in **Server Components**.  
- ❌ Do NOT create custom API route handlers just to `fetch` from the client.  
- ❌ Do NOT fetch data with `useEffect` + `useState` in a page component.  

---

## Verification Checklist (Trae Auto-Review)
Before committing changes, verify:  

- [ ] Is the Next.js **App Router** used correctly?  
- [ ] Are **Server Components** fetching data directly via Supabase?  
- [ ] Are **Server Actions** handling mutations (create poll, vote)?  
- [ ] Are **shadcn/ui components** used for UI consistency?  
- [ ] Are **Supabase secrets** read from `.env.local` and NOT hardcoded?  
