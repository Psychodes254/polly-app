"use client";

import React, { useState, useEffect } from 'react';

// This is a self-contained component that simulates authentication
// to avoid external dependencies like 'next/navigation' and 'supabaseClient'.
// It manages its own state for 'logged in' status and loading.

export default function ProtectedPage() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Simulate an authentication check, like verifying a session or token.
    // In a real application, this would be an API call.
    const mockAuthCheck = () => {
      setLoading(true);
      setTimeout(() => {
        const mockUser = { email: 'user@example.com' };
        setIsLoggedIn(true); // Assuming the user is authenticated for this demo.
        setUser(mockUser);
        setLoading(false);
      }, 1500); // Simulate a network delay
    };

    mockAuthCheck();
  }, []);

  const handleLogout = () => {
    // Simulate logging out by resetting the state.
    // In a real app, this would be a call to a signOut function.
    setLoading(true);
    setTimeout(() => {
      setIsLoggedIn(false);
      setUser(null);
      setLoading(false);
    }, 500);
  };

  // Render a loading state while the authentication check is in progress.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  // If the user is not logged in after the check, show a message and a link.
  // This simulates the redirect functionality.
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold mb-4">You are not logged in.</h1>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Please log in to view this page.
          </p>
          <a href="#" className="p-2 inline-block text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // If the user is logged in, show the protected content.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4 font-sans text-gray-900 dark:text-gray-100">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-lg w-full text-center border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold mb-4">Welcome, {user.email}!</h1>
        <p className="mb-6 text-lg text-gray-700 dark:text-gray-300">
          You have successfully accessed a protected route.
        </p>
        <button
          onClick={handleLogout}
          className="p-3 text-white font-semibold bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md"
        >
          Logout
        </button>
      </div>
    </div>
  );
}