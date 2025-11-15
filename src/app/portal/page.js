'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PortalLogin from './components/PortalLogin';
import CustomerDashboard from './components/CustomerDashboard';
import { login, logout } from '../redux/slices/userSlice';

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
        <div className="pt-[120px] pb-16 flex justify-center items-center min-h-[50vh]">
          <div className="animate-pulse text-2xl text-[#54BB74]">Loading...</div>
        </div>
      </main>
    );
  }
  
  return (
    <main className="bg-[#292929] text-white min-h-screen">
      
      <div className="">
        <div className="">
          {!isLoggedIn ? (
            <PortalLogin onLogin={handleLogin} />
          ) : (
            <div className="max-w-7xl mx-auto">
              <CustomerDashboard user={user.data} onLogout={handleLogout} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
