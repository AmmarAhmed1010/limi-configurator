"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaTimes,
} from "react-icons/fa";
import { loginUser, clearAuthStatus } from "@/app/redux/slices/userSlice";

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  
  const dispatch = useDispatch();
  const { loginStatus, error, isLoggedIn, user } = useSelector(
    (state) => state?.user || {}
  );

  // Handle successful login
  useEffect(() => {
    if (isLoggedIn && user) {
      onLoginSuccess?.();
      onClose();
    }
  }, [isLoggedIn, user, onLoginSuccess, onClose]);

  // Clear errors when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      dispatch(clearAuthStatus());
    }
  }, [isOpen, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignUp) {
      // Handle sign up logic here
      // For now, just log in
      dispatch(loginUser({ email, password, isWebsiteLogin: true }));
    } else {
      // Handle login
      dispatch(loginUser({ email, password, isWebsiteLogin: true }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative w-full max-w-md p-8 bg-[#2D2D2D] rounded-lg shadow-xl text-white"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <FaTimes size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center">
          {isSignUp ? "Create Account" : "Sign In"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 text-red-200 text-sm rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-[#3D3D3D] border border-[#4D4D4D] rounded-md focus:outline-none focus:ring-2 focus:ring-[#54BB74] focus:border-transparent"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#3D3D3D] border border-[#4D4D4D] rounded-md focus:outline-none focus:ring-2 focus:ring-[#54BB74] focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {isSignUp ? "Create Password" : "Password"}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-[#3D3D3D] border border-[#4D4D4D] rounded-md focus:outline-none focus:ring-2 focus:ring-[#54BB74] focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {!isSignUp && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                className="text-sm text-[#54BB74] hover:underline"
                onClick={() => {
                  // Handle forgot password
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loginStatus === 'loading'}
            className={`w-full py-2 px-4 bg-[#54BB74] hover:bg-[#3DA35D] text-white font-medium rounded-md transition-colors ${
              loginStatus === 'loading' ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loginStatus === 'loading' 
              ? 'Loading...' 
              : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setIsSignUp(false)}
                className="text-[#54BB74] hover:underline"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button
                onClick={() => setIsSignUp(true)}
                className="text-[#54BB74] hover:underline"
              >
                Sign Up
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
