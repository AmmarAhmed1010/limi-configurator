import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  getPendantAssignments,
  getBarAssignments,
  getBallAssignments,
  getUniversalAssignments,
  getChandelierAssignments,
  onDataRefresh,
} from "../pendantSystemData";
import { FaChevronLeft, FaChevronRight, FaCheck } from "react-icons/fa";
import { listenForCableMessages } from "../../../util/iframeCableMessageHandler";

const MobilePendantConfig = ({
  pendants,
  selectedPendants,
  handleChandelierTypeChange,
  setSelectedPendants,
  cables,
  getImageSrc,
  onPendantDesignChange,
  onSystemBaseDesignChange,
  selectAllPendants,
  clearSelections,
  setShowConfigurationTypeSelector,
  setActiveStep,
  sendMessageToPlayCanvas,
  onConfigurationTypeChange,
  localConfiguringType,
  setLocalConfiguringType,
  onSystemTypeSelection,
  onChandelierTypeChange,
  onClose,
  // Loading functionality
  setPendantLoading,
  turnOffPendantLoading,
}) => {
  const [activeTab, setActiveTab] = useState("design");

  // Assignment state (fetch from API)
  const [pendantAssignments, setPendantAssignments] = useState([]);
  const [barAssignments, setBarAssignments] = useState([]);
  const [ballAssignments, setBallAssignments] = useState([]);
  const [universalAssignments, setUniversalAssignments] = useState([]);
  const [chandelierAssignments, setChandelierAssignments] = useState([]);

  // Fetch assignments (same pattern as ConfigPanel)
  useEffect(() => {
    const fetchAssignments = async () => {
      setPendantAssignments(await getPendantAssignments());
      setBarAssignments(await getBarAssignments());
      setBallAssignments(await getBallAssignments());
      setUniversalAssignments(await getUniversalAssignments());
      setChandelierAssignments(await getChandelierAssignments());
    };
    fetchAssignments();
    // Listen for data refreshes
    const unsubscribe = onDataRefresh(() => fetchAssignments());
    return unsubscribe;
  }, []);

  // Visibility checks for assignment arrays
  const hasVisiblePendants = pendantAssignments.some(
    (item) => item.isShow === true
  );
  const hasVisibleBars = barAssignments.some((item) => item.isShow === true);
  const hasVisibleBalls = ballAssignments.some((item) => item.isShow === true);
  const hasVisibleUniversals = universalAssignments.some(
    (item) => item.isShow === true
  );
  const hasVisibleChandeliers = chandelierAssignments.some(
    (item) => item.isShow === true
  );
  const anyVisibleAssignments = [
    ...pendantAssignments,
    ...barAssignments,
    ...ballAssignments,
    ...universalAssignments,
    ...chandelierAssignments,
  ].some((item) => item.isShow === true);

  const [configuringSystemType, setConfiguringSystemType] = useState(null);
  const [currentDesign, setCurrentDesign] = useState(null);
  const [showSystemOptions, setShowSystemOptions] = useState(false);
  const carouselRef = useRef(null);
  // Force re-render when data changes
  const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);

  // Handle pendant location selection
  const handlePendantLocationClick = (locationIndex) => {
    if (!selectedPendants.includes(locationIndex)) {
      // If not already selected, add to selection
      setSelectedPendants([...selectedPendants, locationIndex]);
    } else {
      // If already selected, remove from selection
      const newSelection = selectedPendants.filter(
        (id) => id !== locationIndex
      );
      setSelectedPendants(newSelection);
    }
  };

  // Handle configuration type selection (pendant, system, or chandelier)
  const handleConfigTypeSelection = (type) => {
    setLocalConfiguringType(type);

    if (type === "pendant") {
      setActiveStep("pendantSelection");
      setShowSystemOptions(false);
      setConfiguringSystemType(null);
    } else if (type === "system") {
      setActiveStep("systemType");
      setShowSystemOptions(true);
      setConfiguringSystemType(null);
    } else if (type === "chandelier") {
      setActiveStep("chandelierSelection");
      setShowSystemOptions(false);
      setConfiguringSystemType(null);
    
    }

    // Call the parent component's handler if it exists
    if (onConfigurationTypeChange) {
      onConfigurationTypeChange(type);
    }

    // Send message to PlayCanvas
    if (sendMessageToPlayCanvas) {
      sendMessageToPlayCanvas(`configType:${type}`);
    }
  };

  // Handle system type selection (bar, ball, universal)
  const handleSystemTypeSelection = (systemType) => {
    setConfiguringSystemType(systemType);

    // Fire specific messages for each system type (same logic as ConfigPanel)
    
    if (systemType === "bar") {
      // Fire the PlayCanvas messages when bar is selected

      if (selectedPendants.length > 0) {
        selectedPendants.forEach((id) => {
          sendMessageToPlayCanvas(`cable_${id}`);
          sendMessageToPlayCanvas("bars");
          sendMessageToPlayCanvas("glass_none");
          sendMessageToPlayCanvas("color_gold");
          sendMessageToPlayCanvas("silver_none");
          sendMessageToPlayCanvas(
            "product_https://dev.api1.limitless-lighting.co.uk/configurator_dynamic/models/Bar_1756732230450.glb"
          );
          sendMessageToPlayCanvas("allmodelsloaded");
        });
      } else {
        sendMessageToPlayCanvas(`cable_0`);
        sendMessageToPlayCanvas("bars");
        sendMessageToPlayCanvas("glass_none");
        sendMessageToPlayCanvas("color_gold");
        sendMessageToPlayCanvas("silver_none");
        sendMessageToPlayCanvas(
          "product_https://dev.api1.limitless-lighting.co.uk/configurator_dynamic/models/Bar_1756732230450.glb"
        );
        sendMessageToPlayCanvas("allmodelsloaded");
      }
    }

    // Call the parent handler
    if (onSystemTypeSelection) {
      onSystemTypeSelection(systemType);
    }
  };

  // Handle pendant design selection
  const handlePendantDesignSelection = (design) => {
    // Show loading overlay
    if (setPendantLoading) {
      setPendantLoading(true);
    }

    // Loading will only be turned off when "loadingOff" message is received from iframe

    setCurrentDesign(design);

    // Use all selected pendants if available, otherwise fall back to just the first one
    const pendantsToUpdate =
      selectedPendants && selectedPendants.length > 0
        ? selectedPendants
        : [selectedPendants[0]];

    onPendantDesignChange(pendantsToUpdate, design);
  };

  // Handle system base design selection
  const handleSystemBaseDesignSelection = (design) => {
    // Show loading overlay
    if (setPendantLoading) {
      setPendantLoading(true);
    }

    // Loading will only be turned off when "loadingOff" message is received from iframe

    setCurrentDesign(design);
    onSystemBaseDesignChange(design);
  };

  // Handle chandelier design selection with loading
  const handleChandelierDesignSelection = (design) => {
    // Show loading overlay
    if (setPendantLoading) {
      setPendantLoading(true);
    }

    // Loading will only be turned off when "loadingOff" message is received from iframe

    setCurrentDesign(design);
    if (handleChandelierTypeChange) {
      handleChandelierTypeChange(design);
    }
  };

  // Subscribe to data refresh events to force re-render
  useEffect(() => {
    const unsubscribe = onDataRefresh((newData) => {
      setDataRefreshTrigger((prev) => prev + 1);
    });

    return unsubscribe;
  }, []);

  // Carousel scroll functions
  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 200;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };



  // Render pendant numbers for selection
  const renderPendantSelection = () => {
    // if (!pendants || pendants.length === 0) {
    //   return (
    //     <div className="text-center text-gray-400 py-8">
    //       No pendants available
    //     </div>
    //   );
    // }

    return (
      <div className="space-y-4">
        {/* Pendant grid with cable info */}
        <div className="flex gap-3">
          {cables.map((pendant, index) => {
            // Get cable size and design for this pendant
            const cableSize = cables && cables[index] ? cables[index].size : 1;
            const cableDesign =
              cables && cables[index] ? cables[index].design : null;
            const designImageUrl = getImageSrc(cableDesign);

            return (
              <button
                key={index}
                onClick={() => handlePendantLocationClick(index)}
                className={`
                  w-14 h-14 rounded-full flex items-center justify-center text-xs font-medium
                  transition-all duration-200 border-2 relative overflow-hidden
                  ${
                    selectedPendants.includes(index)
                      ? "border-emerald-400 shadow-lg shadow-emerald-400/30"
                      : "border-gray-600 hover:border-gray-500"
                  }
                `}
              >
                {/* Background image if available */}
                {designImageUrl && (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-70"
                    style={{ backgroundImage: `url(${designImageUrl})` }}
                  />
                )}

                {/* Dark overlay for better text visibility */}
                <div className="absolute inset-0 bg-black bg-opacity-40" />

                {/* Content */}
                <div className="relative z-10 flex items-center justify-center text-white">
                  <div className="text-sm font-bold">{index + 1}</div>
                </div>

                {/* Selection indicator */}
                {/* {selectedPendants.includes(index) && (
                  <div className="absolute top-5 right-5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <FaCheck className="text-white text-xs" />
                  </div>
                )} */}
              </button>
            );
          })}
        </div>

        {/* Selection controls */}
        {/* <div className="flex gap-2 mt-4">
          <button
            onClick={() => {
              selectAllPendants();
            }}
            className="flex-1 py-2 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Select All
          </button>
          <button
            onClick={() => clearSelections()}
            className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Clear All
          </button>
        </div> */}
      </div>
    );
  };

  // Render design options (pendant/system/chandelier)
  const renderDesignOptions = () => {
    // If no configuration type selected
    if (!localConfiguringType) {
      // Check chandelier conditions from localStorage like ConfigPanel
      const parentConfig =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("lightConfig") || "{}")
          : {};

      // Show chandelier option when lightAmount is 3 and lightType is ceiling
      const showChandelier =
        parentConfig.lightAmount === 3 &&
        (parentConfig.lightType === "ceiling" ||
          parentConfig.lightType === "rectangular");

      return (
        <div className="space-y-3">
         
          <div
            className={`flex justify-center ${
              showChandelier ? "gap-4" : "gap-6"
            }`}
          >
            <button
              onClick={() => handleConfigTypeSelection("pendant")}
              className="flex flex-col w-16 transition-all duration-200 justify-center items-center text-gray-300 hover:text-white"
            >
              <img
                src="./images/configOptions/pendant.png"
                alt="Pendant"
                className="w-14 h-14"
              />
              <div className="text-black text-xs font-medium mt-1">Pendant</div>
            </button>

            <button
              onClick={() => handleConfigTypeSelection("system")}
              className="flex flex-col w-16 transition-all duration-200 justify-center items-center text-gray-300 hover:text-white"
            >
              <img
                src="./images/configOptions/system.png"
                alt="System"
                className="w-14 h-14"
              />
              <div className="text-black text-xs font-medium mt-1">System</div>
            </button>

            {showChandelier && (
              <button
                onClick={() => handleConfigTypeSelection("chandelier")}
                className="flex flex-col w-16 transition-all duration-200 justify-center items-center text-gray-300 hover:text-white"
              >
                <img
                  src="./images/configOptions/chandelier.png"
                  alt="Chandelier"
                  className="w-14 h-14"
                />
                <div className="text-black text-xs font-medium mt-1">
                  Chandelier
                </div>
              </button>
            )}
          </div>
        </div>
      );
    }

    // If pendant configuration selected, show pendant designs
    if (localConfiguringType === "pendant") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-black text-sm">Pendant Designs</div>
            <button
              onClick={() => setLocalConfiguringType(null)}
              className="text-emerald-400 text-sm hover:text-emerald-300"
            >
              ← Back
            </button>
          </div>

          {/* Carousel container */}
          <div className="relative">
            {/* Left scroll button */}
            <button
              onClick={() => scrollCarousel("left")}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg transition-colors"
            >
              <FaChevronLeft size={16} />
            </button>

            {/* Right scroll button */}
            <button
              onClick={() => scrollCarousel("right")}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg transition-colors"
            >
              <FaChevronRight size={16} />
            </button>

            {/* Horizontal scrollable carousel */}
            <div
              ref={carouselRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide px-8"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {pendantAssignments.map((pendant) => (
                <button
                  key={pendant.design}
                  onClick={() => handlePendantDesignSelection(pendant.design)}
                  className="flex-shrink-0 w-18 transition-all duration-200 text-center text-black"
                >
                  <div className="relative">
                    {pendant.media?.image?.url && (
                      <img
                        src={pendant.media.image.url}
                        alt={pendant.name}
                        className={`w-14 h-14 object-cover rounded-full mb-1 transition-all duration-200 mx-auto ${
                          currentDesign === pendant.design
                            ? "border-2 border-emerald-400"
                            : ""
                        }`}
                      />
                    )}
                    {currentDesign === pendant.design && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-500 bg-opacity-90 rounded-full flex items-center justify-center">
                        <FaCheck className="text-white text-xs" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-medium">{pendant.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // If system configuration selected, show system types or system designs
    if (localConfiguringType === "system") {
      if (!configuringSystemType) {
        // Show system type selection (bar, ball, universal)
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-black text-sm">System Type</div>
              <button
                onClick={() => setLocalConfiguringType(null)}
                className="text-emerald-400 text-sm hover:text-emerald-300"
              >
                ← Back
              </button>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => handleSystemTypeSelection("bar")}
                className="flex flex-col w-16 transition-all duration-200 justify-center items-center text-black"
              >
                <img
                  src="./images/configOptions/bar.png"
                  alt="Bar"
                  className="w-14 h-14"
                />
                <div className="text-black text-xs font-medium mt-1">Bar</div>
              </button>

              <button
                onClick={() => handleSystemTypeSelection("ball")}
                className="flex flex-col w-16 transition-all duration-200 justify-center items-center text-black"
              >
                <img
                  src="./images/configOptions/ball.png"
                  alt="Ball"
                  className="w-14 h-14"
                />
                <div className="text-black text-xs font-medium mt-1">Ball</div>
              </button>

              <button
                onClick={() => handleSystemTypeSelection("universal")}
                className="flex flex-col w-16 transition-all duration-200 justify-center items-center text-black"
              >
                <img
                  src="./images/configOptions/universal.png"
                  alt="Universal"
                  className="w-14 h-14"
                />
                <div className="text-black text-xs font-medium mt-1">
                  Universal
                </div>
              </button>
            </div>
          </div>
        );
      } else {
        // Show system designs based on selected type
        const systemAssignments = {
          bar: barAssignments,
          ball: ballAssignments,
          universal: universalAssignments,
        };

        const currentAssignments =
          systemAssignments[configuringSystemType] || [];

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-black text-sm">
                {configuringSystemType.charAt(0).toUpperCase() +
                  configuringSystemType.slice(1)}{" "}
                Designs
              </div>
              <button
                onClick={() => setConfiguringSystemType(null)}
                className="text-emerald-400 text-sm hover:text-emerald-300"
              >
                ← Back
              </button>
            </div>

            {/* Carousel container for system designs */}
            <div className="relative">
              {/* Left scroll button */}
              <button
                onClick={() => scrollCarousel("left")}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg transition-colors"
              >
                <FaChevronLeft size={16} />
              </button>

              {/* Right scroll button */}
              <button
                onClick={() => scrollCarousel("right")}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg transition-colors"
              >
                <FaChevronRight size={16} />
              </button>

              {/* Horizontal scrollable carousel */}
              <div
                ref={carouselRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide px-8"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {currentAssignments.map((design) => (
                  <button
                    key={design.design}
                    onClick={() =>
                      handleSystemBaseDesignSelection(design.design)
                    }
                    className="flex-shrink-0 w-18 transition-all duration-200 text-center text-black"
                  >
                    <div className="relative">
                      {design.media?.image?.url && (
                        <img
                          src={design.media.image.url}
                          alt={design.name}
                          className={`w-14 h-14 object-cover rounded-full mb-1 transition-all duration-200 mx-auto ${
                            currentDesign === design.design
                              ? "border-2 border-emerald-400"
                              : ""
                          }`}
                        />
                      )}
                      {currentDesign === design.design && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-500 bg-opacity-90 rounded-full flex items-center justify-center">
                          <FaCheck className="text-white text-xs" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-medium">{design.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      }
    }

    // If chandelier configuration selected, show chandelier designs
    if (localConfiguringType === "chandelier") {
      // Get parent config to check baseType like in ConfigPanel
      const parentConfig =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("lightConfig") || "{}")
          : {};

      // Filter chandelierAssignments based on baseType
      const filteredChandeliers = chandelierAssignments.filter(
        (chand) => chand.baseType === parentConfig.baseType
      );

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-black text-sm">Chandelier Designs</div>
            <button
              onClick={() => setLocalConfiguringType(null)}
              className="text-emerald-400 text-sm hover:text-emerald-300"
            >
              ← Back
            </button>
          </div>

          {/* Carousel container for chandelier designs */}
          <div className="relative">
            {/* Left scroll button */}
            <button
              onClick={() => scrollCarousel("left")}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg transition-colors"
            >
              <FaChevronLeft size={16} />
            </button>

            {/* Right scroll button */}
            <button
              onClick={() => scrollCarousel("right")}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg transition-colors"
            >
              <FaChevronRight size={16} />
            </button>

            {/* Horizontal scrollable carousel */}
            <div
              ref={carouselRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide px-8"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {filteredChandeliers.map((design) => (
                <button
                  key={design.design}
                  onClick={() => handleChandelierDesignSelection(design.design)}
                  className="flex-shrink-0 w-18 transition-all duration-200 text-center text-black"
                >
                  <div className="relative">
                    {design.media?.image?.url && (
                      <img
                        src={design.media.image.url}
                        alt={design.name}
                        className={`w-14 h-14 object-cover rounded-full mb-1 transition-all duration-200 mx-auto ${
                          currentDesign === design.design
                            ? "border-2 border-emerald-400"
                            : ""
                        }`}
                      />
                    )}
                    {currentDesign === design.design && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-500 bg-opacity-90 rounded-full flex items-center justify-center">
                        <FaCheck className="text-white text-xs" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-medium">{design.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation with Close Button */}
      <div className="flex items-center border-b border-gray-700 mb-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="text-black p-3"
        >
          ✕
        </button>

        {/* Tab buttons */}
        <div className="flex flex-1">
          <button
            onClick={() => setActiveTab("selection")}
            className={`
              flex-1 py-4 px-4 text-sm font-medium transition-colors
              ${
                activeTab === "selection"
                  ? "text-emerald-400 border-b-2 border-emerald-400"
                  : "text-black"
              }
            `}
          >
            Selection
          </button>
          <button
            onClick={() => setActiveTab("design")}
            className={`
              flex-1 py-4 px-4 text-sm font-medium transition-colors
              ${
                activeTab === "design"
                  ? "text-emerald-400 border-b-2 border-emerald-400"
                  : "text-black"
              }
            `}
          >
            Design
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "selection"
            ? renderPendantSelection()
            : renderDesignOptions()}
        </motion.div>
      </div>
    </div>
  );
};

export default MobilePendantConfig;
