"use client";

import React, { useState, useEffect } from "react";
import { buildApi1Url } from '../../../../config/api.config';
import { useSelector, useDispatch } from "react-redux";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaArrowUp,
  FaArrowDown,
  FaImage,
  FaVideo,
  FaColumns,
  FaLayerGroup,
  FaBoxOpen,
  FaUserPlus,
} from "react-icons/fa";
import SlideEditor from "../../components/SlideCarousel/SlideEditor";
import SlideCarousel from "../../components/SlideCarousel";
import {
  addSlide,
  removeSlide,
  updateSlide,
  reorderSlides,
  setActiveSlideIndex,
  replaceAllSlides,
} from "../../redux/slices/slidesSlice";

// Import SlidesTemplates data
import { slideTemplates } from "../../data/slideTemplates.js";

// Import sub-components
import Header from "./SlideManagement/Header";
import PresentationSettings from "./SlideManagement/PresentationSettings";
import SlidePreview from "./SlideManagement/SlidePreview";
import SlideList from "./SlideManagement/SlideList";
import EditModal from "./SlideManagement/EditModal";
import AddCustomerModal from "./SlideManagement/AddCustomerModal";
// Import utility functions
import {
  getThemeBackgroundColor,
  getThemeStyles,
} from "./SlideManagement/utils/themeUtils";

