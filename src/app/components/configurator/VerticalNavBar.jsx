"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FaArrowLeft,
  FaArrowRight,
  FaTimes,
  FaLightbulb,
  FaLayerGroup,
  FaRegLightbulb,
  FaObjectGroup,
  FaList,
  FaCubes,
  FaPalette,
  FaGlobe
} from 'react-icons/fa';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { NavButton } from './navComponents/NavButton';
import { LightTypeDropdown } from './navComponents/LightTypeDropdown';
import { EnvironmentDropdown } from './navComponents/EnvironmentDropdown';
import { BaseTypeDropdown } from './navComponents/BaseTypeDropdown';
import { LightAmountDropdown } from './navComponents/LightAmountDropdown';
import { PendantSelectionDropdown } from './navComponents/PendantSelectionDropdown';
import { SystemTypeDropdown } from './navComponents/SystemTypeDropdown';
import { SystemConfigurationDropdown } from './navComponents/SystemConfigurationDropdown';
import { ConfigPanel } from './navComponents/ConfigPanel';
import MobileBottomMenu from './navComponents/MobileBottomMenu';
import BaseColorPanel from "./navComponents/BaseColorPanel";
import { ProgressIndicator } from './navComponents/ProgressIndicator';
import { SaveConfigurationModal } from './navComponents/SaveConfigurationModal';
import { useNavSteps } from './navComponents/useNavSteps';
import { useNavDropdown } from './navComponents/useNavDropdown';
import { usePendantSelection } from './navComponents/usePendantSelection';
import { BrightnessSlider } from './navComponents/BrightnessSlider';
import InfoPanel from './navComponents/InfoPanel';

import {
  listenForConnectorColorMessages,
  listenForWallbaseColorMessages,
  listenForOffconfigMessages,
  listenForCableMessages,
  listenForSelectedCableMessages
} from "../../util/iframeCableMessageHandler";

