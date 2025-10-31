// src/app/hooks/useBarState.js
import { useDispatch, useSelector } from 'react-redux';
import { 
  setHasBarModel, 
  setHasBarAttachment, 
  resetBarStates,
  setBarState,
  initializeBarArray
} from '../redux/slices/barSlice';

export const useBarState = () => {
  const dispatch = useDispatch();
  const { 
    hasBarModel, 
    hasBarAttachment,
    barArray 
  } = useSelector((state) => state.bar);

  return {
    // Individual states (kept for backward compatibility)
    hasBarModel,
    hasBarAttachment,
    
    // Array state
    barArray,
    
    // Individual setters
    setHasBarModel: (value, index) => dispatch(setHasBarModel({ index, value })),
    setHasBarAttachment: (value, index) => dispatch(setHasBarAttachment({ index, value })),
    
    // New setters
    setBarState: (index, states) => dispatch(setBarState({ index, ...states })),
    initializeBarArray: (length) => dispatch(initializeBarArray({ length })),
    resetBarStates: () => dispatch(resetBarStates())
  };
};