export default function SlideManagement({ customer }) {
  const dispatch = useDispatch();
  const { slides, activeSlideIndex } = useSelector((state) => state.slides);
  const [customerSlides, setCustomerSlides] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success", // 'success' or 'error'
  });


  // Generate a unique ID for slides
  const generateUniqueId = (prefix = "slide") => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `${prefix}-${timestamp}-${randomStr}`;
  };

  // Function to fetch customer slides from API
  const fetchCustomerSlides = async (profileId) => {
    if (!profileId) return;

    setLoading(true);
    try {
      const response = await fetch(
        buildApi1Url(`/admin/slide/customers/${profileId}/slideshows`)
      );

      if (!response.ok) {
        throw new Error("Failed to fetch customer slides");
      }

      const data = await response.json();
      if (data.success && data.data.length > 0) {
        // Customer has existing slides
        setCustomerSlides(data.data[data.data.length - 1]);
        setShowTemplates(false);
       

        // Load slides into Redux store
        const slidesToLoad = data.data[data.data.length - 1].slides || [];
        // For now, we'll update the first slide and add the rest
        if (slidesToLoad.length > 0) {
          // First ensure all slides have unique IDs
          const processedSlides = slidesToLoad.map((slide, index) => {
            // Check if slide has no ID or if the ID is duplicated
            const isDuplicate =
              slidesToLoad.filter((s) => s.id === slide.id).length > 1;
            if (!slide.id || isDuplicate) {
              return {
                ...slide,
                id: generateUniqueId(`api-${index}`),
              };
            }
            return slide;
          });
          localStorage.setItem(
            `slides_${profileId}`,
            JSON.stringify(processedSlides)
          );

          // Replace the existing forEach loop with this:
          if (processedSlides.length > 0) {
            dispatch(replaceAllSlides(processedSlides));
            dispatch(setActiveSlideIndex(0));
          }

          // Also update presentation settings if available
          if (data.data[0].title || data.data[0].subtitle) {
            setPresentationSettings({
              title: data.data[0].title || "Presentation",
              subtitle:
                data.data[0].subtitle ||
                `Interactive presentation for ${
                  customer?.clientCompanyInfo || "{customerName}"
                }`,
              customerId: profileId,
            });
          }
        }
      } else {
        console.warn(`API returned no slides for customer ${profileId}`);
      }

      // If API fetch fails or returns no slides, try localStorage
      const storageKey = `slides_${profileId}`;
      const savedSlides = localStorage.getItem(storageKey);
      if (savedSlides) {
        const parsedSlides = JSON.parse(savedSlides);
        if (parsedSlides && parsedSlides.length > 0) {
          // Check for duplicate IDs in localStorage slides too
          const processedSlides = parsedSlides.map((slide, index) => {
            const isDuplicate =
              parsedSlides.filter((s) => s.id === slide.id).length > 1;
            if (!slide.id || isDuplicate) {
              return {
                ...slide,
                id: generateUniqueId(`local-${index}`),
              };
            }
            return slide;
          });

          // dispatch(replaceAllSlides(processedSlides));
          dispatch(setActiveSlideIndex(0));
       
          setShowTemplates(false);
        } else {
          // No slides in localStorage either, show templates
        
          setShowTemplates(true);
        }
      } else {
        // No slides in localStorage either, show templates
        setShowTemplates(true);
      }
    } catch (error) {
      console.error("Error fetching customer slides:", error);
      setNotification({
        show: true,
        message: `Error loading slides: ${error.message}`,
        type: "error",
      });
      setShowTemplates(true);
    } finally {
      setLoading(false);
    }
  };

  // Load customer-specific slides when customer changes
  useEffect(() => {
    if (customer && customer.profileId) {
      fetchCustomerSlides(customer.profileId);
    }
  }, [customer, dispatch]);
  const [previewMode, setPreviewMode] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);

  // Local state for form values to ensure real-time UI updates
  const [formState, setFormState] = useState({
    layout: "",
    media: { type: "image", position: "left", urls: [""] },
    text: {
      heading: "",
      subheading: "",
      description: "",
      bullets: [],
      alignment: "left",
      verticalPosition: "center",
      showHeading: true,
      showSubheading: true,
      showDescription: true,
      showBullets: false,
    },
    appearance: {
      theme: "charleston",
      backgroundColor: "#292929",
      overlayDarken: false,
      padding: "2rem",
    },
  });

  // Update formState when editingSlide changes
  useEffect(() => {
    if (editingSlide) {
      setFormState({
        layout: editingSlide.layout || "",
        media: {
          type: editingSlide.media?.type || "image",
          position: editingSlide.media?.position || "left",
          urls: [...(editingSlide.media?.urls || [""])],
        },
        text: {
          heading: editingSlide.text?.heading || "",
          subheading: editingSlide.text?.subheading || "",
          description: editingSlide.text?.description || "",
          bullets: [...(editingSlide.text?.bullets || [])],
          alignment: editingSlide.text?.alignment || "left",
          verticalPosition: editingSlide.text?.verticalPosition || "center",
          showHeading:
            editingSlide.text?.showHeading !== undefined
              ? editingSlide.text.showHeading
              : true,
          showSubheading:
            editingSlide.text?.showSubheading !== undefined
              ? editingSlide.text.showSubheading
              : true,
          showDescription:
            editingSlide.text?.showDescription !== undefined
              ? editingSlide.text.showDescription
              : true,
          showBullets:
            editingSlide.text?.showBullets !== undefined
              ? editingSlide.text.showBullets
              : false,
        },
        appearance: {
          theme: editingSlide.appearance?.theme || "charleston",
          backgroundColor:
            editingSlide.appearance?.backgroundColor || "#292929",
          overlayDarken:
            editingSlide.appearance?.overlayDarken !== undefined
              ? editingSlide.appearance.overlayDarken
              : false,
          padding: editingSlide.appearance?.padding || "2rem",
        },
      });
    }
  }, [editingSlide]);

  const [presentationSettings, setPresentationSettings] = useState({
    title: "Presentation",
    subtitle: `Interactive presentation for ${
      customer?.clientCompanyInfo || "{customerName}"
    }`,
    customerId: customer?.profileId || "",
  });

  // Load presentation settings from localStorage on component mount or when customer changes
  useEffect(() => {
    try {
      // Try to load customer-specific settings first
      const customerKey = `presentationSettings_${customer?.profileId}`;
      const savedSettings = localStorage.getItem(customerKey);

      if (savedSettings) {
        setPresentationSettings(JSON.parse(savedSettings));
      } else if (customer) {
        // If no saved settings for this customer, create new ones with customer info
        setPresentationSettings({
          title: "Presentation",
          subtitle: `Interactive presentation for ${customer.clientCompanyInfo}`,
          customerId: customer.profileId,
        });
      }
    } catch (error) {
      console.error("Error loading presentation settings:", error);
    }
  }, [customer]);

  // Handle adding a new slide
  const handleAddSlide = () => {
    // Create a modal element
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black bg-opacity-50 flex bg items-center justify-center z-50";

    // Create modal content
    const modalContent = document.createElement("div");
    modalContent.className =
      "bg-[#1e1e1e] p-6 rounded-lg shadow-xl max-w-lg w-full";

    // Add title
    const title = document.createElement("h2");
    title.className = "text-xl font-semibold mb-4 text-white";
    title.textContent = "Select Slide Type";
    modalContent.appendChild(title);

    // Create buttons container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "flex gap-3 justify-between";

    // Define slide types
    const slideTypes = [
      { id: "media-text-split", label: "Media + Text" },
      { id: "video-background", label: "Video Background" },
    ];

    // Create buttons for each type
    slideTypes.forEach((type) => {
      const button = document.createElement("button");
      button.className =
        "bg-[#54bb74] hover:bg-[#93cfa2] text-white px-3 py-2 rounded-md flex justify-center items-center flex-1";
      button.textContent = type.label;

      button.onclick = () => {
        // Remove modal
        document.body.removeChild(modal);

        // Create new slide with selected layout
        const newSlide = {
          id: generateUniqueId(),
          layout: type.id,
          media: {
            type: type.id === "video-background" ? "video" : "image",
            urls: [
              type.id === "video-background"
                ? "/videos/sample.mp4"
                : "/images/sample.jpg",
            ],
            position: type.id === "media-text-split" ? "left" : "background",
          },
          text: {
            heading: `New ${type.label} Slide`,
            subheading: "Click to edit",
            description: "Edit this slide content",
            bullets: ["Feature 1", "Feature 2", "Feature 3"],
            alignment: "left",
            verticalPosition: "center",
            showBullets: true,
          },
          appearance: {
            theme: "charleston",
            backgroundColor: "#2B2D2F",
            overlayDarken: false,
            padding: "2rem",
          },
          meta: {
            index: slides.length,
            status: "draft",
            updatedAt: new Date().toISOString(),
          },
        };

        dispatch(addSlide(newSlide));
        setEditingSlide(newSlide);
        setEditModalOpen(true);
      };

      buttonContainer.appendChild(button);
    });

    // Add close button
    const closeButton = document.createElement("button");
    closeButton.className =
      "mt-4 w-full p-2 bg-[#333] hover:bg-[#444] text-white rounded-md transition-colors";
    closeButton.textContent = "Cancel";
    closeButton.onclick = () => document.body.removeChild(modal);

    // Assemble modal
    modalContent.appendChild(buttonContainer);
    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);

    // Add modal to body
    document.body.appendChild(modal);
  };

  // Toggle between edit and preview modes
  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };

  // Handle opening the edit modal for a slide
  const handleEditSlide = (slide) => {
    setEditingSlide(slide);
    setEditModalOpen(true);
  };

  // Apply selected template
  const applyTemplate = (templateKey) => {
    if (!customer || !customer.profileId) {
      alert("Please select a customer before applying a template.");
      return;
    }

    const template = slideTemplates[templateKey];
    if (!template) return;

    // Clear existing slides first
    // We'll update the first slide and add the rest
    if (template.slides.length > 0) {
      // Update the first slide
      dispatch(updateSlide({ index: 0, slide: template.slides[0] }));

      // Add subsequent slides
      for (let i = 1; i < template.slides.length; i++) {
        dispatch(addSlide(template.slides[i]));
      }

      // Set active slide to first slide
      dispatch(setActiveSlideIndex(0));

      // Update presentation settings
      setPresentationSettings({
        title: "LIMI Lighting Solutions",
        subtitle: `Custom presentation for ${customer.clientCompanyInfo}`,
        customerId: customer.profileId,
      });

      // Hide templates after applying
      setShowTemplates(false);

      // Save immediately
      handleSaveChanges();
    }
  };

  // Check if slideshow exists for this customer
  const checkExistingSlideshow = async (profileId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        buildApi1Url(`/admin/slide/customers/${profileId}/slideshows`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.warn(
          `API returned status ${response.status} when checking for existing slideshows`
        );
        return { exists: false, id: null };
      }

      const data = await response.json();

      // Handle different API response structures
      if (data && data.success && data.data && data.data.length > 0) {
        // Standard API response with data array
        return { exists: true, id: data.data[0]._id || null };
      } else if (data && data._id) {
        // Direct object response
        return { exists: true, id: data._id };
      } else if (data && Array.isArray(data) && data.length > 0) {
        // Direct array response
        return { exists: true, id: data[0]._id || null };
      } else if (data && data.slides && data.slides.length > 0) {
        // Object with slides array
        return { exists: true, id: data._id || null };
      }

      return { exists: false, id: null };
    } catch (error) {
      console.error("Error checking existing slideshow:", error);
      return { exists: false, id: null };
    }
  };

  // Handle saving changes
  const handleSaveChanges = async () => {
    if (!customer || !customer.profileId) {
      alert("Please select a customer before saving.");
      return;
    }

    try {
      // First show a loading notification
      setNotification({
        show: true,
        message: "Saving slideshow...",
        type: "info",
      });

      // Save to localStorage with customer-specific key
      const storageKey = `slides_${customer.profileId}`;
      localStorage.setItem(storageKey, JSON.stringify(slides));

      // Also save presentation settings with customer-specific key
      const settingsKey = `presentationSettings_${customer.profileId}`;
      localStorage.setItem(settingsKey, JSON.stringify(presentationSettings));

      // Ensure all slides have unique IDs before saving to API
      // First check if slides array exists and has items
      if (!slides || !Array.isArray(slides) || slides.length === 0) {
        console.error("No slides to process:", slides);
        throw new Error("No slides available to save");
      }


      const processedSlides = slides
        .map((slide, index) => {
          // Ensure slide is a valid object
          if (!slide || typeof slide !== "object") {
            console.error("Invalid slide at index:", index, slide);
            return null;
          }

          // Check if slide has no ID or if the ID is duplicated
          const isDuplicate =
            slides.filter((s) => s.id === slide.id).length > 1;

          const processedSlide = {
            ...slide,
            id:
              !slide.id || isDuplicate
                ? generateUniqueId(`save-${index}`)
                : slide.id,
            meta: {
              ...(slide.meta || {}),
              index,
              status: "published",
              updatedAt: new Date().toISOString(),
            },
          };

          return processedSlide;
        })
        .filter(Boolean); // Remove any null entries

      if (processedSlides.length === 0) {
        console.error("No valid slides after processing");
        throw new Error("No valid slides to save");
      }


      // Update Redux state
      dispatch(updateSlide(processedSlides));

      // Prepare data for API
      const slideshowData = {
        customerId: customer.profileId,
        title: presentationSettings.title || "LIMI Lighting Solutions",
        subtitle:
          presentationSettings.subtitle ||
          `Custom presentation for ${customer.clientCompanyInfo}`,
        slides: processedSlides,
      };

      // Check if slideshow already exists
      // const { exists, id } = await checkExistingSlideshow(customer.profileId);

      // Save to API - use PUT if exists, POST if new
      const token = localStorage.getItem("token");
      let url = buildApi1Url('/admin/slide/slideshows');
      let method = "POST";
      let operationType = "created";

      // if (exists && id) {
      //   url = `https://api1.limitless-lighting.co.uk/admin/slide/slideshows/${id}`;
      //   method = 'POST';
      //   operationType = 'updated';
      // } else {
      // }

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(slideshowData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}):`, errorText);
        throw new Error(
          `API error: ${response.status} - ${errorText || "Unknown error"}`
        );
      }

      const data = await response.json();

      // If this was a new slideshow (POST), update the local state with the new ID
      if (method === "POST" && data && data._id) {
        setCustomerSlides(data);
      }

      // Dispatch a custom event to notify other components
      const event = new Event("slidesUpdated");
      window.dispatchEvent(event);

      // Show success notification
      setNotification({
        show: true,
        message: `Slideshow ${operationType} successfully!`,
        type: "success",
      });

      // Hide notification after 3 seconds
      setTimeout(() => {
        setNotification({
          ...notification,
          show: false,
        });
      }, 3000);
    } catch (error) {
      console.error("Error saving slideshow:", error);
      setNotification({
        show: true,
        message: `Error saving slideshow: ${error.message}`,
        type: "error",
      });
    }
  };

  // Notification component
  const NotificationMessage = () => {
    if (!notification.show) return null;

    return (
      <div
        className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-md shadow-lg transition-all duration-300 transform ${
          notification.show
            ? "translate-y-0 opacity-100"
            : "-translate-y-4 opacity-0"
        } ${
          notification.type === "success"
            ? "bg-[#54BB74]/90 text-white"
            : "bg-red-500/90 text-white"
        }`}
      >
        <div className="flex items-center">
          {notification.type === "success" ? (
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          ) : (
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          )}
          <span>{notification.message}</span>
        </div>
      </div>
    );
  };

  // Handle customer added event
  const handleCustomerAdded = (newCustomer) => {
    // Show success notification
    setNotification({
      show: true,
      message: `Customer ${newCustomer.clientCompanyInfo} added successfully!`,
      type: "success",
    });

    // Hide notification after 3 seconds
    setTimeout(() => {
      setNotification({
        ...notification,
        show: false,
      });
    }, 3000);
  };

  return (
    <div className="bg-[#1e1e1e] rounded-lg shadow-lg p-6 relative">
      <NotificationMessage />
      <div className="mb-6 bg-[#292929] p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            {customer ? (
              <div>
                <h2 className="text-xl font-[Amenti] text-[#93cfa2] mb-1">
                  Customer: {customer.clientCompanyInfo}
                </h2>
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-gray-300">
                    Managing slideshow for customer ID: {customer.profileId}
                  </p>
                  <a
                    href={`/customer/${customer.profileId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#333] hover:bg-[#444] text-white px-3 py-1 rounded-md text-sm flex items-center transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    View Customer Page
                  </a>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-[Amenti] text-[#93cfa2] mb-1">
                  No Customer Selected
                </h2>
                <p className="text-gray-300">
                  Please select a customer or add a new one to manage their
                  slideshow.
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="bg-[#54BB74] text-[#1e1e1e] px-4 py-2 rounded-md hover:bg-[#93cfa2] transition-colors flex items-center whitespace-nowrap"
          >
            <FaUserPlus className="mr-2" />
            {customer ? "Add Another Customer" : "Add Customer"}
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 border-t-4 border-[#54BB74] border-solid rounded-full animate-spin mb-6"></div>
          <p className="text-gray-300">Loading customer slideshow data...</p>
        </div>
      ) : showTemplates ? (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-[Amenti] text-[#93cfa2] mb-4">
              Start with a Template
            </h2>
            <p className="text-gray-300 mb-4">
              This customer doesn't have any slides yet. Choose a template to
              get started quickly with professionally designed slides.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Object.keys(slideTemplates).map((key) => (
              <div
                key={key}
                className="bg-[#292929] rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:translate-y-[-4px] cursor-pointer"
                onClick={() => setSelectedTemplate(key)}
              >
                <div className="h-40 bg-[#333] relative">
                  {/* Template thumbnail image */}
                  <div className="absolute inset-0 flex items-center justify-center text-[#93cfa2]">
                    {key === "modern" && <FaColumns size={48} />}
                    {key === "showcase" && <FaLayerGroup size={48} />}
                    {key === "corporate" && <FaColumns size={48} />}
                  </div>
                  {selectedTemplate === key && (
                    <div className="absolute inset-0 bg-[#54BB74]/20 flex items-center justify-center">
                      <div className="bg-[#54BB74] text-white px-3 py-1 rounded-full text-sm font-medium">
                        Selected
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-[#93cfa2] mb-1">
                    {slideTemplates[key].name}
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    {slideTemplates[key].description}
                  </p>
                  <div className="text-xs text-gray-400">
                    {slideTemplates[key].slides.length} slides
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => applyTemplate(selectedTemplate)}
              disabled={!selectedTemplate}
              className={`px-6 py-3 rounded-md text-lg flex items-center ${
                !selectedTemplate
                  ? "bg-[#333] text-gray-500 cursor-not-allowed"
                  : "bg-[#54BB74] text-[#1e1e1e] hover:bg-[#93cfa2]"
              }`}
            >
              <FaPlus className="mr-2" />
              Apply Template
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Header Component */}
          <Header
            togglePreviewMode={togglePreviewMode}
            previewMode={previewMode}
            handleSaveChanges={handleSaveChanges}
          />

          {/* Presentation Settings Component */}
          <PresentationSettings
            presentationSettings={presentationSettings}
            setPresentationSettings={setPresentationSettings}
            customer={customer}
            setShowAddCustomerModal={setShowAddCustomerModal}
          />

          {/* Main Content */}
          {previewMode ? (
            <SlidePreview />
          ) : (
            <div className="">
              {/* Slide List Component */}
              <SlideList
                slides={slides}
                activeSlideIndex={activeSlideIndex}
                handleAddSlide={handleAddSlide}
                handleEditSlide={handleEditSlide}
                dispatch={dispatch}
                setActiveSlideIndex={setActiveSlideIndex}
                removeSlide={removeSlide}
                reorderSlides={reorderSlides}
                addSlide={addSlide}
              />

              {/* Slide Editor */}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal Component */}
      {editModalOpen && editingSlide && (
        <EditModal
          editingSlide={editingSlide}
          formState={formState}
          setFormState={setFormState}
          setEditModalOpen={setEditModalOpen}
          dispatch={dispatch}
          slides={slides}
        />
      )}

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onCustomerAdded={handleCustomerAdded}
        token={localStorage.getItem("dashboardToken")}
      />
    </div>
  );
}
