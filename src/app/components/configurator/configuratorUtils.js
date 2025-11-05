import { getSystemAssignments, getSystemAssignmentsSync, findSystemAssignmentByDesign, onDataRefresh } from "./pendantSystemData";
import { useState, useEffect } from "react";
import { store } from '../../redux/store';
import { useBarState } from '../../hooks/useBarState';
// ============================================================================
// REACT HOOKS FOR SYSTEM ASSIGNMENTS
// ============================================================================

/**
 * React hook to manage system assignments with automatic updates
 * @returns {Object} { systemAssignments, isLoading, findByDesign }
 */
export const useSystemAssignments = () => {
  const [systemAssignments, setSystemAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial load
    const loadInitialData = async () => {
      try {
        const assignments = await getSystemAssignments();
        setSystemAssignments(assignments);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading system assignments:', error);
        setIsLoading(false);
      }
    };

    // Subscribe to data refresh events
    const unsubscribe = onDataRefresh((newData) => {
      const visibleAssignments = newData.filter(item => item.isShow === true);
      setSystemAssignments(visibleAssignments);
    });

    loadInitialData();

    return unsubscribe;
  }, []);

  // Helper function to find assignment by design name
  const findByDesign = (designName) => {
    return systemAssignments.find((a) => a.design === designName);
  };

  return {
    systemAssignments,
    isLoading,
    findByDesign
  };
};

// ============================================================================
// LOCAL STORAGE UTILITIES
// ============================================================================

/**
 * Load data from localStorage with error handling
 * @param {string} key - The localStorage key
 * @param {*} defaultValue - Default value if key doesn't exist or error occurs
 * @returns {*} The parsed value or default value
 */
export const loadFromLocalStorage = (key, defaultValue) => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error("Error reading from localStorage", error);
    return defaultValue;
  }
};

/**
 * Save data to localStorage with error handling
 * @param {string} key - The localStorage key
 * @param {*} value - The value to save
 */
export const saveToLocalStorage = (key, value) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error writing to localStorage", error);
  }
};

// ============================================================================
// DEFAULT PENDANT ASSIGNMENTS
// ============================================================================

/**
 * Get default pendant assignments for a given light amount
 * @param {number} amount - Number of lights (1, 3, or 6)
 * @returns {Array} Array of pendant configurations
 */
export const getDefaultPendantAssignments = (amount) => {
  const baseConfig = {
    systemType: "",
    design: "piko",
    isSystem: false,
    message: "product_5",
    hasGlass: false,
    hasSilver: false,
    hasGold: true,
    modelUrl:
      "https://dev.api1.limitless-lighting.co.uk/configurator_dynamic/models/model_1756460850615.glb",
  };

  switch (amount) {
    case 1:
      return [{ ...baseConfig, id: 0 }];
    case 3:
      return [
        { ...baseConfig, id: 0 },
        { ...baseConfig, id: 1 },
        { ...baseConfig, id: 2 },
      ];
    case 6:
      return [
        { ...baseConfig, id: 0 },
        { ...baseConfig, id: 1 },
        { ...baseConfig, id: 2 },
        { ...baseConfig, id: 3 },
        { ...baseConfig, id: 4 },
        { ...baseConfig, id: 5 },
      ];
    default:
      return [{ ...baseConfig, id: 0 }];
  }
};

/**
 * Get default system assignments for a given light amount
 * @param {number} amount - Number of lights
 * @returns {Array} Array of system configurations
 */
export const getDefaultSystemAssignments = (amount) => {
  // This function should be implemented based on your system assignment logic
  // For now, returning a basic structure
  return Array.from({ length: amount }, (_, index) => ({
    id: index,
    systemType: "pendant",
    design: "piko",
    designId: "product_5",
  }));
};

/**
 * Get default designs for a given light amount
 * @param {number} amount - Number of lights
 * @returns {Array} Array of design configurations
 */
export const getDefaultDesigns = (amount) => {
  return Array.from({ length: amount }, () => ({ design: "piko" }));
};

// ============================================================================
// PLAYCANVAS MESSAGING UTILITIES
// ============================================================================

/**
 * Send a message to the PlayCanvas iframe
 * @param {string} message - The message to send
 */
export const sendMessageToPlayCanvas = (message) => {
 console.log("Sending message to PlayCanvas iframe:", message);
  const iframe = document.getElementById("playcanvas-app");
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage(message, "*");
  }
};

