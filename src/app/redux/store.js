import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import themeReducer from './slices/themeSlice';
import cartReducer from './slices/cartSlice';
import favoritesReducer from './slices/favoritesSlice';
import productsReducer from './slices/productsSlice';
import slidesReducer from './slices/slidesSlice';
import slideAnalyticsReducer from './slices/slideAnalyticsSlice';
import assetsReducer from './slices/assetsSlice';
import activityReducer from './slices/activitySlice';
import authReducer from './slices/authSlice';
import barReducer from './slices/barSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,  
    bar: barReducer,
    theme: themeReducer,
    cart: cartReducer,
    favorites: favoritesReducer,
    products: productsReducer,
    slides: slidesReducer,
    slideAnalytics: slideAnalyticsReducer,
    assets: assetsReducer,
    activity: activityReducer,
    auth: authReducer,
  },
  // Add middleware or other store configuration here if needed
});

export default store;
