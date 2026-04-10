'use client';
import { useEffect, useState } from 'react';
import { useRef } from 'react';
import dynamic from 'next/dynamic';

// Use dynamic import with no SSR for the configurator to ensure it only loads on client
const ConfiguratorLayout = dynamic(
  () => import('../components/configurator/ConfiguratorLayout'),
  { ssr: false }
);

// Feature flag to toggle between old and new configurator
const USE_NEW_CONFIGURATOR = true;

// Import the old configurator for fallback
const LightConfigurator = dynamic(
  () => import('../components/LightConfigurator'),
  { ssr: false }
);

export default function ConfiguratorPage() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleKeyDown = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        setIsFullScreen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <main className="min-h-screen">
      <div className="h-screen">
        {USE_NEW_CONFIGURATOR ? (
          <ConfiguratorLayout />
        ) : (
          <LightConfigurator />
        )}
      </div>
    </main>
  );
}
