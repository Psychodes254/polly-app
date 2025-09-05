"use client";

import { useState } from 'react';

/**
 * LoginPage component provides a simple login form.
 * This component is for demonstration purposes and uses mock authentication.
 */
export default function LoginPage() {
  // State for managing user input, loading, and error messages
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  /**
   * Handles the login form submission.
   * Simulates an API call and checks for hardcoded credentials.
   * @param {React.FormEvent} e - The form submission event.
   */
  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate an API call with a timeout
    setTimeout(() => {
      // Simple validation for demonstration purposes
      if (email === 'test@example.com' && password === 'password123') {
        setIsLoggedIn(true);
      } else {
        setError('Invalid email or password.');
      }
      setLoading(false);
    }, 1500);
  };

  // Display a success message if login is successful
  if (isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md w-96 text-center">
          <h1 className="text-2xl font-bold mb-4">Login Successful!</h1>
          <p>Welcome back!</p>
        </div>
      </div>
    );
  }

  // Render the login form
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
        <form onSubmit={handleLogin} className="flex flex-col space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="p-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Don't have an account?{' '}
          <a href="#" className="text-blue-500 hover:underline" onClick={(e) => { e.preventDefault(); alert("Sign up functionality is not available in this demo."); }}>
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
