import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaHome, FaBan, FaBuilding, FaUtensils, FaStore, FaGraduationCap, FaHospital, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { getSceneData, onSceneDataRefresh } from '../pendantSystemData';
import { cloneUniformsGroups } from 'three/src/renderers/shaders/UniformsUtils';

export const EnvironmentDropdown = ({ config, onEnvironmentChange, setActiveStep, setOpenDropdown, tourActive, onTourSelection, sendMessageToPlayCanvas }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [environments, setEnvironments] = useState([]);
  const [isEnvLoading, setIsEnvLoading] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load scene data on component mount
  useEffect(() => {
    const loadSceneData = async () => {
      try {
        const sceneData = await getSceneData();

        // Always include "No Scene" option first
        const formattedEnvironments = [
          {
            id: 'no_scene',
            label: 'No Scene',
            icon: <FaBan className="w-5 h-5" />, 
            description: 'Empty',
            sceneValue: 0,
            sceneUrl: null
          },
          ...sceneData.map((scene, index) => ({
            id: scene._id || scene.sceneName?.toLowerCase().replace(/\s+/g, '_'),
            label: scene.sceneName,
            icon: scene.sceneIcon ? <img src={scene.sceneIcon} alt={scene.sceneName} className="w-5 h-5" /> : getIconForSceneType('interior'),
            description: scene.sceneName || 'Scene',
            sceneValue: index + 1,
            sceneUrl: scene.sceneModel,
            minZoom: scene.minZoom,
            maxZoom: scene.maxZoom,
            minYaw: scene.minYaw,
            maxYaw: scene.maxYaw
          }))
        ];

        setEnvironments(formattedEnvironments);
      } catch (error) {
        console.error('Error loading scene data:', error);
        // Fallback to default "No Scene" option
        setEnvironments([{
          id: 'no_scene',
          label: 'No Scene',
          icon: <FaBan className="w-5 h-5" />,
          description: 'Empty',
          sceneValue: 0,
          sceneUrl: null
        }]);
      }
    };

    loadSceneData();

    // Subscribe to scene data updates
    const unsubscribe = onSceneDataRefresh((newSceneData) => {
      const formattedEnvironments = [
        {
          id: 'no_scene',
          label: 'No Scene',
          icon: <FaBan className="w-5 h-5" />,
          description: 'Empty',
          sceneValue: 0,
          sceneUrl: null
        },
        ...newSceneData.map((scene, index) => ({
          id: scene._id || scene.sceneName?.toLowerCase().replace(/\s+/g, '_'),
          label: scene.sceneName,
          icon: scene.sceneIcon ? <img src={scene.sceneIcon} alt={scene.sceneName} className="w-5 h-5" /> : getIconForSceneType('interior'),
          description: scene.sceneName || 'Scene',
          sceneValue: index + 1,
          sceneUrl: scene.sceneModel,
          minZoom: scene.minZoom,
          maxZoom: scene.maxZoom,
          minYaw: scene.minYaw,
          maxYaw: scene.maxYaw
        }))
      ];
      setEnvironments(formattedEnvironments);
    });

    return unsubscribe;
  }, []);

  // Icon mapping for different scene types
  const getIconForSceneType = (sceneType) => {
    const iconMap = {
      'no_scene': <FaBan className="w-5 h-5" />,
      'interior': <FaHome className="w-5 h-5" />,
      'office': <FaBuilding className="w-5 h-5" />,
      'restaurant': <FaUtensils className="w-5 h-5" />,
      'retail': <FaStore className="w-5 h-5" />,
      'education': <FaGraduationCap className="w-5 h-5" />,
      'healthcare': <FaHospital className="w-5 h-5" />
    };
    return iconMap[sceneType] || <FaHome className="w-5 h-5" />;
  };

  const itemsPerPage = isMobile ? 3 : 4;
  const totalPages = Math.ceil(environments.length / itemsPerPage);

  const handleEnvironmentSelect = (environment) => {
    console.log("environment", environment)

    // Show local loading overlay for 3 seconds when an environment is selected
    setIsEnvLoading(true);
    setTimeout(() => {
      setIsEnvLoading(false);
      // Close dropdown after loading completes
      setOpenDropdown(null);
    }, 3000);
    // If tour is active, call tour selection handler
    if (tourActive && onTourSelection) {
      onTourSelection('environment', environment.id);
    }
    // Call the environment change handler
    onEnvironmentChange(environment.id);

    // Send multiple configuration messages to PlayCanvas
    if (sendMessageToPlayCanvas) {
      if (environment.minYaw !== undefined) {
        sendMessageToPlayCanvas(`minYaw:${environment.minYaw}`);
      }
      if (environment.maxYaw !== undefined) {
        sendMessageToPlayCanvas(`maxYaw:${environment.maxYaw}`);
      }
      if (environment.minZoom !== undefined) {
        sendMessageToPlayCanvas(`minZoom:${environment.minZoom}`);
      }
      if (environment.maxZoom !== undefined) {
        sendMessageToPlayCanvas(`maxZoom:${environment.maxZoom}`);
      }
      // Send scene URL if it's not the empty scene and has a scene URL
      if (environment.id !== 'no_scene' && environment.sceneUrl) {
        sendMessageToPlayCanvas(`sceneLink:${environment.sceneUrl}`);
      } else {
        // For no scene, just send the scene value
        sendMessageToPlayCanvas(`scene:${environment.sceneValue}`);
      }
    }

  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const getCurrentItems = () => {
    const startIndex = currentIndex * itemsPerPage;
    const items = environments.slice(startIndex, startIndex + itemsPerPage);
    return items;
  };

  return (
    <>
      {isEnvLoading && typeof document !== 'undefined' &&
        createPortal(
          <div
            id="playcanvas-loader"
            className="fixed left-0 right-0 bottom-0 top-20 flex flex-col items-center justify-center bg-[#2B2D2F] z-[900] overflow-hidden"
          >
            <div className="flex flex-col items-center justify-center space-y-16">
              {/* Logo */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Spinner - Adjusted size */}
                <div className="absolute inset-0 border-2 border-t-white border-transparent rounded-full animate-spin"></div>
                {/* Logo with adjusted size and spacing */}
                <div className="w-16 h-16 flex items-center justify-center">
                  <img
                    src="/images/svgLogos/__Logo_Icon_White.svg"
                    alt="LIMI Logo"
                    className="w-full h-full object-contain"
                    style={{
                      minWidth: "64px",
                      minHeight: "64px",
                    }}
                  />
                </div>  
              </div>
            </div>
          </div>,
          document.body
        )}
      <div
        className="relative max-sm:right-0 max-sm:w-full p-4"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {!isMobile && <h3 className="text-base font-bold text-black mb-4 font-['Amenti']">Environment</h3>}

        {/* Carousel Container */}
        <div className="relative">
        {/* Navigation Arrows */}
        {totalPages > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-8 h-8 bg-gray-700/80 hover:bg-emerald-500/30 rounded-full flex items-center justify-center transition-all duration-300 text-white hover:text-emerald-400"
            >
              <FaChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-8 h-8 bg-gray-700/80 hover:bg-emerald-500/30 rounded-full flex items-center justify-center transition-all duration-300 text-white hover:text-emerald-400"
            >
              <FaChevronRight className="w-3 h-3" />
            </button>
          </>
        )}

        {/* Carousel Content */}
        <div className="overflow-hidden">
          <div
            className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-4'} gap-4`}

          >
            {getCurrentItems().map((environment) => (
              <button
                key={environment.id}
                className={`
                  flex flex-col items-center rounded-xl transition-all duration-300 min-w-0 group
                `}
                onClick={() => handleEnvironmentSelect(environment)}



              >
                <div className={`
                  w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all duration-300
                  ${config.environment === environment.id
                    ? 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-400'
                    : 'bg-gray-700/60 border-2 border-gray-600 group-hover:border-emerald-400/50 group-hover:bg-emerald-500/10 text-white group-hover:text-emerald-400'
                  }
                `}>
                  {environment.icon}
                </div>

              </button>
            ))}
          </div>
        </div>

        {/* Pagination Dots */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${index === currentIndex
                    ? 'bg-emerald-400'
                    : 'bg-gray-600 hover:bg-gray-500'
                  }
                `}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
};