/**
 * Send all messages for a specific design to PlayCanvas
 * @param {string} designName - The design name
 * @param {number|Array} idOrIds - Single ID or array of IDs
 */
let wasChandelier = false;
export const sendMessagesForDesign = (designName, idOrIds) => {
  const assignment = findSystemAssignmentByDesign(designName);
  if (!assignment) return;

  // Track previous systemType to control message sending

  // Get the current bar state
 const barArray = store.getState().bar.barArray || [];

  // Helper to send all messages for a single id
  const sendAllMessages = (id) => {

    const barState = barArray[id] || {};
     if (barState.hasBarAttachment) {
      sendMessageToPlayCanvas(`cable_${id}`);
      sendMessageToPlayCanvas("bars");
      sendMessageToPlayCanvas("glass_none");
      sendMessageToPlayCanvas("color_gold");
      sendMessageToPlayCanvas("silver_none");
      sendMessageToPlayCanvas(
        "product_https://dev.api1.limitless-lighting.co.uk/configurator_dynamic/models/Bar_1756732230450.glb"
      );
    }
    if (assignment.systemType === "bar") {
      sendMessageToPlayCanvas("barextra");
    }else{
      // sendMessageToPlayCanvas("Nobars");
    }
    sendMessageToPlayCanvas(`cable_${id}`);
    sendMessageToPlayCanvas(
      `glass_${assignment.hasGlass ? "attached" : "none"}`
    );
    sendMessageToPlayCanvas(`color_${assignment.hasGold ? "gold" : "none"}`);
    sendMessageToPlayCanvas(
      `silver_${assignment.hasSilver ? "attached" : "none"}`
    );
    sendMessageToPlayCanvas(`product_${assignment.media?.model?.url}`);
    sendMessageToPlayCanvas(`${assignment.message}`);

    // Updated logic for chandelier/unequal_cable
    if (assignment.systemType === "chandelier") {
      sendMessageToPlayCanvas(`chandelier_clearance`);
      sendMessageToPlayCanvas(`height_set`);
      wasChandelier = true;
    }else{
      if (wasChandelier) {
        sendMessageToPlayCanvas('unequal_cable');
        wasChandelier = false;
    }
    }
  };

  if (Array.isArray(idOrIds)) {
    idOrIds.forEach((id) => {
      sendAllMessages(id);
    });
    // Fire allmodelsloaded ONCE at the end
    sendMessageToPlayCanvas("allmodelsloaded");
  } else {
    sendAllMessages(idOrIds);
    // Fire allmodelsloaded after the single id
    sendMessageToPlayCanvas("allmodelsloaded");
  }
};

/**
 * Send messages for design on reload (single ID only)
 * @param {string} designName - The design name
 * @param {number} id - The cable ID
 */
export const sendMessagesForDesignOnReload = (designName, id) => {
  const assignment = findSystemAssignmentByDesign(designName);
  if (!assignment) return;
  // Helper to send all messages for a single id
  const sendAllMessages = (id) => {
    if (assignment.systemType === "bar") {
      sendMessageToPlayCanvas("barextra");
    }
      
    sendMessageToPlayCanvas(`cable_${id}`);
    sendMessageToPlayCanvas(
      `glass_${assignment.hasGlass ? "attached" : "none"}`
    );
    sendMessageToPlayCanvas(`color_${assignment.hasGold ? "gold" : "none"}`);
    sendMessageToPlayCanvas(
      `silver_${assignment.hasSilver ? "attached" : "none"}`
    );
    sendMessageToPlayCanvas(`product_${assignment.media?.model?.url}`);
    sendMessageToPlayCanvas(`${assignment.message}`);
    if (assignment.systemType === "chandelier") {
      sendMessageToPlayCanvas(`chandelier_clearance`);
      sendMessageToPlayCanvas(`height_set`);
      wasChandelier = true;
    }else{
      sendMessageToPlayCanvas('unequal_cable');
    }
  };
  sendAllMessages(id);
};

// ============================================================================
// CONFIGURATION UTILITIES
// ============================================================================

/**
 * Prepare configuration data for saving
 * @param {Object} config - Current configuration state
 * @param {Array} cables - Current cables state
 * @returns {Object} Formatted configuration for saving
 */
