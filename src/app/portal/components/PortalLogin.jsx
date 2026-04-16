"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import Link from "next/link"; 
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEnvelope,
  FaLock,
  FaMobileAlt,
  FaArrowRight,
  FaGoogle,
  FaApple,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
} from "react-icons/fa";
import { loginUser, clearAuthStatus } from "../../redux/slices/userSlice";
import SignupForm from "./SignupForm";
import PortalCTA from "../../components/PortalCTA";
import { useRef } from "react";
import { fetchUserByToken } from '../../../app/redux/slices/userSlice.js';
import { useHideNavFooter } from '../../components/context/HideNavFooterContext';
import { buildApiUrl, API_CONFIG } from '../../config/api.config';
export default function PortalLogin({ onLogin }) {
  const [isFetchingByToken, setIsFetchingByToken] = useState(false);
  const [loginMethod, setLoginMethod] = useState("email"); // 'email' or 'otp'
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const loginSectionRef = useRef(null);

  // Forgot Password state
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetStatus, setResetStatus] = useState({ type: "", message: "" });
  const { hideNavFooter, setHideNavFooter } = useHideNavFooter();

  const dispatch =  useDispatch();
  const { loginStatus, error, isLoggedIn, user } = useSelector(
    (state) => state?.user || {}
  );
  // Auto-login via token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      setHideNavFooter(false);
      setIsFetchingByToken(true);
      dispatch(fetchUserByToken(urlToken)).finally(() => {
        setIsFetchingByToken(false);
      });
    }
  }, [dispatch, hideNavFooter]);

  // Clear auth status when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearAuthStatus());
    };
  }, [dispatch]);
  const handleSignInClick = (showSignupForm = false) => {
    if (loginSectionRef.current) {
      const yOffset = -80; // Adjust this value based on your header height
      const y = loginSectionRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      
      // If showSignupForm is true, show the signup form
      if (showSignupForm) {
        setShowSignup(true);
      } else {
        setShowSignup(false);
      }
    }
  };
  // Redirect to dashboard after successful login
  const router = require('next/navigation').useRouter();
  useEffect(() => {
    if (isLoggedIn && user) {
      router.push('/dashboard'); // or '/portal' or your desired route
      onLogin(user);
      setShowSignup(false);
    }
  }, [isLoggedIn, user, router, onLogin]);

  // Handle email login
  const handleEmailLogin = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password, isWebsiteLogin: true }));
  };

  // Handle forgot password
  const handleForgotPassword = (e) => {
    e.preventDefault();
    setForgotPassword(true);
    setResetStep(1);
    setResetStatus({ type: "", message: "" });
  };

  // Handle back to login from forgot password
  const handleBackToLogin = () => {
    setForgotPassword(false);
    setResetStep(1);
    setResetEmail("");
    setResetOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetStatus({ type: "", message: "" });
  };

  // Handle send OTP for password reset
  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetStatus({
        type: "error",
        message: "Please enter your email address",
      });
      return;
    }

    setResetStatus({ type: "loading", message: "Sending OTP..." });

    try {
      const response = await fetch(buildApiUrl('/client/forgot_password/send_otp'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error_message || "Failed to send OTP");

      setResetStep(2);
      setResetStatus({ type: "success", message: "OTP sent to your email" });
    } catch (error) {
      setResetStatus({
        type: "error",
        message: error.message || "Failed to send OTP",
      });
    }
  };


  // Handle verify OTP for password reset
  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    if (!resetOtp || resetOtp.length !== 6) {
      setResetStatus({
        type: "error",
        message: "Please enter a valid 6-digit OTP",
      });
      return;
    }

    setResetStatus({ type: "loading", message: "Verifying OTP..." });

    try {
      const response = await fetch(buildApiUrl('/client/forgot_password/verify_otp'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, otp: resetOtp }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Invalid OTP");

      setResetStep(3);
      setResetStatus({ type: "success", message: "OTP verified successfully" });
    } catch (error) {
      setResetStatus({
        type: "error",
        message: error.message || "Failed to verify OTP",
      });
    }
  };


  // Handle reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      setResetStatus({
        type: "error",
        message: "Password must be at least 8 characters long",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetStatus({ type: "error", message: "Passwords do not match" });
      return;
    }

    setResetStatus({ type: "loading", message: "Updating password..." });

    try {
      const response = await fetch(buildApiUrl('/client/forgot_password/reset'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to reset password");

      setResetStatus({
        type: "success",
        message: "Password updated successfully! Redirecting to login...",
      });

      setTimeout(() => {
        handleBackToLogin();
      }, 2000);
    } catch (error) {
      setResetStatus({
        type: "error",
        message: error.message || "Failed to reset password",
      });
    }
  };


  const switchToSignup = () => {
    setShowSignup(true);
    dispatch(clearAuthStatus());
  };

  const switchToLogin = () => {
    setShowSignup(false);
    dispatch(clearAuthStatus());
  };

  // Handle OTP login
  const [otpStatus, setOtpStatus] = useState("idle"); // 'idle' | 'sending' | 'sent' | 'verifying' | 'failed'
  const [otpError, setOtpError] = useState("");

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (phone && phone.length >= 10) {
      setOtpStatus("sending");
      setOtpError("");

      try {
        // Call the OTP send API
        const response = await fetch("/client/user/send-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to send OTP");
        }

        setOtpSent(true);
        setOtpStatus("sent");
      } catch (error) {
        setOtpStatus("failed");
        setOtpError(error.message || "Failed to send OTP");
      }
    } else {
      setOtpError("Please enter a valid phone number");
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (otp && otp.length === 6) {
      setOtpStatus("verifying");
      setOtpError("");

      try {
        // Call the OTP verification API
        const response = await fetch("/client/user/verify-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone, otp }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Invalid OTP");
        }

        const data = await response.json();

        // Save token if provided
        if (data.token) {
          localStorage.setItem("limiToken", data.token);
        }

        // Get user profile
        const profileResponse = await fetch("/client/user/profile", {
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        });

        if (!profileResponse.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const userData = await profileResponse.json();

        // Save to localStorage
        localStorage.setItem("limiUser", JSON.stringify(userData));

        // Login successful
        onLogin(userData);
      } catch (error) {
        setOtpStatus("failed");
        setOtpError(error.message || "Failed to verify OTP");
      }
    } else {
      setOtpError("Please enter a valid 6-digit OTP");
    }
  };

  // Demo user login for quick testing
  const loginAsDemoUser = async () => {
    try {
      // Call the demo login API
      const response = await fetch("/client/user/demo-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Demo login failed");
      }

      const data = await response.json();

      // Save token if provided
      if (data.token) {
        localStorage.setItem("limiToken", data.token);
      }

      // Get user profile
      const profileResponse = await fetch("https://saturn-toys-wc-angle.trycloudflare.com/client/user/profile", {
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error("Failed to fetch demo user profile");
      }

      const userData = await profileResponse.json();

      // Save to localStorage
      localStorage.setItem("limiUser", JSON.stringify(userData));

      // Login successful
      onLogin(userData);
    } catch (error) {
      // Fallback to local demo user if API fails
      const demoUser = {
        id: "demo123",
        name: "Sarah Johnson",
        email: "sarah@example.com",
        phone: "+1234567890",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop",
      };

      onLogin(demoUser);
    }
  };

  if (isFetchingByToken) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <span className="text-emerald-9">Logging you in...</span>
      </div>
    );
  }

  return (
    <div className="">
      {/* <PortalCTA onSignInClick={handleSignInClick}  /> */}
      <div className="max-w-4xl mt-10 mx-auto">
        <div  ref={loginSectionRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left side - Login/Signup form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-lg bg-charleston-green-11 p-8"
          >
            <h1 className="mb-6 font-[Amenti] text-2xl font-bold text-emerald-9 md:text-3xl">
              Customer Portal
            </h1>

            <AnimatePresence mode="wait">
              {showSignup ? (
                <SignupForm key="signup" onSwitchToLogin={switchToLogin} />
              ) : forgotPassword ? (
                <motion.div
                  key="forgot-password"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6"
                >
                  <div className="relative">
                    <button
                      onClick={handleBackToLogin}
                      className="absolute -top-2 -left-2 text-gray-400 hover:text-gray-300 p-2"
                      aria-label="Back to login"
                    >
                      <FaArrowLeft />
                    </button>

                    <h2 className="text-xl font-semibold text-white mb-6 text-center">
                      {resetStep === 1 && "Reset Password"}
                      {resetStep === 2 && "Verify OTP"}
                      {resetStep === 3 && "Create New Password"}
                    </h2>
                  </div>

                  {resetStatus.message && (
                    <div
                      className={`mb-4 p-3 rounded-md text-sm ${
                        resetStatus.type === "error"
                          ? "bg-red-500/20 text-red-400"
                          : resetStatus.type === "success"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {resetStatus.message}
                    </div>
                  )}

                  {resetStep === 1 && (
                    <form onSubmit={handleSendResetOtp}>
                      <div className="mb-6">
                        <label className="block text-gray-300 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <FaEnvelope className="text-gray-500" />
                          </div>
                          <input
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="bg-charleston-green text-white w-full pl-10 pr-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9"
                            placeholder="your@email.com"
                            required
                            disabled={resetStatus.type === "loading"}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={resetStatus.type === "loading"}
                        className="w-full bg-emerald-9 py-3 rounded-md text-white hover:bg-emerald-10 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resetStatus.type === "loading" ? (
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <>
                            <span>Next</span>
                            <FaArrowRight />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {resetStep === 2 && (
                    <form onSubmit={handleVerifyResetOtp}>
                      <div className="mb-6">
                        <p className="text-gray-300 text-sm mb-4">
                          We've sent a 6-digit OTP to {resetEmail}
                        </p>
                        <label className="block text-gray-300 mb-2">
                          Enter OTP
                        </label>
                        <input
                          type="text"
                          value={resetOtp}
                          onChange={(e) =>
                            setResetOtp(
                              e.target.value.replace(/[^0-9]/g, "").slice(0, 6)
                            )
                          }
                          className="bg-charleston-green text-white w-full px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9 text-center tracking-widest font-mono text-xl"
                          placeholder="123456"
                          maxLength={6}
                          required
                          disabled={resetStatus.type === "loading"}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={resetStatus.type === "loading"}
                        className="w-full bg-emerald-9 py-3 rounded-md text-white hover:bg-emerald-10 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resetStatus.type === "loading" ? (
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <>
                            <span>Verify OTP</span>
                            <FaArrowRight />
                          </>
                        )}
                      </button>

                      <div className="mt-4 text-center text-sm text-gray-400">
                        Didn't receive the code?{" "}
                        <button
                          type="button"
                          onClick={handleSendResetOtp}
                          className="text-emerald-9 hover:underline"
                          disabled={resetStatus.type === "loading"}
                        >
                          Resend OTP
                        </button>
                      </div>
                    </form>
                  )}

                  {resetStep === 3 && (
                    <form onSubmit={handleResetPassword}>
                      <div className="mb-4">
                        <label className="block text-gray-300 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <FaLock className="text-gray-500" />
                          </div>
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="bg-charleston-green text-white w-full pl-10 pr-12 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9"
                            placeholder="••••••••"
                            required
                            minLength={8}
                            disabled={resetStatus.type === "loading"}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors"
                            disabled={resetStatus.type === "loading"}
                          >
                            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      <div className="mb-6">
                        <label className="block text-gray-300 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <FaLock className="text-gray-500" />
                          </div>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="bg-charleston-green text-white w-full pl-10 pr-12 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9"
                            placeholder="••••••••"
                            required
                            minLength={8}
                            disabled={resetStatus.type === "loading"}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors"
                            disabled={resetStatus.type === "loading"}
                          >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={resetStatus.type === "loading"}
                        className="w-full bg-emerald-9 py-3 rounded-md text-white hover:bg-emerald-10 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resetStatus.type === "loading" ? (
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <>
                            <span>Save Password</span>
                            <FaArrowRight />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="login"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6"
                >
                  <div className="flex border-b border-charleston-green-7 mb-6">
                    <button
                      onClick={() => setLoginMethod("email")}
                      className={`px-4 py-2 font-medium flex items-center gap-2 ${
                        loginMethod === "email"
                          ? "border-b-2 border-emerald-9 text-emerald-9"
                          : "text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      <FaEnvelope />
                      Email Login
                    </button>
                    {/* <button
                    onClick={() => setLoginMethod('otp')}
                    className={`flex items-center gap-2 px-4 py-2 font-medium ${loginMethod === 'otp' ? 'border-b-2 border-emerald-9 text-emerald-9' : 'text-gray-400 hover:text-gray-300'}`}
                  >
                    <FaMobileAlt />
                    OTP Login
                  </button> */}
                  </div>

                  {loginMethod === "email" ? (
                    <form onSubmit={handleEmailLogin}>
                      <div className="mb-4">
                        <label className="block text-gray-300 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <FaEnvelope className="text-gray-500" />
                          </div>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-charleston-green w-full pl-10 pr-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9"
                            placeholder="your@email.com"
                            required
                            disabled={loginStatus === "loading"}
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-gray-300 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <FaLock className="text-gray-500" />
                          </div>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-charleston-green text-white w-full pl-10 pr-12 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9"
                            placeholder="••••••••"
                            required
                            disabled={loginStatus === "loading"}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors"
                            disabled={loginStatus === "loading"}
                          >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      <div className="mb-6 text-right">
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-emerald-9 hover:underline text-sm"
                          disabled={loginStatus === "loading"}
                        >
                          Forgot Password?
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={loginStatus === "loading"}
                        className="flex w-full items-center justify-center gap-2 rounded-md bg-white py-3 font-medium text-charleston-green-15 transition-colors hover:bg-emerald-0 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loginStatus === "loading" ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-charleston-green-9 border-t-transparent"></div>
                        ) : (
                          <>
                            <span>Sign In</span>
                            <FaArrowRight />
                          </>
                        )}
                      </button>
                    </form>
                  ) : forgotPassword ? (
                    <div className="relative">
                      <button
                        onClick={handleBackToLogin}
                        className="absolute -top-2 -left-2 text-gray-400 hover:text-gray-300 p-2"
                        aria-label="Back to login"
                      >
                        <FaArrowLeft />
                      </button>

                      <h2 className="text-xl font-semibold text-white mb-6 text-center">
                        {resetStep === 1 && "Reset Password"}
                        {resetStep === 2 && "Verify OTP"}
                        {resetStep === 3 && "Create New Password"}
                      </h2>

                      {resetStatus.message && (
                        <div
                          className={`mb-4 p-3 rounded-md text-sm ${
                            resetStatus.type === "error"
                              ? "bg-red-500/20 text-red-400"
                              : resetStatus.type === "success"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {resetStatus.message}
                        </div>
                      )}

                      {resetStep === 1 && (
                        <form onSubmit={handleSendResetOtp}>
                          <div className="mb-6">
                            <label className="block text-gray-300 mb-2">
                              Email Address
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <FaEnvelope className="text-gray-500" />
                              </div>
                              <input
                                type="email"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                className="bg-charleston-green text-white w-full pl-10 pr-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9"
                                placeholder="your@email.com"
                                required
                                disabled={resetStatus.type === "loading"}
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={resetStatus.type === "loading"}
                            className="w-full bg-emerald-9 py-3 rounded-md text-white hover:bg-emerald-10 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {resetStatus.type === "loading" ? (
                              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                            ) : (
                              <>
                                <span>Next</span>
                                <FaArrowRight />
                              </>
                            )}
                          </button>
                        </form>
                      )}

                      {resetStep === 2 && (
                        <form onSubmit={handleVerifyResetOtp}>
                          <div className="mb-6">
                            <p className="text-gray-300 text-sm mb-4">
                              We've sent a 4-digit OTP to {resetEmail}
                            </p>
                            <label className="block text-gray-300 mb-2">
                              Enter OTP
                            </label>
                            <input
                              type="text"
                              value={resetOtp}
                              onChange={(e) =>
                                setResetOtp(
                                  e.target.value
                                    .replace(/[^0-9]/g, "")
                                    .slice(0, 4)
                                )
                              }
                              className="bg-charleston-green text-white w-full px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9 text-center tracking-widest font-mono text-xl"
                              placeholder="1234"
                              maxLength={4}
                              required
                              disabled={resetStatus.type === "loading"}
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={resetStatus.type === "loading"}
                            className="w-full bg-emerald-9 py-3 rounded-md text-white hover:bg-emerald-10 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {resetStatus.type === "loading" ? (
                              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                            ) : (
                              <>
                                <span>Verify OTP</span>
                                <FaArrowRight />
                              </>
                            )}
                          </button>

                          <div className="mt-4 text-center text-sm text-gray-400">
                            Didn't receive the code?{" "}
                            <button
                              type="button"
                              onClick={handleSendResetOtp}
                              className="text-emerald-9 hover:underline"
                              disabled={resetStatus.type === "loading"}
                            >
                              Resend OTP
                            </button>
                          </div>
                        </form>
                      )}

                      {resetStep === 3 && (
                        <form onSubmit={handleResetPassword}>
                          <div className="mb-4">
                            <label className="block text-gray-300 mb-2">
                              New Password
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <FaLock className="text-gray-500" />
                              </div>
                              <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="bg-charleston-green text-white w-full pl-10 pr-12 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9"
                                placeholder="••••••••"
                                required
                                minLength={8}
                                disabled={resetStatus.type === "loading"}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowNewPassword(!showNewPassword)
                                }
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors"
                                disabled={resetStatus.type === "loading"}
                              >
                                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                              </button>
                            </div>
                          </div>

                          <div className="mb-6">
                            <label className="block text-gray-300 mb-2">
                              Confirm New Password
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <FaLock className="text-gray-500" />
                              </div>
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) =>
                                  setConfirmPassword(e.target.value)
                                }
                                className="bg-charleston-green text-white w-full pl-10 pr-12 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9"
                                placeholder="••••••••"
                                required
                                minLength={8}
                                disabled={resetStatus.type === "loading"}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowConfirmPassword(!showConfirmPassword)
                                }
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors"
                                disabled={resetStatus.type === "loading"}
                              >
                                {showConfirmPassword ? (
                                  <FaEyeSlash />
                                ) : (
                                  <FaEye />
                                )}
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={resetStatus.type === "loading"}
                            className="w-full bg-emerald-9 py-3 rounded-md text-white hover:bg-emerald-10 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {resetStatus.type === "loading" ? (
                              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                            ) : (
                              <>
                                <span>Save Password</span>
                                <FaArrowRight />
                              </>
                            )}
                          </button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div>
                      {!otpSent ? (
                        <form onSubmit={handleSendOTP}>
                          <div className="mb-6">
                            <label className="block text-gray-300 mb-2">
                              Phone Number
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <FaMobileAlt className="text-gray-500" />
                              </div>
                              <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="bg-charleston-green text-white w-full pl-10 pr-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9"
                                placeholder="+1 (234) 567-8900"
                                required
                                disabled={otpStatus === "sending"}
                              />
                            </div>
                          </div>

                          {otpError && !otpSent && (
                            <div className="mb-4 text-red-400 text-sm">
                              {otpError}
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={otpStatus === "sending"}
                            className="w-full bg-emerald-9 py-3 rounded-md text-white hover:bg-emerald-10 transition-colors flex items-center justify-center gap-2 font-medium"
                          >
                            {otpStatus === "sending" ? (
                              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                            ) : (
                              <>
                                <span>Send OTP</span>
                                <FaArrowRight />
                              </>
                            )}
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleVerifyOTP}>
                          <div className="mb-2">
                            <p className="text-gray-300 text-sm">
                              OTP sent to {phone}.
                              <button
                                type="button"
                                onClick={() => {
                                  setOtpSent(false);
                                  setOtpStatus("idle");
                                  setOtpError("");
                                }}
                                className="ml-2 text-emerald-9 hover:underline"
                                disabled={otpStatus === "verifying"}
                              >
                                Change
                              </button>
                            </p>
                          </div>

                          <div className="mb-6">
                            <label className="block text-gray-300 mb-2">
                              Enter OTP
                            </label>
                            <input
                              type="text"
                              value={otp}
                              onChange={(e) =>
                                setOtp(
                                  e.target.value
                                    .replace(/[^0-9]/g, "")
                                    .slice(0, 6)
                                )
                              }
                              className="bg-charleston-green text-white w-full px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9 text-center tracking-widest font-mono text-xl"
                              placeholder="123456"
                              maxLength={6}
                              required
                              disabled={otpStatus === "verifying"}
                            />
                          </div>

                          {otpError && otpSent && (
                            <div className="mb-4 text-red-400 text-sm">
                              {otpError}
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={otpStatus === "verifying"}
                            className="w-full bg-emerald-9 py-3 rounded-md text-white hover:bg-emerald-10 transition-colors flex items-center justify-center gap-2 font-medium"
                          >
                            {otpStatus === "verifying" ? (
                              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                            ) : (
                              <>
                                <span>Verify OTP</span>
                                <FaArrowRight />
                              </>
                            )}
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 text-red-400 text-sm">{error}</div>
                  )}

                  {/* <div className="mt-6">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-charleston-green-7 w-full"></div>
                <span className="bg-charleston-green-11 text-gray-400 px-3 text-sm relative z-10">
                  or continue with
                </span>
                <div className="border-t border-charleston-green-7 w-full"></div>
              </div>
              
              <div className="flex gap-4 mt-4">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 bg-charleston-green-9 py-2 text-white rounded-md hover:bg-charleston-green-8 transition-colors"
                >
                  <FaGoogle />
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 bg-charleston-green-9 py-2 text-white rounded-md hover:bg-charleston-green-8 transition-colors"
                >
                  <FaApple />
                  <span>Apple</span>
                </button>
              </div>
            </div>
             */}
                  <div className="mt-6 text-center">
                    <div className="flex flex-col gap-2">
                      {/* <button
                  type="button"
                  onClick={loginAsDemoUser}
                  className="text-emerald-9 hover:underline"
                >
                  Login as Demo User
                </button> */}

                      <button
                        type="button"
                        onClick={switchToSignup}
                        className="text-emerald-9 hover:underline"
                      >
                        Create a new account
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right side - Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center md:text-left"
          >
            <h2 className="mb-4 font-[Amenti] text-xl font-bold text-emerald-9 md:text-2xl">
              Access Your LIMI Experience
            </h2>
            <p className="mb-6 text-gray-300">
              Sign in to view your saved configurations, order history, and
              manage your LIMI lighting experience across all devices.
            </p>

            <div className="mb-6 rounded-lg border border-emerald-9/25 bg-charleston-green-11 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-full bg-emerald-9/20 p-3">
                  <FaMobileAlt className="text-xl text-emerald-9" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">
                    Cross-Platform Access
                  </h3>
                  <p className="text-sm text-gray-400">
                    View configurations created in the LIMI mobile app
                  </p>
                </div>
              </div>

              <div className="relative h-48 rounded-lg overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?q=80&w=1974&auto=format&fit=crop"
                  alt="LIMI App Configuration"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charleston-green-11 to-transparent opacity-60"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white text-sm font-medium">
                    Your configurations sync automatically between the app and
                    web portal
                  </p>
                </div>
              </div>
            </div>
            {/*           
          <div className="text-sm text-gray-400">
            <p>Don't have the LIMI app yet?</p>
            <div className="mt-2 flex gap-4 justify-center md:justify-start">
              <Link 
                href="https://apps.apple.com/app/limi-lighting"
                target="_blank"
                className="flex items-center gap-1 text-emerald-9 hover:underline"
              >
                <FaApple   />
                <span>App Store</span>
              </Link>
              <Link 
                href="https://play.google.com/store/apps/details?id=com.limi.lighting"
                target="_blank"
                className="flex items-center gap-1 text-emerald-9 hover:underline"
              >
                <FaGoogle />
                <span>Google Play</span>
              </Link>
            </div>
          </div> */}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
