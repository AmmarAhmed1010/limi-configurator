'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FaBox, 
  FaTruck, 
  FaCheck, 
  FaFileInvoice, 
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaExternalLinkAlt
} from 'react-icons/fa';

export default function OrderHistory({ orders }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  
  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      // Filter by search term
      const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by status
      const matchesStatus = filterStatus === 'all' || 
                           order.status.toLowerCase() === filterStatus.toLowerCase();
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by selected field
      const aValue = new Date(a[sortBy]);
      const bValue = new Date(b[sortBy]);
      
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
  
  // Toggle order details
  const toggleOrderDetails = (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
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
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return <FaBox className="text-yellow-500" />;
      case 'shipped':
        return <FaTruck className="text-blue-500" />;
      case 'delivered':
        return <FaCheck className="text-green-500" />;
      default:
        return <FaBox className="text-gray-500" />;
    }
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Order History</h2>
          <p className="text-gray-400 text-sm">
            View and track your LIMI lighting orders
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
              placeholder="Search orders..."
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none bg-charleston-green-9 text-white pl-3 pr-8 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-9"
              >
                <option value="all">All Status</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
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
      
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No orders found.</p>
          <p className="text-gray-500 text-sm mt-2">
            Your order history will appear here once you make a purchase.
          </p>
          <div className="mt-4">
            <button
              onClick={() => window.location.href = '/product-catalog'}
              className="inline-flex items-center gap-2 bg-emerald-9 text-white px-4 py-2 rounded-md hover:bg-emerald-10 transition-colors"
            >
              <span>Shop Now</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-charleston-green-9 rounded-lg overflow-hidden"
            >
              {/* Order header */}
              <div 
                className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer"
                onClick={() => toggleOrderDetails(order.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="bg-charleston-green-11 p-3 rounded-lg">
                    {getStatusIcon(order.status)}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{order.id}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        order.status.toLowerCase() === 'delivered' ? 'bg-green-900/30 text-green-400' :
                        order.status.toLowerCase() === 'shipped' ? 'bg-blue-900/30 text-blue-400' :
                        'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Ordered on {formatDate(order.date)}
                    </p>
                    <p className="text-sm text-gray-400">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold text-emerald-9">${order.total.toFixed(2)}</div>
                    {order.trackingNumber && (
                      <div className="text-xs text-gray-400">
                        Tracking: {order.trackingNumber.slice(0, 8)}...
                      </div>
                    )}
                  </div>
                  
                  <div className={`transition-transform ${expandedOrderId === order.id ? 'rotate-180' : ''}`}>
                    <FaChevronDown className="text-gray-400" />
                  </div>
                </div>
              </div>
              
              {/* Order details */}
              {expandedOrderId === order.id && (
                <div className="border-t border-gray-700 p-4">
                  {/* Order items */}
                  <div className="mb-6">
                    <h4 className="text-white font-medium mb-3">Order Items</h4>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="relative w-16 h-16 rounded-md overflow-hidden bg-charleston-green-11">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          
                          <div className="flex-1">
                            <div className="text-white font-medium">{item.name}</div>
                            <div className="text-sm text-gray-400">Qty: {item.quantity}</div>
                            <Link 
                              href={`/product-catalog/${item.id}`} 
                              target="_blank"
                              className="inline-flex items-center gap-1 text-xs text-emerald-9 hover:underline mt-1"
                            >
                              <span>View Product</span>
                              <FaExternalLinkAlt size={10} />
                            </Link>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-white">${item.price.toFixed(2)}</div>
                            <div className="text-sm text-gray-400">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Shipping information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-white font-medium mb-3">Shipping Address</h4>
                      <div className="bg-charleston-green-11 p-3 rounded-lg">
                        <p className="text-white">{order.shippingAddress.name}</p>
                        <p className="text-gray-400">{order.shippingAddress.street}</p>
                        <p className="text-gray-400">
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                        </p>
                        <p className="text-gray-400">{order.shippingAddress.country}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-medium mb-3">Order Summary</h4>
                      <div className="bg-charleston-green-11 p-3 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400">Subtotal:</span>
                          <span className="text-white">${(order.total * 0.9).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400">Shipping:</span>
                          <span className="text-white">$0.00</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400">Tax:</span>
                          <span className="text-white">${(order.total * 0.1).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-700">
                          <span className="text-white font-medium">Total:</span>
                          <span className="text-emerald-9 font-semibold">${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tracking information */}
                  {order.trackingNumber && (
                    <div className="mb-6">
                      <h4 className="text-white font-medium mb-3">Tracking Information</h4>
                      <div className="bg-charleston-green-11 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-gray-400">Tracking Number:</p>
                            <p className="text-white font-mono">{order.trackingNumber}</p>
                            {order.estimatedDelivery && (
                              <p className="text-sm text-gray-400 mt-2">
                                Estimated delivery: {formatDate(order.estimatedDelivery)}
                              </p>
                            )}
                          </div>
                          
                          <button className="bg-charleston-green-9 text-emerald-9 px-3 py-2 rounded-md hover:bg-charleston-green-8 transition-colors flex items-center gap-2">
                            <span>Track Package</span>
                            <FaExternalLinkAlt className="text-xs" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-charleston-green-9 border border-gray-700 text-white px-4 py-2 rounded-md hover:bg-charleston-green-8 transition-colors">
                      <FaFileInvoice />
                      <span>View Invoice</span>
                    </button>
                    
                    <button className="flex-1 flex items-center justify-center gap-2 bg-charleston-green-9 border border-gray-700 text-white px-4 py-2 rounded-md hover:bg-charleston-green-8 transition-colors">
                      <FaBox />
                      <span>Return Items</span>
                    </button>
                    
                    <button className="flex-1 flex items-center justify-center gap-2 bg-charleston-green-9 border border-gray-700 text-white px-4 py-2 rounded-md hover:bg-charleston-green-8 transition-colors">
                      <FaTruck />
                      <span>Contact Support</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
