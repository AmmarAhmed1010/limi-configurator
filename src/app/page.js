'use client';
import dynamic from 'next/dynamic';
import HeroSection from './components/HeroSection';
import ProductShowcase from './components/ProductShowcase';
import HowItWorks from './components/HowItWorks';
import InteractiveConfigurator from './components/InteractiveConfigurator';
import OurStory from './components/OurStory';
import TimelineAchievements from './components/TimelineAchievements';
import TransitionLayout from './components/TransitionLayout';
import SectionNavigation from './components/SectionNavigation';

// Commented out sections as requested
// import InteractiveStory from './components/InteractiveStory';
// import LightingCarousel from './components/LightingCarousel';
// import LightingScene from './components/LightingScene';
// import ModelSection from './components/ModelSection';
// import MotiveSection from './components/MotiveSection';
// import MouseTrail from './components/MouseTrail';
// import AnalyticsInsights from './components/AnalyticsInsights';
// import DistributorHub from './components/DistributorHub';
// import LightingStyleCompare from './components/LightingStyleCompare';
// import ProductCategories from './components/ProductCategories';
// import PortalCTA from './components/PortalCTA';
// import ConfiguratorPreview from './components/ConfiguratorPreview';
// import VideoHighlightsCarousel from './components/VideoHighlightsCarousel';

import ScrollToTop from './components/ScrollToTop';
import SplashScreen from './components/SplashScreen';
import CookieConsent from './components/CookieConsent';
import { useEffect, useState, Suspense } from 'react';
import { useHideNavFooter } from './components/context/HideNavFooterContext';
import { initTracking, sendTrackingData, cleanupTracking } from './services/trackingService';
import { initDynamicThemeSwitcher, setDayNightTheme } from './utils/dynamicThemeSwitcher';
import HourSelector from './components/ui/HourSelector';
// Dynamically import CubeAnimation with SSR disabled
const CubeAnimation = dynamic(() => import('./components/CubeAnimation'), { 
  ssr: false,
  loading: () => <div className="h-screen bg-[#292929]"></div>
});

/**
 * The main entry point of the application, which renders the main sections:
 * Hero, Lighting Controls, Motive, Interactive Story, and more.
 *
 * @returns {JSX.Element} The main app component.
 */
export default function Home() {
  const { hideNavFooter, setHideNavFooter } = useHideNavFooter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Initialize dynamic hourly theme switcher
    if (typeof window !== 'undefined') {
      initDynamicThemeSwitcher();
      setDayNightTheme(testHour); // Set initial hour for testing
    }
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    // Initial check
    checkMobile();
    // Add event listener for windo
    window.addEventListener('resize', checkMobile);
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
 
  // Custom hook to handle splash completion
  useEffect(() => {
    // Listen for splash screen completion
    const handleSplashComplete = () => {
      setShowSplash(false);
      setShowUserSelection(true);
    };

    // Create a custom event for splash screen completion
    window.addEventListener('splashComplete', handleSplashComplete);

    return () => {
      window.removeEventListener('splashComplete', handleSplashComplete);
    };
  }, []);

  // Handle user selection
  // const handleUserTypeSelect = (type) => {
  //   setUserType(type);
  //   setShowUserSelection(false);
  // };

  // Handle tracking consent
  const handleTrackingConsent = () => {
    initTracking();
  };

  // Check if consent was previously given and initialize tracking if needed
  useEffect(() => {
    const consentStatus = localStorage.getItem('cookieConsent');
    if (consentStatus === 'true') {
      initTracking();
      
    }
    
    // Cleanup tracking on component unmount
    return () => {
      cleanupTracking();
    };
  }, []);

  return (
    <main>
      {/* <SplashScreen onComplete={() => window.dispatchEvent(new Event('splashComplete'))} /> */}
      {/* <UserSelectionPopup isVisible={showUserSelection} onSelect={handleUserTypeSelect} /> */}
      {/* TESTING: HourSelector for dynamic theme (hide after testing) */}
      <div style={{
  position: 'fixed',
  top: 16,
  right: 16,
  zIndex: 99999,
  background: 'rgba(255,255,255,0.9)',
  padding: 8,
  borderRadius: 8
}}>
  <HourSelector hour={testHour} onChange={handleHourChange} />
</div>
      <TransitionLayout>
      
        <HeroSection />
        <ProductShowcase />
        <HowItWorks />
        <InteractiveConfigurator />
        <OurStory />
        <TimelineAchievements />
        {/* Commented out sections as requested
        <InteractiveStory />
        <LightingCarousel />
        <ModelSection />
        <VideoHighlightsCarousel />
        <LightingScene />
        <ProductCategories />
        <PortalCTA />
        <ConfiguratorPreview />
        <AnalyticsInsights />
        <DistributorHub />
        */}
      </TransitionLayout>
      <SectionNavigation />
      {/* <ScrollToTop /> */}
      <CookieConsent onAccept={handleTrackingConsent} onDecline={() => {}} />
    </main>
  );
}
