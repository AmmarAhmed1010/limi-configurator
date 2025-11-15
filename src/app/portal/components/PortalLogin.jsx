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
        <span className="text-emerald">Logging you in...</span>
      </div>
    );
  }

  return (
    <div className="">
      <PortalCTA onSignInClick={handleSignInClick}  />
    </div>
  );
}
