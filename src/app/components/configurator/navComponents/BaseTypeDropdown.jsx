import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { listenForLoadingOffMountMessages } from '../../../util/iframeCableMessageHandler';

export const BaseTypeDropdown = ({ config, onBaseTypeChange, setActiveStep, setOpenDropdown, tourActive, onTourSelection, setShowLoadingScreen }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for loadingOffMount message to hide loading screen
  useEffect(() => {
    const cleanup = listenForLoadingOffMountMessages((data, event) => {
      console.log('🔚 BaseTypeDropdown - Received loadingOffMount event, hiding loading screen');
      if (setShowLoadingScreen) {
        setShowLoadingScreen(false);
      }
    });
    return cleanup;
  }, [setShowLoadingScreen]);

  return (
    <div className="p-4">
      {!isMobile && <h3 className="text-base font-bold text-black mb-3 font-['Amenti']">Base Type</h3>}
      <div className="flex space-x-3">
        {['round', 'rectangular'].map((type) => (
          <motion.button
            key={type}
            className={`flex flex-col items-center ${config.baseType === type ? 'text-emerald-500' : 'text-gray-300 hover:text-white'}`}
            onClick={() => {
              console.log('🎯 BaseTypeDropdown - Button clicked for type:', type);
              
              // Show loading screen
              if (setShowLoadingScreen) {
                console.log('✅ BaseTypeDropdown - Showing loading screen');
                setShowLoadingScreen(true);
              } else {
                console.log('❌ BaseTypeDropdown - setShowLoadingScreen not available');
              }
              
              // If tour is active, call tour selection handler
              if (tourActive && onTourSelection) {
                onTourSelection('baseType', type);
              }
              
              onBaseTypeChange(type);
              setActiveStep('lightAmount');
              setOpenDropdown(null);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className={`w-16 h-16 rounded-full overflow-hidden relative ${config.baseType === type ? 'ring-2 ring-emerald-500' : ''}`}>
              <Image 
                src={`/images/configbase/${type}.png`}
                alt={`${type} base`}
                fill
                className="object-cover"
                priority
              />
            </div>
            <span className="text-sm text-black">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
