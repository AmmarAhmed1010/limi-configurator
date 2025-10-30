import React, { useState, useEffect } from 'react';
import { buildApiUrl, buildApi1Url } from '../../../config/api.config';
import { FaClone, FaSpinner, FaSearch, FaEye, FaCheckSquare, FaSquare, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import SlidePreviewModal from './SlidePreviewModal';

/**
 * DuplicateSlideModal component for selecting and duplicating slides from other customers
 */
const DuplicateSlideModal = ({ isOpen, onClose, onDuplicate }) => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSlides, setCustomerSlides] = useState([]);
  const [selectedSlides, setSelectedSlides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewSlide, setPreviewSlide] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [slidesPerPage] = useState(9);

  // Fetch customers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  // Fetch customers from API
  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('dashboardToken');
      const response = await fetch(buildApiUrl('/client/get_customer_details/'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.success && Array.isArray(data.data)) {
        setCustomers(data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch slides for selected customer
  const fetchCustomerSlides = async (customerId) => {
    setLoading(true);
    setError(null);
    setCustomerSlides([]);
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('dashboardToken');
      const response = await fetch(buildApi1Url(`/admin/slide/customers/${customerId}/slideshows`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch slides: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different API response structures
      let slides = [];
      if (data && data.success && data.data && data.data.length > 0) {
        // Standard API response with data array
        slides = data.data[data.data.length - 1].slides || [];
      } else if (data && data.slides && data.slides.length > 0) {
        // Direct object response
        slides = data.slides;
      } else if (data && Array.isArray(data) && data.length > 0) {
        // Direct array response
        slides = data[0].slides || [];
      }

      // If API fetch fails or returns no slides, try localStorage
      if (slides.length === 0) {
        const storageKey = `slides_${customerId}`;
        const savedSlides = localStorage.getItem(storageKey);
        
        if (savedSlides) {
          try {
            const parsedSlides = JSON.parse(savedSlides);
            if (parsedSlides && parsedSlides.length > 0) {
              slides = parsedSlides;
            }
          } catch (e) {
            console.error('Error parsing saved slides:', e);
          }
        }
      }

      setCustomerSlides(slides);
      
      if (slides.length === 0) {
        setError('No slides found for this customer.');
      }
    } catch (err) {
      setError('Failed to load slides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setSelectedSlides([]);
    fetchCustomerSlides(customer.profileId);
  };

  // Handle slide selection
  const handleSlideSelect = (slide) => {
    setSelectedSlides(prevSelected => {
      // Check if slide is already selected
      const isAlreadySelected = prevSelected.some(s => s.id === slide.id);
      
      if (isAlreadySelected) {
        // If already selected, remove it
        return prevSelected.filter(s => s.id !== slide.id);
      } else {
        // If not selected, add it
        return [...prevSelected, slide];
      }
    });
  };

  // Handle duplicate button click
  const handleDuplicate = () => {
    if (selectedSlides.length > 0) {
      // Duplicate each selected slide
      selectedSlides.forEach(slide => {
        onDuplicate(slide);
      });
      onClose();
    }
  };

  // Handle preview slide
  const handlePreviewSlide = (slide, e) => {
    e.stopPropagation(); // Prevent triggering the selection
    setPreviewSlide(slide);
    setShowPreview(true);
  };

  // Handle select all slides
  const handleSelectAll = () => {
    if (selectedSlides.length === paginatedSlides.length) {
      // If all current page slides are selected, deselect them
      setSelectedSlides(prevSelected => 
        prevSelected.filter(slide => !paginatedSlides.some(s => s.id === slide.id))
      );
    } else {
      // Otherwise, select all slides on current page that aren't already selected
      setSelectedSlides(prevSelected => {
        const newSelected = [...prevSelected];
        paginatedSlides.forEach(slide => {
          if (!newSelected.some(s => s.id === slide.id)) {
            newSelected.push(slide);
          }
        });
        return newSelected;
      });
    }
  };
  
  // Calculate pagination
  const indexOfLastSlide = currentPage * slidesPerPage;
  const indexOfFirstSlide = indexOfLastSlide - slidesPerPage;
  const paginatedSlides = customerSlides.slice(indexOfFirstSlide, indexOfLastSlide);
  const totalPages = Math.ceil(customerSlides.length / slidesPerPage);
  
  // Check if all slides on current page are selected
  const allCurrentPageSelected = paginatedSlides.length > 0 && 
    paginatedSlides.every(slide => selectedSlides.some(s => s.id === slide.id));

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.clientCompanyInfo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.profileId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1e1e1e] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-[#333]">
          <h2 className="text-xl font-bold text-white">Duplicate Slide from Another Customer</h2>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {/* Search input */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#292929] border border-[#444] rounded-md py-2 pl-10 pr-4 text-white"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          {/* Customer selection */}
          {!selectedCustomer ? (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Select a Customer</h3>
              
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <FaSpinner className="animate-spin text-[#54bb74] text-2xl" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredCustomers.map(customer => (
                    <div
                      key={customer.profileId}
                      className="bg-[#292929] p-4 rounded-md hover:bg-[#333] cursor-pointer transition-colors"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <div className="font-medium text-white">{customer.clientCompanyInfo || 'Unnamed Customer'}</div>
                      <div className="text-sm text-gray-400">ID: {customer.profileId}</div>
                    </div>
                  ))}
                </div>
              )}

              {filteredCustomers.length === 0 && !loading && (
                <div className="text-center py-6 text-gray-400">
                  {searchTerm ? 'No customers match your search' : 'No customers found'}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Slides from {selectedCustomer.clientCompanyInfo}
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      (Select multiple slides by clicking on them)
                    </span>
                  </h3>
                  <div className="flex items-center mt-2">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center text-sm text-[#54bb74] hover:text-[#93cfa2] mr-4"
                    >
                      {allCurrentPageSelected ? <FaCheckSquare className="mr-1" /> : <FaSquare className="mr-1" />}
                      {allCurrentPageSelected ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-sm text-gray-400">
                      {selectedSlides.length} selected
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-[#54bb74] hover:text-[#93cfa2] text-sm"
                >
                  ← Back to customers
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <FaSpinner className="animate-spin text-[#54bb74] text-2xl" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedSlides.map((slide, index) => (
                      <div
                        key={`${slide.id}-${index}`}
                        className={`
                          bg-[#292929] p-3 rounded-md cursor-pointer transition-colors
                          ${selectedSlides.some(s => s.id === slide.id) ? 'ring-2 ring-[#54bb74]' : 'hover:bg-[#333]'}
                        `}
                        onClick={() => handleSlideSelect(slide)}
                      >
                        {/* Slide thumbnail */}
                        <div className="relative">
                          <div className="w-full h-32 bg-[#1e1e1e] rounded-md flex items-center justify-center mb-3 overflow-hidden">
                            {slide.media?.urls && slide.media.urls[0] ? (
                              <div 
                                className="w-full h-full bg-cover bg-center"
                                style={{ backgroundImage: `url(${slide.media.urls[0]})` }}
                              />
                            ) : (
                              <div className="text-gray-500">No preview</div>
                            )}
                          </div>
                          
                          {/* Preview button */}
                          <button 
                            className="absolute top-2 right-2 bg-black bg-opacity-70 text-white p-1 rounded-full hover:bg-opacity-90 transition-opacity"
                            onClick={(e) => handlePreviewSlide(slide, e)}
                            title="Preview slide"
                          >
                            <FaEye />
                          </button>
                        </div>
                        
                        <div className="font-medium text-white truncate">
                          {slide.text?.heading || `Slide ${indexOfFirstSlide + index + 1}`}
                        </div>
                        <div className="text-xs text-gray-400">{slide.layout}</div>
                        {slide.text?.description && (
                          <div className="text-xs text-gray-400 mt-1 truncate">
                            {slide.text.description.substring(0, 50)}{slide.text.description.length > 50 ? '...' : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-6 space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-white hover:bg-[#333]'}`}
                      >
                        <FaChevronLeft />
                      </button>
                      
                      <div className="px-4 py-2 text-white">
                        Page {currentPage} of {totalPages}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-500 cursor-not-allowed' : 'text-white hover:bg-[#333]'}`}
                      >
                        <FaChevronRight />
                      </button>
                    </div>
                  )}
                </>
              )}

              {customerSlides.length === 0 && !loading && (
                <div className="text-center py-6 text-gray-400">
                  No slides found for this customer
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[#333] flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#333] hover:bg-[#444] text-white rounded-md transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleDuplicate}
            disabled={selectedSlides.length === 0}
            className={`
              px-4 py-2 rounded-md flex items-center
              ${selectedSlides.length === 0 
                ? 'bg-[#333] text-gray-500 cursor-not-allowed' 
                : 'bg-[#54bb74] hover:bg-[#93cfa2] text-white'}
            `}
          >
            <FaClone className="mr-2" /> Duplicate Selected Slides ({selectedSlides.length})
          </button>
        </div>
      </div>
      
      {/* Slide Preview Modal */}
      <SlidePreviewModal
        slide={previewSlide}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
};

export default DuplicateSlideModal;
