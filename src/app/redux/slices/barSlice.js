// src/app/redux/slices/barSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  hasBarModel: false,
  hasBarAttachment: false,
  barArray: []  // New array to hold states for each index
};

const barSlice = createSlice({
  name: 'bar',
  initialState,
  reducers: {
    setHasBarModel: (state, action) => {
      const { index, value } = action.payload;
      state.hasBarModel = value;
      // Update the array if index is provided
      if (index !== undefined) {
        if (!state.barArray[index]) {
          state.barArray[index] = { hasBarModel: value, hasBarAttachment: false };
        } else {
          state.barArray[index].hasBarModel = value;
        }
      }
    },
    setHasBarAttachment: (state, action) => {
      const { index, value } = action.payload;
      state.hasBarAttachment = value;
      // Update the array if index is provided
      if (index !== undefined) {
        if (!state.barArray[index]) {
          state.barArray[index] = { hasBarModel: false, hasBarAttachment: value };
        } else {
          state.barArray[index].hasBarAttachment = value;
        }
      }
    },
    setBarState: (state, action) => {
      // Directly set both states for a specific index
      const { index, hasBarModel, hasBarAttachment } = action.payload;
      if (index !== undefined) {
        state.barArray[index] = { hasBarModel, hasBarAttachment };
      }
    },
    resetBarStates: (state) => {
      state.hasBarModel = false;
      state.hasBarAttachment = false;
      state.barArray = [];
    },
    initializeBarArray: (state, action) => {
      // Initialize the array with a specific length
      const { length } = action.payload;
      state.barArray = Array(length).fill().map(() => ({
        hasBarModel: false,
        hasBarAttachment: false
      }));
    }
  }
});

export const { 
  setHasBarModel, 
  setHasBarAttachment, 
  resetBarStates,
  setBarState,
  initializeBarArray
} = barSlice.actions;

export default barSlice.reducer;