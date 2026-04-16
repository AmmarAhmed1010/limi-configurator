import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { buildApiUrl, buildApi1Url, API_CONFIG } from '../../config/api.config';

// Load user from localStorage if available
const loadUserFromStorage = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const savedUser = localStorage.getItem('limiUser');
    return savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    return null;
  }
};

// Save user to localStorage
const saveUserToStorage = (user) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('limiUser', JSON.stringify(user));
  } catch (error) {
  }
};

const savedUser = loadUserFromStorage();

// Default user data structure with mock data
const defaultUserData = {
  id: '',
  name: '',
  email: '',
  phone: '',
  avatar: '',
  notifications: {
    email: true,
    sms: false,
    app: true
  },
  addresses: [],
  paymentMethods: [],
  savedConfigurations: [],
  // Add token expiration tracking
  tokenExpiresAt: null
};

// Merge saved user with default structure to ensure all fields exist
const mergedUser = savedUser ? {
  ...defaultUserData,
  ...savedUser,
  // Ensure nested objects exist
  notifications: {
    ...defaultUserData.notifications,
    ...(savedUser.notifications || {})
  },
  addresses: savedUser.addresses || [],
  paymentMethods: savedUser.paymentMethods || [],
  savedConfigurations: savedUser.savedConfigurations || []
} : null;

const initialState = {
  isLoggedIn: !!mergedUser,
  user: mergedUser,
  registeredUsers: [],
  loginStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  signupStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  successMessage: null,
};

/**
 * Website email/password login: verify_otp + user profile (login form only — not used for signup).
 */
async function loginWithEmailPassword(email, password) {
  const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.VERIFY_OTP), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      isWebsiteLogin: true,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error_message || data.message || 'Login failed');
  }

  if (!data.data?.token) {
    throw new Error('No token received');
  }

  const token = data.data.token.startsWith('Bearer ')
    ? data.data.token
    : `${data.data.token}`;
  localStorage.setItem('limiToken', token);

  const profileResponse = await fetch(buildApi1Url(API_CONFIG.ENDPOINTS.USER_PROFILE), {
    headers: {
      Authorization: token,
    },
  });

  if (!profileResponse.ok) {
    throw new Error('Failed to fetch user profile');
  }

  const userData = await profileResponse.json();
  saveUserToStorage(userData);
  return userData;
}

/**
 * Token from send_otp success body — backend may nest differently after it verifies OTP server-side.
 */
function extractTokenFromSendOtpResponse(d) {
  if (!d || typeof d !== 'object') return null;
  const t =
    d?.data?.token ??
    d?.data?.data?.token ??
    d?.token ??
    d?.otp?.token ??
    d?.otp?.access_token ??
    d?.data?.access_token ??
    d?.access_token;
  return t != null && t !== '' ? t : null;
}

/** Persist token and load profile (signup success path — no verify_otp call). */
async function loadProfileAfterSendOtpToken(tokenRaw) {
  const token = String(tokenRaw).startsWith('Bearer ')
    ? tokenRaw
    : `${tokenRaw}`;
  localStorage.setItem('limiToken', token);
  const profileResponse = await fetch(buildApi1Url(API_CONFIG.ENDPOINTS.USER_PROFILE), {
    headers: { Authorization: token },
  });
  if (!profileResponse.ok) {
    throw new Error('Failed to fetch user profile');
  }
  const userData = await profileResponse.json();
  saveUserToStorage(userData);
  return userData;
}

// Real API login thunk
export const loginUser = createAsyncThunk(
  'user/login',
  async (credentials, { rejectWithValue }) => {
    try {
      if (!credentials.email || !credentials.password) {
        return rejectWithValue('Please enter both email and password');
      }

      const userData = await loginWithEmailPassword(
        credentials.email,
        credentials.password
      );
      return userData;
    } catch (error) {
      return rejectWithValue(error?.message || 'Login failed');
    }
  }
);

//Login through token 
export const fetchUserByToken = createAsyncThunk(
  'user/fetchUserByToken',
  async (token, { rejectWithValue }) => {
    try {
      if (!token) {
        return rejectWithValue('Token is required');
      }

      // Use token to fetch user profile
      const profileResponse = await fetch(buildApi1Url(API_CONFIG.ENDPOINTS.USER_PROFILE), {
        headers: {
          'Authorization': token.startsWith('Bearer ') ? token : `${token}`
        }
      });

      if (!profileResponse.ok) {
        return rejectWithValue('Failed to fetch user profile');
      }
      localStorage.setItem('limiToken', token);
      const userData = await profileResponse.json();
      // Save to localStorage
      saveUserToStorage(userData);

      return userData;
    } catch (error) {
      return rejectWithValue(error.error_message || 'Failed to fetch user by token');
    }
  }
);


