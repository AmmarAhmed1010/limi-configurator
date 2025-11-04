import { motion } from "framer-motion";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
  FaShoppingCart,
  FaSave,
} from "react-icons/fa";
import { ConfigPanel } from "./ConfigPanel";
import { MobilePendantSelector } from "./MobilePendantSelector";

export const PendantSelectionDropdown = ({
  pendants,
  selectedPendants,
  setSelectedPendants,
  currentDesign,
  setCurrentDesign,
  onCableSizeChange,
  carouselRef,
  scrollCarousel,
  selectAllPendants,
  clearSelections,
  togglePendantSelection,
  setOpenBase,
  applyDesignToSelected,
  applyToAllPendants,
  getImageSrc,
  handleSaveConfig,
  configuringType,
  configuringSystemType,
  breadcrumbPath,
  onBreadcrumbNavigation,
  onSystemTypeSelection,
  selectedLocation,
  onPendantDesignChange,
  onSystemBaseDesignChange,
  onSelectConfigurationType,
  onClose,
  cables,
  sendMessageToPlayCanvas, // Add sendMessageToPlayCanvas prop
}) => {
  // State to track active tab on mobile
  const [activeTab, setActiveTab] = useState("configure"); // 'configure' or 'design'
  const [isMobile, setIsMobile] = useState(false);
 // Select all pendants

  // Listen for selectedcable messages and update selectedPendants

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

  const handleCableSizeChange = (size, selectedCables) => {
    onCableSizeChange(size, selectedCables);
  };

  // Use mobile component for mobile devices
  if (isMobile) {
    return (
      <MobilePendantSelector
        pendants={pendants}
        cables={cables}
        selectedPendants={selectedPendants}
        onPendantDesignChange={onPendantDesignChange}
        onClose={onClose}
        isOpen={true} // Always open when this component is rendered
        getImageSrc={getImageSrc()}
        togglePendantSelection={togglePendantSelection}
        selectAllPendants={selectAllPendants}
        clearSelections={clearSelections}
        applyToAllPendants={applyToAllPendants}
        handleSaveConfig={handleSaveConfig}
        sendMessageToPlayCanvas={sendMessageToPlayCanvas}
      />
    );
  }

  // Desktop UI
  return (
    <div
      className="p-4"
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Desktop title */}
      <div>
        <h3 className="text-base font-bold text-black mb-3 font-['Amenti']">
          Configure Pendants
        </h3>
      </div>

      {/* Pendant selection controls */}
      <div className="flex justify-between mb-3">
        {selectedPendants.length > 0 && (
          <>
            <button
              onClick={selectAllPendants}
              className="px-3 py-1 rounded-lg text-xs bg-gray-700 hover:bg-gray-600 text-white"
            >
              Select All
            </button>

            <button
              onClick={clearSelections}
              className="px-3 py-1 rounded-lg text-xs bg-gray-700 hover:bg-gray-600 text-white"
            >
              Clear ({selectedPendants.length})
            </button>
          </>
        )}
      </div>

      {/* Pendant selector carousel */}
      <div className="relative mb-4">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
          <button
            onClick={() => scrollCarousel("left")}
            className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition-colors"
          >
            <FaChevronLeft size={14} />
          </button>
        </div>

        <div
          ref={carouselRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-8 max-w-full"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {cables && cables.length > 0
            ? cables.map(
                (cable, index) => (
                  (
                    <motion.div
                      key={index}
                      className="flex-shrink-0 cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => togglePendantSelection(index)}
                      style={{ userSelect: "none" }}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all overflow-hidden relative ${
                          selectedPendants.includes(index)
                            ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-gray-800"
                            : "bg-gray-700 text-white hover:bg-gray-600"
                        }`}
                      >
                        {/* Show pendant design as background if it has one */}
                        {cable.design && (
                          <div className="absolute inset-0 opacity-30">
                            <Image
                              src={
                                getImageSrc(cable.design) ||
                                `/images/configOptions/2.png`
                              }
                              alt={cable.design}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <span className="relative z-10">{index + 1}</span>
                      </div>
                    </motion.div>
                  )
                )
              )
            : pendants.map((pendant, index) => (
                <motion.div
                  key={index}
                  className="flex-shrink-0 cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => togglePendantSelection(index)}
                  style={{ userSelect: "none" }}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all overflow-hidden relative ${
                      selectedPendants.includes(index)
                        ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-gray-800"
                        : "bg-gray-700 text-white hover:bg-gray-600"
                    }`}
                  >
                    {/* Show pendant design as background if it has one */}
                    {pendant.design && (
                      <div className="absolute inset-0 opacity-30">
                        <Image
                          src={
                            getImageSrc(pendant.design) ||
                            `/images/configOptions/2.png`
                          }
                          alt={pendant.design}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <span className="relative z-10">{index + 1}</span>
                  </div>
                </motion.div>
              ))}
        </div>

        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
          <button
            onClick={() => scrollCarousel("right")}
            className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition-colors"
          >
            <FaChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
