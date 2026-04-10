"use client";
import { FaCamera, FaSave } from "react-icons/fa";
import { useState, useRef } from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import {
  FaUser,
  FaEnvelope,
  FaMobileAlt,
  FaBell,
  FaHome,
  FaCreditCard,
  FaEdit,
  FaTrash,
  FaPlus,
  FaShieldAlt,
} from "react-icons/fa";
import {
  updateNotificationPreferences,
  addAddress,
  updateAddress,
  updateUserAvatar,
  removeAddress,
  setDefaultAddress,
  addPaymentMethod,
  updatePaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
} from "../../../redux/slices/userSlice";
import { buildApi1Url, buildApiUrl, API_CONFIG } from '../../../config/api.config';

export default function AccountSettings({ user, onUserUpdate }) {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("profile");
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Form state for editing (to avoid direct Redux updates until form submission)
  const [formData, setFormData] = useState({
    username: user.data.username || "",
    email: user.data.email || "",
    phone: user.data.phone || "",
    password: user.data.password || "••••••••••",
  });

  // Address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [originalAddress, setOriginalAddress] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    type: "Home",
    name: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });
  const [editingAddressId, setEditingAddressId] = useState(null);

  // Payment method form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    type: "Credit Card",
    name: user?.name || "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [editingPaymentId, setEditingPaymentId] = useState(null);

  // Profile picture upload state
  const fileInputRef = useRef(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");
  // Track if profile picture was changed
  const [profilePicChanged, setProfilePicChanged] = useState(false);

  // Handle form submission
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Helper function to fetch fresh user data
  const fetchUserData = async () => {
    const token = localStorage.getItem("limiToken");
    if (!token) return null;

    try {
      const response = await fetch(
        buildApi1Url(API_CONFIG.ENDPOINTS.USER_PROFILE),
        {
          headers: { Authorization: token },
        }
      );

      if (!response.ok) {
        // Check if it's an invalid/expired token error
        try {
          const errorData = await response.json();
          if (errorData.message === "Invalid or expired token.") {
            // Clear token from localStorage and redirect to login
            localStorage.removeItem('limiToken');
            localStorage.removeItem('limiUser');
            window.location.href = '/login';
            return null;
          }
        } catch (parseError) {
          // If we can't parse the error response, fall back to generic error
        }
        throw new Error("Failed to fetch user data");
      }

      const userData = await response.json();
      localStorage.setItem("limiUser", JSON.stringify(userData));
      return userData;
    } catch (error) {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError("");

    try {
      // Prepare the update data according to the API spec
      const updateData = {
        username: formData.username,
        phone: formData.phone,
        email: formData.email,
        emailNotification: user?.notifications?.email || false,
        smsNotification: user?.notifications?.sms || false,
        appNotification: user?.notifications?.app || false,
      };

      // Only include password if it's being changed
      if (formData.password && formData.password !== "••••••••••") {
        updateData.password = formData.password;
      }

      // Include address if available
      const defaultAddress = user?.addresses?.find(addr => addr.default) || user?.addresses?.[0];
      if (defaultAddress) {
        updateData.address = {
          fullName: defaultAddress.name,
          phone: defaultAddress.phone || formData.phone,
          street: defaultAddress.street,
          city: defaultAddress.city,
          state: defaultAddress.state,
          postalCode: defaultAddress.zip,
          country: defaultAddress.country
        };
      }

      // Include payment methods if available
      const defaultPayment = user?.paymentMethods?.find(pm => pm.default) || user?.paymentMethods?.[0];
      if (defaultPayment) {
        updateData.paymentMethods = [{
          cardType: defaultPayment.type,
          cardHolder: defaultPayment.name,
          cardNumber: defaultPayment.cardNumber,
          expiryDate: defaultPayment.expiry,
          cvv: defaultPayment.cvv
        }];
      }

      // Get the token from localStorage
      const token = localStorage.getItem("limiToken");
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      // Make the API call to update profile
      const response = await fetch(
        buildApi1Url(API_CONFIG.ENDPOINTS.USER_PROFILE),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update profile");
      }

      // Fetch fresh user data after successful update
      const updatedUser = await fetchUserData();
      if (!updatedUser) {
        throw new Error("Profile updated but failed to refresh user data");
      }

      // Update the user data in the parent component and Redux store
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      // Update local state
      setFormData({
        username: updatedUser.data.username || "",
        email: updatedUser.data.email || "",
        phone: updatedUser.data.phone || "",
        password: "••••••••••", // Reset to masked password
      });

      setEditMode(false);
    } catch (error) {
      setSaveError(
        error.message || "Failed to update profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle notification settings
  const toggleNotification = (type) => {
    dispatch(
      updateNotificationPreferences({
        [type]: !user.notifications[type],
      })
    );
  };

  // Handle address functions
  const handleAddAddress = (newAddress) => {
    dispatch(addAddress(newAddress));
  };

  const handleUpdateAddress = (id, addressData) => {
    dispatch(updateAddress({ id, ...addressData }));
  };

  const handleRemoveAddress = (id) => {
    dispatch(removeAddress(id));
  };

  const handleSetDefaultAddress = (id) => {
    dispatch(setDefaultAddress(id));
  };

  // Handle payment method functions
  const handleAddPaymentMethod = (newPaymentMethod) => {
    dispatch(addPaymentMethod(newPaymentMethod));
  };

  const handleUpdatePaymentMethod = (id, paymentData) => {
    dispatch(updatePaymentMethod({ id, ...paymentData }));
  };

  const handleRemovePaymentMethod = (id) => {
    dispatch(removePaymentMethod(id));
  };

  const handleSetDefaultPaymentMethod = (id) => {
    dispatch(setDefaultPaymentMethod(id));
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size exceeds 5MB limit");
      return;
    }

    // Check file type
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setUploadError(
        "Invalid file type. Please upload a JPG, PNG, or GIF image."
      );
      return;
    }

    setUploadingMedia(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const token = localStorage.getItem("limiToken");
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      // Upload profile picture using PUT method
      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.UPDATE_PROFILE),
        {
          method: "PATCH",
          body: formData,
          headers: {
            Authorization: token,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Upload failed with status: ${response.status}`
        );
      }

      // Get the updated user data from the response
      const updatedUser = await fetchUserData();
      if (!updatedUser) {
        throw new Error("Profile updated but failed to refresh user data");
      }

      // Update the avatar in Redux store and localStorage
      dispatch(updateUserAvatar(updatedUser.data.profilePicture.url));

      // Update parent component with new user data
      // if (onLogin) {
      //   onLogin(updatedUser);
      // }
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      setUploadError(
        error.message ||
          "Failed to upload profile picture. Please try again or contact support."
      );
    } finally {
      setUploadingMedia(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle remove profile picture
  const handleRemovePicture = async () => {
    if (
      !window.confirm("Are you sure you want to remove your profile picture?")
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("limiToken");
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const response = await fetch(
        buildApi1Url(API_CONFIG.ENDPOINTS.USER_PROFILE_PICTURE),
        {
          method: "DELETE",
          headers: {
            Authorization: token,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to remove profile picture"
        );
      }

      // Get updated user data
      const profileResponse = await fetch(
        buildApi1Url(API_CONFIG.ENDPOINTS.USER_PROFILE),
        {
          headers: { Authorization: token },
        }
      );

      if (!profileResponse.ok) {
        throw new Error("Failed to fetch updated profile");
      }

      const updatedUser = await profileResponse.json();
      // Update Redux store with empty avatar
      dispatch(updateUserAvatar({ url: "" }));

      // Update parent component with the new user data
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      // Show success message
      setUploadSuccess(true);
      setProfilePicChanged((prev) => !prev); // Trigger profile reload
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      setUploadError(error.message || "Failed to remove profile picture");
    }
  };

  // Reload user data when profile picture changes
  useEffect(() => {
    const reload = async () => {
      const updatedUser = await fetchUserData();
      if (updatedUser && onUserUpdate) {
        onUserUpdate(updatedUser);
      }
    };
    if (profilePicChanged) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilePicChanged]);

  // Render profile tab
  const renderProfileTab = () => (
    <div className="space-y-8">
      <div className="rounded-xl bg-charleston-green-11 p-0 shadow-lg sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white">
              Personal Information
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Update your personal details and contact information
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <FaUser className="text-gray-500 text-sm" />
                </div>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="bg-charleston-green-9 text-white w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-700 focus:border-emerald-9 focus:ring-2 focus:ring-emerald-9/20 focus:outline-none transition-all duration-200"
                    placeholder="Enter your full name"
                    required
                  />
                ) : (
                  <div className="bg-charleston-green-9 text-white w-full pl-10 pr-4 py-2.5 rounded-lg border border-transparent">
                    {formData.username || (
                      <span className="text-gray-500">Not set</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <FaEnvelope className="text-gray-500 text-sm" />
                </div>
                {editMode ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="bg-charleston-green-9 text-white w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-700 focus:border-emerald-9 focus:ring-2 focus:ring-emerald-9/20 focus:outline-none transition-all duration-200"
                    placeholder="your.email@example.com"
                    required
                  />
                ) : (
                  <div className="bg-charleston-green-9 text-white w-full pl-10 pr-4 py-2.5 rounded-lg border border-transparent">
                    {formData.email || (
                      <span className="text-gray-500">Not set</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Phone Number Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Phone Number
                </label>
                <span className="text-xs text-gray-500">Optional</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <FaMobileAlt className="text-gray-500 text-sm" />
                </div>
                {editMode ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="bg-charleston-green-9 text-white w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-700 focus:border-emerald-9 focus:ring-2 focus:ring-emerald-9/20 focus:outline-none transition-all duration-200"
                    placeholder="+1 (555) 123-4567"
                  />
                ) : (
                  <div className="bg-charleston-green-9 text-white w-full pl-10 pr-4 py-2.5 rounded-lg border border-transparent">
                    {formData.phone || (
                      <span className="text-gray-500">Not set</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                {/* <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <FaLock className="text-gray-500 text-sm" />
                </div> */}
                {editMode ? (
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="bg-charleston-green-9 text-white w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-700 focus:border-emerald-9 focus:ring-2 focus:ring-emerald-9/20 focus:outline-none transition-all duration-200"
                      placeholder="Enter new password"
                      autoComplete="new-password"
                    />
                    {formData.password &&
                      formData.password !== "••••••••••" && (
                        <div className="mt-2">
                          <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                formData.password.length < 4
                                  ? "bg-red-500 w-1/4"
                                  : formData.password.length < 8
                                  ? "bg-yellow-500 w-1/2"
                                  : "bg-green-500 w-full"
                              }`}
                            />
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            {formData.password.length < 4
                              ? "Weak password"
                              : formData.password.length < 8
                              ? "Could be stronger"
                              : "Strong password"}
                          </div>
                          {formData.password.length > 0 &&
                            formData.password.length < 8 && (
                              <p className="mt-1 text-xs text-amber-400">
                                Use at least 8 characters for a stronger
                                password
                              </p>
                            )}
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="flex items-center bg-charleston-green-9 text-white w-full pl-10 pr-4 py-2.5 rounded-lg border border-transparent">
                    <span className="tracking-widest">••••••••••••</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {!editMode && (
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-800 mt-6">
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="inline-flex items-center gap-2 bg-charleston-green-9 hover:bg-charleston-green-8 text-white px-4 py-2.5 rounded-lg transition-colors duration-200 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-9/20 sm:w-auto w-full"
              >
                <FaEdit className="text-sm" />
                <span>Edit Profile</span>
              </button>
            </div>
          )}
          {editMode && (
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-800 mt-6">
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  // Reset form to original user data
                  setFormData({
                    username: user?.username || "",
                    email: user?.email || "",
                    phone: user?.phone || "",
                    password: user?.password || "",
                  });
                }}
                className="px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white bg-charleston-green-9 hover:bg-charleston-green-8 rounded-lg border border-gray-700 transition-colors duration-200 w-full sm:w-auto"
              >
                Cancel
              </button>
              <div className="relative w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-9 to-emerald-10 hover:from-emerald-10 hover:to-emerald-11 rounded-lg shadow-md hover:shadow-emerald-9/20 transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto ${
                    isSaving ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FaSave className="text-sm" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
                {saveError && (
                  <div className="absolute left-0 right-0 -bottom-6 text-xs text-red-400 text-center">
                    {saveError}
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </div>

      <div className="mb-10">
        <h3 className="text-2xl font-bold text-white mb-6 pb-3 border-b border-gray-700/50">
          Profile Settings
        </h3>

        {/* Profile Picture Section */}
        <div className="mb-8 rounded-2xl border border-charleston-green-8/50 bg-charleston-green-12 p-6 shadow-lg">
          <h4 className="text-lg font-medium text-white mb-5 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-emerald-9 rounded-full"></span>
            Profile Picture
          </h4>

          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative group">
              <div className="h-32 w-32 overflow-hidden rounded-full bg-gradient-to-br from-charleston-green-9 to-charleston-green-11 p-1 sm:h-36 sm:w-36">
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-emerald-9 ring-2 ring-charleston-green-8 transition-all duration-300 group-hover:ring-emerald-9">
                  {user?.data?.profilePicture?.url ? (
                    <Image
                      src={user?.data?.profilePicture?.url}
                      alt={user?.data?.username || 'User'}
                      width={144}
                      height={144}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '';
                      }}
                    />
                  ) : (
                    <span className="text-4xl font-bold text-charleston-green">
                      {(() => {
                        const username = user?.data?.username || '';
                        if (username) {
                          const nameParts = username.trim().split(/\s+/);
                          if (nameParts.length >= 2) {
                            return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
                          } else if (nameParts[0]) {
                            return nameParts[0].charAt(0).toUpperCase();
                          }
                        }
                        return 'U';
                      })()}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <div className="bg-white/10 backdrop-blur-sm p-3 rounded-full">
                      <FaCamera className="text-white text-xl" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full mt-6 sm:mt-0">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
                onClick={(e) => e.stopPropagation()}
              />

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingMedia}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-9 to-emerald-10 hover:from-emerald-8 hover:to-emerald-11 text-white px-6 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 w-full sm:w-auto shadow-lg hover:shadow-emerald-9/30 hover:-translate-y-0.5"
                >
                  {uploadingMedia ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FaEdit />
                      Change Picture
                    </>
                  )}
                </button>
{/* 
                {user?.data?.profilePicture?.url && (
                  <button
                    type="button"
                    onClick={handleRemovePicture}
                    disabled={uploadingMedia}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-charleston-green-7/50 bg-charleston-green-9 px-4 py-3 text-gray-300 transition-all duration-200 hover:border-charleston-green-6 hover:bg-charleston-green-8 hover:text-white disabled:opacity-50 sm:w-auto"
                  >
                    <FaTrash className="text-red-500" />
                    <span>Remove</span>
                  </button>
                )} */}
              </div>

              <div className="mt-4 space-y-2">
                {uploadError && (
                  <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="text-red-400 mt-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="text-red-400 text-sm">{uploadError}</p>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="text-green-400 mt-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="text-green-400 text-sm">
                      Profile picture updated successfully!
                    </p>
                  </div>
                )}

                <p className="text-gray-400 text-xs mt-3">
                  Recommended size: 512x512px. Max file size: 2MB. Formats: JPG,
                  PNG, or GIF.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white mb-5 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-emerald-9 rounded-full"></span>
            Notification Preferences
          </h4>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                id: "email",
                icon: <FaEnvelope className="text-xl" />,
                title: "Email Notifications",
                description: "Receive order updates and promotions via email",
                checked: user?.notifications?.email || false,
              },
              {
                id: "sms",
                icon: <FaMobileAlt className="text-xl" />,
                title: "SMS Notifications",
                description: "Get important updates and alerts via SMS",
                checked: user?.notifications?.sms || false,
              },
              {
                id: "app",
                icon: <FaBell className="text-xl" />,
                title: "Push Notifications",
                description: "Receive updates in the LIMI mobile app",
                checked: user?.notifications?.app || false,
              },
            ].map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-charleston-green-8/50 bg-charleston-green-12 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-charleston-green-11 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-emerald-9/10 rounded-lg text-emerald-9">
                      {item.icon}
                    </div>
                    <div>
                      <h5 className="text-white font-medium">{item.title}</h5>
                      <p className="text-sm text-gray-400 mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={item.checked}
                      onChange={() => toggleNotification(item.id)}
                    />
                    <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 sm:peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-emerald-9 after:shadow-lg"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Render addresses tab
  const renderAddressesTab = () => {
    // Get address from user data if available
    const userAddress = user?.data?.address || {};
    
    const handleAddressSubmit = async (e) => {
      e.preventDefault();
      
      try {
        // Create an object to hold only the changed fields
        const changedFields = {};
        
        // Map of form field names to API field names
        const fieldMappings = {
          name: 'fullName',
          street: 'street',
          city: 'city',
          state: 'state',
          zip: 'postalCode',
          country: 'country'
        };

        // Check each field to see if it was modified
        Object.entries(fieldMappings).forEach(([formField, apiField]) => {
          if (originalAddress?.[apiField] !== addressFormData[formField]) {
            changedFields[apiField] = addressFormData[formField];
          }
        });

        // If no fields were changed, just close the form
        if (Object.keys(changedFields).length === 0) {
          setShowAddressForm(false);
          setEditingAddressId(null);
          return;
        }

        // Only include the phone if it's available
        if (formData.phone) {
          changedFields.phone = formData.phone;
        }

        // Get the token from localStorage
        const token = localStorage.getItem("limiToken");
        if (!token) {
          throw new Error("Authentication required. Please log in again.");
        }

        // Make the API call to update profile with only changed address fields
        const response = await fetch(
          buildApi1Url(API_CONFIG.ENDPOINTS.USER_PROFILE),
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
            body: JSON.stringify({ address: changedFields }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update address");
        }

        // Fetch fresh user data after successful update
        const updatedUser = await fetchUserData();
        if (!updatedUser) {
          throw new Error("Address updated but failed to refresh user data");
        }

        // Update the user data in the parent component
        if (onUserUpdate) {
          onUserUpdate(updatedUser);
        }

        setShowAddressForm(false);
        setEditingAddressId(null);
        
      } catch (error) {
        setSaveError(error.message || "Failed to update address. Please try again.");
      }
    };

    const startEditAddress = () => {
      const currentAddress = {
        name: userAddress?.fullName || user?.data?.username || "",
        street: userAddress?.street || "",
        city: userAddress?.city || "",
        state: userAddress?.state || "",
        zip: userAddress?.postalCode || "",
        country: userAddress?.country || "",
      };
      
      // Store the original address values for comparison
      setOriginalAddress({
        fullName: userAddress?.fullName || "",
        street: userAddress?.street || "",
        city: userAddress?.city || "",
        state: userAddress?.state || "",
        postalCode: userAddress?.postalCode || "",
        country: userAddress?.country || "",
      });
      
      setAddressFormData(currentAddress);
      setShowAddressForm(true);
    };

    return (
      <div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Your Address
          </h3>

          {showAddressForm || !userAddress?.street ? (
            <form
              onSubmit={handleAddressSubmit}
              className="bg-charleston-green-9 p-4 rounded-lg"
            >
              <h4 className="text-white font-medium mb-4">
                {userAddress?.street ? "Edit Address" : "Add Your Address"}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={addressFormData.name}
                    onChange={(e) =>
                      setAddressFormData({
                        ...addressFormData,
                        name: e.target.value,
                      })
                    }
                    className="bg-charleston-green-11 text-white w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-300 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={addressFormData.street}
                    onChange={(e) =>
                      setAddressFormData({
                        ...addressFormData,
                        street: e.target.value,
                      })
                    }
                    className="bg-charleston-green-11 text-white w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">City</label>
                  <input
                    type="text"
                    value={addressFormData.city}
                    onChange={(e) =>
                      setAddressFormData({
                        ...addressFormData,
                        city: e.target.value,
                      })
                    }
                    className="bg-charleston-green-11 text-white w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">
                    State/Province
                  </label>
                  <input
                    type="text"
                    value={addressFormData.state}
                    onChange={(e) =>
                      setAddressFormData({
                        ...addressFormData,
                        state: e.target.value,
                      })
                    }
                    className="bg-charleston-green-11 text-white w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">
                    ZIP/Postal Code
                  </label>
                  <input
                    type="text"
                    value={addressFormData.zip}
                    onChange={(e) =>
                      setAddressFormData({
                        ...addressFormData,
                        zip: e.target.value,
                      })
                    }
                    className="bg-charleston-green-11 text-white w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Country</label>
                  <input
                    type="text"
                    value={addressFormData.country}
                    onChange={(e) =>
                      setAddressFormData({
                        ...addressFormData,
                        country: e.target.value,
                      })
                    }
                    className="bg-charleston-green-11 text-white w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddressForm(false);
                    setEditingAddressId(null);
                  }}
                  className="bg-charleston-green-11 border border-gray-700 text-white px-4 py-2 rounded-md hover:bg-charleston-green-8 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-9 text-white px-4 py-2 rounded-md hover:bg-emerald-10 transition-colors"
                >
                  {userAddress?.street ? "Update Address" : "Save Address"}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-charleston-green-9 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <FaHome className="text-emerald-9" />
                  <div className="font-medium text-white">Primary Address</div>
                </div>

                <button
                  onClick={startEditAddress}
                  className="text-gray-400 hover:text-white"
                >
                  <FaEdit />
                </button>
              </div>

              <div className="text-gray-300 space-y-1">
                <div>{userAddress?.fullName || user?.data?.username}</div>
                <div>{userAddress?.street}</div>
                <div>
                  {userAddress?.city}{userAddress?.state ? `, ${userAddress.state}` : ''} {userAddress?.postalCode}
                </div>
                <div>{userAddress?.country}</div>
                <div className="pt-2 text-gray-400 text-sm">
                  Phone: {userAddress?.phone || formData.phone || 'Not provided'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render payment methods tab
  const renderPaymentMethodsTab = () => {
    const handlePaymentSubmit = (e) => {
      e.preventDefault();
      const last4 = paymentFormData.cardNumber.slice(-4);
      const paymentMethod = {
        ...paymentFormData,
        last4,
        cardNumber: undefined, // Don't store full card number
      };

      if (editingPaymentId) {
        handleUpdatePaymentMethod(editingPaymentId, paymentMethod);
      } else {
        handleAddPaymentMethod(paymentMethod);
      }

      setShowPaymentForm(false);
      setEditingPaymentId(null);
      setPaymentFormData({
        type: "Credit Card",
        name: user?.name || "",
        cardNumber: "",
        expiry: "",
        cvv: "",
      });
    };

    return (
      <div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Payment Methods
          </h3>

          <div className="space-y-4">
            {user?.paymentMethods?.map((method) => (
              <div key={method.id} className="bg-charleston-green-9 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <FaCreditCard className="text-emerald-9" />
                    <div className="font-medium text-white">
                      {method.type} •••• {method.last4}
                    </div>
                    {method.default && (
                      <span className="bg-emerald-9/20 text-emerald-9 text-xs px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingPaymentId(method.id);
                        setPaymentFormData({
                          type: method.type,
                          name: method.name,
                          cardNumber: `•••• •••• •••• ${method.last4}`,
                          expiry: method.expiry,
                          cvv: "•••",
                        });
                        setShowPaymentForm(true);
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleRemovePaymentMethod(method.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <div className="text-gray-300 mb-4">
                  <div>Expires: {method.expiry}</div>
                  <div>{method.name}</div>
                </div>

                {!method.default && (
                  <button
                    onClick={() => handleSetDefaultPaymentMethod(method.id)}
                    className="text-emerald-9 text-sm hover:underline"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            ))}
            {(!user?.paymentMethods || user.paymentMethods.length === 0) && (
              <div className="text-gray-400 text-center py-6">
                No payment methods yet. Add your first payment method below.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          {showPaymentForm ? (
            <form
              onSubmit={handlePaymentSubmit}
              className="bg-charleston-green-9 p-4 rounded-lg"
            >
              <h4 className="text-white font-medium mb-4">
                {editingPaymentId
                  ? "Edit Payment Method"
                  : "Add New Payment Method"}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-300 mb-2">Card Type</label>
                  <select
                    value={paymentFormData.type}
                    onChange={(e) =>
                      setPaymentFormData({
                        ...paymentFormData,
                        type: e.target.value,
                      })
                    }
                    className="bg-charleston-green-11 text-white w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9"
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="PayPal">PayPal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.name}
                    onChange={(e) =>
                      setPaymentFormData({
                        ...paymentFormData,
                        name: e.target.value,
                      })
                    }
                    className="bg-charleston-green-11 text-white w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-300 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.cardNumber}
                    onChange={(e) =>
                      setPaymentFormData({
                        ...paymentFormData,
                        cardNumber: e.target.value,
                      })
                    }
                    placeholder="•••• •••• •••• ••••"
                    className="bg-charleston-green-11 text-white w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.expiry}
                    onChange={(e) =>
                      setPaymentFormData({
                        ...paymentFormData,
                        expiry: e.target.value,
                      })
                    }
                    placeholder="MM/YY"
                    className="bg-charleston-green-11 text-white w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">CVV</label>
                  <input
                    type="text"
                    value={paymentFormData.cvv}
                    onChange={(e) =>
                      setPaymentFormData({
                        ...paymentFormData,
                        cvv: e.target.value,
                      })
                    }
                    placeholder="•••"
                    className="bg-charleston-green-11 text-white w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-9"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentForm(false);
                    setEditingPaymentId(null);
                  }}
                  className="bg-charleston-green-11 border border-gray-700 text-white px-4 py-2 rounded-md hover:bg-charleston-green-8 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-9 text-white px-4 py-2 rounded-md hover:bg-emerald-10 transition-colors"
                >
                  {editingPaymentId
                    ? "Update Payment Method"
                    : "Add Payment Method"}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowPaymentForm(true)}
              className="flex items-center gap-2 bg-charleston-green-9 border border-gray-700 text-white px-4 py-2 rounded-md hover:bg-charleston-green-8 transition-colors"
            >
              <FaPlus />
              <span>Add Payment Method</span>
            </button>
          )}
        </div>

        <div className="mt-6 p-4 bg-charleston-green-11 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <FaShieldAlt className="text-emerald-9" />
            <div className="text-white font-medium">
              Secure Payment Processing
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Your payment information is encrypted and securely stored. We never
            store your full card details on our servers.
          </p>
        </div>
      </div>
    );
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfileTab();
      case "addresses":
        return renderAddressesTab();
      case "payment":
        return renderPaymentMethodsTab();
      default:
        return renderProfileTab();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Account Settings
            </h1>
            <p className="text-gray-400 mt-1">
              Manage your profile, addresses, and payment methods in one place
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-9 animate-pulse"></span>
              <span>Active</span>
            </span>
            <span>•</span>
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
          <div className="flex overflow-x-auto scrollbar-hide -mb-px">
            {[
              {
                id: "profile",
                icon: <FaUser className="hidden sm:block text-sm sm:text-lg" />,
                label: "Profile",
              },
              {
                id: "addresses",
                icon: <FaHome className="hidden sm:block text-sm sm:text-lg" />,
                label: "Addresses",
              },
              {
                id: "payment",
                icon: (
                  <FaCreditCard className="hidden sm:block text-sm sm:text-lg" />
                ),
                label: "Payment Methods",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-5 py-3.5 font-medium text-sm flex items-center gap-2 transition-all duration-200 ${
                  activeTab === tab.id
                    ? "text-emerald-9"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/30"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-9 to-emerald-10 rounded-full"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {renderTabContent()}
    </div>
  );
}
