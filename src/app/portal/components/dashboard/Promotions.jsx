'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FaTag, 
  FaCopy, 
  FaCheck, 
  FaCalendarAlt, 
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaChevronDown,
  FaMobileAlt,
  FaExclamationCircle
} from 'react-icons/fa';

export default function Promotions({ promotions }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('validTo');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('active');
  const [copiedCode, setCopiedCode] = useState(null);
  
  // Filter and sort promotions
  const filteredPromotions = promotions
    .filter(promo => {
      // Filter by search term
      const matchesSearch = promo.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           promo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (promo.code && promo.code.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by status
      const matchesStatus = filterStatus === 'all' || promo.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by selected field
      let aValue, bValue;
      
      if (sortBy === 'validTo' || sortBy === 'validFrom') {
        aValue = new Date(a[sortBy]);
        bValue = new Date(b[sortBy]);
      } else if (sortBy === 'title') {
        aValue = a[sortBy];
        bValue = b[sortBy];
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    });
  
  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Calculate days remaining
  const getDaysRemaining = (endDateString) => {
    const endDate = new Date(endDateString);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Copy promo code to clipboard
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    
    // Reset copied status after 2 seconds
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Promotions & Offers</h2>
          <p className="text-gray-400 text-sm">
            View available discounts and special offers
          </p>
        </div>
        
        {/* Search and filters */}
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
              placeholder="Search promotions..."
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none bg-charleston-green-9 text-white pl-3 pr-8 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-9"
              >
                <option value="all">All Promotions</option>
                <option value="active">Active Only</option>
                <option value="expired">Expired</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <FaChevronDown className="text-gray-500 text-xs" />
              </div>
            </div>
            
            <button
              onClick={toggleSortOrder}
              className="flex items-center gap-2 bg-charleston-green-9 text-white px-3 py-2 rounded-md hover:bg-charleston-green-8 transition-colors"
            >
              <FaSortAmountDown className={sortOrder === 'desc' ? '' : 'rotate-180'} />
            </button>
          </div>
        </div>
      </div>
      
      {filteredPromotions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No promotions found.</p>
          <p className="text-gray-500 text-sm mt-2">
            Check back later for new offers and discounts.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPromotions.map(promo => {
            const daysRemaining = getDaysRemaining(promo.validTo);
            const isExpired = daysRemaining <= 0;
            const isEnding = daysRemaining <= 3 && !isExpired;
            
            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`bg-charleston-green-9 rounded-lg overflow-hidden ${isExpired ? 'opacity-70' : ''}`}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Promo image */}
                  <div className="relative h-48 md:h-auto">
                    <Image
                      src={promo.image}
                      alt={promo.title}
                      fill
                      className="object-cover"
                    />
                    {promo.appExclusive && (
                      <div className="absolute top-2 left-2 bg-emerald-9 text-white text-xs font-bold px-2 py-1 rounded">
                        App Exclusive
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-charleston-green-11 to-transparent opacity-50"></div>
                  </div>
                  
                  {/* Promo details */}
                  <div className="p-4 md:col-span-2">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">{promo.title}</h3>
                        <p className="text-gray-400 mb-4">{promo.description}</p>
                        
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <FaCalendarAlt className="text-emerald-9" />
                            <span className="text-gray-400">
                              Valid until {formatDate(promo.validTo)}
                            </span>
                          </div>
                          
                          {promo.appExclusive && (
                            <div className="flex items-center gap-2 text-sm">
                              <FaMobileAlt className="text-emerald-9" />
                              <span className="text-gray-400">App Exclusive</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Categories */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {promo.categories.map((category, index) => (
                            <span 
                              key={index}
                              className="bg-charleston-green-11 text-gray-300 text-xs px-2 py-1 rounded"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-center md:text-right">
                        <div className="inline-block bg-charleston-green-11 px-4 py-2 rounded-lg mb-3">
                          <div className="text-sm text-gray-400">Discount</div>
                          <div className="text-xl font-bold text-emerald-9">{promo.discount}</div>
                        </div>
                        
                        {isEnding && !isExpired && (
                          <div className="flex items-center gap-2 text-yellow-400 text-sm mb-3 justify-center md:justify-end">
                            <FaExclamationCircle />
                            <span>Ending soon! {daysRemaining} days left</span>
                          </div>
                        )}
                        
                        {isExpired && (
                          <div className="flex items-center gap-2 text-red-400 text-sm mb-3 justify-center md:justify-end">
                            <FaExclamationCircle />
                            <span>Expired</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Promo code and actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
                      {promo.code ? (
                        <div className="flex-1 flex items-center gap-2 bg-charleston-green-11 p-2 rounded-lg">
                          <div className="bg-charleston-green-9 px-3 py-2 rounded font-mono font-bold text-white flex-1 text-center">
                            {promo.code}
                          </div>
                          <button
                            onClick={() => copyToClipboard(promo.code)}
                            className="bg-charleston-green-9 text-white p-2 rounded hover:bg-charleston-green-8 transition-colors"
                            disabled={isExpired}
                          >
                            {copiedCode === promo.code ? <FaCheck className="text-green-500" /> : <FaCopy />}
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 text-gray-400 text-sm">
                          No code needed. Discount applied automatically at checkout.
                        </div>
                      )}
                      
                      <Link
                        href="/product-catalog"
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                          isExpired 
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                            : 'bg-emerald-9 text-white hover:bg-emerald-10'
                        }`}
                      >
                        <FaTag />
                        <span>Shop Now</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      
      {/* App download reminder */}
      <div className="mt-8 bg-gradient-to-r from-charleston-green-9 to-charleston-green-11 rounded-lg p-5 border border-emerald-9/30">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="md:w-2/3">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-emerald-9/20 p-2 rounded-full">
                <FaMobileAlt className="text-emerald-9 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Get App-Exclusive Promotions
              </h3>
            </div>
            
            <p className="text-gray-300 mb-4">
              Download the LIMI mobile app to access exclusive promotions and discounts not available on the web. Plus, get early access to sales and special offers.
            </p>
            
            <div className="flex gap-3">
              <Link 
                href="https://apps.apple.com/app/limi-lighting"
                target="_blank"
                className="flex items-center gap-2 bg-emerald-9 text-white px-4 py-2 rounded-md hover:bg-emerald-10 transition-colors"
              >
                <span>iOS App</span>
              </Link>
              <Link 
                href="https://play.google.com/store/apps/details?id=com.limi.lighting"
                target="_blank"
                className="flex items-center gap-2 bg-charleston-green-9 border border-emerald-9 text-emerald-9 px-4 py-2 rounded-md hover:bg-emerald-9 hover:text-white transition-colors"
              >
                <span>Android App</span>
              </Link>
            </div>
          </div>
          
          <div className="md:w-1/3">
            <div className="relative h-40 w-full rounded-lg overflow-hidden">
              <Image 
                src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1974&auto=format&fit=crop"
                alt="LIMI Mobile App"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charleston-green-11 to-transparent opacity-60"></div>
              <div className="absolute bottom-3 left-3 right-3">
                <div className="text-white font-semibold">LIMI Mobile App</div>
                <div className="text-sm text-gray-300">Exclusive offers await</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
