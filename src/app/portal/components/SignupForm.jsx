'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaArrowRight, FaCheck } from 'react-icons/fa';
import { signupUser, clearAuthStatus } from '../../redux/slices/userSlice';

export default function SignupForm({ onSwitchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const dispatch = useDispatch();
  const { signupStatus, error, successMessage, isLoggedIn } = useSelector(
    (state) => state.user
  );
  
  // Clear auth status when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearAuthStatus());
    };
  }, [dispatch]);
  
  // Signup completes after send_otp only — user verifies via email, then signs in (no auto-login)
  
  const validatePassword = () => {
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    
    setPasswordError('');
    return true;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    dispatch(signupUser({ name, email, password }));
  };
  
  // Loading overlay
  if (signupStatus === 'loading') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-charleston-green-15/90">
        <div className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-solid border-emerald-9 border-t-transparent"></div>
        <p className="text-gray-300">Creating Your Account...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="mb-6 font-['Amenti'] text-2xl font-bold text-emerald-9">
        Create Your Account
      </h2>
      
      {signupStatus === 'succeeded' && isLoggedIn ? (
        <div className="mb-6 rounded-lg border border-emerald-9/25 bg-emerald-9/10 p-4 text-center">
          <div className="mb-3 flex justify-center">
            <div className="rounded-full bg-emerald-9 p-2">
              <FaCheck className="text-lg text-white" />
            </div>
          </div>
          <p className="font-medium text-emerald-9">
            Welcome back — you&apos;re signed in. Redirecting…
          </p>
        </div>
      ) : signupStatus === 'succeeded' ? (
        <div className="mb-6 space-y-4 rounded-lg border border-emerald-9/25 bg-emerald-9/10 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 rounded-full bg-emerald-9 p-1">
              <FaCheck className="text-sm text-white" />
            </div>
            <p className="font-medium text-emerald-9">{successMessage}</p>
          </div>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="w-full rounded-md bg-emerald-9 py-3 font-medium text-white transition-colors hover:bg-emerald-10"
          >
            Sign in
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaUser className="text-gray-500" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-charleston-green-8 bg-charleston-green-11 py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-9"
                placeholder="John Doe"
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaEnvelope className="text-gray-500" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-charleston-green-8 bg-charleston-green-11 py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-9"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaLock className="text-gray-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-charleston-green-8 bg-charleston-green-11 py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-9"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-300 mb-2">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaLock className="text-gray-500" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-charleston-green-8 bg-charleston-green-11 py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-9"
                placeholder="••••••••"
                required
              />
            </div>
            {passwordError && (
              <p className="mt-2 text-red-400 text-sm">{passwordError}</p>
            )}
          </div>
          
          {error && (
            <div className="mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={signupStatus === 'loading'}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-9 py-3 font-medium text-white transition-colors hover:bg-emerald-10"
          >
            {signupStatus === 'loading' ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <span>Create Account</span>
                <FaArrowRight />
              </>
            )}
          </button>
          
          <div className="mt-4 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-emerald-9 hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </form>
      )}
    </motion.div>
  );
}
