import { motion } from "framer-motion";
import React, { useState, useEffect, useRef } from "react";
import { buildApi1Url } from '../../../config/api.config';
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import {
  getSystemAssignments,
  getPendantAssignments,
  getBarAssignments,
  getBallAssignments,
  getUniversalAssignments,
  getChandelierAssignments,
  onDataRefresh,
} from "../pendantSystemData";
import {
  FaHeart,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
  FaCubes,
} from "react-icons/fa";
import { FaArrow } from "react-icons/fa";
import { Breadcrumb } from "./Breadcrumb";
import BaseColorPanel from "./BaseColorPanel";
import {
  addToFavorites,
  removeFromFavorites,
  fetchFavorites,
} from "../../../redux/slices/favoritesSlice";
import { useBarState } from "../../../hooks/useBarState";
export const ConfigPanel = ({
  configuringType,
  configuringSystemType,
  breadcrumbPath,
  showConfigurationTypeSelector,
  handleChandelierTypeChange,
  onBreadcrumbNavigation,
  onSystemTypeSelection,
  selectedLocation,
  setCables,
  selectedPendants,
  cables, // Add cables prop
  onPendantDesignChange,
  onSystemBaseDesignChange,
  onBaseColorChange,
  onSelectConfigurationType,
  onShadeSelect,
  currentShade,
  onCableSizeChange, // NEW PROP
  onChandelierTypeChange, // NEW PROP for chandelier
  onClose,
  className = "", // Add className prop with default empty string
  sendMessageToPlayCanvas, // Add sendMessageToPlayCanvas prop
}) => {
  // Clear shade state when entering pendant mode (defensive, avoids render loop)
  // Only runs when configuringType changes

  useEffect(() => {
    if (configuringType === "pendant") {
      setShowShades(false);
      setAvailableShades([]);
      setLocalSelectedShade(null);
    }
  }, [configuringType]);

  useEffect(() => {
    if (showConfigurationTypeSelector) {
      setCurrentDesign(null);
      setAvailableShades([]);
      setLocalSelectedShade(null);
      setBarNavState({ showBarEngines: false, showBarOptions: false });
      handleBreadcrumbNavigation("home");
    }
  }, [showConfigurationTypeSelector]);

  const dispatch = useDispatch();
  const favorites = useSelector((state) => state.favorites.items);
  const [currentDesign, setCurrentDesign] = useState(null);
  // Internal state for selected cable size (for immediate UI feedback)
  const [localSelectedCableSize, setLocalSelectedCableSize] = useState(1);
  // Force re-render when data changes
  const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);

  // State for async data - only visible items (isShow: true)
  const [pendantAssignments, setPendantAssignments] = useState([]);
  const [systemAssignments, setSystemAssignments] = useState([]);
  const [barAssignments, setBarAssignments] = useState([]);
  const [ballAssignments, setBallAssignments] = useState([]);
  const [universalAssignments, setUniversalAssignments] = useState([]);
  const [chandelierAssignments, setChandelierAssignments] = useState([]);
  // Loading state for pendant selection
  const [pendantLoading, setPendantLoading] = useState(false);
  // Ref to store the timeout ID for cleanup
  const loadingTimeoutRef = useRef(null);
  const {
    barArray,
    setBarState,
    initializeBarArray
  } = useBarState();