export const prepareConfigForSave = (config, cables) => {
  const configSummary = {
    light_type: config.lightType,
    light_amount: config.lightAmount,
    base_color: config.baseColor,
    cables: cables,
    shades: config.shades || {},
  };

  // Only include base_type for ceiling lights
  if (config.lightType === "ceiling") {
    configSummary.base_type = config.baseType;
  }

  return configSummary;
};

/**
 * Create iframe messages array for API payload
 * @param {Object} config - Current configuration state
 * @param {Object} configToSave - Configuration being saved
 * @returns {Array} Array of iframe messages
 */
export const createIframeMessagesArray = (config, configToSave) => {
  const iframeMessagesArray = [];
  iframeMessagesArray.push(`light_type:${config.lightType}`);

  if (config.baseType) {
    iframeMessagesArray.push(`base_type:${config.baseType}`);
  }
  iframeMessagesArray.push(`light_amount:${config.lightAmount}`);

  if (configToSave.cables && Array.isArray(configToSave.cables)) {
    configToSave.cables.forEach((cable, i) => {
      if (cable.isSystem) {
        iframeMessagesArray.push(`system:${cable.systemType}`);
        iframeMessagesArray.push(`cable_${i}:${cable.designId}`);
      } else {
        iframeMessagesArray.push(`cable_${i}:${cable.designId}`);
      }
    });
  }

  if (config.baseColor) {
    iframeMessagesArray.push(`base_color:${config.baseColor}`);
  }
  if (config.connectorColor) {
    iframeMessagesArray.push(`connector_color:${config.connectorColor}`);
  }
  if (config.cableColor) {
    iframeMessagesArray.push(`cable_color:${config.baseColor}`);
  }
  if (configToSave.cable_length) {
    iframeMessagesArray.push(`cable_length:${configToSave.cable_length}`);
  }

  return iframeMessagesArray;
};

/**
 * Create UI-friendly configuration for display
 * @param {Object} config - Current configuration state
 * @param {Array} cables - Current cables state
 * @param {Object} configToSave - Configuration being saved
 * @returns {Object} UI-friendly configuration object
 */
export const createUIConfig = (config, cables, configToSave) => {
  const uiConfig = {
    light_type:
      config.lightType.charAt(0).toUpperCase() + config.lightType.slice(1),
    light_amount: config.lightAmount,
    cable_color: config.baseColor,
    connector_color: config.connectorColor,
    cables: {},
    cableConfig: cables,
  };

  if (config.baseType) {
    uiConfig.base_type =
      config.baseType.charAt(0).toUpperCase() + config.baseType.slice(1);
  }

  // Format cable information for UI display
  if (configToSave.cables && Array.isArray(configToSave.cables)) {
    configToSave.cables.forEach((cable, index) => {
      const cableNumber = index + 1;
      if (cable.isSystem) {
        // System cable
        const systemType = cable.systemType
          ? cable.systemType.charAt(0).toUpperCase() + cable.systemType.slice(1)
          : "Unknown";
        const design = cable.design
          ? cable.design.charAt(0).toUpperCase() + cable.design.slice(1)
          : "Unknown";
        uiConfig.cables[
          index
        ] = `Cable ${cableNumber}: {\n  System Type: ${systemType}\n  Base Design: ${design}\n}`;
      } else {
        // Pendant cable
        const design = cable.design
          ? cable.design.charAt(0).toUpperCase() + cable.design.slice(1)
          : "Unknown";
        uiConfig.cables[index] = `Cable ${cableNumber}: ${design}`;
      }
    });
  }

  return uiConfig;
};

/**
 * Create API payload for saving configuration
 * @param {string} configName - Name of the configuration
 * @param {string} thumbnail - Thumbnail URL
 * @param {string} modelId - Model ID
 * @param {Object} uiConfig - UI-friendly configuration
 * @param {string} userId - User ID
 * @param {Array} iframeMessagesArray - Array of iframe messages
 * @returns {Object} API payload object
 */
export const createAPIPayload = (
  configName,
  thumbnail,
  modelId,
  uiConfig,
  userId,
  iframeMessagesArray
) => {
  return {
    name: configName,
    thumbnail: {
      url: thumbnail,
      public_id: "",
    },
    config: {
      ...uiConfig,
      download_Id: modelId,
    },
    user_id: userId || "",
    iframe: iframeMessagesArray,
  };
};

// ============================================================================
// CABLE AND PENDANT UTILITIES
// ============================================================================

