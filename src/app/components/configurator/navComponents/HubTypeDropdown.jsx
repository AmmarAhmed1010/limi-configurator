import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export const HubTypeDropdown = ({
  config,
  onBaseTypeChange,
  onLightAmountChange,
  setActiveStep,
  setOpenDropdown,
  tourActive,
  onTourSelection,
  setShowLoadingScreen,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSelect = (baseType, amount) => {
    if (setShowLoadingScreen) {
      setShowLoadingScreen(true);
    }

    if (tourActive && onTourSelection) {
      onTourSelection('baseType', baseType);
      onTourSelection('lightAmount', amount);
    }

    // onBaseTypeChange(baseType);
    // onLightAmountChange(amount);

    if (baseType === 'round') {
      onBaseTypeChange(baseType);
   if(amount > 1){
    onLightAmountChange(amount);
   }
    }
    if (baseType === 'rectangular') {
      onBaseTypeChange(baseType);
    }
    setActiveStep('pendantSelection');
    setOpenDropdown(null);

    if (setShowLoadingScreen) {
      setTimeout(() => {
        setShowLoadingScreen(false);
      }, 3000);
    }
  };

  const RoundOptionButton = ({ amount }) => (
    <motion.button
      key={`round-${amount}`}
      className={`flex-shrink-0 flex flex-col items-center ${
        config.baseType === 'round' && config.lightAmount === amount
          ? 'text-emerald-500'
          : 'text-gray-300 hover:text-white'
      }`}
      onClick={() => handleSelect('round', amount)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div
        className={`w-16 h-16 rounded-full overflow-hidden relative ${
          config.baseType === 'round' && config.lightAmount === amount
            ? 'ring-2 ring-emerald-500'
            : ''
        }`}
      >
        <Image
          src={`/images/configIcons/${config.lightType || 'ceiling'}/${amount}.png`}
          alt={`${amount} light${amount !== 1 ? 's' : ''}`}
          fill
          className="object-cover"
          priority
        />
      </div>
      <span className="text-sm text-black mt-1">
        {amount} Light{amount !== 1 ? 's' : ''}
      </span>
    </motion.button>
  );

  const RectOptionButton = ({ amount }) => (
    <motion.button
      key={`rect-${amount}`}
      className={`flex-shrink-0 flex flex-col items-center ${
        config.baseType === 'rectangular' && config.lightAmount === amount
          ? 'text-emerald-500'
          : 'text-gray-300 hover:text-white'
      }`}
      onClick={() => handleSelect('rectangular', amount)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div
        className={`w-16 h-16 rounded-full overflow-hidden relative ${
          config.baseType === 'rectangular' && config.lightAmount === amount
            ? 'ring-2 ring-emerald-500'
            : ''
        }`}
      >
        <Image
          src={`/images/configIcons/${config.lightType || 'ceiling'}/${amount}.png`}
          alt={`${amount} light${amount !== 1 ? 's' : ''}`}
          fill
          className="object-cover"
          priority
        />
      </div>
      <span className="text-sm text-black mt-1">
        {amount} Light{amount !== 1 ? 's' : ''}
      </span>
    </motion.button>
  );

  return (
    <div className="p-4">
      {!isMobile && (
        <h3 className="text-base font-bold text-black mb-3 font-['Amenti']">
          Hub Type
        </h3>
      )}

      <div className="space-y-4">
        <div>
           <div className="mt-2 flex items-center">
            <span className="text-sm font-semibold text-black">Round</span>
          </div>
          <div className="mt-2 flex gap-3">
            {[1, 3, 6].map((amount) => (
              <RoundOptionButton key={amount} amount={amount} />
            ))}
          </div>
        </div>

        <div>
          <div className="mt-2 flex items-center">
            <span className="text-sm font-semibold text-black">Rectangular</span>
          </div>
          <div className="mt-2 flex gap-3">
            <RectOptionButton amount={3} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HubTypeDropdown;
