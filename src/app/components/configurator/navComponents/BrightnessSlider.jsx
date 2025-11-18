import { useState, useEffect } from 'react';

const LUMEN_LEVELS = [0, 400, 800, 1200, 2000, 3000];
const TEMP_LEVELS = [2000, 2700, 3000, 3500, 4000, 5000, 6000, 6500, 8000];

const findClosestIndex = (arr, target) => {
  let closestIndex = 0;
  let smallestDiff = Infinity;
  arr.forEach((val, idx) => {
    const diff = Math.abs(val - target);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestIndex = idx;
    }
  });
  return closestIndex;
};

const lumenToBrightness = (lumen) => {
  const min = LUMEN_LEVELS[0];
  const max = LUMEN_LEVELS[LUMEN_LEVELS.length - 1];
  const clamped = Math.min(Math.max(lumen, min), max);
  return Math.round(((clamped - min) / (max - min)) * 100);
};

export const BrightnessSlider = ({
  brightness,
  setBrightness,
  temperature,
  setTemperature,
  initialLumen = 800,
  initialTemperature = 2700,
  lighting = true,
  sendMessageToPlayCanvas,
  onLumenChange,
  onTemperatureChange,
  onPresetChange,
}) => {
  const [lumenIndex, setLumenIndex] = useState(
    findClosestIndex(LUMEN_LEVELS, initialLumen)
  );
  const [tempIndex, setTempIndex] = useState(
    findClosestIndex(TEMP_LEVELS, initialTemperature)
  );
  const [activePreset, setActivePreset] = useState(null);

  // Sync internal indices with external temperature prop
  useEffect(() => {
    const newTempIndex = findClosestIndex(TEMP_LEVELS, temperature);
    if (newTempIndex !== tempIndex) {
      setTempIndex(newTempIndex);
    }
  }, [temperature]);

  // Sync internal indices with external brightness prop
  useEffect(() => {
    const newLumenIndex = findClosestIndex(
      LUMEN_LEVELS,
      (brightness / 100) * (LUMEN_LEVELS[LUMEN_LEVELS.length - 1] - LUMEN_LEVELS[0]) + LUMEN_LEVELS[0]
    );
    if (newLumenIndex !== lumenIndex) {
      setLumenIndex(newLumenIndex);
    }
  }, [brightness]);

  const sendBrightnessUpdate = (value) => {
    if (!lighting || !sendMessageToPlayCanvas) return;
    sendMessageToPlayCanvas('brightness:' + value);
    console.log("Brightness sent to PlayCanvas: " + value);
  };

  const sendTemperatureUpdate = (value) => {
    if (!lighting || !sendMessageToPlayCanvas) return;
    sendMessageToPlayCanvas('colorTemperature:' + Math.round(value));
    console.log("Color temperature sent to PlayCanvas: " + value);
  };
  const handleLumenChange = (e) => {
    const index = parseInt(e.target.value, 10);
    setLumenIndex(index);
    setActivePreset(null);

    const newLumen = LUMEN_LEVELS[index];
    const newBrightness = lumenToBrightness(newLumen);
    setBrightness(newBrightness);
    sendBrightnessUpdate(newBrightness);  // Add this line to send the update
    if (onLumenChange) onLumenChange(newLumen);
  };
  const handleTempChange = (e) => {
    const index = parseInt(e.target.value, 10);
    setTempIndex(index);
    setActivePreset(null);

    const newTemp = TEMP_LEVELS[index];
    setTemperature(newTemp);
    sendTemperatureUpdate(newTemp);  // Add this line to send the update
    if (onTemperatureChange) onTemperatureChange(newTemp);
  };

  const applyPreset = (presetKey) => {
    let lumenTarget, tempTarget;

    switch (presetKey) {
      case 'focus':
        lumenTarget = 2000;
        tempTarget = 6500;
        break;
      case 'natural':
        lumenTarget = 1200;
        tempTarget = 4000;
        break;
      case 'cozy':
      default:
        lumenTarget = 800;
        tempTarget = 2700;
    }

    const newLumenIndex = findClosestIndex(LUMEN_LEVELS, lumenTarget);
    const newTempIndex = findClosestIndex(TEMP_LEVELS, tempTarget);

    setLumenIndex(newLumenIndex);
    setTempIndex(newTempIndex);
    setActivePreset(presetKey);

    const finalLumen = LUMEN_LEVELS[newLumenIndex];
    const finalTemp = TEMP_LEVELS[newTempIndex];

    setBrightness(lumenToBrightness(finalLumen));
    setTemperature(finalTemp);
    sendBrightnessUpdate(lumenToBrightness(finalLumen));  // Add this line
    sendTemperatureUpdate(finalTemp);  // Add this line
    if (onLumenChange) onLumenChange(finalLumen);
    if (onTemperatureChange) onTemperatureChange(finalTemp);
    if (onPresetChange) onPresetChange(presetKey);
  };

  return (
    <div className="p-4 w-full max-w-sm space-y-4 bg-white/90 rounded-xl border border-gray-200">
      {/* Quick presets */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">Quick presets</span>
      </div>
      <div className="flex gap-2">
        {[
          { key: 'cozy', label: 'Cozy' },
          { key: 'natural', label: 'Natural' },
          { key: 'focus', label: 'Focus' },
        ].map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => applyPreset(preset.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${activePreset === preset.key
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Lumen / brightness control */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Brightness</span>
          <span className="text-sm font-semibold text-gray-900">
            {LUMEN_LEVELS[lumenIndex]} lm
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={LUMEN_LEVELS.length - 1}
          step={1}
          value={lumenIndex}
          onChange={handleLumenChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex text-[10px] text-gray-500 mt-1">
          {LUMEN_LEVELS.map((lvl, idx) => (
            <span
              key={lvl}
              className={`w-0 flex-1 text-center ${idx === 0 ? '-ml-1' : ''}`}
            >
              {lvl}
            </span>
          ))}
        </div>
      </div>

      {/* Temperature control */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Color temperature
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {TEMP_LEVELS[tempIndex]}K
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={TEMP_LEVELS.length - 1}
          step={1}
          value={tempIndex}
          onChange={handleTempChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>
    </div>
  );
};

export default BrightnessSlider;