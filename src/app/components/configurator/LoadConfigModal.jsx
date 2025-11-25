"use client";

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { buildApi1Url } from '../../config/api.config';
import { motion } from 'framer-motion';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { FiUser, FiMail, FiLock, FiEdit2 } from 'react-icons/fi';

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
  const userState = useSelector((state) => state.user);
  const profileData = userState?.user?.data || {};
  const profileName = profileData.username || 'Guest User';
  const profileEmail = profileData.email || profileData.phone || '';
  const profileInitial = profileName ? profileName.charAt(0).toUpperCase() : 'U';
  
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

  const handleDeleteConfig = async (configId) => {
    try {
      const response = await fetch(
        buildApi1Url(`/admin/products/light-configs/${configId}`),
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete configuration');
      }

      if (selectedConfig === configId) {
        setSelectedConfig(null);
      }

      if (onRetry) {
        onRetry();
      }
    } catch (err) {
      console.error('Failed to delete the selected configuration. Please try again.', err);
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
        className="bg-gray-900 rounded-lg p-6 md:p-8 w-full max-w-4xl h-[80vh] max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Profile Settings</h2>
          <button 
            onClick={()=>{onClose(); 
              handleCloseSaveModal();
            }}
            className="text-gray-400 hover:text-white"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_2fr] gap-6 mt-4">
          <div className="bg-gray-800 rounded-lg p-5 flex flex-col items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 text-2xl font-semibold">
              {profileInitial}
            </div>

            <div className="w-full space-y-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">
                    Name
                  </p>
                  <p className="text-white text-sm break-all">{profileName}</p>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-md border border-gray-600 px-2 py-1 text-xs text-gray-200 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  <FiEdit2 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">
                    Email
                  </p>
                  <p className="text-gray-300 text-sm break-all">
                    {profileEmail || "Not set"}
                  </p>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-md border border-gray-600 px-2 py-1 text-xs text-gray-200 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  <FiEdit2 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">
                    Password
                  </p>
                  <p className="text-gray-300 text-sm">••••••••••</p>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-md border border-gray-600 px-2 py-1 text-xs text-gray-200 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  <FiEdit2 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(configurations || [])
                    .slice(
                      (currentPage - 1) * configurationsPerPage,
                      currentPage * configurationsPerPage
                    )
                    .map((config) => {
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
                          <div className="relative w-full h-28 bg-gray-800">
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
                            <h3 className="font-semibold text-white mb-1 line-clamp-1">
                              {config.name}
                            </h3>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLoadConfig(config._id);
                                  handleCloseSaveModal();
                                }}
                                className="flex-1 px-2 py-1 rounded bg-emerald-600 text-white text-xs hover:bg-emerald-700"
                              >
                                Load
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteConfig(config._id);
                                }}
                                className="px-2 py-1 rounded bg-red-600/80 text-white text-xs hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                            {/* <div className="text-xs text-gray-400 space-y-0.5">
                              <p>Light Type: {config.config.light_type}</p>
                              <p>Light Amount: {config.config.light_amount}</p>
                              <p>Base Color: {config.config.cable_color}</p>
                              {config.config.base_type && (
                                <p>Base Type: {config.config.base_type}</p>
                              )}
                              <p className="mt-1 text-[10px] text-gray-500">
                                {new Date(config.createdAt).toLocaleDateString()}
                              </p>
                            </div> */}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {(configurations || []).length > configurationsPerPage && (
                  <div className="flex justify-center items-center mt-3 space-x-4 text-xs">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-full ${
                        currentPage === 1
                          ? 'text-gray-500 cursor-not-allowed'
                          : 'text-emerald-500 hover:bg-gray-900'
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
                          : 'text-emerald-500 hover:bg-gray-900'
                      }`}
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoadConfigModal;
