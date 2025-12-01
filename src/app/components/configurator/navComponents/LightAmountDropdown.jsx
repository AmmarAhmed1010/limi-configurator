import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRef, useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export const LightAmountDropdown = ({ 
  config, 
  onLightAmountChange, 
  setActiveStep, 
  setOpenDropdown,
  tourActive,
  onTourSelection,
  setShowLoadingScreen
}) => {
  const carouselRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Function to scroll the carousel
  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 100; // Adjust as needed
      const currentScroll = carouselRef.current.scrollLeft;
      
      carouselRef.current.scrollTo({
        left: direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Define available light amounts based on light type and base type
  let lightAmounts = [];
  if (config.lightType === 'wall') {
    lightAmounts = [1];
  } else if (config.lightType === 'floor') {
    lightAmounts = [3];
  } else if (config.lightType === 'ceiling') {
    // Restrict to 3 lights for rectangular base
    if (config.baseType === 'rectangular') {
      lightAmounts = [3];
    } else {
      // Always include 3 and 6 for ceiling lights with round base
      lightAmounts = [1, 3, 6];
    }
  }
  
  // Check if we need a carousel (more than 3 options)
  const needsCarousel = lightAmounts.length > 3;
  
  // Light amount button component to avoid repetition
  const LightAmountButton = ({ amount }) => (
    <motion.button
      key={amount}
      className={`flex-shrink-0 flex flex-col items-center ${config.lightAmount === amount ? 'text-emerald-500' : 'text-gray-300 hover:text-white'}`}
      onClick={() => {
        console.log('🎯 LightAmountDropdown - Button clicked for amount:', amount);
        
        // Show loading screen
        if (setShowLoadingScreen) {
          console.log('✅ LightAmountDropdown - Showing loading screen');
          setShowLoadingScreen(true);
        } else {
          console.log('❌ LightAmountDropdown - setShowLoadingScreen not available');
        }
        
        // If tour is active, call tour selection handler
        if (tourActive && onTourSelection) {
          onTourSelection('lightAmount', amount);
        }
        
        onLightAmountChange(amount);
        // Always go to pendant selection next
        setActiveStep('pendantSelection');
        setOpenDropdown(null);
        
        // Hide loading screen after 3 seconds
        if (setShowLoadingScreen) {
          console.log('⏰ LightAmountDropdown - Setting timeout to hide loading screen in 3s');
          setTimeout(() => {
            console.log('🔚 LightAmountDropdown - Hiding loading screen');
            setShowLoadingScreen(false);
          }, 3000);
        }
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className={`w-16 h-16 rounded-full overflow-hidden relative ${config.lightAmount === amount ? 'ring-2 ring-emerald-500' : ''}`}>
        <Image 
          src={`/images/configIcons/${config.lightType}/${amount}.png`}
          alt={`${amount} light${amount !== 1 ? 's' : ''}`}
          fill
          className="object-cover"
          priority
        />
      </div>
      <span className="text-sm text-black mt-1">{amount} Light{amount !== 1 ? 's' : ''}</span>
    </motion.button>
  );

  return (
    <div className="p-4">
      {!isMobile && <h3 className="text-base font-bold text-black mb-3 font-['Amenti']">Light Amount</h3>}
      
      {/* Light amount options */}
      <div className="relative">
        {needsCarousel ? (
          // Carousel layout for more than 3 options
          <>
            {/* Left arrow */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
              <button 
                onClick={() => scrollCarousel('left')}
                className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <FaChevronLeft size={14} />
              </button>
            </div>
            
            {/* Carousel container */}
            <div 
              ref={carouselRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-10 max-w-full"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {lightAmounts.map((amount) => (
                <LightAmountButton key={amount} amount={amount} />
              ))}
            </div>
            
            {/* Right arrow */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
              <button 
                onClick={() => scrollCarousel('right')}
                className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <FaChevronRight size={14} />
              </button>
            </div>
          </>
        ) : (
          // Regular flex layout for 3 or fewer options
          <div className="flex gap-3 justify-center">
            {lightAmounts.map((amount) => (
              <LightAmountButton key={amount} amount={amount} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
