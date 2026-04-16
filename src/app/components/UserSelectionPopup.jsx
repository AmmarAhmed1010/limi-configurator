'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

/**
 * A popup coasks users to select whether they are a customer or distributor.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isVisible - Whether the popup is visible
 * @param {Function} props.onSelect - Callback function when user makes a selection
 * @returns {JSX.Element} The UserSelectionPopup component
 */
const UserSelectionPopup = ({ isVisible, onSelect }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);

  // Prevent scrolling when popup is visible
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isVisible]);

  const handleSelect = (userType) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setHoveredOption(userType);
    
    setTimeout(() => {
      onSelect(userType);
      setIsAnimating(false);
      setHoveredOption(null);
    }, 600);
  };

  // Card variants for framer-motion
  const cardVariants = {
    initial: { 
      scale: 0.95, 
      opacity: 0.8,
      y: 0,
      boxShadow: '0px 0px 0px rgba(243, 235, 226, 0)'
    },
    hover: { 
      scale: 1.05, 
      opacity: 1,
      y: -10,
      boxShadow: '0px 10px 20px rgba(243, 235, 226, 0.2)'
    },
    selected: {
      scale: 1.1,
      opacity: 1,
      y: -15,
      boxShadow: '0px 15px 25px rgba(243, 235, 226, 0.3)'
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Background blur and overlay */}
          <motion.div 
            className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => !isAnimating && setHoveredOption(null)}
          />
          
          {/* Main popup content */}
          <motion.div 
            className="relative bg-[#292929] rounded-xl p-8 w-full max-w-2xl mx-4 text-center border border-[#f3ebe2]/20 overflow-hidden"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 120 }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#93cfa2] via-[#f3ebe2] to-[#93cfa2]"></div>
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[#93cfa2]/10 blur-xl"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[#93cfa2]/10 blur-xl"></div>
            
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative w-16 h-16 mb-2">
                <div className="absolute inset-0 flex">
                  <div className="flex flex-col flex-1">
                    <div className="bg-[#f3ebe2] h-1/2 w-full m-0.5"></div>
                    <div className="bg-[#f3ebe2] h-1/2 w-full m-0.5"></div>
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="bg-[#f3ebe2] h-1/2 w-full m-0.5"></div>
                    <div className="bg-[#f3ebe2] h-1/2 w-full m-0.5"></div>
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="bg-[#f3ebe2] h-1/2 w-full m-0.5"></div>
                    <div className="bg-[#f3ebe2] h-1/2 w-full m-0.5"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <motion.h2 
              className="text-3xl font-bold text-[#f3ebe2] mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Welcome to Limi
            </motion.h2>
            
            <motion.p 
              className="text-[#f3ebe2]/80 mb-10 max-w-md mx-auto"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Please select your user type to continue and experience our innovative lighting solutions
            </motion.p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              {/* Customer Option */}
              <motion.div
                className={`relative cursor-pointer rounded-xl p-6 bg-[#292929] border ${
                  hoveredOption === 'customer' ? 'border-[#93cfa2]' : 'border-[#f3ebe2]/20'
                } flex flex-col items-center transition-colors duration-300`}
                variants={cardVariants}
                initial="initial"
                animate={hoveredOption === 'customer' ? 'selected' : 'initial'}
                whileHover="hover"
                onClick={() => handleSelect('customer')}
                disabled={isAnimating}
              >
                <div className="w-16 h-16 mb-4 rounded-full bg-[#93cfa2]/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#93cfa2]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 5.523 4.477 10 10 10s10-4.477 10-10C20 4.477 15.523 0 10 0zm0 18a8 8 0 100-16 8 8 0 000 16z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#f3ebe2] mb-2">Customer</h3>
                <p className="text-[#f3ebe2]/70 text-sm">Explore our lighting products and visualize them in your space</p>
                
                <motion.div 
                  className="absolute bottom-4 right-4 w-6 h-6 rounded-full bg-[#93cfa2] flex items-center justify-center"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: hoveredOption === 'customer' ? 1 : 0,
                    opacity: hoveredOption === 'customer' ? 1 : 0
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-4 h-4 text-[#292929]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              </motion.div>
              
              {/* Distributor Option */}
              <motion.div
                className={`relative cursor-pointer rounded-xl p-6 bg-[#292929] border ${
                  hoveredOption === 'distributor' ? 'border-[#93cfa2]' : 'border-[#f3ebe2]/20'
                } flex flex-col items-center transition-colors duration-300`}
                variants={cardVariants}
                initial="initial"
                animate={hoveredOption === 'distributor' ? 'selected' : 'initial'}
                whileHover="hover"
                onClick={() => handleSelect('distributor')}
                disabled={isAnimating}
              >
                <div className="w-16 h-16 mb-4 rounded-full bg-[#93cfa2]/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#93cfa2]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#f3ebe2] mb-2">Distributor</h3>
                <p className="text-[#f3ebe2]/70 text-sm">Access analytics, inventory management and distribution tools</p>
                
                <motion.div 
                  className="absolute bottom-4 right-4 w-6 h-6 rounded-full bg-[#93cfa2] flex items-center justify-center"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: hoveredOption === 'distributor' ? 1 : 0,
                    opacity: hoveredOption === 'distributor' ? 1 : 0
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-4 h-4 text-[#292929]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              </motion.div>
            </div>
            
            <motion.p 
              className="text-xs text-[#f3ebe2]/50 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              You can change your selection later in profile settings
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserSelectionPopup;
