'use client';

import React, { useState } from 'react';
import { buildApiUrl } from '../../../config/api.config';
import { FaTimes, FaUserPlus } from 'react-icons/fa';

const AddCustomerModal = ({ isOpen, onClose, onCustomerAdded, token }) => {
  const [formData, setFormData] = useState({
    staffName: '',
    clientName: '',
    clientCompanyInfo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(buildApiUrl('/client/customer_capture'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add customer');
      }

      const data = await response.json();
      setSuccess(true);
      
      // Reset form
      setFormData({
        staffName: '',
        clientName: '',
        clientCompanyInfo: ''
      });
      
      // Notify parent component about the new customer
      if (onCustomerAdded && data.data) {
        onCustomerAdded(data.data);
      }
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error adding customer:', err);
      setError(err.message || 'An error occurred while adding the customer');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/70">
      <div className="bg-[#1e1e1e] rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-[#292929] px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-[Amenti] text-[#93cfa2] flex items-center">
            <FaUserPlus className="mr-2" /> Add New Customer
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {success ? (
            <div className="bg-[#54BB74]/20 border border-[#54BB74]/30 text-[#93cfa2] px-4 py-3 rounded mb-4">
              Customer added successfully!
            </div>
          ) : error ? (
            <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded mb-4">
              {error}
            </div>
          ) : null}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="staffName" className="block text-gray-300 mb-2">
                Staff Name
              </label>
              <input
                type="text"
                id="staffName"
                name="staffName"
                value={formData.staffName}
                onChange={handleChange}
                className="w-full bg-[#292929] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#54BB74] focus:border-transparent"
                placeholder="Your name"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="clientName" className="block text-gray-300 mb-2">
                Client Name
              </label>
              <input
                type="text"
                id="clientName"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                className="w-full bg-[#292929] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#54BB74] focus:border-transparent"
                placeholder="Client's name"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="clientCompanyInfo" className="block text-gray-300 mb-2">
                Client Company Information
              </label>
              <input
                type="text"
                id="clientCompanyInfo"
                name="clientCompanyInfo"
                value={formData.clientCompanyInfo}
                onChange={handleChange}
                className="w-full bg-[#292929] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#54BB74] focus:border-transparent"
                placeholder="Company name or information"
                required
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-[#333] text-white px-4 py-2 rounded mr-3 hover:bg-[#444] transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#54BB74] text-[#1e1e1e] px-6 py-2 rounded font-medium hover:bg-[#93cfa2] transition-colors flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#1e1e1e] border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaUserPlus className="mr-2" />
                    Add Customer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCustomerModal;
