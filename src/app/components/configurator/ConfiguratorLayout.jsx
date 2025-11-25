"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VerticalNavBar from "./VerticalNavBar";
import HorizontalOptionsBar from "./HorizontalOptionsBar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PlayCanvasViewer from "../PlayCanvasViewer";
import { ConfigurationTypeSelector } from "./navComponents/ConfigurationTypeSelector";
import { Breadcrumb } from "./navComponents/Breadcrumb";
import { PreviewControls } from "./PreviewControls";
import { SaveConfigModal } from "./SaveConfigModal";
import { LoadConfigModal } from "./LoadConfigModal";
import BaseColorPanel from "./navComponents/BaseColorPanel";
import { useSelector, useDispatch } from "react-redux";
import { saveConfiguration } from "../../../app/redux/slices/userSlice.js";
import { useRouter, useSearchParams } from "next/navigation";
import ConfigurationSummary from "../lightConfigurator/ConfigurationSummary";
import { fetchUserByToken } from "../../../app/redux/slices/userSlice.js";
import { useBarState } from "../../hooks/useBarState";
import { buildApi1Url } from "../../config/api.config";
import {
  chandelierAssignments,
  getSystemAssignments,
  getSystemAssignmentsSync,
  findSystemAssignmentByDesign,
  getMountDataSync,
} from "./pendantSystemData";
import {
  listenForCableMessages,
  listenForSelectedCableMessages,
  listenForMouseOutMessages,
  listenForMouseOverMessages,
  listenForOffconfigMessages,
} from "../../util/iframeCableMessageHandler";
import { listenForWallbaseColorMessages } from "../../util/iframeCableMessageHandler";
import {
  loadFromLocalStorage,
  saveToLocalStorage,
  getDefaultPendantAssignments,
  getDefaultSystemAssignments,
  getDefaultDesigns,
  sendMessageToPlayCanvas,
  sendMessagesForDesign,
  sendMessagesForDesignOnReload,
  prepareConfigForSave,
  createIframeMessagesArray,
  createUIConfig,
  createAPIPayload,
  handleCableSizeChange,
  processSelectedCableMessage,
  handleShadeSelect,
  getLightTypeChangeData,
  filterSelectedPendants,
  updateContainerDimensions,
  useSystemAssignments,
  handleColorPicker,
} from "./configuratorUtils";

