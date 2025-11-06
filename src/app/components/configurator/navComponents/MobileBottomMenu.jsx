import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LightTypeDropdown } from './LightTypeDropdown';
import { EnvironmentDropdown } from './EnvironmentDropdown';
import { BaseTypeDropdown } from './BaseTypeDropdown';
import  BaseColorPanel  from './BaseColorPanel';
import { LightAmountDropdown } from './LightAmountDropdown';
import { PendantSelectionDropdown } from './PendantSelectionDropdown';
import { SystemTypeDropdown } from './SystemTypeDropdown';
import { SystemConfigurationDropdown } from './SystemConfigurationDropdown';
import MobilePendantConfig from './MobilePendantConfig';
import LightingControl from './LightingControl';

const MobileBottomMenu = ({
  isOpen,
  activeStep,
  handleChandelierTypeChange,
  onClose,
  // Props for different components
  config,
  onLightTypeChange,
  onEnvironmentChange,
  onBaseTypeChange,
  onBaseColorChange,
  onConnectorColorChange,
  onLightAmountChange,
  onSystemTypeChange,
  setActiveStep,
  setOpenDropdown,
  tourState,
  handleTourSubSelection,
  // Pendant selection props
  pendants,
  setShowConfigurationTypeSelector,
  setLocalConfiguringType,
  selectedPendants,
  cables,

  currentDesign,
  setOpenBase,
  setCurrentDesign,
  carouselRef,
  brightness,
  setBrightness,
  temperature,
  setTemperature,
  onCableSizeChange,
  scrollCarousel,
  handlePendantLocationClick,
  selectAllPendants,
  clearSelections,
  setSelectedPendants,
  applyDesignToSelected,
  applyToAllPendants,
  getImageSrc,
  handleSaveConfig,
  localConfiguringType,
  configuringSystemType,
  breadcrumbPath,
  onBreadcrumbNavigation,
  onSystemTypeSelection,
  onPendantDesignChange,
  onSystemBaseDesignChange,
  sendMessageToPlayCanvas,
  onConfigurationTypeChange
}) => {
  // Loading state for pendant/system selection
  const [pendantLoading, setPendantLoading] = useState(false);
  // Ref to store the timeout ID for cleanup
  const loadingTimeoutRef = useRef(null);
  
  // Function to turn off pendant loading
  const turnOffPendantLoading = () => {
    setPendantLoading(false);
    // Clear the timeout if it exists
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };

  // Listen for messages from iframe to turn off loading
  useEffect(() => {
    const handleMessage = (event) => {
      // Check if the message is from the expected iframe origin
      if (event.data === "loadingOff") {
        turnOffPendantLoading();
      }
    };

    window.addEventListener("message", handleMessage);
    
    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("message", handleMessage);
      // Also clear any pending timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);
  const getTitle = () => {
    switch (activeStep) {
      case 'lightType': return 'Light Type';
      case 'environment': return 'Environment';
      case 'baseType': return 'Base Type';
      case 'baseColor': return 'Base Color';
      case 'lightingControl': return 'Lighting Control';
      case 'lightAmount': return 'Light Amount';
      case 'pendantSelection': return 'Pendant Selection';
      case 'systemType': return 'System Type';
      case 'systemConfiguration': return 'System Configuration';
      default: return 'Configuration';
    }
  };

  const renderContent = () => {
    switch (activeStep) {
      case 'lightType':
        return (
          <LightTypeDropdown
            config={config}
            onLightTypeChange={onLightTypeChange}
            setActiveStep={setActiveStep}
            setOpenDropdown={setOpenDropdown}
            tourActive={tourState.isActive}
            onTourSelection={handleTourSubSelection}
          />
        );
      
      case 'environment':
        return (
          <EnvironmentDropdown
            config={config}
            onEnvironmentChange={onEnvironmentChange}
            setActiveStep={setActiveStep}
            setOpenDropdown={setOpenDropdown}
            tourActive={tourState.isActive}
            onTourSelection={handleTourSubSelection}
            sendMessageToPlayCanvas={sendMessageToPlayCanvas}
          />
        );
      
      case 'baseType':
        return (
          <BaseTypeDropdown
            config={config}
            onBaseTypeChange={onBaseTypeChange}
            setActiveStep={setActiveStep}
            setOpenDropdown={setOpenDropdown}
            tourActive={tourState.isActive}
            onTourSelection={handleTourSubSelection}
          />
        );
      
      case 'baseColor':
        return (
          <BaseColorPanel
            config={config}
            onBaseColorChange={onBaseColorChange}
            onConnectorColorChange={onConnectorColorChange}
            setActiveStep={setActiveStep}
            setOpenDropdown={setOpenDropdown}
            tourActive={tourState.isActive}
            onTourSelection={handleTourSubSelection}
            activeTab="base"
            setActiveTab={() => {}}
          />
        );

      case 'lightingControl':
        return (
          <LightingControl
            sendMessageToPlayCanvas={sendMessageToPlayCanvas}

            brightness={config.brightness || 100}
            colorTemperature={config.colorTemperature || 4000}
            onBrightnessChange={(value) => {
              // Handle brightness change
              if (onEnvironmentChange) {
                onEnvironmentChange({ ...config, brightness: value });
              }
            }}
            onColorTemperatureChange={(value) => {
              // Handle color temperature change
              if (onEnvironmentChange) {
                onEnvironmentChange({ ...config, colorTemperature: value });
              }
            }}
            setActiveStep={setActiveStep}
            setOpenDropdown={setOpenDropdown}
            tourActive={tourState.isActive}
            onTourSelection={handleTourSubSelection}
          />
        );
      
      case 'lightAmount':
        return (
          <LightAmountDropdown
            config={config}
            onLightAmountChange={onLightAmountChange}
            setActiveStep={setActiveStep}
            setOpenDropdown={setOpenDropdown}
            tourActive={tourState.isActive}
            onTourSelection={handleTourSubSelection}
          />
        );
      
      case 'pendantSelection':
        return (
          <MobilePendantConfig
            pendants={pendants}
            getImageSrc={getImageSrc}
            handleChandelierTypeChange={handleChandelierTypeChange}
            selectAllPendants={selectAllPendants}
            clearSelections={clearSelections}
            selectedPendants={selectedPendants}
            setSelectedPendants={setSelectedPendants}
            cables={cables}
            onPendantDesignChange={onPendantDesignChange}
            onSystemBaseDesignChange={onSystemBaseDesignChange}
            setShowConfigurationTypeSelector={setShowConfigurationTypeSelector}
            setActiveStep={setActiveStep}
            sendMessageToPlayCanvas={sendMessageToPlayCanvas}
            onConfigurationTypeChange={onConfigurationTypeChange}
            localConfiguringType={localConfiguringType}
            setLocalConfiguringType={setLocalConfiguringType}
            onSystemTypeSelection={onSystemTypeSelection}
            onClose={onClose}
            // Loading functionality
            setPendantLoading={setPendantLoading}
            turnOffPendantLoading={turnOffPendantLoading}
          />
        );
      
      case 'systemType':
        return (
          <SystemTypeDropdown
            config={config}
            onSystemTypeChange={onSystemTypeChange}
            setActiveStep={setActiveStep}
            setOpenDropdown={setOpenDropdown}
            tourActive={tourState.isActive}
            onTourSelection={handleTourSubSelection}
          />
        );
      
      case 'systemConfiguration':
        return (
          <SystemConfigurationDropdown
            config={config}
            setActiveStep={setActiveStep}
            setOpenDropdown={setOpenDropdown}
            tourActive={tourState.isActive}
            onTourSelection={handleTourSubSelection}
          />
        );
      
      default:
        return <div className="p-4 text-white">Select a configuration option</div>;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Full-Screen Loading Overlay for Pendant/System Selection */}
      {pendantLoading && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-center space-y-4">
            {/* Spinning loader */}
            <div className="w-12 h-12 border-3 border-gray-600 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-white text-lg font-medium font-['Amenti']">Loading configuration...</p>
          </div>
        </motion.div>
      )}
      
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-[#FFFFFF9E] z-[9998] h-30 rounded-t-2xl "
      >
      {/* Header - only show for non-pendant selection steps */}
      {activeStep !== 'pendantSelection' && (
        <div className="flex items-center justify-between pt-4 px-8">
          <div className="flex-1">
            <h3 className="text-black font-medium text-lg">
              {getTitle()}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-black transition-colors"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Content */}
      <div className={`flex-1 overflow-y-auto ${activeStep === 'pendantSelection' ? 'p-0' : 'p-4'}`}>
        {renderContent()}
      </div>
      </motion.div>
    </>
  );
};

export default MobileBottomMenu;
