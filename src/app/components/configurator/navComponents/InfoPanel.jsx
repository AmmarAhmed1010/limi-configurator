import React from 'react';
import { FaMouse, FaMousePointer, FaMousePointer as FaMouseScroll, FaDownload } from 'react-icons/fa';

const InfoPanel = () => {
  return (
    <div className="p-4 w-64">
      <h3 className="text-lg font-medium mb-4">Navigation Guide</h3>
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className="mt-1">
            <FaMousePointer className="text-gray-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-800">Rotate View</h4>
            <p className="text-sm text-gray-600">Left-click and drag to rotate the view</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="mt-1">
            <FaMouse className="text-gray-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-800">Pan View</h4>
            <p className="text-sm text-gray-600">Right-click and drag to pan the view</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="mt-1">
            <FaMouseScroll className="text-gray-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-800">Zoom</h4>
            <p className="text-sm text-gray-600">Scroll up to zoom in, scroll down to zoom out</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="mt-1">
            <FaDownload className="text-gray-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-800">Download Model</h4>
            <p className="text-sm text-gray-600">
              Save your configured light in My favourite, access it from My Profile to download model.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;