/**
 * Handle cable size change for selected cables
 * @param {string} size - New cable size
 * @param {Array} selectedCables - Array of selected cable indices
 * @param {Array} cables - Current cables array
 * @param {Function} setCables - State setter for cables
 */
export const handleCableSizeChange = (
  size,
  selectedCables,
  cables,
  setCables
) => {
  setCables((prev) => {
    const updated = [...prev];
    (selectedCables || []).forEach((idx) => {
      if (updated[idx]) updated[idx] = { ...updated[idx], size };
    });
    return updated;
  });

  // Send a message for each selected cable
  (selectedCables || []).forEach((idx) => {
    sendMessageToPlayCanvas(`cable_${idx}:size_${size}`);
  });
};

/**
 * Process selected cable message and return unique ordered indices
 * @param {string} message - Cable message from iframe
 * @returns {Array} Array of unique cable indices
 */
export const processSelectedCableMessage = (message) => {
  // Remove the prefix and trailing semicolon, then split by any non-digit character
  let valuesString = message
    .replace(/^selectedcable:/i, "")
    .replace(/;/g, "")
    .trim();

  // Split on any non-digit (comma, period, space, etc.), filter out empty strings
  const parts = valuesString.split(/[^0-9]+/).filter(Boolean);

  // Convert to integers, de-duplicate while preserving order
  const seen = new Set();
  const uniqueOrdered = parts
    .map((m) => parseInt(m, 10))
    .filter((n) => !Number.isNaN(n) && !seen.has(n) && seen.add(n));

  return uniqueOrdered;
};

/**
 * Handle shade selection for pendants
 * @param {string} designId - Design ID
 * @param {string} shadeId - Shade ID
 * @param {string} systemType - System type
 * @param {number} shadeIndex - Shade index
 * @param {Array} selectedPendants - Selected pendant indices
 * @param {Function} setCables - State setter for cables
 */
export const handleShadeSelect = (
  designId,
  shadeId,
  systemType,
  shadeIndex,
  selectedPendants,
  setCables
) => {
  setCables((prev) => {
    const updated = [...prev];
    (selectedPendants || []).forEach((idx) => {
      if (updated[idx]) {
        updated[idx] = {
          ...updated[idx],
          design: `${designId} (${shadeId})`,
          designId: `system_base_${designId}_${shadeIndex + 1}`,
        };
      }
    });
    return updated;
  });

  (selectedPendants || []).forEach((idx) => {
    sendMessageToPlayCanvas(
      `cable_${idx}:system_base_${designId}_${shadeIndex + 1}`
    );
  });
};

// ============================================================================
// LIGHT TYPE AND AMOUNT UTILITIES
// ============================================================================

/**
 * Get new light amount and pendants based on light type change
 * @param {string} type - New light type
 * @param {Object} config - Current configuration
 * @param {number} lastCeilingLightAmount - Last ceiling light amount
 * @returns {Object} Object with newAmount and newPendants
 */
export const getLightTypeChangeData = (
  type,
  config,
  lastCeilingLightAmount
) => {
  let newAmount = config.lightAmount;
  let newPendants = [];

  if (type === "wall") {
    newAmount = 1;
    newPendants = getDefaultPendantAssignments(1);
  } else if (type === "floor") {
    newAmount = 3;
    newPendants = getDefaultPendantAssignments(3);
  } else if (type === "ceiling") {
    // Restore last ceiling light amount when switching back to ceiling
    if (config.baseType === "rectangular") {
      newAmount = 3;
    } else {
      newAmount = lastCeilingLightAmount;
    }
    newPendants = getDefaultPendantAssignments(newAmount);
  }

  return { newAmount, newPendants };
};

/**
 * Filter selected pendants to only include valid indices for new amount
 * @param {Array} selectedPendants - Current selected pendants
 * @param {number} amount - New light amount
 * @returns {Array} Filtered selected pendants
 */
export const filterSelectedPendants = (selectedPendants, amount) => {
  return selectedPendants
    ? selectedPendants.filter((index) => index < amount)
    : [];
};

// ============================================================================
// DIMENSION UTILITIES
// ============================================================================

/**
 * Update container dimensions from a DOM element
 * @param {HTMLElement} containerRef - Container element reference
 * @returns {Object} Dimensions object with width, height, top, left
 */
export const updateContainerDimensions = (containerRef) => {
  if (containerRef.current) {
    const rect = containerRef.current.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
    };
  }
  return { width: 0, height: 0, top: 0, left: 0 };
};
