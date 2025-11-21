import {
  FaLightbulb,
  FaLayerGroup,
  FaRegLightbulb,
  FaObjectGroup,
  FaList,
  FaCubes,
  FaPalette,
  FaGlobe,
  FaCheck,
  FaInfoCircle,
} from "react-icons/fa";


import { TbBrightnessFilled } from "react-icons/tb";
import { IoMdSettings } from "react-icons/io";
import { FiHome } from "react-icons/fi";

export const useNavSteps = (config) => {
  // Get dynamic image paths based on selected configuration
  const getLightTypeImage = () => {
    if (config.lightType) {
      return `/images/verticalNavbar/lightType/${config.lightType}.png`;
    }
    return null;
  };

  const getBaseTypeImage = () => {
    if (config.baseType) {
      return `/images/verticalNavbar/baseType/${config.baseType}.png`;
    }
    return null;
  };

  const getLightAmountImage = () => {
    if (config.lightAmount) {
      return `/images/verticalNavbar/lightAmount/${config.lightAmount}.png`;
    }
    return null;
  };

  // Define navigation steps
  const steps = [
    {
      id: "info",
      icon: <FaInfoCircle />,
      label: "Information",
      tooltip: "Navigation Guide",
      isActive: true,
      isCompleted: false,
    },

    {
      id: "lightType",
      icon: <FaLightbulb />, // Fallback icon
      // image: getLightTypeImage(),
      label: "Light Type",
      tooltip: "Light Type",
      isActive: true, // Always active
      isCompleted: Boolean(config.lightType),
    },
    {
      id: "lightingControl",
      icon: <TbBrightnessFilled />,
      label: "Lighting Control",
      tooltip: "Ambient Setting",
      isActive: true,
      isCompleted: false,
    },
    {
      id: "environment",
      icon: <FiHome />,
      label: "Environment",
      tooltip: "Environmental Setting",
      isActive: true, // Always active
      isCompleted: Boolean(config.environment),
    },
    {
      id: "baseType",
      icon: <FaLayerGroup />, // Fallback icon
      // image: getBaseTypeImage(),
      label: "Base Type",
      tooltip: "Select base type",
      isActive: config.lightType === "ceiling", // Only active for ceiling lights
      isCompleted: Boolean(config.baseType),
    },
    {
      id: "baseColor",
      icon: <FaPalette />,
      label: "Base Color",
      tooltip: "Colour Setting",
      isActive: config.lightType === "ceiling" && Boolean(config.baseType), // Active after base type is selected
      isCompleted: Boolean(config.baseColor),
    },

    {
      id: "lightAmount",
      icon: <FaRegLightbulb />, // Fallback icon
      // image: getLightAmountImage(),
      label: "Light Amount",
      tooltip: "Select number of lights",
      isActive: true, // Always active
      isCompleted: Boolean(config.lightAmount),
    },
    {
      id: "pendantSelection",
      icon: <IoMdSettings />,
      label:
        config.configurationType === "pendant"
          ? "Select Pendants"
          : "Select Systems",
      tooltip: "Configure Pendant",
      isActive: true, // Always active - fixed to allow switching back
      isCompleted: false,
    },
  ];

  return { steps };
};
