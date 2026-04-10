'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FaHeart, 
  FaShoppingCart, 
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaChevronDown,
  FaStar,
  FaEye,
  FaTrash
} from 'react-icons/fa';

export default function Favorites({ favorites }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('addedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Get unique categories
  const categories = ['all', ...new Set(favorites.map(item => item.category))];
  
  // Filter and sort favorites
  const filteredFavorites = favorites
    .filter(item => {
      // Filter by search term
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by category
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Sort by selected field
      let aValue, bValue;
      
      if (sortBy === 'addedAt') {
        aValue = new Date(a[sortBy]);
        bValue = new Date(b[sortBy]);
      } else if (sortBy === 'price') {
        aValue = a[sortBy];
        bValue = b[sortBy];
      } else if (sortBy === 'name') {
        aValue = a[sortBy];
        bValue = b[sortBy];
      } else if (sortBy === 'rating') {
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
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Favorites</h2>
          <p className="text-gray-400 text-sm">
            View and manage your favorite LIMI products
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
              placeholder="Search favorites..."
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="appearance-none bg-charleston-green-9 text-white pl-3 pr-8 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-9"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <FaChevronDown className="text-gray-500 text-xs" />
              </div>
            </div>
            
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-charleston-green-9 text-white pl-3 pr-8 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-9"
              >
                <option value="addedAt">Date Added</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="rating">Rating</option>
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
      
      {filteredFavorites.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No favorites found.</p>
          <p className="text-gray-500 text-sm mt-2">
            Add products to your favorites to see them here.
          </p>
          <div className="mt-4">
            <Link
              href="/product-catalog"
              className="inline-flex items-center gap-2 bg-emerald-9 text-white px-4 py-2 rounded-md hover:bg-emerald-10 transition-colors"
            >
              <span>Browse Products</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFavorites.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-charleston-green-9 rounded-lg overflow-hidden group"
            >
              <div className="relative h-48">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2">
                  <button className="bg-charleston-green-11/80 text-red-500 p-2 rounded-full hover:bg-charleston-green-11 transition-colors">
                    <FaHeart />
                  </button>
                </div>
                {!item.inStock && (
                  <div className="absolute bottom-2 left-2 bg-red-900/80 text-white text-xs font-bold px-2 py-1 rounded">
                    Out of Stock
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-charleston-green-11 to-transparent opacity-0 group-hover:opacity-60 transition-opacity"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/product-catalog/${item.id}`}
                    className="bg-emerald-9 text-white p-3 rounded-full mx-2 hover:bg-emerald-10 transition-colors"
                  >
                    <FaEye />
                  </Link>
                  <button
                    className="bg-charleston-green-9 text-white p-3 rounded-full mx-2 hover:bg-charleston-green-8 transition-colors"
                    disabled={!item.inStock}
                  >
                    <FaShoppingCart />
                  </button>
                  <button
                    className="bg-charleston-green-9 text-white p-3 rounded-full mx-2 hover:bg-charleston-green-8 transition-colors"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <FaStar 
                      key={i} 
                      className={i < Math.floor(item.rating) ? 'text-yellow-400' : 'text-gray-600'} 
                      size={12}
                    />
                  ))}
                  <span className="text-gray-400 text-xs ml-1">({item.reviewCount})</span>
                </div>
                
                <h3 className="text-white font-medium mb-1">{item.name}</h3>
                
                <div className="flex justify-between items-center">
                  <div className="text-emerald-9 font-semibold">${item.price.toFixed(2)}</div>
                  <div className="text-xs text-gray-400">Added {formatDate(item.addedAt)}</div>
                </div>
                
                <div className="mt-3 flex gap-2">
                  <button
                    className="flex-1 flex items-center justify-center gap-1 bg-emerald-9 text-white px-3 py-2 rounded hover:bg-emerald-10 transition-colors disabled:bg-gray-700 disabled:text-gray-400"
                    disabled={!item.inStock}
                  >
                    <FaShoppingCart className="text-sm" />
                    <span className="text-sm">Add to Cart</span>
                  </button>
                  
                  <button
                    className="flex items-center justify-center gap-1 bg-charleston-green-9 border border-gray-700 text-white px-3 py-2 rounded hover:bg-charleston-green-8 transition-colors"
                  >
                    <FaTrash className="text-sm" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
