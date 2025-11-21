import { Tooltip } from '../Tooltip';
import { useState, useEffect } from 'react';
import {
  FaLightbulb,
  FaLayerGroup,
  FaRegLightbulb,
  FaObjectGroup,
  FaList,
  FaCubes,
  FaPalette,
  FaCheck,
  FaInfoCircle,

} from "react-icons/fa";
import React from 'react';
import { FiHome } from "react-icons/fi";
import { IoMdSettings } from "react-icons/io";
import { TbBrightnessFilled } from "react-icons/tb";

// Function to get React icon based on step ID
const getStepIcon = (stepId) => {
  const iconMap = {
    info: FaInfoCircle,
    lightType: FaLightbulb,
    hubType: FaLightbulb,
    baseType: FaLayerGroup,
    baseColor: FaPalette,
    lightAmount: FaList,
    pendantSelection: IoMdSettings,
    systemType: FaCubes,
    finish: FaCheck,
    systemConfiguration: FaObjectGroup,
    lightingControl: TbBrightnessFilled,
  };

  const IconComponent = iconMap[stepId] || FiHome;
  return <IconComponent size={20} />;
};

export const NavButton = ({
  step,
  index,
  activeStep,
  openDropdown,
  handleStepClick,
  setActiveStep,
  toggleDropdown,
  getNavIcon,
  emerald,
  charlestonGreen,
  textColor,
  dropdownRefs,
  containerDimensions,
  isGuided = false,
  isCompleted = false,
  children,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 640);
      setScreenWidth(window.innerWidth);

      const handleResize = () => {
        setIsMobile(window.innerWidth < 640);
        setScreenWidth(window.innerWidth);
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  if (!step) return null;

  const isOpen = openDropdown === step.id;
  const isActive = isOpen || activeStep === step.id;

  const handleClick = (e) => {
    e.stopPropagation();

    if (step.disabled) return;

    if (isOpen) {
      // close dropdown
      toggleDropdown(step.id);
    } else {
      // open / change step
      handleStepClick(step.id);
    }
  };

  return (
    <div key={step.id} className="relative">
      {/* One button only – no remounting between states */}
      <Tooltip
        content={isOpen ? '' : (step.tooltip || 'Navigation option')}
        position="right"
      >
        <div className="relative group">
          <button
            className={`
              relative w-12 h-12 rounded-full overflow-hidden
              flex items-center justify-center text-base
              transition-colors  duration-200
              ${step.disabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}
              ${isCompleted ? 'ring-2 ring-emerald-500' : ''}
            `}
            style={{
              backgroundColor: 'transparent', // let gradient show
              border: 'none',
              boxShadow: 'none',
            }}
            onClick={handleClick}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {/* Inner solid circle */}
            <span
              className="
                absolute inset-[2px] rounded-full flex items-center justify-center
              "
              style={{
                backgroundColor: isActive ? '#141414' : 'rgba(255, 255, 255, 0.6)',

                color: isActive ? '#DCDCDC' : '#141414',
              }}
            >
              {/* {getStepIcon(step.id)}
               */}
               {React.cloneElement(step.icon, { size: 20 })}
            </span>
          </button>
        </div>
      </Tooltip>

      {/* Dropdown content */}
      {isOpen && (
        <div
          ref={(el) => step.id && (dropdownRefs.current[step.id] = el)}
          className="
      absolute max-sm:fixed left-full ml-4 top-0
      rounded-xl z-[200] overflow-hidden
      sm:left-full sm:ml-3 sm:top-0
      max-sm:top-[25vh] max-sm:left-auto max-sm:right-0
      bg-white/60 text-[#141414]
    "
          style={{
            width: isMobile
              ? `${containerDimensions.width || screenWidth}px`
              : "280px",
            maxWidth: isMobile
              ? `${containerDimensions.width || screenWidth}px`
              : "calc(100vw - 2rem)",
            ...(isMobile && containerDimensions.height > 0 && {
              top: `360px`,
            }),
          }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}


    </div>
  );
};