// Pendant selection functionality
//adsaldasldja
const VerticalNavBar = ({
  activeStep,
  setCables,
  brightness,
  setBrightness,
  colorTemperature,
  setColorTemperature,
  lighting,
  setLighting,
  isLightingPanelOpen,
  setIsLightingPanelOpen,
  setActiveStep,
  showConfigurationTypeSelector,
  setShowConfigurationTypeSelector,
  handleChandelierTypeChange,
  config,
  cables, // Add cables prop
  onCableSizeChange, // Add cable size change handler
  onLightTypeChange,
  onEnvironmentChange, // Add environment change handler
  onBaseTypeChange,
  onBaseColorChange,
  onConnectorColorChange,
  onConfigurationTypeChange,
  onLightAmountChange,
  onSystemTypeChange,
  onPendantSelection,
  onPendantDesignChange,
  onSystemBaseDesignChange,
  pendants,
  selectedPendants,
  setSelectedPendants,
  onLocationSelection,
  configuringType,
  configuringSystemType,
  breadcrumbPath,
  onBreadcrumbNavigation,
  cableMessage,
  setCableMessage,
  onSystemTypeSelection,
  containerDimensions,
  onShadeSelect, // Add onShadeSelect prop
  sendMessageToPlayCanvas, // Add sendMessageToPlayCanvas prop
  setShowPendantLoadingScreen, // Add setShowPendantLoadingScreen prop
  setShowLoadingScreen, // Add setShowLoadingScreen prop
}) => {
  // Debug loading screen prop
  useEffect(() => {
    console.log('🔗 VerticalNavBar - setShowLoadingScreen prop received:', !!setShowLoadingScreen);
  }, [setShowLoadingScreen]);
  // Define colors from LIMI brand palette
  const emerald = "#50C878";
  const charlestonGreen = "#2B2D2F";
  const textColor = "#FFFFFF";

  const [isMobile, setIsMobile] = useState(false);
  const [currentGuideStep, setCurrentGuideStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showTooltip, setShowTooltip] = useState(true);
  // Add these state variables after other state declarations
  const [tourStep, setTourStep] = useState(0);
  const [isTourActive, setIsTourActive] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [targetElement, setTargetElement] = useState(null);
  const [openingBase, setOpeningBase] = useState(false);
  const [openBase, setOpenBase] = useState(false);
  // Welcome modal state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [activeTab, setActiveTab] = useState("base");
  const [mobileBottomMenuOpen, setMobileBottomMenuOpen] = useState(false);
  const [mobileActiveStep, setMobileActiveStep] = useState(null);

  // Tour system state
  const [tourState, setTourState] = useState({
    isActive: false,
    currentStep: 0,
    totalSteps: 5,
    isAutoAdvancing: false, // Changed to false for manual progression
    showWelcome: false,
    isCompleted: false,
    waitingForUser: false,
    userCompletedStep: false,
  });

  // New state to track current tour step and user selections
  const [currentTourStep, setCurrentTourStep] = useState(null);
  const [userSelection, setUserSelection] = useState(null);

  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
  };
  // Define the order of steps for the guided tour
  const guidedSteps = [
    { id: "lightType", message: "First, select your light type" },
    { id: "baseType", message: "Now, choose the base type" },
    { id: "baseColor", message: "Select a base color" },
    { id: "lightAmount", message: "How many lights do you need?" },
    {
      id: "pendantSelection",
      message: "Finally, customize your pendant selection",
    },
  ];
  const selectAllPendants = () => {
    setSelectedPendants(cables.map((_, index) => index));
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedPendants([]);
  };
  useEffect(() => {
    const cleanup = listenForWallbaseColorMessages((data, event) => {
      // handle wallbaseColor message here
      // Example: open a modal, update config, etc.
      setActiveStep("baseColor");
      setOpenDropdown("baseColor");
      handleSetActiveTab("base");
      setShowConfigurationTypeSelector(false);
      setOpenBase(true);
    });
    return cleanup;
  }, []);
  useEffect(() => {
    const cleanup = listenForConnectorColorMessages((data, event) => {
      // Example: open a modal, update config, etc.
      setOpenDropdown("baseColor");
      setActiveStep("baseColor");
      handleSetActiveTab("connector");
      setShowConfigurationTypeSelector(false);
      setOpenBase(true);
    });
    return cleanup;
  }, []);

  useEffect(() => {
    const cleanup = listenForCableMessages((data, event) => {

      // Example: open a modal, update config, etc.
      setMobileBottomMenuOpen(true)
      setMobileActiveStep('pendantSelection')
    });
    return cleanup;
  }, []);

  useEffect(() => {
    const cleanup = listenForSelectedCableMessages((data, event) => {
      // Example: open a modal, update config, etc.
      setShowConfigurationTypeSelector(true);
      setActiveStep("pendantSelection");
      setOpenDropdown("pendantSelection");
    });
    return cleanup;
  }, [config.selectedPendants]);


  useEffect(() => {
    if (activeStep === "pendantSelection") {
      setOpenBase(false);
      setShowConfigurationTypeSelector(true);
    }
  }, [activeStep]);

  useEffect(() => {
    const cleanup = listenForOffconfigMessages((data, event) => {
      setShowConfigurationTypeSelector(false);
      setOpenBase(false);
      setOpenDropdown(false);
      setActiveStep(null);
      setIsLightingPanelOpen(false);
      setCableMessage("");

      // Reset breadcrumb and navigation states
      onBreadcrumbNavigation("home");
    });
    return cleanup;
  }, [cableMessage]);

  useEffect(() => {
    if (cableMessage && cableMessage.startsWith("cable_")) {
      const match = cableMessage.match(/^cable_(\d+)/);
      if (match) {
        const cableId = Number(match[1]);
        // Schedule state updates to avoid setState during render
        setTimeout(() => {
          if (config.lightAmount === 1) {
            setShowConfigurationTypeSelector(false);
            setOpenBase(false);
            // 1. Open the pendant selection step
            setActiveStep("pendantSelection");


            setIsLightingPanelOpen(true);
            // 2. Select the pendant with the extracte
            setSelectedPendants([cableId]);
            // 3. Show the configuration type selector
            setTimeout(() => {
              setShowConfigurationTypeSelector(true);
              setLocalConfiguringType(null);
            }, 200);
          } else {
            setShowConfigurationTypeSelector(false);
            setOpenBase(false);
            // 1. Open the pendant selection step
            setActiveStep("pendantSelection");
            setOpenDropdown("pendantSelection");

            setIsLightingPanelOpen(true);
            // 2. Select the pendant with the extracted id
            setSelectedPendants([cableId]);
            // 3. Show the configuration type selector
            setTimeout(() => {
              setShowConfigurationTypeSelector(true);
              setLocalConfiguringType(null);
            }, 200);
          }
          setCableMessage("");
        }, 0);
      }
    }
  }, [cableMessage, setActiveStep, setSelectedPendants, setCableMessage]);

  // Define interactive tour steps with user prompts
  const tourSteps = [
    {
      id: "lightType",
      title: "Step 1: Choose Your Light Type",
      description:
        "We offer three main types: Ceiling, Wall, and Floor lights.",
      instruction:
        'Please click on the Light Type dropdown and select "Ceiling" to continue.',
      target: '[data-tour="lightType"]',
      action: "open_dropdown",
      expectedValue: "ceiling",
      waitForUser: true,
      playCanvasMessages: [],
    },
    {
      id: "baseType",
      title: "Step 2: Select Base Type",
      description: "Choose between Round and Rectangular base designs.",
      instruction:
        'Click on the Base Type dropdown and select "Round" for a modern look.',
      target: '[data-tour="baseType"]',
      action: "open_dropdown",
      expectedValue: "round",
      waitForUser: true,
      playCanvasMessages: [],
    },
    {
      id: "baseColor",
      title: "Step 3: Choose Base Color",
      description: "Select a color that matches your interior design.",
      instruction:
        'Open the Base Color section and choose "Black" for a sleek appearance.',
      target: '[data-tour="baseColor"]',
      action: "open_dropdown",
      expectedValue: "black",
      waitForUser: true,
      playCanvasMessages: [],
    },
    {
      id: "lightAmount",
      title: "Step 4: Number of Lights",
      description: "Choose how many lights you want in your configuration.",
      instruction:
        'Click on Light Amount and select "3" for balanced illumination.',
      target: '[data-tour="lightAmount"]',
      action: "open_dropdown",
      expectedValue: 3,
      waitForUser: true,
      playCanvasMessages: [],
    },
    {
      id: "pendantSelection",
      title: "Step 5: Configure Pendants",
      description:
        "Now customize each pendant to complete your lighting design.",
      instruction: "Click on Pendant Selection to choose your pendant styles.",
      target: '[data-tour="pendantSelection"]',
      action: "open_dropdown",
      expectedValue: null,
      waitForUser: true,
      playCanvasMessages: [],
    },
  ];

  // Check if current step is completed
  const isStepCompleted = (stepId) => completedSteps.includes(stepId);

  // Mark step as completed
  const completeStep = (stepId) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);

      // Move to next step in the guide
      const currentIndex = guidedSteps.findIndex((step) => step.id === stepId);
      if (currentIndex < guidedSteps.length - 1) {
        setCurrentGuideStep(currentIndex + 1);
      }
    }
  };

  // Check if a step is currently being guided
  const isGuidedStep = (stepId) => {
    return guidedSteps[currentGuideStep]?.id === stepId;
  };

  // Tour control functions
  const firePlayCanvasMessages = (messages, delay = 500) => {
    if (!messages || !Array.isArray(messages)) return;

    messages.forEach((message, index) => {
      setTimeout(() => {
        if (sendMessageToPlayCanvas) {
          sendMessageToPlayCanvas(message);
        }
      }, index * delay);
    });
  };

  const executeTourStep = async (step) => {

    // Schedule step execution for next tick to avoid setState during render
    setTimeout(() => {
      performStepExecution(step);
    }, 0);
  };

  const performStepExecution = async (step) => {

    // 1. Open the dropdown/section for user interaction
    await performInteractiveStepAction(step);

    // 2. Set state to wait for user interaction
    setTourState((prev) => ({
      ...prev,
      waitingForUser: true,
      userCompletedStep: false,
    }));
  };

  const performInteractiveStepAction = async (step) => {

    switch (step.id) {
      case "lightType":
        setActiveStep("lightType");
        setOpenDropdown("lightType");
        break;

      case "baseType":
        setActiveStep("baseType");
        setOpenDropdown("baseType");
        break;

      case "baseColor":
        setActiveStep("baseColor");
        setOpenDropdown("baseColor");
        handleSetActiveTab("base");
        break;

      case "lightAmount":
        setActiveStep("lightAmount");
        setOpenDropdown("lightAmount");
        break;

      case "pendantSelection":
        setActiveStep("pendantSelection");
        setOpenDropdown("pendantSelection");
        break;

      default:
        break;
    }
  };

  // New function to handle user sub-option selections during tour
  const handleTourSubSelection = (stepId, selectedValue) => {
    setUserSelection({ stepId, selectedValue });

    // Check if this matches the expected value for current tour step
    const currentStep = tourSteps[tourState.currentStep];
    if (currentStep && currentStep.id === stepId) {
      const expectedValue = currentStep.expectedValue;

      if (expectedValue === null || selectedValue === expectedValue) {
        setTourState((current) => ({
          ...current,
          userCompletedStep: true,
          waitingForUser: false,
        }));

        manualAdvanceToNextStep();

        return true;
      } else {

        // During tour, keep dropdown open if wrong selection is made
        if (tourState.isActive && tourState.waitingForUser) {
          // Re-open the dropdown to allow user to try again
          setTimeout(() => {
            setActiveStep(stepId);
            setOpenDropdown(stepId);
          }, 100);
        }
      }
    }
    return false;
  };

  // Manual function to advance to next tour step (called by user action)
  const manualAdvanceToNextStep = () => {
    if (!tourState.isActive) return;

    const nextStep = tourState.currentStep + 1;

    if (nextStep >= tourSteps.length) {
      setTourState(prev => ({
        ...prev,
        isActive: false,
        isCompleted: true,
        currentStep: 0,
        waitingForUser: false,
        userCompletedStep: false,
      }));
      return;
    }

    // Update to next step
    setTourState(prev => ({
      ...prev,
      currentStep: nextStep,
      waitingForUser: true,
      userCompletedStep: false,
    }));

    // Reset selection state
    setUserSelection(null);
    setCurrentTourStep(null);

    // Execute the next step properly through performInteractiveStepAction
    const nextTourStep = tourSteps[nextStep];
    if (nextTourStep) {
      setTimeout(() => {
        performInteractiveStepAction(nextTourStep);
      }, 100);
    }
  };

  const advanceToNextStep = () => {
    setTourState((prev) => {
      // Don't advance if tour is not active
      if (!prev.isActive) {
        return prev;
      }

      const nextStep = prev.currentStep + 1;
      if (nextStep >= tourSteps.length) {
        return {
          ...prev,
          isActive: false,
          isCompleted: true,
          currentStep: 0,
          waitingForUser: false,
          userCompletedStep: false,
        };
      }

      const newState = {
        ...prev,
        currentStep: nextStep,
        waitingForUser: false,
        userCompletedStep: false,
      };

      // Execute next step immediately when advancing
      if (tourSteps[nextStep]) {
        executeTourStep(tourSteps[nextStep]);
      }

      return newState;
    });
  };

  const startInteractiveTour = () => {
    sendMessageToPlayCanvas(`guidedtourstarted`);
    // First, set the tour state to active
    setTourState((prev) => {
      const newState = {
        ...prev,
        isActive: true,
        currentStep: 0,
        isCompleted: false,
        waitingForUser: false,
        userCompletedStep: false,
      };
      return newState;
    });

    // Schedule first step execution to avoid setState during render
    setTimeout(() => {
      const firstStep = tourSteps[0];
      if (firstStep) {
        setActiveStep("lightType");
        setOpenDropdown("lightType");
        setTourState((prev) => ({
          ...prev,
          waitingForUser: true,
          userCompletedStep: false,
        }));
      }
    }, 0);
  };

  const stopTour = () => {
    sendMessageToPlayCanvas(`guidedtourended`);
    setTourState((prev) => ({
      ...prev,
      isActive: false,
      showWelcome: false,
      isCompleted: false,
      currentStep: 0,
      waitingForUser: false,
      userCompletedStep: false,
    }));
  };

  // Add useEffect to monitor user actions during tour
  useEffect(() => {
    if (tourState.isActive && tourState.waitingForUser) {
      // Monitor for user selections and check if they match expected values
      const currentStep = tourSteps[tourState.currentStep];

    }
  }, [
    tourState.waitingForUser,
    tourState.currentStep,
    tourState.isActive,
    tourState.userCompletedStep,
  ]);


  // Effect to check screen size and update on resize
  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window !== "undefined") {
      // Initial check
      setIsMobile(window.innerWidth < 640);

      // Function to update on resize
      const handleResize = () => {
        setIsMobile(window.innerWidth < 640);
      };

      // Add event listener
      window.addEventListener("resize", handleResize);

      // Clean up
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);
  // Get navigation steps
  const { steps } = useNavSteps(config);

  // Custom dropdown state management with auto-close config panel functionality
  const { openDropdown, setOpenDropdown, dropdownRefs } =
    useNavDropdown(setActiveStep);

  // Handle step click in vertical nav - with tour integration
  const handleStepClick = (stepId) => {
    // If tour is active, just open the dropdown - let sub-selection handle validation
    if (tourState.isActive) {
      setActiveStep(stepId);
      setOpenDropdown(stepId);
      return;
    }

    // Normal non-tour behavior
    // Auto-close config panel when clicking on any vertical navbar option
    if (stepId !== "pendantSelection") {
      setShowConfigurationTypeSelector(false);
    }
    if (localConfiguringType) {
      setLocalConfiguringType(null);
      // Also reset in parent component
      if (onConfigurationTypeChange) {
        onConfigurationTypeChange(null);
      }
    }

    // Handle hotspot - on for pendant selection, off for everything else
    if (stepId === "pendantSelection") {
      sendMessageToPlayCanvas(`hotspot:on`);
    } else {
      sendMessageToPlayCanvas(`hotspot:off`);
    }

    // Always set this step as the active step
    setActiveStep(stepId);

    // Toggle the dropdown for this step
    setOpenDropdown(openDropdown === stepId ? null : stepId);

    // Close any other dropdowns
    if (openDropdown && openDropdown !== stepId) {
      setOpenDropdown(null);
    }
  };

  // Toggle dropdown for a step - with auto-close config panel
  const toggleDropdown = (stepId) => {
    // Auto-close config panel when toggling any dropdown in vertical navbar
    if (localConfiguringType) {
      setLocalConfiguringType(null);
      // Also reset in parent component
      if (onConfigurationTypeChange) {
        onConfigurationTypeChange(null);
      }
    }

    if (openDropdown === stepId) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(stepId);
    }
  };

  // Local state for configuration type (will be synced with parent component)
  const [localConfiguringType, setLocalConfiguringType] =
    useState(configuringType);


  // Update local state when prop changes
  useEffect(() => {
    setLocalConfiguringType(configuringType);
  }, [configuringType]);

  // Pendant selection functionality
  const {
    currentDesign,
    setCurrentDesign,
    carouselRef,
    scrollCarousel,
    togglePendantSelection,
    applyDesignToSelected,
    applyToAllPendants,
    getImageSrc,
    getPendantDesignImageNumber
  } = usePendantSelection(pendants, selectedPendants, setSelectedPendants, onPendantDesignChange, setShowConfigurationTypeSelector, setOpenBase);




  // Handle pendant location selection to show configuration type selector
  const handlePendantLocationClick = (locationIndex) => {
    // Only show configuration type selector when clicking a pendant location
    // but don't reset the multi-selection functionality
    if (!selectedPendants.includes(locationIndex)) {
      // If not already selected, add to selection and show config selector
      setSelectedPendants([...selectedPendants, locationIndex]);
      setShowConfigurationTypeSelector(true);
    } else {
      // If already selected, just toggle selection without showing config selector
      const newSelection = selectedPendants.filter(
        (id) => id !== locationIndex
      );
      setSelectedPendants(newSelection);
    }
  };

  // Modal state for save configuration
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [configName, setConfigName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false); // This would be connected to your auth system
  const [isSaving, setIsSaving] = useState(false);

  // Handle save configuration
  const handleSaveConfig = () => {
    setShowSaveModal(true);
    setConfigName(
      `${config.lightType.charAt(0).toUpperCase() + config.lightType.slice(1)
      } Light Configuration`
    );
  };

  // Save configuration to system
  const saveConfigToSystem = () => {
    if (!configName.trim()) {
      // You would show a toast notification here
      return;
    }

    setIsSaving(true);

    // Simulate saving
    setTimeout(() => {
      setShowSaveModal(false);
      setIsSaving(false);
      // You would show a success notification here
    }, 1500);
  };

  // Calculate progress based on active step
  const calculateProgress = () => {
    const currentStepIndex = steps.findIndex((step) => step.id === activeStep);
    return (currentStepIndex + 1) / steps.length;
  };

  // Function to get icon for navigation buttons
  const getNavIcon = (stepId) => {
    const iconMap = {
      lightType: <FaLightbulb />,
      environment: <FaGlobe />,
      baseType: <FaLayerGroup />,
      baseColor: <FaPalette />,
      lightAmount: <FaList />,
      pendantSelection: <FaRegLightbulb />,
      systemType: <FaCubes />,
      systemConfiguration: <FaObjectGroup />
    };
    return iconMap[stepId] || <FaList />;
  };

  // Determine if we should show the vertical nav bar
  const showVerticalNav = !configuringType;

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.startConfiguratorTour = () => {
        setTourState((prev) => ({ ...prev, showWelcome: true }));
      };
    }
    return () => {
      if (typeof window !== "undefined") {
        delete window.startConfiguratorTour;
      }
    };
  }, []);

  return (
    <>
      {/* Welcome Tour Modal */}
      <WelcomeTourModal
        isOpen={tourState.showWelcome}
        onSkip={() => {
          setTourState((prev) => ({ ...prev, showWelcome: false }));
        }}
        onStart={() => {
          setTourState((prev) => ({ ...prev, showWelcome: false }));
          startInteractiveTour();
        }}
      />

      {/* Tour Overlay System */}
      {tourState.isActive && (
        <TourOverlay
          step={tourSteps[tourState.currentStep]}
          stepIndex={tourState.currentStep}
          totalSteps={tourState.totalSteps}
          onSkip={stopTour}
          onPause={() =>
            setTourState((prev) => ({ ...prev, isAutoAdvancing: false }))
          }
          onResume={() =>
            setTourState((prev) => ({ ...prev, isAutoAdvancing: true }))
          }
          waitingForUser={tourState.waitingForUser}
          userCompletedStep={tourState.userCompletedStep}
        />
      )}

      {/* Desktop vertical nav */}
      {showVerticalNav && !isMobile && (
        <div
          className="absolute left-8 top-1/2 transform -translate-y-1/2 z-[100] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <ProgressIndicator progress={calculateProgress()} emerald={emerald} />
          <motion.div
            className="p-3 rounded-full flex flex-col"
            // style={{ backgroundColor: charlestonGreen }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {/* Render NavButtons with data-tour-step for guided tour */}
            {steps
              .filter((step) => {
                if (
                  (step.id === "baseType" || step.id === "baseColor") &&
                  config.lightType !== "ceiling"
                ) {
                  return false;
                }

                // Hide environment button for wall and floor light types
                if (
                  step.id === "environment" &&
                  (config.lightType === "wall" || config.lightType === "floor")
                ) {
                  return false;
                }
                // Hide environment button for wall and floor light types
                if (
                  step.id === "lightAmount" &&
                  (config.lightType === "wall" || config.lightType === "floor")
                ) {
                  return false;
                }

                return true;
              })
              .map((step, index) => (
                <div className="relative" key={step.id}>
                  <NavButton
                    step={step}
                    index={index}
                    activeStep={activeStep}
                    openDropdown={openDropdown}
                    handleStepClick={handleStepClick}
                    toggleDropdown={toggleDropdown}
                    getNavIcon={getNavIcon}
                    emerald={emerald}
                    charlestonGreen={charlestonGreen}
                    textColor={textColor}
                    dropdownRefs={dropdownRefs}
                    containerDimensions={containerDimensions}
                    isGuided={isGuidedStep(step.id)}
                    isCompleted={isStepCompleted(step.id)}
                    data-tour={step.id}
                  >
                    {step?.id === "lightType" && openDropdown === step?.id && (
                      <LightTypeDropdown
                        config={config}
                        onLightTypeChange={onLightTypeChange}
                        setActiveStep={setActiveStep}
                        setOpenDropdown={setOpenDropdown}
                        tourActive={tourState.isActive}
                        onTourSelection={handleTourSubSelection}
                        setShowLoadingScreen={setShowLoadingScreen}
                      />
                    )}

                    {step?.id === "environment" && openDropdown === step?.id && (
                      <EnvironmentDropdown
                        config={config}
                        onEnvironmentChange={onEnvironmentChange}
                        setActiveStep={setActiveStep}
                        setOpenDropdown={setOpenDropdown}
                        tourActive={tourState.isActive}
                        onTourSelection={handleTourSubSelection}
                        sendMessageToPlayCanvas={sendMessageToPlayCanvas}
                      />
                    )}

                    {step?.id === "baseType" && openDropdown === step?.id && (
                      <BaseTypeDropdown
                        config={config}
                        onBaseTypeChange={onBaseTypeChange}
                        setActiveStep={setActiveStep}
                        setOpenDropdown={setOpenDropdown}
                        tourActive={tourState.isActive}
                        onTourSelection={handleTourSubSelection}
                        setShowLoadingScreen={setShowLoadingScreen}
                      />
                    )}

                    {step?.id === "baseColor" && openDropdown === step?.id && (
                      <BaseColorPanel
                        currentBaseColor={config.baseColor}
                        onBaseColorChange={onBaseColorChange}
                        currentConnectorColor={config?.connectorColor}
                        onConnectorColorChange={onConnectorColorChange}
                        setActiveTab={handleSetActiveTab}
                        activeTab={activeTab}
                        tourActive={tourState.isActive}
                        onTourSelection={handleTourSubSelection}
                      />
                    )}

                    {/* Configuration type dropdown removed */}

                    {step?.id === "systemType" && openDropdown === step?.id && (
                      <SystemTypeDropdown
                        config={config}
                        onSystemTypeChange={onSystemTypeChange}
                        setActiveStep={setActiveStep}
                        setOpenDropdown={setOpenDropdown}
                      />
                    )}

                    {step?.id === "lightAmount" &&
                      openDropdown === step?.id && (
                        <LightAmountDropdown
                          config={config}
                          onLightAmountChange={onLightAmountChange}
                          setActiveStep={setActiveStep}
                          setOpenDropdown={setOpenDropdown}
                          tourActive={tourState.isActive}
                          onTourSelection={handleTourSubSelection}
                          setShowLoadingScreen={setShowLoadingScreen}
                        />
                      )}

                    {step?.id === "pendantSelection" &&
                      openDropdown === step?.id && (
                        <PendantSelectionDropdown
                          pendants={pendants}
                          setShowPendantLoadingScreen={setShowPendantLoadingScreen}
                          selectedPendants={selectedPendants}
                          setSelectedPendants={setSelectedPendants}
                          cables={cables} // Pass cables prop to child component
                          currentDesign={currentDesign}
                          setOpenBase={setOpenBase}
                          setCurrentDesign={setCurrentDesign}
                          carouselRef={carouselRef}
                          onCableSizeChange={onCableSizeChange}
                          scrollCarousel={scrollCarousel}
                          togglePendantSelection={(locationIndex) => {
                            handlePendantLocationClick(locationIndex);
                          }}
                          selectAllPendants={selectAllPendants}
                          clearSelections={clearSelections}
                          applyDesignToSelected={applyDesignToSelected}
                          applyToAllPendants={applyToAllPendants}
                          getImageSrc={getImageSrc}
                          handleSaveConfig={handleSaveConfig}
                          configuringType={localConfiguringType}
                          configuringSystemType={configuringSystemType}
                          breadcrumbPath={breadcrumbPath}
                          onBreadcrumbNavigation={onBreadcrumbNavigation}
                          onSystemTypeSelection={onSystemTypeSelection}
                          selectedLocation={selectedPendants[0]}
                          onPendantDesignChange={onPendantDesignChange}
                          onSystemBaseDesignChange={onSystemBaseDesignChange}
                          sendMessageToPlayCanvas={sendMessageToPlayCanvas}
                          onSelectConfigurationType={(type) => {
                            // This matches the original handleConfigTypeSelection function
                            setLocalConfiguringType(type);

                            // Update the active step based on the configuration type
                            if (type === "pendant") {
                              setActiveStep("pendantSelection");
                            } else if (type === "system") {
                              setActiveStep("systemType");
                            }

                            // Call the parent component's handler if it exists
                            if (onConfigurationTypeChange) {
                              onConfigurationTypeChange(type);
                            }
                          }}
                          onClose={() => {
                            setShowConfigurationTypeSelector(false);
                            // Call parent handler to reset configuration type
                            if (onConfigurationTypeChange) {
                              onConfigurationTypeChange(null);
                            }
                          }}
                        />
                      )}

                    {step?.id === "info" && openDropdown === step?.id && (
                      <InfoPanel 
                        productInfo={{
                          model: config.model || "Limi Pro X1",
                          type: config.lightType || "Not selected",
                          environment: config.environment || "Not selected",
                          baseType: config.baseType || "Not selected",
                          baseColor: config.baseColor || "Not selected",
                          lightAmount: config.lightAmount ? `${config.lightAmount} lights` : "Not selected"
                        }}
                      />
                    )}

                    {step?.id === "lightingControl" && openDropdown === step?.id && (
                      <div className="p-4 rounded-lg shadow-lg">
                        <h3 className="text-lg font-medium mb-4">Adjust Brightness</h3>
                        <BrightnessSlider

                          brightness={brightness}
                          setBrightness={setBrightness}
                          temperature={colorTemperature}
                          setTemperature={setColorTemperature}
                          initialValue={config.brightness || 50}

                          onChange={(value) => {
                            // Update the config with the new brightness value
                            // You might want to add a proper handler for this
                            console.log('Brightness changed to:', value);
                            // Example: onBrightnessChange?.(value);
                          }}
                          sendMessageToPlayCanvas={sendMessageToPlayCanvas}
                        />


                      </div>
                    )}
                  </NavButton>
                </div>
              ))}
          </motion.div>
        </div>
      )}

      {/* Mobile vertical nav */}
      {showVerticalNav && isMobile && (
        <div
          className="fixed left-4 top-1/2 transform -translate-y-1/2 z-[100] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <ProgressIndicator progress={calculateProgress()} emerald={emerald} />
          <motion.div
            className="p-2 rounded-full flex flex-col gap-3"
            // style={{ backgroundColor:  }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {steps
             .filter((step) => {
                if (
                  (step.id === "baseType" || step.id === "baseColor") &&
                  config.lightType !== "ceiling"
                ) {
                  return false;
                }
                //hide info button for ceiling light types
                if (
                  step.id === "info" &&
                  (config.lightType === "ceiling" || config.lightType === "wall" || config.lightType === "floor")
                ) {
                  return false;
                }
                // Hide environment button for wall and floor light types
                if (
                  step.id === "environment" &&
                  (config.lightType === "wall" || config.lightType === "floor")
                ) {
                  return false;
                }
                // Hide environment button for wall and floor light types
                if (
                  step.id === "lightAmount" &&
                  (config.lightType === "wall" || config.lightType === "floor")
                ) {
                  return false;
                }

                return true;
              })
              .map((step, index) => (
                <div className="relative" key={step.id}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Close any existing dropdowns first
                      setOpenDropdown(null);
                      // Set mobile active step and open bottom menu
                      setMobileActiveStep(step.id);
                      setMobileBottomMenuOpen(true);
                      // Also set the active step for consistency
                      setActiveStep(step.id);
                    }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-base transition-all duration-200 ${mobileActiveStep === step.id && mobileBottomMenuOpen
                      ? `text-white`
                      : "text-black"
                      }`}
                    style={{
                      backgroundColor:
                        mobileActiveStep === step.id && mobileBottomMenuOpen ? '#141414' : 'rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    {getNavIcon(step.id)}
                  </button>
                </div>
              ))}
          </motion.div>
        </div>
      )}

      {/* Mobile Bottom Menu */}
      <MobileBottomMenu
        isOpen={mobileBottomMenuOpen && isMobile}
        brightness={brightness}
        setBrightness={setBrightness}
        colorTemperature={colorTemperature}
        setColorTemperature={setColorTemperature}
        activeStep={mobileActiveStep}
        handleChandelierTypeChange={handleChandelierTypeChange}
        setLocalConfiguringType={setLocalConfiguringType}
        onClose={() => setMobileBottomMenuOpen(false)}
        config={config}
        onLightTypeChange={onLightTypeChange}
        onEnvironmentChange={onEnvironmentChange}
        onBaseTypeChange={onBaseTypeChange}
        onBaseColorChange={onBaseColorChange}
        onConnectorColorChange={onConnectorColorChange}
        onLightAmountChange={onLightAmountChange}
        onSystemTypeChange={onSystemTypeChange}
        setActiveStep={setActiveStep}
        setOpenDropdown={setOpenDropdown}
        tourState={tourState}
        handleTourSubSelection={handleTourSubSelection}
        pendants={pendants}
        setShowPendantLoadingScreen={setShowPendantLoadingScreen}
        selectedPendants={selectedPendants}
        cables={cables}
        currentDesign={currentDesign}
        setOpenBase={setOpenBase}
        setCurrentDesign={setCurrentDesign}
        carouselRef={carouselRef}
        onCableSizeChange={onCableSizeChange}
        scrollCarousel={scrollCarousel}
        handlePendantLocationClick={handlePendantLocationClick}
        selectAllPendants={selectAllPendants}
        clearSelections={clearSelections}
        applyDesignToSelected={applyDesignToSelected}
        applyToAllPendants={applyToAllPendants}
        getImageSrc={getImageSrc}
        handleSaveConfig={handleSaveConfig}
        localConfiguringType={localConfiguringType}
        configuringSystemType={configuringSystemType}
        breadcrumbPath={breadcrumbPath}
        onBreadcrumbNavigation={onBreadcrumbNavigation}
        onSystemTypeSelection={onSystemTypeSelection}
        setSelectedPendants={setSelectedPendants}
        onPendantDesignChange={onPendantDesignChange}
        onSystemBaseDesignChange={onSystemBaseDesignChange}
        sendMessageToPlayCanvas={sendMessageToPlayCanvas}
        onConfigurationTypeChange={onConfigurationTypeChange}
      />

      {/* Configuration Panel */}

      <AnimatePresence>
        {showConfigurationTypeSelector &&
          !openingBase &&
          selectedPendants.length > 0 &&
          !isMobile && (
            <ConfigPanel
              configuringType={localConfiguringType}
              configuringSystemType={configuringSystemType}
              breadcrumbPath={breadcrumbPath}
              onBreadcrumbNavigation={onBreadcrumbNavigation}
              onSystemTypeSelection={onSystemTypeSelection}
              selectedLocation={selectedPendants[0]}
              selectedPendants={selectedPendants}
              cables={cables}
              setCables={setCables}
              onCableSizeChange={onCableSizeChange}
              handleChandelierTypeChange={handleChandelierTypeChange}
              onPendantDesignChange={onPendantDesignChange}
              onSystemBaseDesignChange={onSystemBaseDesignChange}
              onShadeSelect={onShadeSelect}
              setShowPendantLoadingScreen={setShowPendantLoadingScreen}
              currentShade={null}
              showConfigurationTypeSelector={showConfigurationTypeSelector}
              sendMessageToPlayCanvas={sendMessageToPlayCanvas}
              onSelectConfigurationType={(type) => {
                // This matches the original handleConfigTypeSelection function
                setLocalConfiguringType(type);

                // if(type == 'pendant' || type == 'system'){
                //   setShowConfigurationTypeSelector(false);
                // }

                // Update the active step based on the configuration type
                if (type === "pendant") {
                  setActiveStep("pendantSelection");
                } else if (type === "system") {
                  setActiveStep("systemType");
                }

                // Call the parent component's handler if it exists
                if (onConfigurationTypeChange) {
                  onConfigurationTypeChange(type);
                }
              }}
              onClose={() => {
                setShowConfigurationTypeSelector(false);
                // Call parent handler to reset configuration type
                if (onConfigurationTypeChange) {
                  onConfigurationTypeChange(null);
                }
              }}
            />
          )}
      </AnimatePresence>

      {showSaveModal && (
        <SaveConfigurationModal
          onClose={() => setShowSaveModal(false)}
          config={config}
          currentDesign={currentDesign}
          isSaving={isSaving}
          setShowSaveModal={setShowSaveModal}
          saveConfigToSystem={saveConfigToSystem}
        />
      )}
    </>
  );
};

// GuidedTourOverlay component

function GuidedTourOverlay({
  isActive,
  step,
  stepIndex,
  totalSteps,
  targetSelector,
  onNext,
  onPrev,
  onClose,
}) {
  const [highlightRect, setHighlightRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [actionCompleted, setActionCompleted] = useState(false);

  // Find and track the position of the highlighted element
  useLayoutEffect(() => {
    if (!isActive || !targetSelector) {
      setHighlightRect(null);
      return;
    }
    const el = document.querySelector(targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setHighlightRect(rect);
      // Position tooltip to the right of the button
      setTooltipPos({
        top: rect.top + rect.height / 2,
        left: rect.right + 24,
      });
    }
  }, [isActive, step, targetSelector]);

  // Escape to close
  useEffect(() => {
    if (!isActive) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isActive, onClose]);

  // --- BEGIN: Auto-advance logic for required actions ---
  useEffect(() => {
    if (!isActive || !step?.requiredAction || !step.targetSelector) return;
    const el = document.querySelector(step.targetSelector);
    if (!el) return;
    let handler;
    if (step.requiredAction.type === "click") {
      handler = () => {
        setActionCompleted(true);
        setTimeout(() => {
          setActionCompleted(false);
          onNext();
        }, 700);
      };
      el.addEventListener("click", handler);
    } else if (step.requiredAction.type === "change") {
      handler = () => {
        setActionCompleted(true);
        setTimeout(() => {
          setActionCompleted(false);
          onNext();
        }, 700);
      };
      el.addEventListener("change", handler);
    }
    return () => {
      if (handler) {
        if (step.requiredAction.type === "click")
          el.removeEventListener("click", handler);
        if (step.requiredAction.type === "change")
          el.removeEventListener("change", handler);
      }
    };
  }, [isActive, step, onNext]);
  // --- END: Auto-advance logic ---

  if (!isActive || !highlightRect) return null;

  return createPortal(
    <>
      {/* Overlay - No spotlight, just dimmed background */}
      <div
        className="fixed inset-0 z-[10000] pointer-events-none bg-black bg-opacity-50"
        style={{ backdropFilter: "blur(4px)" }}
        aria-hidden="true"
      />
      {/* Action completed checkmark only */}
      <div
        className="fixed z-[10010] pointer-events-none"
        style={{
          top: highlightRect.top - 24,
          left: highlightRect.left - 24,
          width: highlightRect.width + 48,
          height: highlightRect.height + 48,
          pointerEvents: "none",
        }}
      >
        {/* Action completed checkmark */}
        {actionCompleted && (
          <div className="absolute top-0 right-0 p-2 bg-emerald-500 text-white rounded-full shadow-md animate-fadeIn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )}
      </div>
      {/* Tooltip */}
      <div
        className="fixed z-[10002] bg-gradient-to-br from-white to-gray-50 text-gray-800 rounded-xl shadow-2xl px-6 py-5 flex flex-col gap-3 w-[340px] animate-fadeIn border border-gray-100"
        style={{
          top: Math.max(tooltipPos.top - 70, 24),
          left: "50%",
          transform: "translateX(-50%)",
          pointerEvents: "auto",
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header with close button */}
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-lg">
                {step?.title || ""}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                Step {stepIndex + 1} of {totalSteps}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${((stepIndex + 1) / totalSteps) * 100}%`,
                }}
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-200 text-gray-500 hover:text-gray-700"
            aria-label="Close tour"
            tabIndex={0}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Description */}
        <div className="text-sm text-gray-600 leading-relaxed">
          {step?.description || ""}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-3 mt-2">
          <button
            onClick={onPrev}
            disabled={stepIndex === 0}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center ${stepIndex === 0
              ? "text-gray-400 cursor-not-allowed"
              : "text-emerald-600 hover:bg-emerald-50 hover:shadow-sm"
              }`}
          >
            <FiChevronLeft size={18} className="mr-1" />
            Back
          </button>

          {stepIndex === totalSteps - 1 ? (
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg font-medium text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors duration-200 flex-1 text-center shadow-sm hover:shadow-md"
            >
              Finish Tour
            </button>
          ) : (
            <button
              onClick={onNext}
              className="px-5 py-2 rounded-lg font-medium text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors duration-200 flex-1 text-center shadow-sm hover:shadow-md flex items-center justify-center"
            >
              Continue <FiChevronRight size={18} className="ml-1.5" />
            </button>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
// WelcomeTourModal component
function WelcomeTourModal({ isOpen, onSkip, onStart }) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black bg-opacity-60 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl px-8 py-8 flex flex-col items-center gap-4 max-w-[90vw] w-[420px]">
        <div className="text-2xl font-bold mb-2 text-emerald-600">
          Ready to explore LIMI?
        </div>
        <div className="text-gray-700 text-base mb-4 text-center">
          Let us guide you through creating the perfect lighting configuration.
          <br />
          <span className="text-sm text-gray-500 mt-2 block">
            Takes about 2 minutes
          </span>
        </div>
        <div className="flex gap-4 mt-2 w-full">
          <button
            className="flex-1 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
            onClick={onSkip}
          >
            Skip Tour
          </button>
          <button
            className="flex-1 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition shadow-lg"
            onClick={onStart}
          >
            Start Tour
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// TourOverlay component
function TourOverlay({
  step,
  stepIndex,
  totalSteps,
  onSkip,
  onPause,
  onResume,
  waitingForUser,
  userCompletedStep,
}) {
  const [highlightRect, setHighlightRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [dropdownRect, setDropdownRect] = useState(null);

  // Find and track the position of the highlighted element and dropdown
  useLayoutEffect(() => {
    if (!step || !step.target) {
      setHighlightRect(null);
      setDropdownRect(null);
      return;
    }

    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setHighlightRect(rect);
      // Position tooltip to the left of the navigation
      setTooltipPos({
        top: rect.top + rect.height / 2,
        left: rect.left - 320, // Position tooltip to the left
      });

      // Find the dropdown content area - only if dropdown is actually open
      let dropdownElement = el.parentElement?.querySelector('.p-4') ||
        el.parentElement?.querySelector('[style*="padding"]') ||
        el.parentElement?.querySelector('div[style]');

      // Special case for pendantSelection - look for ConfigPanel
      if (step.id === 'pendantSelection') {
        const configPanel = document.querySelector('div[class*="fixed"][class*="bottom-0"], div[class*="absolute"][class*="bottom-1"]');
        if (configPanel && configPanel.offsetHeight > 0 && configPanel.offsetWidth > 0) {
          const configBounds = configPanel.getBoundingClientRect();
          setDropdownRect(configBounds);
          return;
        }
      }

      // Check if dropdown is visible and if the parent dropdown is actually open
      const parentDropdown = el.parentElement;
      const isDropdownOpen = parentDropdown && (
        parentDropdown.style.display !== 'none' &&
        parentDropdown.offsetHeight > 0 &&
        parentDropdown.offsetWidth > 0 &&
        !parentDropdown.hasAttribute('hidden') &&
        !parentDropdown.classList.contains('hidden')
      );

      // Also check if the dropdown content itself is visible
      const isContentVisible = dropdownElement &&
        dropdownElement.offsetHeight > 0 &&
        dropdownElement.offsetWidth > 0 &&
        getComputedStyle(dropdownElement).visibility !== 'hidden' &&
        getComputedStyle(dropdownElement).display !== 'none';

      if (isContentVisible && isDropdownOpen) {
        const dropdownBounds = dropdownElement.getBoundingClientRect();
        setDropdownRect(dropdownBounds);
      } else {
        setDropdownRect(null);
      }
    }
  }, [step]);

  if (!step || !highlightRect) return null;

  return createPortal(
    <>
      {/* Background Overlay with dropdown cutout and center spotlight */}
      <svg
        className="fixed inset-0 z-[10000] pointer-events-none"
        width={typeof window !== "undefined" ? window.innerWidth : 0}
        height={typeof window !== "undefined" ? window.innerHeight : 0}
        style={{
          width: "100vw",
          height: "100vh",
          display: "block",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="center-spotlight" cx="50%" cy="50%" r="25%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="70%" stopColor="white" stopOpacity="0.1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="dropdown-cutout-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Center spotlight cutout */}
            <circle
              cx="50%"
              cy="50%"
              r="200"
              fill="black"
              opacity="0.7"
            />
            {dropdownRect && (
              <rect
                x={dropdownRect.left - 1}
                y={dropdownRect.top - 1}
                width={dropdownRect.width + 2}
                height={dropdownRect.height + 2}
                rx="8"
                ry="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          style={{ backdropFilter: "blur(4px)", pointerEvents: "none" }}
          mask="url(#dropdown-cutout-mask)"
        />
        {/* Center spotlight overlay - adjust position for baseType step */}
        {/* <circle
          cx="50%"
          cy={step?.id === 'baseType' ? '20%' : '50%'}
          r="200"
          fill="url(#center-spotlight)"
          style={{ pointerEvents: "none" }}
        /> */}
      </svg>


      {/* Tour Tooltip */}
      <div
        className="fixed z-[10020] bg-white text-gray-800 rounded-lg shadow-lg px-4 py-3 w-[240px] sm:w-[240px] animate-fadeIn border border-gray-200"
        style={{
          ...(typeof window !== "undefined" && window.innerWidth < 640
            ? {
              bottom: "280px",
              left: "30%",
              transform: "translateX(-50%)",
              top: "auto"
            }
            : {
              top: Math.max(tooltipPos.top - 80, 24),
              left: Math.max(tooltipPos.left - 240, 24),
              transform: "none",
              bottom: "auto"
            }
          ),
          pointerEvents: "auto",
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-gray-900 text-sm">
            {step.title}
          </span>
          <button
            onClick={onSkip}
            className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            aria-label="Skip tour"
          >
            <FiX size={14} />
          </button>
        </div>

        {/* Description */}
        <div className="text-xs text-gray-600 mb-3">
          {step.description}
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{stepIndex + 1} of {totalSteps}</span>
          <button
            onClick={onSkip}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Skip
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

export default VerticalNavBar;

// Add CSS animations for tour effects
const tourStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes slideInFromRight {
    from { 
      opacity: 0; 
      transform: translateX(20px); 
    }
    to { 
      opacity: 1; 
      transform: translateX(0); 
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  
  .animate-pulse {
    animation: pulse 2s infinite;
  }
  
  .animate-slideInFromRight {
    animation: slideInFromRight 0.4s ease-out;
  }
  
  .tour-spotlight {
    pointer-events: none;
    z-index: 9999;
  }
  
  .tour-tooltip {
    backdrop-filter: blur(10px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  
  .tour-highlight {
    box-shadow: 0 0 0 4px rgba(80, 200, 120, 0.3), 0 0 0 8px rgba(80, 200, 120, 0.2);
    border-radius: 50%;
  }
`;

// Inject styles into document head
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = tourStyles;
  document.head.appendChild(styleSheet);
}
