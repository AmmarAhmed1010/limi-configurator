"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { listenForModelIdMessages } from "../../util/iframeCableMessageHandler";
import { listenForScreenshotUploadMessages } from "../../util/iframeCableMessageHandler";
export const SaveConfigModal = ({
  isOpen,
  onClose,
  onSave,
  handleCloseSaveModal,
  configSummary,
}) => {
  const [configName, setConfigName] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [modelId, setModelId] = useState(""); // <-- New state
  const [fetchingModelId, setFetchingModelId] = useState(false);
  const [loading, setLoading] = useState(false);
  if (!isOpen) return null;

  const getThumbnailFromIframe = () => {
    return new Promise((resolve) => {
      const iframe = document.getElementById("playcanvas-app");
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage("savedataimage", "*");
      }
    });
  };

  const [uploadSuccessData, setUploadSuccessData] = useState(null);
  const [modalIdString, setModalIdString] = useState("");
  const messageHandlerRef = useRef(null);
  useEffect(() => {
    if (!fetchingModelId) return;
    // Start listening for model_id messages
    const cleanup = listenForModelIdMessages((data, event) => {
      // Example: model_id:12345
      if (typeof data === "string" && data.startsWith("model_id")) {
        setModelId(data.split(" ")[1]);
        setFetchingModelId(false);
        setLoading(false);
      }
    });
    return () => {
      if (cleanup) cleanup();
    };
  }, [fetchingModelId]);
  // Clean up on modal close (remove any lingering handler)
  useEffect(() => {
    if (isOpen) {
      setFetchingModelId(true);
      setLoading(true);
    } else {
      setFetchingModelId(false);
      setLoading(false);
    }
    if (!isOpen && messageHandlerRef.current) {
      window.removeEventListener("message", messageHandlerRef.current);
      messageHandlerRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    // Listen for screenshot upload messages
    const cleanup = listenForScreenshotUploadMessages((data) => {
      const value = data.replace(/^ScreenShot\s*:\s*/, "");
      setThumbnail(value);
    });
    return () => {
      if (cleanup) cleanup();
    };
  }, [isOpen]);

  // Request thumbnail when modal is opened
  useEffect(() => {
    if (isOpen) {
      getThumbnailFromIframe();
    }
  }, [isOpen]);

  // Format the config summary for display
  const formatConfigSummary = () => {
    const { light_type, base_type, light_amount, cables, base_color } =
      configSummary;
    let summaryText = `Light Type: ${light_type}\n`;
    if (light_type === "ceiling") {
      summaryText += `Base Type: ${base_type}\n`;
    }
    summaryText += `Light Amount: ${light_amount}\n`;
    summaryText += `Base Color: ${base_color}\n\n`;

    summaryText += "Cables:\n";
    (cables || []).forEach((cable, idx) => {
      summaryText += `Cable ${idx + 1}: `;
      if (cable.isSystem) {
        // System cable
        const systemType = cable.systemType
          ? cable.systemType.charAt(0).toUpperCase() + cable.systemType.slice(1)
          : "Unknown";
        const design = cable.design
          ? cable.design.charAt(0).toUpperCase() +
            cable.design.slice(1).toLowerCase()
          : "";
        summaryText += `System\n  Type: ${systemType}\n  Design: ${design}\n  ${
          cable.size ? `Cable Size: ${cable.size}` : ""
        } \n`;
      } else {
        // Pendant cable - use camel case to Title Case
        const pendantName = cable.design
          ? cable.design.charAt(0).toUpperCase() +
            cable.design.slice(1).toLowerCase()
          : "";
        summaryText += `Pendant\n  Design: ${pendantName}\n  ${
          cable.size ? `Cable Size: ${cable.size}` : ""
        }\n`;
      }
    });

    return summaryText;
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            Save Configuration
          </h2>
          <button
            onClick={() => {
              onClose();
              handleCloseSaveModal();
            }}
            className="text-gray-400 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Configuration Name
          </label>
          <input
            type="text"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="My LIMI Configuration"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Configuration Summary
          </label>
          <pre className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white text-sm overflow-auto max-h-48">
            {formatConfigSummary()}
          </pre>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => {
              onClose();
              handleCloseSaveModal();
            }}
            className="mr-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              id="save_id"
              onClose();
              handleCloseSaveModal();
              onSave(configName, thumbnail, modelId);
              console.log("modelId", modelId);
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            disabled={!configName.trim() || loading || fetchingModelId}
          >
            <span id={modelId} className="text-lg">
              Save
            </span>
          </button>

          {(loading || fetchingModelId) && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 rounded-xl">
              <div className="text-white text-xl font-bold animate-pulse">
                Saving your configuration...
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SaveConfigModal;
