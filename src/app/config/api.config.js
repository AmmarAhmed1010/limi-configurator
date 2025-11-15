/**
 * Centralized API Configuration
 * 
 * This file contains all API base URLs and endpoints.
 * Change the environment here to switch between dev and production APIs.
 */

// Environment configuration - Change this to switch between environments
// Can be overridden by NEXT_PUBLIC_API_ENVIRONMENT env variable
const ENVIRONMENT = process.env.NEXT_PUBLIC_API_ENVIRONMENT || 'dev'; // Options: 'dev' or 'production'

// Base URL configurations for different environments
const API_BASE_URLS = {
  dev: {
    api: 'https://dev.api.limitless-lighting.co.uk',
    api1: 'https://dev.api1.limitless-lighting.co.uk',
    tracking: 'https://api.limitless-lighting.co.uk', // Tracking seems to use production
  },
  production: {
    api: 'https://api.limitless-lighting.co.uk',
    api1: 'https://api1.limitless-lighting.co.uk',
    tracking: 'https://api.limitless-lighting.co.uk',
  }
};

// Get current environment URLs
const currentEnv = API_BASE_URLS[ENVIRONMENT];

/**
 * API Configuration Object
 * Export this to use in your components
 */
export const API_CONFIG = {
  // Base URLs
  BASE_URL: currentEnv.api,
  BASE_URL_API1: currentEnv.api1,
  TRACKING_URL: currentEnv.tracking,
  
  // Environment info
  ENVIRONMENT,
  IS_DEV: ENVIRONMENT === 'dev',
  IS_PRODUCTION: ENVIRONMENT === 'production',
  
  // Common endpoints (you can add more as needed)
  ENDPOINTS: {
    // Client endpoints
    SEND_OTP: '/client/send_otp',
    VERIFY_OTP: '/client/verify_otp',
    USER_PROFILE: '/client/user/profile',
    UPDATE_PROFILE: '/client/update_profile',
    USER_PROFILE_PICTURE: '/client/user/profile/picture',
    TRACKING_CAPTURE: '/client/tracking_capture',
    TRACKING_UPDATE: '/client/tracking_update',
    
    // Admin endpoints
    INVESTOR_DETAILS: '/admin/dashboard/investor_details',
    PRODUCTS_WISHLIST: '/admin/products/light-configs/wishlist',
    LIGHT_CONFIGS: '/admin/products/light-configs',
    SLIDE_MANAGEMENT: '/admin/dashboard/slides',
    PENDANT_SYSTEMS: '/admin/products/pendant-systems',
    
    // Customer endpoints
    CUSTOMER_DATA: '/admin/customers',
  }
};

/**
 * Helper function to build full API URL
 * @param {string} endpoint - The endpoint path
 * @param {string} baseUrl - Optional base URL (defaults to BASE_URL)
 * @returns {string} Full API URL
 */
export const buildApiUrl = (endpoint, baseUrl = API_CONFIG.BASE_URL) => {
  // Remove leading slash from endpoint if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

/**
 * Helper function to get API URL with API1 base
 * @param {string} endpoint - The endpoint path
 * @returns {string} Full API URL using API1 base
 */
export const buildApi1Url = (endpoint) => {
  return buildApiUrl(endpoint, API_CONFIG.BASE_URL_API1);
};

/**
 * Helper function to get tracking API URL
 * @param {string} endpoint - The endpoint path
 * @returns {string} Full tracking API URL
 */
export const buildTrackingUrl = (endpoint) => {
  return buildApiUrl(endpoint, API_CONFIG.TRACKING_URL);
};

// Export default for convenience
export default API_CONFIG;
