import { useState, useRef, useEffect } from 'react';

export const useNavDropdown = (setActiveStep) => {
  // State for dropdown visibility
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRefs = useRef({});
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && dropdownRefs.current[openDropdown] &&
          !dropdownRefs.current[openDropdown].contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdown]);
  
  // Handle step click - toggle dropdown or navigate to step
  const handleStepClick = (stepId) => {
    // Always set this step as the active step
    setActiveStep(stepId);
    
    // Toggle the dropdown for this step
    setOpenDropdown(openDropdown === stepId ? null : stepId);
    
    // Close any other dropdowns
    if (openDropdown && openDropdown !== stepId) {
      setOpenDropdown(null);
    }
  };

  // Toggle dropdown visibility
  const toggleDropdown = (stepId) => {
    // Set this as the active step
    setActiveStep(stepId);
    
    // Toggle the dropdown
    setOpenDropdown(openDropdown === stepId ? null : stepId);
  };
  
  return {
    openDropdown,
    setOpenDropdown,
    dropdownRefs,
    handleStepClick,
    toggleDropdown
  };
};
