import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from '../Tooltip';
import { useState, useEffect } from 'react';
import { 
  FaLightbulb, 
  FaLayerGroup, 
  FaRegLightbulb, 
  FaObjectGroup, 
  FaList, 
  FaCubes,
  FaPalette 
} from "react-icons/fa";
import { FiHome } from "react-icons/fi";

// Function to get React icon based on step ID
const getStepIcon = (stepId) => {
  const iconMap = {
    lightType: FaLightbulb,
    baseType: FaLayerGroup,
    baseColor: FaPalette,
    lightAmount: FaList,
    pendantSelection: FaRegLightbulb,
    systemType: FaCubes,
    systemConfiguration: FaObjectGroup
  };
  
  const IconComponent = iconMap[stepId] || FiHome;
  return <IconComponent size={24} />;
};

export const NavButton = ({
  step,
  index,
  activeStep,
  openDropdown,
  handleStepClick,
  toggleDropdown,
  getNavIcon, // Extract this prop to prevent it from being passed to DOM
  emerald,
  charlestonGreen,
  textColor,
  dropdownRefs,
  containerDimensions,
  isGuided = false,
  isCompleted = false,
  children,
  // Remove ...rest to prevent function props from being passed to DOM elements
}) => {
  // State to track if we're on mobile and screen dimensions
  const [isMobile, setIsMobile] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);
  
  // Effect to check screen size and update on resize
  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window !== 'undefined') {
      // Initial check
      setIsMobile(window.innerWidth < 640);
      setScreenWidth(window.innerWidth);
      
      // Function to update on resize
      const handleResize = () => {
        setIsMobile(window.innerWidth < 640);
        setScreenWidth(window.innerWidth);
      };
      
      // Add event listener
      window.addEventListener('resize', handleResize);
      
      // Clean up
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);
  
  // Guard against undefined or null step
  if (!step) return null;
  
  return (
    <div key={step?.id} className="relative">
      {/* Tooltip only shows when dropdown is closed */}
      {openDropdown !== step?.id && (
        <Tooltip content={step?.tooltip || 'Navigation option'} position="right" className="">
          <div className="relative group">
            <motion.button
              className={`relative w-12 h-12 rounded-full flex items-center justify-center text-base transition-all duration-300 ${activeStep === step?.id ? 'shadow-lg' : 'opacity-80 hover:opacity-100'} ${step?.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${isCompleted ? 'ring-2 ring-emerald-500' : ''}`}
              onClick={() => !step?.disabled && handleStepClick(step?.id)}
              // whileHover={!step?.disabled ? { scale: 1.1 } : {}}
              
              
              style={{
                backgroundColor: activeStep === step?.id ? emerald : 'transparent',
                color: activeStep === step?.id ? '#FFFFFF' : `${textColor}80`,
                border: isMobile && openDropdown === step?.id ? `2px solid ${emerald}` : 'none',
                boxShadow: 'none'
              }}
            >
              {getStepIcon(step?.id)}
            </motion.button>
          </div>
        </Tooltip>
      )}
      
      {/* Button without tooltip when dropdown is open */}
      {openDropdown === step?.id && (
        <motion.button
          className={`relative w-12 h-12 rounded-full flex items-center justify-center text-base transition-all duration-300 ${activeStep === step?.id ? 'shadow-lg' : 'opacity-80 hover:opacity-100'} ${step?.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${isCompleted ? 'ring-2 ring-emerald-500' : ''}`}
          style={{
            backgroundColor: isMobile ? charlestonGreen : emerald,
            color: '#FFFFFF'
          }}
          onClick={(e) => {
            e.stopPropagation();
            toggleDropdown(step?.id);
          }}
          onTouchStart={(e) => e.stopPropagation()}
          
        >
          {getStepIcon(step?.id)}
        </motion.button>
      )}
      
      {/* Dropdown content */}
      {/* <AnimatePresence> */}
        {openDropdown === step?.id && (
          <div
            ref={el => step?.id && (dropdownRefs.current[step.id] = el)}
            className="absolute max-sm:fixed left-full ml-4 top-0 bg-gray-800 max-sm:bg-[#2b2d2f] rounded-lg shadow-xl z-[200] overflow-hidden
              sm:left-full sm:ml-3 sm:top-0 max-sm:top-[25vh] max-sm:left-auto max-sm:right-0"
            style={{
              boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px ${isMobile ? charlestonGreen : emerald}20`,
              width: isMobile ? `${containerDimensions.width || screenWidth}px` : '280px',
              maxWidth: isMobile ? `${containerDimensions.width || screenWidth}px` : 'calc(100vw - 2rem)',
              // Position at 25% from the top of the container on mobile
              ...(isMobile && containerDimensions.height > 0 && {
                top: `360px`,
              })
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        )}
      {/* </AnimatePresence> */}
    </div>
  );
};
