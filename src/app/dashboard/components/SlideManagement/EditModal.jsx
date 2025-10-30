import React, { useState, useEffect } from 'react';
import { buildApi1Url } from '../../../config/api.config';
import { FaColumns, FaVideo, FaLayerGroup,FaExclamationCircle, FaUpload, FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';
import { getThemeStyles, getThemeBackgroundColor } from './utils/themeUtils';

// Import sub-components
import LayoutSelector from './EditModalComponents/LayoutSelector';
import MediaSettings from './EditModalComponents/MediaSettings';
import AppearanceSettings from './EditModalComponents/AppearanceSettings';
import TextSettings from './EditModalComponents/TextSettings';
import SlidePreviewPane from './EditModalComponents/SlidePreviewPane';

/**
 * EditModal component for editing slide properties
 */
const EditModal = ({ 
  editingSlide, 
  formState, 
  setFormState, 
  setEditModalOpen, 
  dispatch, 
  slides
}) => {
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track changes to detect unsaved work
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [formState]);

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit');
      return;
    }
    
    setUploadingMedia(true);
    setUploadError(null);
    setUploadSuccess(false);
    
    try {
      const formData = new FormData();
      formData.append('media', file);
      
      const response = await fetch(buildApi1Url('/admin/slide/upload-media'), {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract URL from the response data array
      let mediaUrl = '';
      if (data.success && data.data && data.data.length > 0 && data.data[0].url) {
        mediaUrl = data.data[0].url;
      }
      
      // Update form state with the new media URL
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      
      setFormState(prevState => ({
        ...prevState,
        media: {
          ...prevState.media,
          type: mediaType,
          urls: [mediaUrl],
        }
      }));
      
      // Also update Redux directly
      dispatch({
        type: 'slides/updateSlide',
        payload: {
          id: editingSlide.id,
          field: 'media',
          value: {
            ...formState.media,
            type: mediaType,
            urls: [mediaUrl],
          }
        }
      });
      
      setUploadSuccess(true);
      setHasUnsavedChanges(true);
    } catch (error) {
      setUploadError(error.message || 'Failed to upload file. Please try again or contact support.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    
    try {
      // Apply all form state changes to Redux at once
      dispatch({
        type: 'slides/updateSlide',
        payload: {
          id: editingSlide.id,
          field: 'layout',
          value: formState.layout
        }
      });
      
      dispatch({
        type: 'slides/updateSlide',
        payload: {
          id: editingSlide.id,
          field: 'media',
          value: formState.media
        }
      });
      
      dispatch({
        type: 'slides/updateSlide',
        payload: {
          id: editingSlide.id,
          field: 'text',
          value: formState.text
        }
      });
      
      dispatch({
        type: 'slides/updateSlide',
        payload: {
          id: editingSlide.id,
          field: 'appearance',
          value: formState.appearance
        }
      });
      
      // Save slides to localStorage for persistence
      localStorage.setItem('slides', JSON.stringify(slides));
      
      // Dispatch a custom event to notify other components
      const event = new Event('slidesUpdated');
      window.dispatchEvent(event);
      
      // Also trigger a storage event for cross-tab communication
      const storageEvent = new StorageEvent('storage', {
        key: 'slides',
        newValue: JSON.stringify(slides),
        url: window.location.href
      });
      window.dispatchEvent(storageEvent);
      
      setShowSuccessMessage(true);
      setHasUnsavedChanges(false);
      
      // Show success state briefly before closing
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEditModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        setEditModalOpen(false);
      }
    } else {
      setEditModalOpen(false);
    }
  };

  // If no slide is being edited, don't render the modal
  if (!editingSlide) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] pt-10 overflow-hidden">
      <div className="bg-[#292929] rounded-xl p-4 sm:p-6 md:p-8 w-full max-w-7xl overflow-y-auto shadow-2xl" style={{ maxHeight: '85vh' }}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Edit Slide</h2>
            {hasUnsavedChanges && (
              <p className="text-yellow-400 text-sm mt-1">You have unsaved changes</p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSaveChanges}
              disabled={saving || !hasUnsavedChanges}
              className="bg-[#54bb74] hover:bg-[#4ca868] text-white px-6 py-2.5 rounded-lg font-medium transition-all flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FaCheck />
                  <span>Save Changes</span>
                </>
              )}
            </button>
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-[#3a3a3a] transition-all"
              aria-label="Close modal"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {showSuccessMessage && (
          <div className="mb-6 bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-green-400 flex items-center">
            <FaCheck className="mr-2" />
            Changes saved successfully!
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Layout & Media */}
          <div className="space-y-6">
            <LayoutSelector 
              formState={formState}
              setFormState={setFormState}
              editingSlide={editingSlide}
              dispatch={dispatch}
            />
            
            <MediaSettings 
              formState={formState}
              setFormState={setFormState}
              editingSlide={editingSlide}
              dispatch={dispatch}
            />
            
            {/* File Upload Section */}
            <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#333] hover:border-[#444] transition-all">
              <div className="mb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-white">Upload Media</h3>
                    <p className="text-gray-400 text-xs mt-0.5">Formats: JPG, PNG, GIF, MP4, WebM • Max: 10MB</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded cursor-pointer transition-all hover:shadow-lg hover:shadow-[#54bb74]/10">
                      <FaUpload className="mr-2" />
                      {uploadingMedia ? 'Uploading...' : 'Choose File'}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*,video/*" 
                        onChange={handleFileUpload}
                        disabled={uploadingMedia}
                      />
                    </label>
                    {uploadingMedia && <FaSpinner className="text-[#54bb74] animate-spin" />}
                  </div>
                </div>
                {uploadSuccess && (
                  <div className="mt-2 text-[#54bb74] text-xs flex items-center gap-1">
                    <FaCheck className="text-[#54bb74]" />
                    File uploaded successfully!
                  </div>
                )}
                {uploadError && (
                  <div className="mt-2 text-red-400 text-xs flex items-center gap-1">
                    <FaExclamationCircle className="text-red-400" />
                    Error: {uploadError}
                  </div>
                )}
              </div>
            </div>
            
            <AppearanceSettings 
              formState={formState}
              setFormState={setFormState}
              editingSlide={editingSlide}
              dispatch={dispatch}
              getThemeBackgroundColor={getThemeBackgroundColor}
            />
          </div>
          
          {/* Right Column - Text Content & Preview */}
          <div>
            <TextSettings 
              formState={formState}
              setFormState={setFormState}
              editingSlide={editingSlide}
              dispatch={dispatch}
            />
            
            <SlidePreviewPane 
              formState={formState}
              getThemeStyles={getThemeStyles}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
