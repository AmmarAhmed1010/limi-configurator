"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Tooltip = ({ children, content, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };
  
  const handleMouseEnter = useCallback(() => {
    setIsVisible(true);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`absolute ${positionClasses[position]} z-[9999] px-3 py-2 bg-gray-900/90 backdrop-blur-sm text-white text-xs rounded-md shadow-lg whitespace-nowrap border border-gray-700`}
        >
          {content}
          <div 
            className={`absolute ${position === 'top' ? 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900/90' : 
                         position === 'bottom' ? 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900/90' :
                         position === 'left' ? 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-900/90' :
                         'right-full top-1/2 transform -translate-y-1/2 border-r-gray-900/90'
                        } border-solid border-8 border-transparent`}
          ></div>
        </motion.div>
      )}
    </div>
  );
};