// Real API signup thunk — website registration uses send_otp only (no verify_otp here)
export const signupUser = createAsyncThunk(
  'user/signup',
  async (userData, { rejectWithValue }) => {
    try {
      if (!userData.email || !userData.password || !userData.name) {
        return rejectWithValue('Please fill in all required fields');
      }

      const signupResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SEND_OTP), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.name,
          email: userData.email,
          password: userData.password,
          isWebsiteSignup: 'true',
        }),
      });

      const responseData = await signupResponse.json().catch(() => ({}));

      if (!signupResponse.ok) {
        return rejectWithValue(
          responseData.error_message ||
            responseData.message ||
            'Signup failed'
        );
      }

      // Signup calls only POST send_otp. Backend verifies OTP / account logic — never call verify_otp here.
      // When success is true and the response includes a session token, log in by loading profile.
      if (responseData.success === true) {
        const token = extractTokenFromSendOtpResponse(responseData);
        if (token) {
          try {
            const profile = await loadProfileAfterSendOtpToken(token);
            return { loggedIn: true, profile };
          } catch (e) {
            return rejectWithValue(
              e?.message || 'Account created but we could not load your profile.'
            );
          }
        }
        const otpMeta = responseData.otp;
        return {
          loggedIn: false,
          emailVerificationPending: true,
          message:
            responseData.message ||
            responseData.data?.message ||
            otpMeta?.message ||
            'Check your email to verify your account, then sign in.',
        };
      }

      return {
        loggedIn: false,
        emailVerificationPending: true,
        message:
          responseData.message ||
          responseData.data?.message ||
          responseData.otp?.message ||
          'Check your email to verify your account, then sign in.',
      };
    } catch (error) {
      return rejectWithValue(error?.message || 'Signup failed');
    }
  }
);