// Add this useEffect right after the useBarState hook
useEffect(() => {
  console.log('barArray updated:', barArray);
}, [barArray]); // This will run every time barArray changes

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

  // Function to load all configurator data (only visible items)
  const loadConfiguratorData = async () => {
    try {
      const [
        systemData,
        pendantData,
        barData,
        ballData,
        universalData,
        chandelierData
      ] = await Promise.all([
        getSystemAssignments(),
        getPendantAssignments(),
        getBarAssignments(),
        getBallAssignments(),
        getUniversalAssignments(),
        getChandelierAssignments()
      ]);

      setSystemAssignments(systemData);
      setPendantAssignments(pendantData);
      setBarAssignments(barData);
      setBallAssignments(ballData);
      setUniversalAssignments(universalData);
      setChandelierAssignments(chandelierData);



    } catch (error) {
      console.error('Error loading configurator data:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadConfiguratorData();
  }, []);

  const syncWishlistWithAPI = async (wishlistArray) => {
    const token = localStorage.getItem("limiToken");
    await fetch(
      buildApi1Url('/admin/products/light-configs/wishlist'),
      {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wishlist: wishlistArray }),
      }
    );
  };

  // Sync localSelectedCableSize with props when relevant data changes
  useEffect(() => {
    if (configuringType === "cableSize") {
      let selectedCableSize = 1;
      if (
        selectedPendants &&
        selectedPendants.length > 0 &&
        cables &&
        cables.length > 0
      ) {
        const idx = selectedPendants[0];
        if (typeof idx === "number" && cables[idx] && cables[idx].size) {
          selectedCableSize = cables[idx].size;
        }
      } else if (
        typeof selectedLocation === "number" &&
        cables &&
        cables[selectedLocation] &&
        cables[selectedLocation].size
      ) {
        selectedCableSize = cables[selectedLocation].size;
      }
      setLocalSelectedCableSize(selectedCableSize);
    }
  }, [configuringType, selectedPendants, selectedLocation, cables]);

  // Subscribe to data refresh events to reload configurator data
  useEffect(() => {
    const unsubscribe = onDataRefresh((newData) => {
      setDataRefreshTrigger(prev => prev + 1);
      // Reload all configurator data to get only visible items
      loadConfiguratorData();
    });

    return unsubscribe;
  }, []);

  // Track navigation state for breadcrumb
  const [navState, setNavState] = useState({
    level: configuringType ? (configuringSystemType ? 2 : 1) : 0,
    path: [],
    ids: {},
  });

  // Track bar system nested navigation
  const [barNavState, setBarNavState] = useState({
    showBarEngines: false, // true when showing "Bar Engines" option
    showBarOptions: false, // true when showing actual bar options
  });

  const [currentConfig, SetcurrentConfig] = useState(null);

  // State for shade selection
  const [showShades, setShowShades] = useState(false);
  const [availableShades, setAvailableShades] = useState([]);
  const [localSelectedShade, setLocalSelectedShade] = useState(currentShade);

  // Shade selection handler
  const handleShadeSelect = (shade, shadeIndex) => {
    setLocalSelectedShade(shade.id);
    const baseOptions = {
      bar: [
        {
          id: "prism",
          name: "Prism",
          baseNumber: "1",
          image: "/images/configOptions/bar/1.png",
        },
        {
          id: "helix",
          name: "Helix",
          baseNumber: "2",
          image: "/images/configOptions/bar/2.png",
        },
        {
          id: "orbit",
          name: "Orbit",
          baseNumber: "3",
          image: "/images/configOptions/bar/3.png",
        },
        {
          id: "zenith",
          name: "Zenith",
          baseNumber: "4",
          image: "/images/configOptions/bar/4.jpg",
        },
        {
          id: "pulse",
          name: "Pulse",
          baseNumber: "5",
          image: "/images/configOptions/bar/5.jpg",
        },
        {
          id: "vortex",
          name: "Vortex",
          baseNumber: "6",
          image: "/images/configOptions/bar/6.jpg",
        },
        {
          id: "nexus",
          name: "Nexus",
          baseNumber: "7",
          image: "/images/configOptions/bar/7.jpg",
        },
        {
          id: "quasar",
          name: "Quasar",
          baseNumber: "8",
          image: "/images/configOptions/bar/8.jpg",
        },
        {
          id: "nova",
          name: "Nova",
          baseNumber: "9",
          image: "/images/configOptions/bar/9.jpg",
        },
      ],
      universal: [
        {
          id: "atom",
          name: "Atom",
          baseNumber: "1",
          image: "/images/configOptions/universal/1.png",
          message: "system_base_1",
        },
        {
          id: "nebula",
          name: "Nebula",
          baseNumber: "2",
          image: "/images/configOptions/universal/2.png",
          message: "system_base_2",
        },
        {
          id: "cosmos",
          name: "Cosmos",
          baseNumber: "3",
          image: "/images/configOptions/universal/3.png",
          message: "system_base_3",
        },
        {
          id: "stellar",
          name: "Stellar",
          baseNumber: "4",
          image: "/images/configOptions/universal/4.png",
          message: "system_base_4",
        },
        {
          id: "eclipse",
          name: "Eclipse",
          baseNumber: "5",
          image: "/images/configOptions/universal/5.png",
          message: "system_base_5",
        },
        {
          id: "aurora",
          name: "Aurora",
          baseNumber: "6",
          image: "/images/configOptions/universal/6.png",
          message: "system_base_6",
        },
        {
          id: "solstice",
          name: "Solstice",
          baseNumber: "7",
          image: "/images/configOptions/universal/7.png",
          message: "system_base_7",
        },
        {
          id: "quantum",
          name: "Quantum",
          baseNumber: "8",
          image: "/images/configOptions/universal/8.png",
          message: "system_base_8",
        },
        {
          id: "vertex",
          name: "Vertex",
          baseNumber: "9",
          image: "/images/configOptions/universal/9.png",
          message: "system_base_9",
        },
        {
          id: "horizon",
          name: "Horizon",
          baseNumber: "10",
          image: "/images/configOptions/universal/10.png",
          message: "system_base_10",
        },
        {
          id: "zoneith",
          name: "Zoneith",
          baseNumber: "11",
          image: "/images/configOptions/universal/11.png",
          message: "system_base_11",
        },
        {
          id: "equinox",
          name: "Equinox",
          baseNumber: "12",
          image: "/images/configOptions/universal/12.png",
          message: "system_base_12",
        },
        {
          id: "meridian",
          name: "Meridian",
          baseNumber: "13",
          image: "/images/configOptions/universal/13.png",
          message: "system_base_13",
        },
        {
          id: "polaris",
          name: "Polaris",
          baseNumber: "14",
          image: "/images/configOptions/universal/14.png",
          message: "system_base_14",
        },
        {
          id: "pulsar",
          name: "Pulsar",
          baseNumber: "15",
          image: "/images/configOptions/universal/15.png",
          message: "system_base_15",
        },
        {
          id: "quasar",
          name: "Quasar",
          baseNumber: "16",
          image: "/images/configOptions/universal/16.png",
          message: "system_base_16",
        },
        {
          id: "supernova",
          name: "Supernova",
          baseNumber: "17",
          image: "/images/configOptions/universal/17.png",
          message: "system_base_17",
        },
        {
          id: "galaxy",
          name: "Galaxy",
          baseNumber: "18",
          image: "/images/configOptions/universal/18.png",
          message: "system_base_18",
        },
        {
          id: "comet",
          name: "Comet",
          baseNumber: "19",
          image: "/images/configOptions/universal/19.png",
          message: "system_base_19",
        },
        {
          id: "meteor",
          name: "Meteor",
          baseNumber: "20",
          image: "/images/configOptions/universal/20.png",
          message: "system_base_20",
        },
        {
          id: "asteroid",
          name: "Asteroid",
          baseNumber: "21",
          image: "/images/configOptions/universal/21.png",
        },
        {
          id: "celestial",
          name: "Celestial",
          baseNumber: "22",
          image: "/images/configOptions/universal/22.png",
        },
        {
          id: "orbital",
          name: "Orbital",
          baseNumber: "23",
          image: "/images/configOptions/universal/23.png",
        },
        {
          id: "lunar",
          name: "Lunar",
          baseNumber: "24",
          image: "/images/configOptions/universal/24.png",
        },
        {
          id: "solar",
          name: "Solar",
          baseNumber: "25",
          image: "/images/configOptions/universal/25.png",
        },
        {
          id: "nova",
          name: "Nova",
          baseNumber: "26",
          image: "/images/configOptions/universal/26.png",
        },
        {
          id: "photon",
          name: "Photon",
          baseNumber: "27",
          image: "/images/configOptions/universal/27.png",
        },
        {
          id: "gravity",
          name: "Gravity",
          baseNumber: "28",
          image: "/images/configOptions/universal/28.png",
        },
        {
          id: "spectrum",
          name: "Spectrum",
          baseNumber: "29",
          image: "/images/configOptions/universal/29.png",
        },
        {
          id: "infinity",
          name: "Infinity",
          baseNumber: "30",
          image: "/images/configOptions/universal/30.png",
        },
        // {
        //   id: "void",
        //   name: "Void",
        //   baseNumber: "31",
        //   image: "/images/configOptions/universal/31.png",
        // },
        // {
        //   id: "blackhole",
        //   name: "Blackhole",
        //   baseNumber: "32",
        //   image: "/images/configOptions/universal/32.png",
        // },
        // {
        //   id: "singularity",
        //   name: "Singularity",
        //   baseNumber: "33",
        //   image: "/images/configOptions/universal/33.png",
        // },
        // {
        //   id: "supernova",
      ],
    };
    if (typeof onShadeSelect === "function") {
      onShadeSelect(designId, shade.id, configuringSystemType, shadeIndex);
    }
  };

  // Update local shade state when currentShade prop changes
  useEffect(() => {
    setLocalSelectedShade(currentShade);
  }, [currentShade]);

  // Update navigation state when configuringType or configuringSystemType changes
  useEffect(() => {
    updateNavigationState();
    // Reset bar navigation state when system type changes
    if (configuringSystemType !== "bar") {
      setBarNavState({ showBarEngines: false, showBarOptions: false });
    }
    // Reset all state when configuringType becomes null (panel closed)
    if (!configuringType) {
      setCurrentDesign(null);
      setAvailableShades([]);
      setLocalSelectedShade(null);
      setBarNavState({ showBarEngines: false, showBarOptions: false });
      // Reset navigation state completely
      setNavState({
        level: 0,
        path: [],
        ids: {},
      });
    }
  }, [configuringType, configuringSystemType]);

  // Debug log for tracking props and state
  useEffect(() => { }, [
    configuringType,
    configuringSystemType,
    currentDesign,
    currentShade,
    localSelectedShade,
  ]);

  // Update navigation state based on current configuration
  const updateNavigationState = () => {
    let newState = {
      level: 0,
      path: [],
      ids: {},
    };

    if (!configuringType) {
      // Home level
      newState.level = 0;
    } else if (configuringType === "pendant") {
      // Pendant design level
      newState.level = 1;
      newState.path = ["pendant"];
      newState.ids = { pendant: true };
    } else if (configuringType === "system") {
      if (!configuringSystemType) {
        // System type selection level
        newState.level = 1;
        newState.path = ["system"];
        newState.ids = { system: true };
      } else {
        // System base design level
        newState.level = 2;
        newState.path = ["system", configuringSystemType];
        newState.ids = { system: true, [configuringSystemType]: true };
      }
    }

    setNavState(newState);
  };
  const carouselRef = useRef(null);
  // Separate ref for shade carousel
  const shadeCarouselRef = useRef(null);

  const getCurrentConfig = () => {
    const config = getPanelConfig();
    SetcurrentConfig(config);
  };

  // Carousel scroll functionality for main design slider
  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === "left" ? -200 : 200;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Carousel scroll functionality for shade slider (separate)
  const scrollShadeCarousel = (direction) => {
    if (shadeCarouselRef.current) {
      const scrollAmount = direction === "left" ? -200 : 200;
      shadeCarouselRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Check if the selected design has multiple shades
  const checkForMultipleShades = (designId, systemType) => {
    // Map of designs to their available shades
    const shadeOptions = {
      // Universal system shades
      // universal: {
      // atom: [
      //   { id: "shallowdome", name: "Shallow Dome", color: "#2B2D2F" },
      //   { id: "deepdome", name: "Deep Dome", color: "#50C878" },
      //   { id: "flatplate", name: "Flat Plate", color: "#87CEAB" },
      // ],
      // nebula: [
      //   { id: "cone", name: "Cone", color: "#2B2D2F" },
      //   { id: "cylinder", name: "Cylinder", color: "#50C878" },
      // ],
      // cosmos: [
      //   { id: "sphere", name: "Sphere", color: "#2B2D2F" },
      //   { id: "hemisphere", name: "Hemisphere", color: "#50C878" },
      //   { id: "disc", name: "Disc", color: "#87CEAB" },
      //   { id: "ring", name: "Ring", color: "#F2F0E6" },
      // ],
      // stellar: [
      //   { id: "pyramid", name: "Pyramid", color: "#2B2D2F" },
      //   { id: "cube", name: "Cube", color: "#50C878" },
      //   { id: "prism", name: "Prism", color: "#87CEAB" },
      // ],
      // eclipse: [
      //   { id: "oval", name: "Oval", color: "#2B2D2F" },
      //   { id: "rectangle", name: "Rectangle", color: "#50C878" },
      // ],
      // },
      // Bar system shades
      // bar: {
      // prism: [
      //   { id: "standard", name: "Standard", color: "#2B2D2F" },
      //   { id: "extended", name: "Extended", color: "#50C878" },
      // ],
      // helix: [
      //   { id: "single", name: "Single", color: "#2B2D2F" },
      //   { id: "double", name: "Double", color: "#50C878" },
      //   { id: "triple", name: "Triple", color: "#87CEAB" },
      // ],
      // },
    };

    // Check if this design has shade options
    // if (
    //   systemType &&
    //   shadeOptions[systemType] &&
    //   shadeOptions[systemType][designId]
    // ) {
    //   return shadeOptions[systemType][designId];
    // }

    return null; // No shades available
  };

  // Get panel configuration based on the current state
  const getPanelConfig = () => {
    // Default configuration for the panel
    let config = {
      title: "",
      showBreadcrumb: true,
      items: [],
      onItemSelect: () => { },
      breadcrumbItems: [],
    };

    // Home/Configuration Type Selection
    if (!configuringType) {
      config.title = "Cable Selected";
      config.showBreadcrumb = false;
      config.items = [
        {
          id: "pendant",
          name: "Pendant",
          image: "/images/configOptions/pendant.png",
        },
        {
          id: "system",
          name: "System",
          image: "/images/configOptions/system.png",
        },
        // {
        //   id: "cableSize",
        //   name: "Cable Size",
        //   image: "/images/configOptions/cable.png",
        // },
      ];
      // Add Chandelier option when baseType is round and lightAmount is 3
      // We need to access the parent config to check these conditions
      // This will be passed as a prop or accessed through a parent component
      const parentConfig =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("lightConfig") || "{}")
          : {};

      // Add chandelier for both round and rectangular base types when lightAmount is 3
      if (parentConfig.lightAmount === 3 && (parentConfig.lightType === "ceiling" || parentConfig.lightType === "rectangular")) {
        config.items.push({
          id: "chandelier",
          name: "Chandelier",
          image: "/images/configOptions/chandelier.png",
        });
      }
      config.onItemSelect = (itemId) => {
        // Reset system type state when selecting system
        if (itemId === "system") {
          setCurrentDesign(null);
          setAvailableShades([]);
          setLocalSelectedShade(null);
          setBarNavState({ showBarEngines: false, showBarOptions: false });
          // Reset navigation state to ensure we show system type selection
          setNavState({
            level: 1,
            path: ["system"],
            ids: { system: true },
          });
        }
        // Handle chandelier selection
        if (itemId === "chandelier") {
          setCurrentDesign(null);
          setAvailableShades([]);
          setLocalSelectedShade(null);
          setBarNavState({ showBarEngines: false, showBarOptions: false });
          // Set navigation state for chandelier
          setNavState({
            level: 1,
            path: ["chandelier"],
            ids: { chandelier: true },
          });
        }
        onSelectConfigurationType(itemId);
      };
      config.selectedItem = null;
      config.useIcon = true;
      config.showCloseButton = true;
      config.showLocationLabel = true;
    }
    // Chandelier Type Selection
    else if (configuringType === "chandelier") {
      config.title = "Chandelier Selection";
      config.showBreadcrumb = true;

      // Get parent config to check baseType
      const parentConfig =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("lightConfig") || "{}")
          : {};

      // Filter chandelierAssignments based on baseType
      const filteredChandeliers = chandelierAssignments.filter((chand) =>
        chand.baseType === parentConfig.baseType
      );

      config.items = filteredChandeliers.map((chand) => ({
        id: chand.design,
        name: chand.name,
        image:
          chand.media && chand.media.image && chand.media.image.url
            ? chand.media.image.url
            : "/images/configOptions/chandelier.png",
      }));
      config.onItemSelect = (itemId) => {
        // Show loading overlay
        setPendantLoading(true);

        // Loading will only be turned off when "loadingOff" message is received from iframe

        // Call the chandelier type change handler
        if (handleChandelierTypeChange) {
          handleChandelierTypeChange(itemId);
        }
      };
      config.selectedItem = currentDesign;
      config.breadcrumbItems = [
        { id: "home", name: "icon-home" },
        { id: "chandelier", name: "Chandelier" },
      ];
    }
    // Cable Size selection panel
    else if (configuringType === "cableSize") {
      config.title = "Cable Size";
      config.showBreadcrumb = true;
      // Use localSelectedCableSize for immediate UI feedback
      config.items = [1, 2, 3, 4, 5, 6].map((size) => ({
        id: size,
        name: `${size} mm`,
        image: `/images/configOptions/cable_size_${size}.png`,
      }));
      config.onItemSelect = (size) => {
        setLocalSelectedCableSize(size); // Update UI immediately
        let cablesToUpdate = [];

        if (selectedPendants && selectedPendants.length > 0) {
          cablesToUpdate = selectedPendants.filter(
            (idx) => typeof idx === "number"
          );
        } else if (typeof selectedLocation === "number") {
          cablesToUpdate = [selectedLocation];
        }
        if (cablesToUpdate.length > 0) {
          onCableSizeChange(size, cablesToUpdate);
        }
      };
      config.selectedItem = localSelectedCableSize;
      config.breadcrumbItems = [
        { id: "home", name: "icon-home" },
        { id: "cableSize", name: "Cable Size" },
      ];
    }
    // Pendant Design Selection
    else if (configuringType === "pendant") {
      config.title = "Pendant Design";
      config.showBreadcrumb = true;
      config.items = pendantAssignments.map((pendant) => ({
        id: pendant.design,
        name: pendant.name,
        image:
          pendant.media && pendant.media.image && pendant.media.image.url
            ? pendant.media.image.url
            : "",
        message: pendant.message,
        baseNumber: pendant.baseNumber,
      }));
      config.onItemSelect = (itemId) => {
        // Show loading overlay
        setPendantLoading(true);

        // Loading will only be turned off when "loadingOff" message is received from iframe

        setCurrentDesign(itemId);

        // Use all selected pendants if available, otherwise fall back to just the first one
        const pendantsToUpdate =
          selectedPendants && selectedPendants.length > 0
            ? selectedPendants
            : [selectedLocation];
        onPendantDesignChange(pendantsToUpdate, itemId);
        // Always hide and clear shade panel for pendants
        setShowShades(false);
        setAvailableShades([]);
        setLocalSelectedShade(null);
      };
      config.selectedItem = currentDesign;
      config.breadcrumbItems = [
        { id: "home", name: "icon-home" },
        { id: "pendant", name: "Pendant Design" },
      ];
    } else if (configuringType === "system") {
      if (!configuringSystemType) {
        // System type selection
        config.title = "System Type";
        config.showBreadcrumb = true;
        config.items = [
          { id: "bar", name: "Bar", image: "/images/configOptions/bar.png" },
          { id: "ball", name: "Ball", image: "/images/configOptions/ball.png" },
          {
            id: "universal",
            name: "Universal",
            message: "system_type_universal",
            image: "/images/configOptions/universal.png",
          },
        ];
        config.onItemSelect = (systemType) => {
          // Fire specific messages for each system type


          if (systemType === "bar") {
            // Initialize the bar array with the number of selected pendants
            initializeBarArray(selectedPendants.length);

            // For each selected pendant, update the bar state
            selectedPendants.forEach((cableIndex) => {
              // Set hasBarModel to true and hasBarAttachment to false for this index
              setBarState(cableIndex, {
                hasBarModel: true,
                hasBarAttachment: false
              });

              // Send the necessary messages to PlayCanvas
              sendMessageToPlayCanvas(`cable_${cableIndex}`);
              sendMessageToPlayCanvas("bars");
              sendMessageToPlayCanvas("glass_none");
              sendMessageToPlayCanvas("color_gold");
              sendMessageToPlayCanvas("silver_none");
              sendMessageToPlayCanvas(
                "product_https://dev.api1.limitless-lighting.co.uk/configurator_dynamic/models/Bar_1756732230450.glb"
              );
            });

            sendMessageToPlayCanvas("allmodelsloaded");
          }
          // Call the parent handler to update state and send message to iframe
          onSystemTypeSelection(systemType);
        };
        config.selectedItem = configuringSystemType;
        config.useIcon = false;
        config.breadcrumbItems = [
          { id: "home", name: "icon-home" },
          { id: "system", name: "System Type" },
        ];
      } else {
        // Handle bar system - show bar options directly
        if (configuringSystemType === "bar") {
          config.title = "Add On";
          config.showBreadcrumb = true;

          // Get bar assignments and filter out "Luga" design
          const systemTypeBases = (barAssignments || []).filter(
            (base) => base.design !== "luga"
          );

          // Create items with images from the type-specific folder, and attach shades if available
          config.items = systemTypeBases.map((base) => {
            const shades = checkForMultipleShades(
              base.id,
              configuringSystemType
            );
            return {
              id: base.design,
              name: base.name,
              image:
                base.media && base.media.image && base.media.image.url
                  ? base.media.image.url
                  : "",
              baseNumber: base.baseNumber,
              shades: shades || null,
            };
          });

          config.onItemSelect = (itemId) => {
            // Show loading overlay
            setPendantLoading(true);

            // Loading will only be turned off when "loadingOff" message is received from iframe

            setCurrentDesign(itemId);
            const selectedBase = config.items.find(
              (item) => item.id === itemId
            );
            const shades = selectedBase && selectedBase.shades;
            if (shades && shades.length > 0) {
              setAvailableShades(shades);
              setLocalSelectedShade(shades[0].id);
              if (typeof onShadeSelect === "function") {
                onShadeSelect(itemId, shades[0].id, configuringSystemType, 0);
              }
            } else {
              setAvailableShades([]);
              setLocalSelectedShade(null);
            }
            onSystemBaseDesignChange(itemId);
          };
          config.selectedItem = currentDesign;
          config.breadcrumbItems = [
            { id: "home", name: "icon-home" },
            { id: "system", name: "System Type" },
            { id: "bar", name: "Add On" },
          ];
        } else {
          // System base design selection for other system types (ball, universal)
          config.title = `${configuringSystemType.charAt(0).toUpperCase() +
            configuringSystemType.slice(1)
            }`;
          config.showBreadcrumb = true;

          // Map of base IDs to names and image numbers based on available files
          const baseOptions = {
            bar: barAssignments,
            ball: ballAssignments,
            universal: universalAssignments,
          };

          // Get the appropriate bases for the selected system type
          const systemTypeBases = baseOptions[configuringSystemType] || [];

          // Create items with images from the type-specific folder, and attach shades if available
          config.items = systemTypeBases.map((base) => {
            const shades = checkForMultipleShades(
              base.id,
              configuringSystemType
            );
            return {
              id: base.design,
              name: base.name,
              image:
                base.media && base.media.image && base.media.image.url
                  ? base.media.image.url
                  : "",
              baseNumber: base.baseNumber,
              shades: shades || null,
            };
          });

          // If a base is selected and it has shades, show those as the next options (inside the same panel)
          if (currentDesign) {
            const selectedBase = config.items.find(
              (item) => item.id === currentDesign
            );
            const shades = selectedBase && selectedBase.shades;

            if (shades && shades.length > 0) {
              // Replace items with shades for this step
              config.items = shades.map((shade, idx) => ({
                ...shade,
                id: shade.id,
                name: shade.name,
                color: shade.color,
                index: idx,
              }));
              config.onItemSelect = (shadeId) => {
                setLocalSelectedShade(shadeId);
                if (typeof onShadeSelect === "function") {
                  onShadeSelect(
                    selectedBase.baseNumber,
                    shadeId,
                    configuringSystemType,
                    config.items.findIndex((s) => s.id === shadeId)
                  );
                }
              };
              config.selectedItem = localSelectedShade;
              config.breadcrumbItems = [
                { id: "home", name: "icon-home" },
                { id: "system", name: "System Type" },
                {
                  id: configuringSystemType,
                  name: `${configuringSystemType.charAt(0).toUpperCase() +
                    configuringSystemType.slice(1)
                    }`,
                },
                { id: "shades", name: "Shades" },
              ];
              config.title = "Shades";
            } else {
              // Show base options
              config.onItemSelect = (itemId) => {
                // Show loading overlay
                setPendantLoading(true);

                // Loading will only be turned off when "loadingOff" message is received from iframe

                setCurrentDesign(itemId);
                const selectedBase = config.items.find(
                  (item) => item.id === itemId
                );
                const shades = selectedBase && selectedBase.shades;
                if (shades && shades.length > 0) {
                  setAvailableShades(shades);
                  setLocalSelectedShade(shades[0].id);
                  if (typeof onShadeSelect === "function") {
                    onShadeSelect(
                      itemId,
                      shades[0].id,
                      configuringSystemType,
                      0
                    );
                  }
                } else {
                  setAvailableShades([]);
                  setLocalSelectedShade(null);
                }
                onSystemBaseDesignChange(itemId);
              };
              config.selectedItem = currentDesign;
              config.breadcrumbItems = [
                { id: "home", name: "icon-home" },
                { id: "system", name: "System Type" },
                {
                  id: configuringSystemType,
                  name: `${configuringSystemType.charAt(0).toUpperCase() +
                    configuringSystemType.slice(1)
                    }`,
                },
              ];
              config.title = `${configuringSystemType.charAt(0).toUpperCase() +
                configuringSystemType.slice(1)
                }`;
            }
          } else {
            // Show base options
            config.onItemSelect = (itemId) => {
              // Show loading overlay
              setPendantLoading(true);

              // Loading will only be turned off when "loadingOff" message is received from iframe

              setCurrentDesign(itemId);
              const selectedBase = config.items.find(
                (item) => item.id === itemId
              );
              const shades = selectedBase && selectedBase.shades;
              if (shades && shades.length > 0) {
                setAvailableShades(shades);
                setLocalSelectedShade(shades[0].id);
                if (typeof onShadeSelect === "function") {
                  onShadeSelect(itemId, shades[0].id, configuringSystemType, 0);
                }
              } else {
                setAvailableShades([]);
                setLocalSelectedShade(null);
              }
              onSystemBaseDesignChange(itemId);
            };
            config.selectedItem = currentDesign;
            config.breadcrumbItems = [
              { id: "home", name: "icon-home" },
              { id: "system", name: "System Type" },
              {
                id: configuringSystemType,
                name: `${configuringSystemType.charAt(0).toUpperCase() +
                  configuringSystemType.slice(1)
                  }`,
              },
            ];
            config.title = `${configuringSystemType.charAt(0).toUpperCase() +
              configuringSystemType.slice(1)
              }`;
          }
        }
      }
    }

    return config;
  };

  // Custom breadcrumb navigation handler
  const handleBreadcrumbNavigation = (id) => {
    // Use the navigation state to determine where to go
    if (id === "home") {
      // Reset to configuration type selection (first level)
      // Clear all system-related state
      setCurrentDesign(null);
      setAvailableShades([]);
      setLocalSelectedShade(null);
      setBarNavState({ showBarEngines: false, showBarOptions: false });
      onSelectConfigurationType(null);
      // Call the parent breadcrumb handler instead of recursively calling itself
      onBreadcrumbNavigation("home");
    } else if (id === "chandelier") {
      // If we click on Chandelier breadcrumb, ensure we're at that level
      if (configuringType !== "chandelier") {
        onSelectConfigurationType("chandelier");
      }
    } else if (id === "system" && navState.level === 2) {
      // If we're in system base design and click on System Type breadcrumb,
      // go back to system type selection
      setNavState({
        level: 1,
        path: ["system"],
        ids: { system: true },
      });
      // Reset bar navigation state and design selection
      setCurrentDesign(null);
      setAvailableShades([]);
      setLocalSelectedShade(null);
      setBarNavState({ showBarEngines: false, showBarOptions: false });
      onSystemTypeSelection(null);
    } else if (id === "pendant") {
      // If we click on Pendant Design breadcrumb, ensure we're at that level
      if (configuringType !== "pendant") {
        onSelectConfigurationType("pendant");
      }
    } else if (id === "bar" && configuringSystemType === "bar") {
      // If we click on Bar breadcrumb, reset to bar options view
      setCurrentDesign(null);
      setAvailableShades([]);
      setLocalSelectedShade(null);
    } else if (
      configuringType === "system" &&
      (id === "universal" || id === "ball")
    ) {
      // If we click on a system base (e.g., Universal, Ball) breadcrumb,
      // reset to show base options for that system
      setCurrentDesign(null);
      setAvailableShades([]);
      setLocalSelectedShade(null);
      // Optionally update navigation state if needed
      // (the panelConfig will update accordingly)
    } else {
      // Pass through to the parent handler
      onBreadcrumbNavigation(id);
    }
  };

  // Get the current panel configuration
  const formatSelectedLocations = (locations) => {
    if (typeof locations === "number") {
      return locations + 1;
    }

    if (Array.isArray(locations) && locations.length > 0) {
      const numericLocations = locations.filter(
        (loc) => typeof loc === "number"
      );
      if (numericLocations.length === 0) return ""; // Handle empty or invalid array

      const displayLocations = numericLocations
        .map((loc) => loc + 1)
        .sort((a, b) => a - b);

      if (displayLocations.length === 0) return ""; // Should be caught by numericLocations.length check, but good for safety

      if (displayLocations.length > 5) {
        const firstFew = displayLocations.slice(0, 4);
        return `${firstFew.join(", ")}, ...`;
      } else if (displayLocations.length === 1) {
        return displayLocations[0];
      } else if (displayLocations.length === 2) {
        return `${displayLocations[0]} & ${displayLocations[1]}`;
      } else {
        // 3 to 5 locations
        const lastItem = displayLocations.pop();
        return `${displayLocations.join(", ")} & ${lastItem}`;
      }
    }
    return ""; // Default for other cases (null, undefined, etc.)
  };

  const panelConfig = getPanelConfig();

  // Determine if we're in mobile view based on the className prop
  const isMobileView = className.includes("max-sm:static");

  return (
    <>
      {/* Full-Screen Loading Overlay for Pendant Selection */}
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
            <p className="text-white text-lg font-medium font-['Amenti']">Loading pendant...</p>
          </div>
        </motion.div>
      )}

      <div className="flex justify-center items-center w-full">
        <motion.div
          className={`fixed h-[150px] sm:absolute bottom-0 sm:bottom-1 -translate-x-1/2 bg-black/95 sm:backdrop-blur-sm border border-gray-700 rounded-t-lg sm:rounded-lg z-40 w-full sm:max-w-[320px] md:max-w-[400px] lg:max-w-[480px] xl:max-w-[540px] sm:w-[80vw] md:w-[55vw] lg:w-[40vw] xl:w-[24vw] max-h-[60vh] sm:max-h-[30vh] shadow-lg overflow-hidden ${className}`}
          initial={
            isMobileView ? { y: "100%", opacity: 0 } : { y: 30, opacity: 0 }
          }
          animate={isMobileView ? { y: 0, opacity: 1 } : { y: 0, opacity: 1 }}
          exit={isMobileView ? { y: "100%", opacity: 0 } : { y: 30, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="px-2 sm:px-2 pt-2">
            {/* Responsive header */}
            <div className="flex items-center justify-between mb-2">
              {panelConfig.showBreadcrumb ? (
                <>
                  <div className="flex items-center w-full">
                    <div className="flex-1 min-w-0">
                      <Breadcrumb
                        path={panelConfig.breadcrumbItems}
                        onNavigate={handleBreadcrumbNavigation}
                      />
                    </div>
                    <h3 className="ml-4 text-xs sm:text-sm font-medium text-white font-['Amenti'] truncate text-right">
                      {panelConfig.title}
                    </h3>
                    {panelConfig.showCloseButton && (
                      <button
                        onClick={onClose}
                        className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 ml-2"
                        aria-label="Close panel"
                      >
                        <FaTimes size={10} className="text-gray-300" />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm font-medium text-white font-['Amenti'] truncate">
                      {panelConfig.title}
                    </h3>
                  </div>
                  {panelConfig.showCloseButton && (
                    <button
                      onClick={onClose}
                      className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 ml-2"
                      aria-label="Close panel"
                    >
                      <FaTimes size={10} className="text-gray-300" />
                    </button>
                  )}
                </>
              )}
            </div>
            {/* Items carousel or cable size segmented control */}
            {configuringType === "cableSize" ? (
              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm font-semibold text-gray-400 mb-1">
                  Length
                </label>
                <div className="flex w-full bg-[#2B2D2F] rounded-full p-1 justify-between">
                  {[1, 2, 3, 4, 5, 6].map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        panelConfig.onItemSelect(size);
                      }}
                      className={`flex-1 py-2 rounded-full font-semibold transition text-sm
                    ${panelConfig.selectedItem === size
                          ? "bg-[#50C878] text-[#F6F6F6] shadow" // charleston green bg, light text
                          : "bg-transparent text-[#50C878] hover:bg-[#E3F9EF]"
                        } // charleston green text, emerald-tinted hover
                  `}
                      style={{ margin: "0 2px" }}
                    >
                      {size}mm
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative w-full">
                {panelConfig.items.length > (isMobileView ? 2 : 3) && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
                    <button
                      onClick={() => scrollCarousel("left")}
                      className="w-7 h-7 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition-colors shadow"
                      aria-label="Scroll left"
                    >
                      <FaChevronLeft size={12} />
                    </button>
                  </div>
                )}
                <div
                  ref={carouselRef}
                  className={`flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide py-2 px-1 sm:px-5 max-w-full`}
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {panelConfig.items.map((item) => (
                    <motion.div
                      key={item.id}
                      className="flex flex-col items-center flex-shrink-0 px-1 sm:px-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => panelConfig.onItemSelect(item.id)}
                    >
                      <div
                        className={`relative ${isMobileView ? "w-14 h-14" : "w-16 h-16"
                          } rounded-full overflow-hidden ${panelConfig.selectedItem === item.id
                            ? "ring-2 ring-emerald-500"
                            : "ring-1 ring-gray-600"
                          }`}
                      >
                        {/* Wishlist Icon Overlay */}

                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={isMobileView ? 56 : 64}
                            height={isMobileView ? 56 : 64}
                            className="object-cover w-full h-full"
                            priority
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: "#2C3539", color: "white" }}
                          >
                            <p className="text-base sm:text-lg font-bold">
                              {item.baseNumber}
                            </p>
                          </div>
                        )}
                        {panelConfig.selectedItem === item.id && (
                          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                            <FaCheck className="text-white text-xs" />
                          </div>
                        )}
                      </div>
                      <p
                        className={`text-center text-xs sm:text-[13px] mt-1.5 text-gray-200 font-medium capitalize`}
                      >
                        {item.name}
                      </p>
                    </motion.div>
                  ))}
                </div>
                {panelConfig.items.length > (isMobileView ? 2 : 3) && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
                    <button
                      onClick={() => scrollCarousel("right")}
                      className="w-7 h-7 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition-colors shadow"
                      aria-label="Scroll right"
                    >
                      <FaChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};
