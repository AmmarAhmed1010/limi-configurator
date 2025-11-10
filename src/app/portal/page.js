'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PortalLogin from './components/PortalLogin';
import CustomerDashboard from './components/CustomerDashboard';
import { login, logout } from '../redux/slices/userSlice';
import Link from 'next/link';
import Image from 'next/image';
import { FaHome } from 'react-icons/fa';

export default function CustomerPortal() {
  const dispatch = useDispatch();
  const { isLoggedIn = false, user = null, loginStatus = 'idle' } = useSelector((state) => state.user || {});

  const router = useRouter();
  const loading = loginStatus === 'loading';
  
  // Handle login
  const handleLogin = (userData) => {
    // This will be handled by the Redux login action
    dispatch(login(userData));
  };
  
  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
    router.push('/portal');
  };
  
  if (loading) {
    return (
      <main className="bg-[#292929] text-white min-h-screen">
        {/* <Header /> */}
        <div className="pt-[120px] pb-16 flex justify-center items-center min-h-[50vh]">
          <div className="animate-pulse text-2xl text-[#54BB74]">Loading...</div>
        </div>
        {/* <Footer /> */}
      </main>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-[#292929] text-white">
        <header className="fixed top-0 left-0 right-0 z-[1000] bg-[#232B2B] py-4 animate-fadeIn">
          <div className="relative flex items-center w-full px-4">
            {/* Logo - Centered */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <Link href="/" className="flex items-center no-underline">
                <Image
                  src="/images/svgLogos/__Icon_Wordmark_White.svg"
                  alt="LIMI Logo"
                  width={200}
                  height={80}
                  className="filter-none"
                  priority
                />
              </Link>
            </div>
            
            {/* Home Button - Right Aligned */}
            <div className="ml-auto">
              <Link
                href="/configurator"
                className="flex h-10 w-10 items-center justify-center text-white no-underline transition-transform duration-200 hover:scale-110"
                title="Home"
              >
                <FaHome className="h-6 w-6" />
              </Link>
            </div>
          </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 pt-24">
        <div className="w-full">
          {!isLoggedIn ? (
            <PortalLogin onLogin={handleLogin} />
          ) : (
            <CustomerDashboard user={user.data} onLogout={handleLogout} />
          )}
        </div>
      </main>
    </div>
  );
}
