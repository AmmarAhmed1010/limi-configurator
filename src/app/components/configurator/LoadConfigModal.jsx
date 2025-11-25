"use client";

import { useState, useEffect } from 'react';
import { buildApi1Url } from '../../config/api.config';
import { motion } from 'framer-motion';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export const LoadConfigModal = ({ 
  isOpen, 
  onClose, 
  onLoad,
  handleCloseSaveModal,
  configurations,
  isLoading,
  error,
  onRetry,
}) => {
  const [selectedConfig, setSelectedConfig] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const configurationsPerPage = 4;
  
  // Generate a random number between 1 and 7 for the fallback image
  const getRandomFallbackImage = () => {
    const randomNum = Math.floor(Math.random() * 7) + 1;
    return `/images/homepage-products/${randomNum}-mobile.jpg`;
  };
  
  // Stock image for fallback - using a random homepage product image
  const fallbackImage = getRandomFallbackImage();

  useEffect(() => {
    if (isOpen && onRetry) {
      onRetry();
    }
  }, [isOpen, onRetry]);

  const handleLoadConfig = async (configId) => {
    try {
      const response = await fetch(buildApi1Url(`/admin/products/light-configs/${configId}`));
      
      if (!response.ok) {
        throw new Error('Failed to fetch configuration details');
      }
      
      const configData = await response.json();
      
      // Pass the configuration to the parent component for loading
      onLoad(configData);
      onClose();
    } catch (err) {
      console.error('Failed to load the selected configuration. Please try again.', err);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-white">Load Configuration</h2>
          <button 
            onClick={()=>{onClose(); 
              handleCloseSaveModal();
            }}
            className="text-gray-400 hover:text-white"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 py-4 text-center">
            {error}
            <button 
              onClick={onRetry}
              className="block mx-auto mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
            >
              Try Again
            </button>
          </div>
        ) : (configurations || []).length === 0 ? (
          <div className="text-gray-400 py-4 text-center">
            No saved configurations found.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Get current configurations for pagination */}
              {(configurations || [])
                .slice(
                  (currentPage - 1) * configurationsPerPage,
                  currentPage * configurationsPerPage
                )
                .map((config) => {
                  // Get thumbnail URL or use fallback
                  const thumbnailUrl = config.thumbnail?.url || fallbackImage;
                  
                  return (
                    <div 
                      key={config._id} 
                      className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selectedConfig === config._id 
                          ? 'border-emerald-500 bg-gray-800' 
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                      onClick={() => setSelectedConfig(config._id)}
                      onDoubleClick={() => handleLoadConfig(config._id)}
                    >
                      <div className="relative w-full h-32 bg-gray-800">
                        <img 
                          src={thumbnailUrl} 
                          alt={config.name || 'Configuration thumbnail'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = fallbackImage;
                          }}
                        />
                      </div>
                      <div className="p-2">
                        <h3 className="font-semibold text-white mb-2">{config.name}</h3>
                        <div className="text-sm text-gray-400">
                          <p>Light Type: {config.config.light_type}</p>
                          <p>Light Amount: {config.config.light_amount}</p>
                          <p>Base Color: {config.config.cable_color}</p>
                          {/* <p>Cable Length: {config.config.cable_length}</p> */}
                          {config.config.base_type && (
                            <p>Base Type: {config.config.base_type}</p>
                          )}
                          <p className="mt-2 text-xs text-gray-500">
                            {new Date(config.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            
            {/* Pagination controls */}
            {(configurations || []).length > configurationsPerPage && (
              <div className="flex justify-center items-center mt-2 space-x-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-full ${
                    currentPage === 1
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-emerald-500 hover:bg-gray-800'
                  }`}
                >
                  <FaChevronLeft />
                </button>
                
                <span className="text-gray-300">
                  Page {currentPage} of {Math.ceil((configurations || []).length / configurationsPerPage)}
                </span>
                
                <button
                  onClick={() => 
                    setCurrentPage(prev => 
                      Math.min(prev + 1, Math.ceil((configurations || []).length / configurationsPerPage))
                    )
                  }
                  disabled={currentPage >= Math.ceil((configurations || []).length / configurationsPerPage)}
                  className={`p-2 rounded-full ${
                    currentPage >= Math.ceil((configurations || []).length / configurationsPerPage)
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-emerald-500 hover:bg-gray-800'
                  }`}
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
          </>
        )}
        
        {!isLoading && !error && (configurations || []).length > 0 && (
          <div className="mt-2 flex justify-end">
            <button
              onClick={()=>{
                onClose();
                handleCloseSaveModal();
              }}
              className="px-4 py-2 mr-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedConfig && handleLoadConfig(selectedConfig) && handleCloseSaveModal()}
           
              disabled={!selectedConfig}
              className={`px-4 py-2 rounded ${
                selectedConfig 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              Load
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default LoadConfigModal;