const ConfiguratorLayout = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isLoggedIn, user } = useSelector((state) => state.user);
  const searchParams = useSearchParams();
  const { barArray, setBarState, initializeBarArray } = useBarState();
  // Version constant to track localStorage schema changes
  const STORAGE_VERSION = "1.6.0";

  // Clear old localStorage data if version doesn't match
  useEffect(() => {
    const currentVersion = localStorage.getItem("limiConfigVersion");

    if (currentVersion !== STORAGE_VERSION) {
      // Clear old localStorage data
      localStorage.removeItem("lightConfig");
      localStorage.removeItem("lightCables");

      // Save default configuration values
      const defaultConfig = {
        lightType: "ceiling",
        environment: "noScene",
        baseType: "round",
        configurationType: "pendant",
        lightAmount: 1,
        baseColor: "black",
        mountUrl:
          "https://dev.api1.limitless-lighting.co.uk/configurator_dynamic/models/singleCeiling_1761213647054.glb",
        selectedPendants: [],
        hotspot: "off",
        shades: {},
        lighting: true,
        colorTemperature: 50,
        brightness: 50,
      };

      const defaultCables = [
        {
          design: "ico",
          connectorColor: "black",
          cableSize: "2mm",
          cableColor: "black",
        },
      ];

      localStorage.setItem("lightConfig", JSON.stringify(defaultConfig));
      localStorage.setItem("lightCables", JSON.stringify(defaultCables));

      // Update state with default values
      setConfig(defaultConfig);
      setCables(defaultCables);
      setBrightness(50);
      setColorTemperature(50);

      // Set new version
      localStorage.setItem("limiConfigVersion", STORAGE_VERSION);
    }
  }, []);

  // State for loading configuration from URL
  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(false);
  const [configFromUrl, setConfigFromUrl] = useState(null);
  const [hasConfigIdParam, setHasConfigIdParam] = useState(false);
  const [localSavedConfig, setLocalSavedConfig] = useState({});
  const [localSavedCables, setLocalSavedCables] = useState({});
  const [selectedCableIndices, setSelectedCableIndices] = useState([]);
  const [cableMessage, setCableMessage] = useState("");
  const [isLightingPanelOpen, setIsLightingPanelOpen] = useState(false);
  const [showPendantLoadingScreen, setShowPendantLoadingScreen] =
    useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [userConfigurations, setUserConfigurations] = useState([]);
  const [userConfigurationsLoading, setUserConfigurationsLoading] =
    useState(false);
  const [userConfigurationsError, setUserConfigurationsError] =
    useState(null);

  const fetchUserConfigurations = useCallback(async () => {
    if (!isLoggedIn || !user?.data?._id) {
      setUserConfigurations([]);
      return;
    }

    setUserConfigurationsLoading(true);
    setUserConfigurationsError(null);

    try {
      const response = await fetch(
        buildApi1Url("/admin/products/users/light-configs"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.data._id }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch configurations");
      }

      const data = await response.json();
      setUserConfigurations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching user configurations:", error);
      setUserConfigurationsError(
        "Failed to load configurations. Please try again."
      );
    } finally {
      setUserConfigurationsLoading(false);
    }
  }, [isLoggedIn, user?.data?._id]);

  useEffect(() => {
    if (isLoggedIn && user?.data?._id) {
      fetchUserConfigurations();
    }
  }, [isLoggedIn, user?.data?._id, fetchUserConfigurations]);

  // Debug loading screen state changes
  useEffect(() => {
    console.log(
      "🔄 ConfiguratorLayout - showLoadingScreen changed:",
      showLoadingScreen
    );
  }, [showLoadingScreen]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {}, [barArray]);
  // Use system assignments hook for optimized data access
  const {
    systemAssignments: hookSystemAssignments,
    isLoading: systemAssignmentsLoading,
    findByDesign,
  } = useSystemAssignments();

  const handleOpenSaveModal = () => {
    setConfiguringType("save");
    setShowConfigurationTypeSelector(false);
  };
  const iframe = document.getElementById("playcanvas-app");
  // Main configuration state - load from localStorage or use defaults
  const [config, setConfig] = useState(() => {
    const savedConfig = loadFromLocalStorage("lightConfig", {
      lightType: "ceiling",
      environment: "noScene",
      baseType: "round",
      configurationType: "pendant",
      lightAmount: 1,
      baseColor: "black",
      selectedPendants: [],
      hotspot: "off",
      shades: {},
      lighting: true,
      mountUrl:
        "https://dev.api1.limitless-lighting.co.uk/configurator_dynamic/models/singleCeiling_1761213647054.glb",
      colorTemperature: 50,
      brightness: 50,
    });
    return savedConfig;
  });
  // Cables state with localStorage persistence
  const [cables, setCables] = useState(() => {
    return loadFromLocalStorage("lightCables", [
      {
        design: "ico",
        connectorColor: "black",
        cableSize: "2mm",
        cableColor: "black",
      },
    ]);
  });

  const [brightness, setBrightness] = useState(config.brightness ?? 50);
  const [colorTemperature, setColorTemperature] = useState(
    config.colorTemperature ?? 50
  );
  const [lighting, setLighting] = useState(
    typeof config.lighting === "boolean" ? config.lighting : true
  );

  useEffect(() => {
    setConfig((prev) => ({
      ...prev,
      brightness,
      colorTemperature,
      lighting,
    }));
  }, [brightness, colorTemperature, lighting]);

  // Save to localStorage whenever config or cables change
  useEffect(() => {
    saveToLocalStorage("lightConfig", config);
    saveToLocalStorage("lightCables", cables);
  }, [config, cables]);

  // useEffect(() => {
  //   // Set up cable message listener
  //   const cleanup = listenForCableMessages((message, event) => {
  //     // Do something with the message, e.g. open UI, update state, etc.
  //     setCableMessage(message);
  //   });
  //fdsafds
  //   return cleanup;
  // }, []);

  useEffect(() => {
    // Set up cable message listener
    const cleanup = listenForOffconfigMessages((message, event) => {
      setCableMessage(message);
    });
    return cleanup;
  }, []);

  // Handler for cable size change
  const handleCableSizeChangeLocal = (size, selectedCables) => {
    handleCableSizeChange(size, selectedCables, cables, setCables);
  };

  // Handler for selected cable messages
  useEffect(() => {
    const cleanup = listenForSelectedCableMessages((message) => {
      const uniqueOrdered = processSelectedCableMessage(message);

      // Save to state
      setConfig((prev) => ({
        ...prev,
        selectedPendants: uniqueOrdered,
      }));
    });
    return cleanup;
  }, []);

  // Handler for shade selection
  const handleShadeSelectLocal = (
    designId,
    shadeId,
    systemType,
    shadeIndex
  ) => {
    handleShadeSelect(
      designId,
      shadeId,
      systemType,
      shadeIndex,
      config,
      setConfig,
      sendMessageToPlayCanvas
    );
  };

  // Handle chandelier
  const handleChandelierTypeChange = (designName) => {
    setCables([
      { design: designName },
      { design: designName },
      { design: designName },
    ]);
    sendMessagesForDesign(designName, 0);
  };

  // Preview mode state
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Modal states
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [configToSave, setConfigToSave] = useState(null);

  // State for saving light amounts
  const [lastCeilingLightAmount, setLastCeilingLightAmount] = useState(1);
  const [lastRoundBaseLightAmount, setLastRoundBaseLightAmount] = useState(1);

  // State for individual configuration
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [configuringType, setConfiguringType] = useState(null); // 'pendant' or 'system'
  const [configuringSystemType, setConfiguringSystemType] = useState(null); // 'bar', 'ball', 'universal'
  const [breadcrumbPath, setBreadcrumbPath] = useState([]);
  const [currentShade, setCurrentShade] = useState(null); // Currently selected shade
  const [showConfigurationTypeSelector, setShowConfigurationTypeSelector] =
    useState(false);
  // Navigation state
  const [activeStep, setActiveStep] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const handleCloseSaveModal = () => {
    setConfiguringType(null);
    setShowConfigurationTypeSelector(true);
  };

  // Initialize pendants when component mounts
  useEffect(() => {
    // Check if we have a configId in the URL
    if (hasConfigIdParam) return;

    // Only initialize with defaults if we don't have saved state
    const savedConfig = loadFromLocalStorage("lightConfig", null);
    const savedCables = loadFromLocalStorage("lightCables", null);
    setLocalSavedConfig(savedConfig);
    setLocalSavedCables(savedCables);
    if (!savedConfig || !savedCables) {
      const initialPendants = getDefaultPendantAssignments(config.lightAmount);
      const initialSystems = getDefaultSystemAssignments(config.lightAmount);
      const system = getDefaultDesigns(config.lightAmount);

      setConfig((prev) => ({
        ...prev,
        pendants: initialPendants,
        systemConfigurations: initialSystems,
      }));

      setCables((prev) => [
        ...prev,
        {
          design: system.design,
        },
      ]);

      setLastCeilingLightAmount(config.lightAmount);
      setLastRoundBaseLightAmount(config.lightAmount);

      // Send initial messages to PlayCanvas
      if (playCanvasReadyRef.current) {
        // sendMessageToPlayCanvas(`light_type:${config.lightType}`);
        // sendMessageToPlayCanvas(`base_type:${config.baseType}`);
        // sendMessageToPlayCanvas(`light_amount:${config.lightAmount}`);

        // Send pendant messages
        initialSystems.forEach((system, index) => {
          setCables((prev) => [
            ...prev,
            {
              isSystem: false,
              systemType: system.systemType,
              design: system.design,
              designId: system.designId,
              connectorColor: "black",
            },
          ]);
          // sendMessageToPlayCanvas(`system:${system.systemType}`);
          // sendMessageToPlayCanvas(`cable_${index}:${system.designId}`);
        });
      }
    } else {
      // sendMessageToPlayCanvas(`light_type:${savedConfig.lightType}`);
      // sendMessageToPlayCanvas(`light_amount:${savedConfig.lightAmount}`);
      // sendMessageToPlayCanvas(`base_type:${savedConfig.baseType}`);
      // savedCables.forEach((cable, index) => {
      //   if (cable.systemType) {
      //     setTimeout(() => sendMessagesForDesign(cable.design, index), 700 + (index * 140));
      //   }
      // });
    }
  }, [hasConfigIdParam]);

  // Listen for app:ready1 message from PlayCanvas iframe
  const handleLoadSpecificConfig = (configData) => {
    try {
      // Input validation
      if (!configData?.config) {
        console.error('Invalid configuration data: missing config object');
        return;
      }

      const { config } = configData;
      
      // Normalize property names (handle both camelCase and snake_case)
      const lightType = (config.lightType || config.light_type || '').toLowerCase();
      const baseType = (config.baseType || config.base_type || 'round').toLowerCase();
      const lightAmount = config.lightAmount || config.light_amount || 1;
      const baseColor = config.baseColor || config.base_color || 'black';
      const brightness = config.brightness || 75;
      const colorTemperature = config.colorTemperature || 50;
      const lighting = config.lighting ?? true;
      const cableConfig = config.cableConfig || [];

      // Find matching mount
      const mounts = getMountDataSync();
      let matchingMount;

      if (lightType === 'ceiling') {
        const ceilingMounts = mounts.filter(
          mount => mount.mountLightType === lightType
        );

        if (baseType === 'round' || baseType === 'rectangular') {
          matchingMount = ceilingMounts.find(
            mount =>
              mount.mountCableNumber === lightAmount &&
              mount.mountBaseType === baseType
          );
        }
      } else {
        matchingMount = mounts.find(mount => mount.mountLightType === lightType);
      }
      sendMessageToPlayCanvas(`light_type:${lightType}`);
      sendMessageToPlayCanvas(`base_type:${baseType}`);
      sendMessageToPlayCanvas(`light_amount:${lightAmount}`);
      sendMessageToPlayCanvas(`mount_model:${matchingMount.modelUrl}`);

      console.log('Matching mount found:', matchingMount);

      // Process cable configurations if they exist
      if (Array.isArray(cableConfig) && cableConfig.length > 0) {
        const designToIndices = cableConfig.reduce((acc, cable, index) => {
          if (cable?.design) {
            acc[cable.design] = acc[cable.design] || [];
            acc[cable.design].push(index);
          }
          return acc;
        }, {});

        // Send messages for each unique design
        Object.entries(designToIndices).forEach(([design, indices]) => {
          try {
            sendMessagesForDesign(design, indices.length === 1 ? indices[0] : indices);
          } catch (error) {
            console.error(`Error sending messages for design ${design}:`, error);
          }
        });
      }

      // Update state in a single batch
      setConfig(prev => ({
        ...prev,
        lightType,
        baseType,
        lightAmount,
        baseColor,
        brightness,
        colorTemperature,
        lighting,
        // Update mount URL if matching mount is found
        ...(matchingMount?.mountUrl && { mountUrl: matchingMount.mountUrl })
      }));

      // Only update cables if we have a valid config
      if (Array.isArray(cableConfig)) {
        setCables(cableConfig);
      }

    } catch (error) {
      console.error('Error in handleLoadSpecificConfig:', error);
      // Uncomment to show error to user
      // toast.error('Failed to load configuration. Please try again.');
    }
  };
  useEffect(() => {
    const handleMessageLoad = (event) => {
      if (event.data === "loadingOffMount") {
        setIsLoading(false);
      }
    };
    window.addEventListener("message", handleMessageLoad);
    return () => window.removeEventListener("message", handleMessageLoad);
  }, []);
  // Listen for app:ready1 message from PlayCanvas iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === "app:ready1") {
        playCanvasReadyRef.current = true;

        // Load saved configuration if available
        const savedConfig = loadFromLocalStorage("lightConfig", null);

        const savedCables = loadFromLocalStorage("lightCables", null);
        if (savedConfig && savedCables) {
          // Use synchronous system assignments access
          const systemAssignments = getSystemAssignmentsSync();

          // Send messages with incremental delays
          // sendMessageToPlayCanvas(`light_type:ceiling`),
          //   sendMessageToPlayCanvas(`base_type:round`),
          //   sendMessageToPlayCanvas(`light_amount:1`),
          //   sendMessageToPlayCanvas(`base_color:black`),
          sendMessageToPlayCanvas(`light_type:${savedConfig.lightType}`),
            sendMessageToPlayCanvas(`base_type:${savedConfig.baseType}`),
            sendMessageToPlayCanvas(`light_amount:${savedConfig.lightAmount}`),
            sendMessageToPlayCanvas(`mount_model:${savedConfig.mountUrl}`);
          // sendMessageToPlayCanvas(`light_amount:${savedConfig.lightAmount}`),

          // sendMessageToPlayCanvas(
          //   `lighting:${savedConfig.lighting ? "on" : "off"}`
          // );

          sendMessageToPlayCanvas(`brightness:31`),
            sendMessageToPlayCanvas("colorTemperature:5000 ");
          setBrightness(31);
          setColorTemperature(5000);
          sendMessageToPlayCanvas(`base_color:${savedConfig.baseColor}`);
          savedCables.forEach((cable, index) => {
            const system = systemAssignments.find(
              (a) => a.design === cable.design
            );
            const hasBarSystem = system?.systemType === "bar";

            if (hasBarSystem) {
              sendMessageToPlayCanvas(`cable_${index}`);
              sendMessageToPlayCanvas("bars");
              sendMessageToPlayCanvas("glass_none");
              sendMessageToPlayCanvas("color_gold");
              sendMessageToPlayCanvas("silver_none");
              sendMessageToPlayCanvas(
                "product_https://dev.api1.limitless-lighting.co.uk/configurator_dynamic/models/Bar_1756732230450.glb"
              );
            }
          });

          savedCables.forEach((cable, index) => {
            const design = systemAssignments.find(
              (a) => a.design === cable.design
            );
            if (design?.systemType === "chandelier") {
              sendMessagesForDesignOnReload(cable.design, 0);
            } else {
              sendMessagesForDesignOnReload(cable.design, index);
            }
          });

          sendMessageToPlayCanvas("allmodelsloaded");
          // sendMessagesForDesign("fina", 0);
          // Send lighting messages with delays
          // sendMessageToPlayCanvas(`guidedtourstarted`);
        }

        // If we have a configuration from URL, load it now
        if (configFromUrl) {
          handleLoadSpecificConfig(configFromUrl);
          setIsLoadingFromUrl(false);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [configFromUrl, handleLoadSpecificConfig]); // Added handleLoadSpecificConfig to dependencies

  // Handle light type change
  // Handle light type change
  const handleLightTypeChange = (type) => {
    // Save current ceiling light amount if switching from ceiling
    if (config.lightType === "ceiling" && type !== "ceiling") {
      setLastCeilingLightAmount(config.lightAmount);
    }
    const mounts = getMountDataSync();

    // Search through each mount object for matching light type
    let matchingMount;
    if (type === "ceiling") {
      // For ceiling type, find all matching mounts and filter based on baseTyp

      if (config.baseType === "round") {
        const ceilingMounts = mounts.filter(
          (mount) => mount.mountLightType === type
        );

        matchingMount = ceilingMounts.find(
          (mount) =>
            mount.mountCableNumber === lastCeilingLightAmount &&
            mount.mountBaseType === "round"
        );
      } else if (config.baseType === "rectangular") {
        const ceilingMounts = mounts.filter(
          (mount) => mount.mountLightType === type
        );
        matchingMount = ceilingMounts.find(
          (mount) =>
            mount.mountCableNumber === lastCeilingLightAmount &&
            mount.mountBaseType === "rectangular"
        );
      }
    } else {
      // For other types, use the original logic
      matchingMount = mounts.find((mount) => {
        return mount.mountLightType === type;
      });
    }
    // Get new amount and pendants using utility function
    const { newAmount, newPendants } = getLightTypeChangeData(
      type,
      config,
      lastCeilingLightAmount
    );

    if (matchingMount && (matchingMount.mountModel || matchingMount.modelUrl)) {
      const modelUrl = matchingMount.modelUrl || matchingMount.mountModel;

      // Send light type message
      sendMessageToPlayCanvas(`light_type:${type}`);
      if (type === "ceiling") {
        sendMessageToPlayCanvas(`base_type:${config.baseType}`);
      }
      sendMessageToPlayCanvas(`light_amount:${newAmount}`);
      sendMessageToPlayCanvas(`mount_model:${modelUrl}`);
      sendMessageToPlayCanvas(`scene:0`);

      setConfig((prev) => ({
        ...prev,
        mountUrl: modelUrl,
      }));
    }
    setConfig((prev) => ({
      ...prev,
      lightType: type,
      lightAmount: newAmount,
      pendants: newPendants,
    }));
    setCables([]);
    newPendants.forEach((pendant, index) => {
      setCables((prev) => [
        ...prev,
        {
          design: pendant.design,
        },
      ]);
    });

    newPendants.forEach((pendant, index) => {
      sendMessagesForDesign(pendant.design, index);
    });
  };

  // Handle configuration type change
  const handleConfigurationTypeChange = useCallback((type) => {
    setConfig((prev) => {
      const newConfig = { ...prev, configurationType: type };
      return newConfig;
    });
  }, []);

  // Handle light amount change
  const handleLightAmountChange = (amount, baseTypeOverride) => {
    const baseType = baseTypeOverride || config.baseType;
    console.log("amountss", amount, baseType);
    // Update the appropriate saved light amount based on current configuration
    if (config.lightType === "ceiling") {
      setLastCeilingLightAmount(amount);
    }
    if (baseType === "round") {
      setLastRoundBaseLightAmount(amount);
    }

    // Use deterministic default pendants and systems for the new amount
    const newSystems = getDefaultDesigns(amount);

    // Filter selectedPendants to only include valid indices for the new amount
    const filteredSelectedPendants = filterSelectedPendants(
      config.selectedPendants,
      amount
    );

    setConfig((prev) => ({
      ...prev,
      lightAmount: amount,
      selectedPendants: filteredSelectedPendants, // Update selectedPendants state
    }));
    setCables(
      newSystems.map((system, idx) => ({
        design: system.design,
      }))
    );

    // Send messages to iframe
    // Get mount data and send mount model if available
    const mounts = getMountDataSync();

    // First filter by lightType, then by cable number
    const matchingMount = mounts
      .filter((mount) => mount.mountBaseType === baseType)
      .find((mount) => {
        return Number(amount) === Number(mount.mountCableNumber);
      });

    sendMessageToPlayCanvas(`light_amount:${amount}`);
    if (matchingMount && (matchingMount.mountModel || matchingMount.modelUrl)) {
      const modelUrl = matchingMount.modelUrl || matchingMount.mountModel;
      sendMessageToPlayCanvas(`mount_model:${modelUrl}`);
      setConfig((prev) => ({
        ...prev,
        mountUrl: modelUrl,
      }));
    }

    const designToIds = {};
    newSystems.forEach((system, idx) => {
      if (!designToIds[system.design]) designToIds[system.design] = [];
      designToIds[system.design].push(idx);
    });
    Object.entries(designToIds).forEach(([design, ids]) => {
      sendMessagesForDesign(design, ids);
    });
  };
 const handleHubTypeChange = (baseType,amount) => {
    console.log("amountss", amount);
    // Update the appropriate saved light amount based on current configuration
    if (config.lightType === "ceiling") {
      setLastCeilingLightAmount(amount);
    }
    if (config.baseType === "round") {
      setLastRoundBaseLightAmount(amount);
    }

    // Use deterministic default pendants and systems for the new amount
    const newSystems = getDefaultDesigns(amount);

    // Filter selectedPendants to only include valid indices for the new amount
    const filteredSelectedPendants = filterSelectedPendants(
      config.selectedPendants,
      amount
    );

    setConfig((prev) => ({
      ...prev,
      lightAmount: amount,
      selectedPendants: filteredSelectedPendants, // Update selectedPendants state
    }));
    setCables(
      newSystems.map((system, idx) => ({
        design: system.design,
      }))
    );

    // Send messages to iframe
    // Get mount data and send mount model if available
    const mounts = getMountDataSync();

    // First filter by lightType, then by cable number
    const matchingMount = mounts
      .filter((mount) => mount.mountBaseType === config.baseType)
      .find((mount) => {
        return Number(amount) === Number(mount.mountCableNumber);
      });
        sendMessageToPlayCanvas(`light_type:ceiling`);
    sendMessageToPlayCanvas(`base_type:${baseType}`);
    sendMessageToPlayCanvas(`light_amount:${amount}`);
    if (matchingMount && (matchingMount.mountModel || matchingMount.modelUrl)) {
      const modelUrl = matchingMount.modelUrl || matchingMount.mountModel;
      sendMessageToPlayCanvas(`mount_model:${modelUrl}`);
      setConfig((prev) => ({
        ...prev,
        mountUrl: modelUrl,
      }));
    }

    const designToIds = {};
    newSystems.forEach((system, idx) => {
      if (!designToIds[system.design]) designToIds[system.design] = [];
      designToIds[system.design].push(idx);
    });
    Object.entries(designToIds).forEach(([design, ids]) => {
      sendMessagesForDesign(design, ids);
    });
  };
  // Handle system type change
  const handleSystemTypeChange = (system) => {
    // Update the global system type
    const systemType =
      typeof system === "string" ? system : system?.systemType;

    setConfig((prev) => ({
      ...prev,
      systemType,
    }));

    setShowColorPicker(false);

    // Get the selected cable number(s)
    const selectedCables =
      config.selectedPendants && config.selectedPendants.length > 0
        ? config.selectedPendants
        : [0]; // Default to cable 0 if none selected

    // Update system type for each selected cable
    setConfig((prev) => {
      // Create or update the cableSystemTypes object
      const cableSystemTypes = { ...(prev.cableSystemTypes || {}) };

      // Update system type for each selected cable
      selectedCables.forEach((cableNo) => {
        cableSystemTypes[cableNo] =
          typeof system === "string"
            ? {
                ...(cableSystemTypes[cableNo] || {}),
                systemType,
              }
            : system;
      });

      return {
        ...prev,
        cableSystemTypes,
      };
    });

    // Send messages to iframe
    setTimeout(() => {
      // Send system type message to iframe
      // sendMessageToPlayCanvas(`system:${system}`);

      setShowTypeSelector(false);
    }, 10);
  };

  // Handle location selection for individual configuration
  const handleLocationSelection = (locationId) => {
    setSelectedLocation(locationId);
    setShowTypeSelector(true);
  };

  // Handle configuration type selection from the floating selector
  const handleConfigTypeSelection = (type) => {
    setConfiguringType(type);
    setShowTypeSelector(false);

    // Reset system type when selecting configuration type
    if (type === "system" || type === null) {
      setConfiguringSystemType(null);
      setBreadcrumbPath([]);
    }

    if (type === "pendant") {
      setBreadcrumbPath([
        { id: "configurePendant", label: "Configure Pendant" },
      ]);
    } else if (type === "system") {
      setBreadcrumbPath([{ id: "system", label: "System" }]);
      // Don't set a default system type - let user choose
    }
  };

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigation = (level) => {
    if (level === "home") {
      // Reset to cable locations view
      setConfiguringType(null);
      setConfiguringSystemType(null);
      setBreadcrumbPath([]);
      setSelectedLocation(null);
    } else if (level === "system") {
      // Go back to system level
      setConfiguringSystemType(null);
      setBreadcrumbPath([{ id: "system", label: "System" }]);
    }
  };

  // Handle system type selection
  const handleIndividualSystemTypeSelection = (type) => {
    // If type is null, reset to system type selection
    if (type === null) {
      setConfiguringSystemType(null);
      setBreadcrumbPath([]);
      return;
    }

    setConfiguringSystemType(type);
    setBreadcrumbPath([
      { id: "system", label: "System" },
      { id: type, label: type?.charAt(0)?.toUpperCase() + type?.slice(1) },
    ]);

    // Call handleSystemTypeChange to update state and send message to iframe
    if (type) {
      handleSystemTypeChange(type);
    }
  };

  // Handle pendant design change
  const handlePendantDesignChange = useCallback(
    (pendantIds, design) => {
      if (!Array.isArray(pendantIds) || pendantIds.length == null) {
        pendantIds = [0];
      }

      // Check if any cable is assigned to a chandelier system
      const hasChandelier = cables.some((cable) => {
        const sys = findSystemAssignmentByDesign(cable.design);
        return sys && sys.systemType === "chandelier";
      });

      if (hasChandelier) {
        // For chandelier, set all three cables to the same design
        setCables([{ design }, { design }, { design }]);
        sendMessagesForDesign(design, [0, 1, 2]);
        return;
      }

      // Otherwise, update only the selected cables
      setCables((prev) => {
        const updatedCables = [...prev];
        pendantIds.forEach((id) => {
          if (id >= 0) {
            updatedCables[id] = { design };
          }
        });
        return updatedCables;
      });

      // Send messages for just the updated cables
      sendMessagesForDesign(
        design,
        pendantIds.length === 1 ? pendantIds[0] : pendantIds
      );
    },
    [cables, config.lightAmount]
  );

  useEffect(() => {
    setShowPendantLoadingScreen(true);
    const timer = setTimeout(() => {
      setShowPendantLoadingScreen(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [handlePendantDesignChange]);

  useEffect(() => {}, [showPendantLoadingScreen]);
  // Handle base type change
  const handleBaseTypeChange = useCallback((baseType) => {
    // Update config state
    setConfig((prev) => ({
      ...prev,
      lightAmount: baseType === "rectangular" ? 3 : 1,
      baseType: baseType,
    }));
    const design = "piko";
    const system = findSystemAssignmentByDesign(design);

    const mounts = getMountDataSync();

    // Search through each mount object for matching base type
    let matchingMount;
    const baseMounts = mounts.filter(
      (mount) => mount.mountBaseType === baseType
    );

    if (baseType === "round") {
      // For round base type, find mount with mountCableNumber == 1
      matchingMount = baseMounts.find((mount) => mount.mountCableNumber === 1);
    } else if (baseType === "rectangular") {
      // For rectangular base type, find mount with mountCableNumber == 3
      matchingMount = baseMounts.find((mount) => mount.mountCableNumber === 3);
    }

    if (matchingMount && (matchingMount.mountModel || matchingMount.modelUrl)) {
      const modelUrl = matchingMount.modelUrl || matchingMount.mountModel;
      sendMessageToPlayCanvas(`base_type:${baseType}`);
      sendMessageToPlayCanvas(
        `light_amount:${baseType === "rectangular" ? 3 : 1}`
      );
      sendMessageToPlayCanvas(`system:${system.systemType}`);
      sendMessageToPlayCanvas(`mount_model:${modelUrl}`);
      setConfig((prev) => ({
        ...prev,
        mountUrl: modelUrl,
      }));
    }
    // Send message to PlayCanvas iframe
    if (baseType === "rectangular") {
      // Use a loop for 3 pendants (IDs 0, 1, 2)
      [0, 1, 2].forEach((id) => {
        sendMessagesForDesign(design, id);
      });
      setCables([
        {
          design: system.design,
        },
        {
          design: system.design,
        },
        {
          design: system.design,
        },
      ]);
    } else {
      sendMessagesForDesign(design, 0);
      setCables([
        {
          design: system.design,
        },
      ]);
    }

    // Move to next step
    setActiveStep("baseColor");
  }, []);

  // Handle base color change
  const handleBaseColorChange = useCallback((baseColor) => {
    // Update config state
    setConfig((prev) => ({
      ...prev,
      baseColor,
    }));
    // Send message to PlayCanvas iframe
    sendMessageToPlayCanvas(`base_color:${baseColor}`);
    // Move to next step
    setActiveStep("systemType");
  }, []);

  // Handle environment change
  const handleEnvironmentChange = useCallback((environment) => {
    // Update config state
    setConfig((prev) => ({
      ...prev,
      environment,
    }));

    // Note: PlayCanvas message is sent directly from EnvironmentDropdown component
  }, []);

  const handleConnectorColorChange = useCallback(
    (connectorColor) => {
      // Send messages for each selected pendant
      // config.selectedPendants.forEach((idx) => {
      //   sendMessageToPlayCanvas('cable_' + idx + ':connector_color_' + connectorColor);
      // });
      sendMessageToPlayCanvas("connector_color:" + connectorColor);
      // Update cables state
      // setCables((prevCables) => {
      //   let updatedCables = [...prevCables];
      //   config.selectedPendants.forEach((idx) => {
      //     updatedCables[idx] = {
      //       ...updatedCables[idx],
      //       connectorColor: connectorColor
      //     };
      //   });
      //   return updatedCables;
      // });
    },
    [config.selectedPendants]
  );

  // Handle pendant selection
  const handlePendantSelection = useCallback((pendantIds) => {
    // Update config state with selected pendants
    setConfig((prev) => ({
      ...prev,
      selectedPendants: pendantIds,
    }));
  }, []);

  const handleSystemBaseDesignChange = useCallback(
    (design) => {
      // Update the system base design in the config
      setConfig((prev) => ({ ...prev, systemBaseDesign: design }));
      setCurrentShade(null);

      // Use synchronous system assignments access
      const systemAssignments = getSystemAssignmentsSync();

      // Find the system for this design
      const system = findSystemAssignmentByDesign(design);

      setShowColorPicker(system?.systemType === "ball");

      // Check if the system type is chandelier
      let hasChandelier = false;
      cables.forEach((cable) => {
        const system = findSystemAssignmentByDesign(cable.design);
        hasChandelier = system && system.systemType === "chandelier";
      });
      if (hasChandelier) {
        // For chandelier, only fire message for cable 0
        // Update cables design for chandelier
        setCables((prev) => {
          const updatedCables = [...prev];
          // Update cables 0, 1, 2 for chandelier
          [0, 1, 2].forEach((cableNo) => {
            if (cableNo >= 0) {
              updatedCables[cableNo] = {
                design: system?.design || design,
              };
            }
          });
          return updatedCables;
        });
        sendMessagesForDesign(design, [0, 1, 2]);
      } else {
        // Send message to PlayCanvas iframe (original logic for non-chandelier systems)

        // Get the selected cable number(s)
        const selectedCables =
          config.selectedPendants && config.selectedPendants.length > 0
            ? config.selectedPendants
            : [0]; // Default to cable 0 if none selected
        // Update all cables in a single state update
        setCables((prev) => {
          const updatedCables = [...prev];

          // Process each selected cable
          selectedCables.forEach((cableNo) => {
            // Update this specific cable
            if (cableNo >= 0) {
              updatedCables[cableNo] = {
                design: design,
              };
            }
          });
          return updatedCables;
        });
        if (system.systemType === "bar") {
          // For bar systems, update only the bar attachment state
          selectedCables.forEach((cableIndex) => {
            // Get current state first
            const currentState = barArray[cableIndex] || {};
            setBarState(cableIndex, {
              hasBarModel: currentState.hasBarModel || false, // Keep existing or default to false
              hasBarAttachment: true, // Only update this property
            });
          });
        } else {
          selectedCables.forEach((cableIndex) => {
            // Get current state first
            setBarState(cableIndex, {
              hasBarModel: false, // Keep existing or default to false
              hasBarAttachment: false, // Only update this property
            });
          });
        }
        // Send messages to iframe
        const designToIds = {};
        selectedCables.forEach((id) => {
          if (!designToIds[design]) designToIds[design] = [];
          designToIds[design].push(id);
        });

        Object.entries(designToIds).forEach(([design, ids]) => {
          sendMessagesForDesign(design, ids.length === 1 ? ids[0] : ids);
        });
      }
    },
    [
      config.selectedPendants,
      config.systemType,
      config.cableSystemTypes,
      cables,
    ]
  );

  // Handle shade selection

  // Save configuration function
  const handleSaveConfig = (configParam, cablesParam) => {
    // Check if user is logged in
    if (!isLoggedIn) {
      toast.info("Please log in to save your configuration");
      // Redirect to login page
      setTimeout(() => {
        router.push("/portal");
      }, 1500);
      return;
    }

    // User is logged in, prepare config and show save modal
    const configSummary = prepareConfigForSaveLocal();

    setConfigToSave(configSummary);
    setIsSaveModalOpen(true);
  };

  // Prepare configuration for saving using utility function
  const prepareConfigForSaveLocal = () => {
    return prepareConfigForSave(config, cables);
  };

  // Handle final save after user enters configuration name
  const handleFinalSave = async (configName, thumbnail, modelId) => {
    if (!configToSave) {
      return;
    }

    // Add name to the configuration
    const finalConfig = {
      ...configToSave,
      name: configName,
      date: new Date().toISOString(),
    };

    // Create iframe messages array and UI config using utility functions
    const iframeMessagesArray = createIframeMessagesArray(config, configToSave);
    const uiConfig = createUIConfig(config, cables, configToSave);

    // Prepare data for API
    const apiPayload = createAPIPayload(
      configName,
      thumbnail,
      modelId,
      uiConfig,
      user?.data?._id,
      iframeMessagesArray
    );

    try {
      // Get dashboardToken from localStorage
      const dashboardToken = localStorage.getItem("limiToken");

      // Take screenshot of the configurator area
      const configuratorElement = document.getElementById("playcanvas-app");

      // Log the API payload for debugging

      // Send data to backend API
      const response = await fetch(
        buildApi1Url("/admin/products/light-configs"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${dashboardToken}`, // Include token in authorization header
          },
          body: JSON.stringify(apiPayload),
        }
      );

      // Log the response status

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Save configuration to Redux store
      dispatch(saveConfiguration(finalConfig));

      // Refresh saved configurations list for header count and modal
      fetchUserConfigurations();

      // Close modal and show success toast
      setIsSaveModalOpen(false);
      toast.success("Configuration saved successfully");
    } catch (error) {
      // toast.error('Failed to save configuration. Please try again.');
      setIsSaveModalOpen(false);
    }
  };

  // Load configuration function
  const handleLoadConfig = () => {
    // Check if user is logged in
    if (!isLoggedIn) {
      toast.info("Please log in to load your saved configurations");
      // Redirect to login page
      setTimeout(() => {
        router.push("/portal");
      }, 1500);
      return;
    }

    // User is logged in, open the load configuration modal
    setIsLoadModalOpen(true);
  };

  // Handle loading a specific configuration

  // Container ref for PlayCanvas viewer
  const containerRef = useRef(null);

  // Ref for tracking if PlayCanvas is ready
  const playCanvasReadyRef = useRef(false);

  // Check for configId in URL parameters on initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");

    if (urlToken) {
      dispatch(fetchUserByToken(urlToken));
    }

    const configId = urlParams.get("configId");

    if (configId) {
      setHasConfigIdParam(true);
      setIsLoadingFromUrl(true);
      // Load configuration data but don't apply it yet - wait for app:ready1
      fetch(
        `https://api1.limitless-lighting.co.uk/admin/products/light-configs/${configId}`
      )
        .then((response) => response.json())
        .then((data) => {
          setConfigFromUrl(data);
          // Don't call handleLoadSpecificConfig yet - wait for app:ready1
          // Just keep the loading state active
        })
        .catch((error) => {
          setIsLoadingFromUrl(false);
          toast.error("Failed to load configuration");
        });
    }
  }, []);

  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
  });

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      const dimensions = updateContainerDimensions(containerRef);
      setContainerDimensions(dimensions);
    };

    // Initial update
    updateDimensions();

    // Add resize listener
    window.addEventListener("resize", updateDimensions);

    // Cleanup
    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full max-sm:h-[100vh] bg-transparent overflow-hidden"
    >
      {/* Loading overlay */}
      {/* {isLoadingFromUrl && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-[#1e1e1e] p-8 rounded-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
            <p className="text-white text-lg">Loading your configuration...</p>
          </div>
        </div>
      )} */}

      {/* 3D Viewer */}
      {mounted && (
        <div className="w-full h-full">
          <PlayCanvasViewer
            config={config}
            isDarkMode={true}
            className="w-full h-full"
            loadcanvas={isLoading}
            localSavedConfig={localSavedConfig}
            localSavedCables={localSavedCables}
          />
        </div>
      )}

      {/* Preview Controls - Always visible */}
      {!isLoading && (
        <PreviewControls
          isPreviewMode={isPreviewMode}
          handleColorPicker={handleColorPicker}
          showColorPicker={showColorPicker}
          setShowColorPicker={setShowColorPicker}
          setIsPreviewMode={setIsPreviewMode}
          config={config}
          cables={cables}
          selectedPendants={config.selectedPendants || []}
          onSaveConfig={handleSaveConfig}
          handleOpenSaveModal={handleOpenSaveModal}
          onLoadConfig={handleLoadConfig}
          sendMessageToPlayCanvas={sendMessageToPlayCanvas}
          onPendantDesignChange={handlePendantDesignChange}
          brightness={brightness}
          setBrightness={setBrightness}
          colorTemperature={colorTemperature}
          setColorTemperature={setColorTemperature}
          lighting={lighting}
          setLighting={setLighting}
          isLightingPanelOpen={isLightingPanelOpen}
          setIsLightingPanelOpen={setIsLightingPanelOpen}
          setCables={setCables}
          sendMessagesForDesign={sendMessagesForDesign}
          cableMessage={cableMessage}
          showPendantLoadingScreen={showPendantLoadingScreen}
          setShowPendantLoadingScreen={setShowPendantLoadingScreen}
          showLoadingScreen={showLoadingScreen}
          setShowLoadingScreen={setShowLoadingScreen}
          savedConfigurationsCount={userConfigurations.length}
          onStartTour={() => {
            if (typeof window !== "undefined" && window.startConfiguratorTour) {
              window.startConfiguratorTour();
            }
          }}
        />
      )}

      {/* Only show UI elements when not in preview mode */}
      {!isPreviewMode && (
        <>
          {/* Vertical Navigation Bar */}
          {!isLoading && (
            <VerticalNavBar
            setConfig={setConfig}
              containerDimensions={containerDimensions}
              handleChandelierTypeChange={handleChandelierTypeChange}
              activeStep={activeStep}
              showColorPicker={showColorPicker}
              setShowColorPicker={setShowColorPicker}
              setActiveStep={setActiveStep}
              config={config}
              cables={cables}
              showConfigurationTypeSelector={showConfigurationTypeSelector}
              setShowConfigurationTypeSelector={
                setShowConfigurationTypeSelector
              }
              onLightTypeChange={handleLightTypeChange}
              onEnvironmentChange={handleEnvironmentChange}
              onBaseTypeChange={handleBaseTypeChange}
            //  onBaseTypeChange={handleHubTypeChange}
              onBaseColorChange={handleBaseColorChange}
              onConnectorColorChange={handleConnectorColorChange}
              onConfigurationTypeChange={handleConfigurationTypeChange}
              onLightAmountChange={handleLightAmountChange}
              onSystemTypeChange={handleSystemTypeChange}
              onPendantSelection={handlePendantSelection}
              onPendantDesignChange={handlePendantDesignChange}
              onSystemBaseDesignChange={handleSystemBaseDesignChange}
              pendants={config.pendants}
              cableMessage={cableMessage}
              brightness={brightness}
              setBrightness={setBrightness}
              colorTemperature={colorTemperature}
              setColorTemperature={setColorTemperature}
              lighting={lighting}
              setLighting={setLighting}
              isLightingPanelOpen={isLightingPanelOpen}
              setIsLightingPanelOpen={setIsLightingPanelOpen}
              selectedPendants={config.selectedPendants || []}
              setSelectedPendants={(pendantIds) =>
                handlePendantSelection(pendantIds)
              }
              onLocationSelection={handleLocationSelection}
              configuringType={configuringType}
              configuringSystemType={configuringSystemType}
              breadcrumbPath={breadcrumbPath}
              onBreadcrumbNavigation={handleBreadcrumbNavigation}
              onSystemTypeSelection={handleIndividualSystemTypeSelection}
              onCableSizeChange={handleCableSizeChangeLocal}
              onShadeSelect={handleShadeSelectLocal}
              setCableMessage={setCableMessage}
              sendMessageToPlayCanvas={sendMessageToPlayCanvas}
              setShowPendantLoadingScreen={setShowPendantLoadingScreen}
              setShowLoadingScreen={setShowLoadingScreen}
            />
          )}

          {/* Configuration panel for individual configuration */}

          {/* {configuringType && (
            <ConfigPanel
              configuringType={configuringType}
              configuringSystemType={configuringSystemType}
              breadcrumbPath={breadcrumbPath}
              onBreadcrumbNavigation={handleBreadcrumbNavigation}
              onSystemTypeSelection={handleIndividualSystemTypeSelection}
              selectedLocation={selectedLocation}
              selectedPendants={config.selectedPendants}
              onPendantDesignChange={handlePendantDesignChange}
              onSystemBaseDesignChange={handleSystemBaseDesignChange}
              onBaseColorChange={handleBaseColorChange}
              onSelectConfigurationType={handleConfigTypeSelection}
              onShadeSelect={handleShadeSelectLocal}
              currentShade={currentShade}
              onClose={() => setConfiguringType(null)}
              className="max-sm:static max-sm:w-full max-sm:max-w-full max-sm:rounded-none max-sm:border-none"
            />
          )} */}
        </>
      )}

      {/* Save Configuration Modal */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <SaveConfigModal
            isOpen={isSaveModalOpen}
            onClose={() => setIsSaveModalOpen(false)}
            onSave={handleFinalSave}
            handleCloseSaveModal={handleCloseSaveModal}
            configSummary={configToSave}
          />
        )}
      </AnimatePresence>

      {/* Load Configuration Modal */}
      <AnimatePresence>
        {isLoadModalOpen && (
          <LoadConfigModal
            isOpen={isLoadModalOpen}
            handleCloseSaveModal={handleCloseSaveModal}
            onClose={() => setIsLoadModalOpen(false)}
            onLoad={handleLoadSpecificConfig}
            configurations={userConfigurations}
            isLoading={userConfigurationsLoading}
            error={userConfigurationsError}
            onRetry={fetchUserConfigurations}
          />
        )}
      </AnimatePresence>

      <ToastContainer position="bottom-center" autoClose={3000} />

      {/* 
      <ConfigurationSummary
        totalPrice={totalPrice}
        lightType={lightType}
        lightAmount={lightAmount}
        cableColor={cableColor}
        cableLength={cableLength}
        pendants={pendants}
        isDarkMode={isDarkMode}
      /> */}
    </div>
  );
};

export default ConfiguratorLayout;
