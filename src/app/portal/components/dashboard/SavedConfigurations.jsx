"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import { fetchUserByToken } from "../../../redux/slices/userSlice";
import { buildApi1Url, API_CONFIG } from '../../../config/api.config';
import { downloadLightConfigPdf } from '../../../util/lightConfigPdfDownload';
import "react-toastify/dist/ReactToastify.css";
import {
  FaEye,
  FaShoppingCart,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaChevronDown,
  FaExternalLinkAlt,
  FaSpinner,
  FaFilePdf,
} from "react-icons/fa";

const CableItem = ({ designName, cableType, cableSize, additionalDetails }) => (
  <details className="group">
    <summary className="flex items-center justify-between p-3 rounded-lg border border-charleston-green-8 bg-charleston-green-11 cursor-pointer hover:bg-charleston-green-10 transition-colors duration-200">
      <div className="flex items-center">
        <span className="w-2 h-2 rounded-full bg-blue-500 mr-3"></span>
        <span className="font-medium text-white">{designName}</span>
        {cableSize && (
          <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-green-900/30 text-green-400 border border-green-800/50">
            Size: {cableSize} mm
          </span>
        )}
        {cableType && (
          <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-900/30 text-blue-400 border border-blue-800/50">
            {cableType}
          </span>
        )}
      </div>
      <svg
        className="w-4 h-4 text-gray-400 transform transition-transform duration-200 group-open:rotate-180"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </summary>
    <div className="mt-1 rounded-b-lg border border-t-0 border-charleston-green-8 bg-charleston-green-9 p-3">
      <div className="space-y-2">
        {cableSize && (
          <div className="flex justify-between text-sm py-1">
            <span className="text-gray-400">Size:</span>
            <span className="text-white">{cableSize} mm</span>
          </div>
        )}
        {additionalDetails.length > 0 && (
          <div className="pt-2 border-t border-gray-700">
            <div className="space-y-2">
              {additionalDetails.map(({ key, value }, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1">
                  <span className="text-gray-400">
                    {key.replace(/_/g, " ")}:
                  </span>
                  <span className="text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </details>
);

export default function SavedConfigurations({ isARView = false }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const [isFetchingByToken, setIsFetchingByToken] = useState(false);
  const [configurations, setConfigurations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [pdfDownloadingId, setPdfDownloadingId] = useState(null);

  // Token-based auto-login for AR view
  useEffect(() => {
    if (isARView) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get("token");
      if (urlToken) {
        setIsFetchingByToken(true);
        dispatch(fetchUserByToken(urlToken)).finally(() => {
          setIsFetchingByToken(false);
        });
      }
    }
  }, [dispatch, isARView]);

  // Fetch configurations when component mounts
  useEffect(() => {
    if (user?.data?._id) {
      fetchConfigurations();
    }
  }, [user]);

  // Fetch configurations from API
  const fetchConfigurations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        buildApi1Url('/admin/products/users/light-configs'),
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
      setConfigurations(data);
    } catch (error) {
      toast.error("Failed to load configurations");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete configuration
  const deleteConfiguration = async (configId) => {
    if (window.confirm("Are you sure you want to delete this configuration?")) {
      setIsDeleting(true);
      try {
        const response = await fetch(
          buildApi1Url(`/admin/products/light-configs/${configId}`),
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete configuration");
        }

        // Remove from local state
        setConfigurations((prev) =>
          prev.filter((config) => config._id !== configId)
        );

        // Close modal if the deleted config was selected
        if (selectedConfig && selectedConfig._id === configId) {
          setSelectedConfig(null);
        }

        toast.success("Configuration deleted successfully");
      } catch (error) {
        toast.error("Failed to delete configuration");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // View in configurator
  const viewInConfigurator = (configId) => {
    router.push(`/configurator?configId=${configId}`);
  };

  const handleDownloadPdf = async (config) => {
    const id = config?._id;
    if (!id) return;
    setPdfDownloadingId(id);
    try {
      const result = await downloadLightConfigPdf(id, {
        fileName: config?.name || `LIMI-Config-${id}`,
      });
      if (result.ok) {
        toast.success("Specification PDF downloaded");
      } else {
        toast.error(result.error || "Could not download PDF");
      }
    } finally {
      setPdfDownloadingId(null);
    }
  };

  // Filter and sort configurations
  const filteredConfigurations = configurations
    .filter((config) => {
      // Filter by search term
      const matchesSearch =
        searchTerm === "" ||
        (config.name &&
          config.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (config.config &&
          config.config.light_type &&
          config.config.light_type
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      // Filter by status - currently all configs have same status, but keeping for future use
      const matchesStatus = filterStatus === "all";

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by selected field
      let aValue, bValue;

      if (sortBy === "updatedAt" || sortBy === "createdAt") {
        aValue = new Date(a[sortBy] || a.createdAt).getTime();
        bValue = new Date(b[sortBy] || b.createdAt).getTime();
      } else if (sortBy === "name") {
        aValue = a.name || "";
        bValue = b.name || "";
      } else if (sortBy === "lightAmount") {
        aValue = a.config?.light_amount || 0;
        bValue = b.config?.light_amount || 0;
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    });

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };
  // View configuration details
  const viewConfigDetails = (config) => {
    setSelectedConfig(config);
  };

  // Close configuration details
  const closeConfigDetails = () => {
    setSelectedConfig(null);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      {!isARView && (
        <div>
          <h2 className="text-xl font-bold text-white">Saved Configurations</h2>
          <p className="text-gray-400 text-sm">
            View and manage your saved lighting configurations
          </p>
        </div>
      )}
        {/* Search and filters */}
        {!isARView && (
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:max-w-[250px]">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaSearch className="text-gray-500" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-charleston-green-9 text-white w-full pl-10 pr-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-9"
                placeholder="Search configurations..."
              />
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-2 bg-charleston-green-9 text-white px-3 py-2 rounded-md hover:bg-charleston-green-8 transition-colors"
                >
                  <FaFilter />
                  <span className="text-sm">
                    {filterStatus === "all" ? "All" : filterStatus}
                  </span>
                  <FaChevronDown className="text-xs" />
                </button>
                {showFilterDropdown && (
                  <div className="absolute top-full right-0 mt-1 bg-charleston-green-9 rounded-md shadow-lg z-10 w-40 py-1">
                    <button
                      onClick={() => {
                        setFilterStatus("all");
                        setShowFilterDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-white hover:bg-charleston-green-8 transition-colors"
                    >
                      All
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={toggleSortOrder}
                className="flex items-center gap-2 bg-charleston-green-9 text-white px-3 py-2 rounded-md hover:bg-charleston-green-8 transition-colors"
              >
                <FaSortAmountDown
                  className={sortOrder === "desc" ? "" : "rotate-180"}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : filteredConfigurations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No configurations found.</p>
          <p className="text-gray-500 text-sm mt-2">
            Create configurations in the configurator to see them here.
          </p>
          {!isARView && (
            <div className="mt-4">
              <Link
                href="/configurator"
                className="inline-flex items-center gap-2 bg-emerald-9 text-white px-4 py-2 rounded-md hover:bg-emerald-10 transition-colors"
              >
                <span>Go to Configurator</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredConfigurations.map((config) => (
            <motion.div
              key={config._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-charleston-green-9 rounded-lg overflow-hidden"
            >
              <div className="flex items-center h-[200px] w-full justify-center py-2 bg-charleston-green-9 border-b border-charleston-green-8">
                <Image
                  src={
                    // buildApi1Url(config.thumbnail?.url) ||
                    `/images/homepage-products/${
                      Math.floor(Math.random() * 7) + 1
                    }-mobile.jpg`
                  }
                  alt={config.name || "Configuration"}
                  height={1000}
                  width={1000}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>

              <div className="p-4 ">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {config.name || "Unnamed Configuration"}
                  </h3>
                  <span>{formatDate(config.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                  <div></div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!isARView && (
                    <button
                      onClick={() => viewConfigDetails(config)}
                      className="flex-1 flex items-center justify-center gap-1 bg-emerald-9 text-white px-3 py-2 rounded hover:bg-emerald-10 transition-colors"
                    >
                      <FaEye />
                      <span className="text-sm">View</span>
                    </button>
                  )}
                  
                  <button
                    id="open_id"
                    onClick={() => viewInConfigurator(config._id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-charleston-green-9 border border-emerald-9 text-emerald-9 px-3 py-2 rounded hover:bg-emerald-9 hover:text-white transition-colors"
                  >
                    <FaEdit />
                    <span id={config._id} className="text-sm">
                      Open
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(config)}
                    disabled={pdfDownloadingId === config._id}
                    className="flex items-center justify-center gap-1 bg-charleston-green-9 border border-gray-600 text-gray-200 px-3 py-2 rounded hover:border-emerald-9 hover:text-emerald-9 transition-colors disabled:opacity-50"
                    title="Download specification PDF"
                  >
                    {pdfDownloadingId === config._id ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaFilePdf />
                    )}
                  </button>

                  {!isARView && (
                    <button
                      onClick={() => deleteConfiguration(config._id)}
                      className="flex items-center justify-center gap-1 bg-charleston-green-9 border border-gray-700 text-white px-3 py-2 rounded hover:bg-red-600 hover:border-red-600 transition-colors"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaTrash />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Configuration Details Modal */}
      {selectedConfig && (
        <div className="fixed inset-0 pt-20 bg-black/80 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="my-8 w-full max-w-6xl overflow-hidden rounded-xl border border-charleston-green-8 bg-gradient-to-br from-charleston-green-11 to-charleston-green-14 shadow-2xl"
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between border-b border-charleston-green-8 bg-gradient-to-r from-charleston-green-11 to-charleston-green-12 p-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Configuration Details
                </h2>
                <p className="text-sm text-gray-400">
                  View and manage your lighting configuration
                </p>
              </div>
              <button
                onClick={closeConfigDetails}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-gray-400 hover:text-white"
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Section - Image & Actions */}
                <div className="w-full lg:w-2/5">
                  <div className="rounded-xl border border-charleston-green-8 bg-charleston-green-12 p-4 shadow-lg">
                    <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
                      <Image
                        src={buildApi1Url(selectedConfig.thumbnail?.url)}
                        alt={selectedConfig.name || "Configuration"}
                        fill
                        aspectRatio="1/1"
                        className="hover:scale-105 transition-transform duration-300"
                        priority
                      />
                    </div>

                    <div className="mb-6">
                      <h1 className="text-2xl font-bold text-white mb-1 truncate">
                        {selectedConfig.name || "Unnamed Configuration"}
                      </h1>
                      <div className="flex items-center text-sm text-gray-400">
                        <svg
                          className="w-4 h-4 mr-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Created: {formatDate(selectedConfig.createdAt)}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-3">
                      {!isARView && (
                        <button
                          onClick={() => viewInConfigurator(selectedConfig._id)}
                          className="group flex transform items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-9 to-emerald-10 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-emerald-9/20"
                        >
                          <FaEdit className="h-4 w-4 transition-transform group-hover:scale-110" />
                          <span>Open in Configurator</span>
                        </button>
                      )}

                      {!isARView && (
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(selectedConfig)}
                          disabled={pdfDownloadingId === selectedConfig._id}
                          className="group flex items-center justify-center gap-2 rounded-lg border border-charleston-green-7 bg-charleston-green-12 px-6 py-3 font-medium text-white transition-all hover:border-emerald-9 hover:text-emerald-9 disabled:opacity-60"
                        >
                          {pdfDownloadingId === selectedConfig._id ? (
                            <FaSpinner className="h-4 w-4 animate-spin" />
                          ) : (
                            <FaFilePdf className="h-4 w-4" />
                          )}
                          <span>Download specification PDF</span>
                        </button>
                      )}

                      {!isARView && (
                        <button
                          onClick={() =>
                            deleteConfiguration(selectedConfig._id)
                          }
                          disabled={isDeleting}
                          className="group flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isDeleting ? (
                            <>
                              <FaSpinner className="h-4 w-4 animate-spin" />
                              <span>Deleting...</span>
                            </>
                          ) : (
                            <>
                              <FaTrash className="h-4 w-4 transition-transform group-hover:scale-110" />
                              <span>Delete Configuration</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Section - Details */}
                <div className="w-full lg:w-3/5 space-y-6">
                  {/* Configuration Details */}
                  <div className="overflow-hidden rounded-xl border border-charleston-green-8 bg-gradient-to-br from-charleston-green-12 to-charleston-green-14 shadow-lg">
                    <div className="border-b border-charleston-green-8 bg-gradient-to-r from-charleston-green-12 to-charleston-green-11 p-5">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-white">
                          Configuration Specifications
                        </h3>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="space-y-1.5 text-sm">
                        {selectedConfig.config?.light_type && (
                          <div className="flex justify-between py-1">
                            <span className="text-gray-400">Light Type</span>
                            <span className="text-white">
                              {selectedConfig.config.light_type}
                            </span>
                          </div>
                        )}
                        {selectedConfig.config?.cable_color && (
                          <div className="flex justify-between py-1">
                            <span className="text-gray-400">Base Color</span>
                            <span className="text-white">
                              {selectedConfig.config.cable_color}
                            </span>
                          </div>
                        )}
                        {selectedConfig.config?.light_amount && (
                          <div className="flex justify-between py-1">
                            <span className="text-gray-400">Light Amount</span>
                            <span className="text-white">
                              {selectedConfig.config.light_amount}
                            </span>
                          </div>
                        )}
                        {selectedConfig.config?.base_type && (
                          <div className="flex justify-between py-1">
                            <span className="text-gray-400">Base Type</span>
                            <span className="text-white">
                              {selectedConfig.config.base_type}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cables Section - Accordion */}
                  {selectedConfig.config?.cables &&
                    Object.keys(selectedConfig.config.cables).length > 0 && (
                      <div className="overflow-hidden rounded-xl border border-charleston-green-8 bg-gradient-to-br from-charleston-green-12 to-charleston-green-14 shadow-lg">
                        <div className="border-b border-charleston-green-8 bg-gradient-to-r from-charleston-green-12 to-charleston-green-11 p-5">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">
                              Cable Configuration
                            </h3>
                            <div className="text-sm text-gray-400">
                              {Object.keys(selectedConfig.config.cables).length}{" "}
                              cables
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              {Object.entries(selectedConfig.config.cables)
                                .filter(([key]) => parseInt(key) < 3)
                                .map(([key, value]) => {
                                  const cableData = value
                                    .split("\n")
                                    .reduce((acc, line) => {
                                      const [k, v] = line
                                        .split(":")
                                        .map((s) => s.trim());
                                      if (k && v) acc[k] = v;
                                      return acc;
                                    }, {});

                                  const cableNumber = parseInt(key) + 1;
                                  const designName =
                                    cableData.design_name ||
                                    `Cable ${cableNumber}`;
                                  const cableType = cableData.type;
                                  let cableSize =
                                    selectedConfig.config?.cableConfig[
                                      cableNumber - 1
                                    ]?.size;
                                  if (
                                    typeof cableSize === "string" &&
                                    cableSize
                                      .trim()
                                      .toLowerCase()
                                      .endsWith("mm")
                                  ) {
                                    cableSize = cableSize
                                      .replace(/mm$/i, "")
                                      .trim();
                                  }

                                  const additionalDetails = Object.entries(
                                    cableData
                                  )
                                    .filter(
                                      ([k]) =>
                                        ![
                                          "design_name",
                                          "type",
                                          "size",
                                        ].includes(k)
                                    )
                                    .map(([k, v]) => ({ key: k, value: v }));

                                  return (
                                    <CableItem
                                      key={key}
                                      designName={designName}
                                      cableType={cableType}
                                      cableSize={cableSize}
                                      additionalDetails={additionalDetails}
                                    />
                                  );
                                })}
                            </div>
                            <div className="space-y-2">
                              {Object.entries(selectedConfig.config.cables)
                                .filter(([key]) => parseInt(key) >= 3)
                                .map(([key, value]) => {
                                  const cableData = value
                                    .split("\n")
                                    .reduce((acc, line) => {
                                      const [k, v] = line
                                        .split(":")
                                        .map((s) => s.trim());
                                      if (k && v) acc[k] = v;
                                      return acc;
                                    }, {});

                                  const cableNumber = parseInt(key) + 1;
                                  const designName =
                                    cableData.design_name ||
                                    `Cable ${cableNumber}`;
                                  const cableType = cableData.type;
                                  let cableSize =
                                    selectedConfig.config?.cableConfig[
                                      cableNumber - 1
                                    ]?.size;
                                  if (
                                    typeof cableSize === "string" &&
                                    cableSize
                                      .trim()
                                      .toLowerCase()
                                      .endsWith("mm")
                                  ) {
                                    cableSize = cableSize
                                      .replace(/mm$/i, "")
                                      .trim();
                                  }

                                  const additionalDetails = Object.entries(
                                    cableData
                                  )
                                    .filter(
                                      ([k]) =>
                                        ![
                                          "design_name",
                                          "type",
                                          "size",
                                        ].includes(k)
                                    )
                                    .map(([k, v]) => ({ key: k, value: v }));

                                  return (
                                    <CableItem
                                      key={key}
                                      designName={designName}
                                      cableType={cableType}
                                      cableSize={cableSize}
                                      additionalDetails={additionalDetails}
                                    />
                                  );
                                })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
