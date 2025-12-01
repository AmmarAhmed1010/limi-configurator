'use client';

import { useState } from 'react';
import { FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';

// Hard-coded credentials (in a real app, this would be handled securely on the backend)
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'limi2025';

export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simple validation
    if (!username || !password) {
      setError('Please enter both username and password');
      setIsLoading(false);
      return;
    }

    // Check credentials (this would be an API call in a real application)
    setTimeout(() => {
      if (username === VALID_USERNAME && password === VALID_PASSWORD) {
        // Generate a simple token (in a real app, this would be a JWT from the server)
        const token = `limi-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        onLogin(token);
      } else {
        setError('Invalid username or password');
      }
      setIsLoading(false);
    }, 1000); // Simulate API d
  };

  return (
    <div className="max-w-md mx-auto bg-[#1e1e1e] rounded-lg overflow-hidden shadow-xl">
      <div className="bg-gradient-to-r from-[#292929] to-[#54bb74]/30 p-6">
        <h2 className="text-2xl font-bold font-[Amenti] text-[#93cfa2] mb-2">
          LIMI Admin Dashboard
        </h2>
        <p className="text-gray-300">
          Enter your credentials to access the customer management system
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-900/20 text-red-400 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-gray-400 mb-2">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-500" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-[#292929] text-white w-full pl-10 pr-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#54bb74]"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-400 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-500" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#292929] text-white w-full pl-10 pr-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#54bb74]"
                placeholder="Enter password"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center items-center space-x-2 bg-[#54bb74] hover:bg-[#93cfa2] text-[#292929] font-bold py-3 px-6 rounded-md transition-colors duration-300 ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-t-2 border-[#292929] border-solid rounded-full animate-spin"></div>
              <span>Logging in...</span>
            </>
          ) : (
            <>
              <FaSignInAlt />
              <span>Login</span>
            </>
          )}
        </button>

        {/* <div className="text-center mt-4 text-sm text-gray-400">
          <p>For demonstration purposes:</p>
          <p>Username: admin | Password: limi2025</p>
        </div> */}
      </form>
    </div>
  );
}
