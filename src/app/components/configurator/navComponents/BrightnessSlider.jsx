import { useState, useEffect } from 'react';

export const BrightnessSlider = ({ initialValue = 50, onChange }) => {
  const [brightness, setBrightness] = useState(initialValue);

  const handleChange = (e) => {
    const value = parseInt(e.target.value);
    setBrightness(value);
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className="p-4 w-full max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Brightness</span>
        <span className="text-sm font-medium text-gray-700">{brightness}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={brightness}
        onChange={handleChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
};

export default BrightnessSlider;