// Update user profile with real API
export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData, { getState, rejectWithValue }) => {
    try {
      // Get current user and token
      const { user } = getState().user;
      let token = localStorage.getItem('limiToken');
      
      if (!user || !token) {
        return rejectWithValue('Please log in to update your profile');
      }

      // Ensure token has Bearer prefix
      token = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      // Make API request with full URL
      const response = await fetch(buildApi1Url(API_CONFIG.ENDPOINTS.USER_PROFILE), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(profileData),
      });
      
      if (response.status === 401) {
        // Token might be expired, clear it
        localStorage.removeItem('limiToken');
        return rejectWithValue('Your session has expired. Please log in again.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || 'Failed to update profile. Please try again.');
      }
      
      // Return the updated user data from the response if available
      let updatedUser;
      try {
        updatedUser = await response.json();
      } catch (e) {
        // If no response body, use the profileData as fallback
        updatedUser = { ...user, ...profileData };
      }
      
      // Save to localStorage
      saveUserToStorage(updatedUser);
      
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error.message || 'Profile update failed');
    }
  }
);

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateUser: (state, action) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload,
          // Preserve nested objects if not provided in the update
          data: {
            ...state.user.data,
            ...(action.payload.data || {})
          }
        };
        saveUserToStorage(state.user);
      }
    },
    login: (state, action) => {
      state.isLoggedIn = true;
      state.user = action.payload;
      state.loginStatus = 'succeeded';
      state.error = null;
      
      // Save to localStorage
      saveUserToStorage(action.payload);
    },
    logout(state) {
      state.isLoggedIn = false;
      state.user = null;
      state.loginStatus = 'idle';
      state.error = null;
      
      // Clear user from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('limiUser');
      }
    },
    clearAuthStatus(state) {
      state.loginStatus = 'idle';
      state.signupStatus = 'idle';
      state.error = null;
      state.successMessage = null;
    },
    updatePersonalInfo(state, action) {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload
        };
        saveUserToStorage(state.user);
      }
    },
    updateNotificationPreferences(state, action) {
      if (state.user) {
        state.user.notifications = {
          ...state.user.notifications,
          ...action.payload
        };
        saveUserToStorage(state.user);
      }
    },
    addAddress(state, action) {
      if (state.user) {
        // Initialize addresses array if it doesn't exist
        if (!state.user.addresses) {
          state.user.addresses = [];
        }
        
        const newAddress = {
          id: `addr-${Date.now()}`,
          default: state.user.addresses.length === 0, // First address is default
          ...action.payload
        };
        
        state.user.addresses.push(newAddress);
        saveUserToStorage(state.user);
      }
    },
    updateAddress(state, action) {
      if (state.user) {
        const { id, ...addressData } = action.payload;
        state.user.addresses = state.user.addresses.map(addr => 
          addr.id === id ? { ...addr, ...addressData } : addr
        );
        saveUserToStorage(state.user);
      }
    },
    updateUserAvatar(state, action) {
      if (state.user) {
        try {
          state.user.avatar = action.payload;
          // Save to localStorage
          saveUserToStorage(state.user);
        } catch (error) {
          // The error will be caught by the error boundary or can be handled by the component
          throw error; // Re-throw to allow error handling in components
        }
      }
    },
    removeAddress(state, action) {
      if (state.user) {
        const addressId = action.payload;
        const removedAddress = state.user.addresses.find(addr => addr.id === addressId);
        
        state.user.addresses = state.user.addresses.filter(addr => addr.id !== addressId);
        
        // If we removed the default address and there are other addresses, make the first one default
        if (removedAddress?.default && state.user.addresses.length > 0) {
          state.user.addresses[0].default = true;
        }
        
        saveUserToStorage(state.user);
      }
    },
    setDefaultAddress(state, action) {
      if (state.user) {
        const addressId = action.payload;
        state.user.addresses = state.user.addresses.map(addr => ({
          ...addr,
          default: addr.id === addressId
        }));
        saveUserToStorage(state.user);
      }
    },
    addPaymentMethod(state, action) {
      if (state.user) {
        const newPaymentMethod = {
          id: `card-${Date.now()}`,
          default: state.user.paymentMethods.length === 0, // First payment method is default
          ...action.payload
        };
        
        state.user.paymentMethods.push(newPaymentMethod);
        saveUserToStorage(state.user);
      }
    },
    updatePaymentMethod(state, action) {
      if (state.user) {
        const { id, ...paymentData } = action.payload;
        state.user.paymentMethods = state.user.paymentMethods.map(method => 
          method.id === id ? { ...method, ...paymentData } : method
        );
        saveUserToStorage(state.user);
      }
    },
    removePaymentMethod(state, action) {
      if (state.user) {
        const paymentId = action.payload;
        const removedMethod = state.user.paymentMethods.find(method => method.id === paymentId);
        
        state.user.paymentMethods = state.user.paymentMethods.filter(method => method.id !== paymentId);
        
        // If we removed the default payment method and there are others, make the first one default
        if (removedMethod?.default && state.user.paymentMethods.length > 0) {
          state.user.paymentMethods[0].default = true;
        }
        
        saveUserToStorage(state.user);
      }
    },
    setDefaultPaymentMethod: (state, action) => {
      const id = action.payload;
      
      if (state.user) {
        state.user.paymentMethods = state.user.paymentMethods.map(method => ({
          ...method,
          isDefault: method.id === id
        }));
        
        // Save to localStorage
        saveUserToStorage(state.user);
      }
    },
    saveConfiguration: (state, action) => {
      const configData = action.payload;
      
      if (state.user) {
        // Generate a unique ID for the configuration
        const configId = `config_${Date.now()}`;
        
        // Add the configuration to the user's saved configurations
        state.user.savedConfigurations = [
          {
            id: configId,
            name: configData.name || `Configuration ${state.user.savedConfigurations.length + 1}`,
            date: new Date().toISOString(),
            configuration: configData,
            thumbnail: configData.thumbnail || '/images/default-config-thumbnail.jpg'
          },
          ...state.user.savedConfigurations
        ];
        
        // Save to localStorage
        saveUserToStorage(state.user);
      }
    },
    removeSavedConfiguration: (state, action) => {
      const configId = action.payload;
      
      if (state.user && state.user.savedConfigurations) {
        state.user.savedConfigurations = state.user.savedConfigurations.filter(
          config => config.id !== configId
        );
        
        // Save to localStorage
        saveUserToStorage(state.user);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loginStatus = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoggedIn = true;
        state.user = action.payload;
        state.loginStatus = 'succeeded';
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loginStatus = 'failed';
        state.error = action.payload || 'Login failed';
      })
      .addCase(fetchUserByToken.fulfilled, (state, action) => {
        state.user = action.payload; // or whatever your user data shape is
        state.isLoggedIn = true;
      })
      
      // Signup cases
      .addCase(signupUser.pending, (state) => {
        state.signupStatus = 'loading';
        state.error = null;
        state.successMessage = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        const payload = action.payload;
        state.signupStatus = 'succeeded';
        state.error = null;

        if (payload?.loggedIn && payload?.profile) {
          state.user = payload.profile;
          state.isLoggedIn = true;
          state.successMessage = null;
          state.loginStatus = 'succeeded';
          return;
        }

        state.successMessage =
          payload?.message ||
          'Check your email to verify your account, then sign in.';
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.signupStatus = 'failed';
        state.error = action.payload || 'Signup failed';
      });
  },
});

export const { 
  login, 
  logout, 
  clearAuthStatus, 
  updatePersonalInfo, 
  updateNotificationPreferences, 
  addAddress, 
  updateAddress, 
  removeAddress, 
  setDefaultAddress, 
  addPaymentMethod, 
  updatePaymentMethod, 
  removePaymentMethod, 
  setDefaultPaymentMethod,
  saveConfiguration,
  removeSavedConfiguration,
  updateUserAvatar,
  updateUser
} = userSlice.actions;

export default userSlice.reducer;
