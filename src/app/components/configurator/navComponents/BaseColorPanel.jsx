import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheck } from 'react-icons/fa';
import { listenForConnectorColorMessages } from '../../../util/iframeCableMessageHandler';

const BaseColorPanel = ({
  onBaseColorChange,
  onConnectorColorChange,
  currentBaseColor,
  currentConnectorColor,
  setActiveTab,
  activeTab,
  tourActive,
  onTourSelection
}) => {

  const [selectedBaseColor, setSelectedBaseColor] = useState(currentBaseColor || 'black');
  const [selectedConnectorColor, setSelectedConnectorColor] = useState(currentConnectorColor || 'black');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

    useEffect(() => {
      const cleanup = listenForConnectorColorMessages((data, event) => {
        setActiveTab('connector');
      });
      return cleanup;
    }, []);
  useEffect(() => {
    if (currentBaseColor) {
      setSelectedBaseColor(currentBaseColor);
    }
  }, [currentBaseColor]);

  useEffect(() => {
    if (currentConnectorColor) {
      setSelectedConnectorColor(currentConnectorColor);
    }
  }, [currentConnectorColor]);

  const handleBaseColorSelect = (color) => {
    
    // If tour is active, call tour selection handler
    if (tourActive && onTourSelection) {
      onTourSelection('baseColor', color);
    }
    
    setSelectedBaseColor(color);
    onBaseColorChange && onBaseColorChange(color);
  };

  const handleConnectorColorSelect = (color) => {
    setSelectedConnectorColor(color);
    onConnectorColorChange && onConnectorColorChange(color);
  };

  const colorOptions = [
    { id: 'black', name: 'Black', hexColor: '#000000' },
    { id: 'gold', name: 'Gold', hexColor: '#D4AF37' },
    { id: 'silver', name: 'Silver', hexColor: '#C0C0C0' },
    { id: 'midnight-blue', name: 'Blue', hexColor: '#191970' }
  ];

  const styles = {
    container: {
      padding: '20px',
      borderRadius: '8px',
      color: 'white',
      width: '100%'
    },
    tabs: {
      display: 'flex',
      marginBottom: '16px',
      borderBottom: '1px solid #333',
    },
    tab: {
      flex: 1,
      padding: '10px 0',
      cursor: 'pointer',
      background: 'none',
      border: 'none',
      color: 'inherit',
      fontSize: '16px',
      fontWeight: 500,
      outline: 'none',
      borderBottom: '2px solid transparent',
      transition: 'border-bottom 0.2s',
    },
    tabActive: {
      borderBottom: '2px solid #54BB74',
      color: '#54BB74',
    },
    title: {
      fontSize: '18px',
      marginBottom: '15px',
      fontWeight: '500'
    },
    colorPalette: {
      display: 'flex',
      justifyContent: 'space-evenly',
      marginBottom: '10px'
    },
    colorOption: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid transparent'
    },
    selectedColor: {
      border: '2px solid #54BB74'
    },
    colorLabels: {
      display: 'flex',
      justifyContent: 'space-evenly',
      fontSize: '12px',
      padding: '0px 7px'
    },
    colorLabel: {
      textAlign: 'center',
      width: '60px'
    }
  };

  return (
    <div style={styles.container}>
      {/* <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === 'base' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('base')}
        >
          Base 
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'connector' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('connector')}
        >
          Connector 
        </button>
      </div> */} 
      {activeTab === 'base' && (
        <>
          {!isMobile && <h3 className="text-black" style={styles.title}>Base Color</h3>}
          <div style={styles.colorPalette}>
            {colorOptions.map((color) => (
              <motion.div
                key={color.id}
                style={{
                  ...styles.colorOption,
                  backgroundColor: color.hexColor,
                  ...(selectedBaseColor === color.id ? styles.selectedColor : {})
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleBaseColorSelect(color.id)}
              >
                {selectedBaseColor === color.id && (
                  <FaCheck color={color.id === 'black' ? 'white' : 'black'} />
                )}
              </motion.div>
            ))}
          </div>
          <div style={styles.colorLabels}>
            {colorOptions.map((color) => (
              <div key={color.id} className="text-black" style={styles.colorLabel}>
                {color.name}
              </div>
            ))}
          </div>
        </>
      )}
      {activeTab === 'connector' && (
        <>
          {!isMobile && <h3 className="text-black" style={styles.title}>Connector Color</h3>}
          <div style={styles.colorPalette}>
            {colorOptions.map((color) => (
              <motion.div
                key={color.id}
                style={{
                  ...styles.colorOption,
                  backgroundColor: color.hexColor,
                  ...(selectedConnectorColor === color.id ? styles.selectedColor : {})
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleConnectorColorSelect(color.id)}
              >
                {selectedConnectorColor === color.id && (
                  <FaCheck color={color.id === 'black' ? 'white' : 'black'} />
                )}
              </motion.div>
            ))}
          </div>
          <div style={styles.colorLabels}>
            {colorOptions.map((color) => (
              <div key={color.id} className="text-black" style={styles.colorLabel}>
                {color.name}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BaseColorPanel;
