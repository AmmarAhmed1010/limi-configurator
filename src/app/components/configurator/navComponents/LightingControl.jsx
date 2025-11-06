import { useState, useEffect } from 'react';

const LUMEN_LEVELS = [400, 800, 1200, 2000, 3000];
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

const LightingControl = ({
  brightness: externalBrightness = 50,
  colorTemperature: externalTemperature = 2700,
  onBrightnessChange,
  onColorTemperatureChange,
  setActiveStep,
  setOpenDropdown,
  tourActive,
  onTourSelection,
  initialLumen = 800,
  initialTemperature = 2700,
  lighting = true,
  sendMessageToPlayCanvas,
  onLumenChange,
  onTemperatureChange,
  onPresetChange,
}) => {
  const [lumenIndex, setLumenIndex] = useState(
    findClosestIndex(LUMEN_LEVELS, (externalBrightness / 100) * (3000 - 400) + 400)
  );
  const [tempIndex, setTempIndex] = useState(
    findClosestIndex(TEMP_LEVELS, externalTemperature)
  );
  const [activePreset, setActivePreset] = useState(null);

  // Sync internal indices with external temperature prop
  useEffect(() => {
    const newTempIndex = findClosestIndex(TEMP_LEVELS, externalTemperature);
    if (newTempIndex !== tempIndex) {
      setTempIndex(newTempIndex);
    }
  }, [externalTemperature]);

  // Sync internal indices with external brightness prop
  useEffect(() => {
    const newLumenIndex = findClosestIndex(
      LUMEN_LEVELS,
      (externalBrightness / 100) * (LUMEN_LEVELS[LUMEN_LEVELS.length - 1] - LUMEN_LEVELS[0]) + LUMEN_LEVELS[0]
    );
    if (newLumenIndex !== lumenIndex) {
      setLumenIndex(newLumenIndex);
    }
  }, [externalBrightness]);

  const sendBrightnessUpdate = (value) => {
    if (!sendMessageToPlayCanvas) return;
    sendMessageToPlayCanvas('brightness:' + value);
    console.log("Brightness sent to PlayCanvas: " + value);
  };

  const sendTemperatureUpdate = (value) => {
    if (!sendMessageToPlayCanvas) return;
    sendMessageToPlayCanvas('colorTemperature:' + Math.round(value));
    console.log("Color temperature sent to PlayCanvas: " + value);
  };

  const handleLumenChange = (e) => {
    const index = parseInt(e.target.value, 10);
    setLumenIndex(index);
    setActivePreset(null);

    const newLumen = LUMEN_LEVELS[index];
    const newBrightness = lumenToBrightness(newLumen);
    
    if (onBrightnessChange) onBrightnessChange(newBrightness);
    sendBrightnessUpdate(newBrightness);
  };

  const handleTempChange = (e) => {
    const index = parseInt(e.target.value, 10);
    setTempIndex(index);
    setActivePreset(null);

    const newTemp = TEMP_LEVELS[index];
    if (onColorTemperatureChange) onColorTemperatureChange(newTemp);
    sendTemperatureUpdate(newTemp);
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
    const finalBrightness = lumenToBrightness(finalLumen);

    if (onBrightnessChange) onBrightnessChange(finalBrightness);
    if (onColorTemperatureChange) onColorTemperatureChange(finalTemp);
    
    sendBrightnessUpdate(finalBrightness);
    sendTemperatureUpdate(finalTemp);
  };

  return (
    <div className="p-4 w-full bg-white rounded-lg space-y-4">
      {/* Quick presets */}
      {/* <div className="flex items-center justify-between">
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
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
              activePreset === preset.key
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            }`}
          >
            {preset.label}
          </button>
        ))} 
      </div> */}

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
        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
          {LUMEN_LEVELS.map((lvl) => (
            <span key={lvl}>{lvl}</span>
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

export default LightingControl;
