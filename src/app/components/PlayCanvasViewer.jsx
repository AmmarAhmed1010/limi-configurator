'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaSpinner } from 'react-icons/fa';

const PlayCanvasViewer = ({ 
  config = {}, 
  isDarkMode,
  className = '',
  loadcanvas,

  localSavedCables,
  localSavedConfig
}) => {
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Listen for messages from the PlayCanvas iframe
  useEffect(() => {
    const handleMessage = (event) => {
      // Check if the message is from our iframe
      if (event.data === 'loadingOffMount') {
        setAppReady(true);     
        setIsLoading(false);
        // Send default selections after app is ready
        // sendDefaultSelections();
      }
      if(event.data === 'load') {
 
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Update loading state based on loadcanvas prop
    if (loadcanvas !== undefined) {
      setIsLoading(loadcanvas);
    }
    
    // Set a timeout to handle cases where the app:ready1 message might not be received
    // This is especially important for mobile browsers
    // const readyTimeout = setTimeout(() => {
    //   if (!appReady) {
    //     setAppReady(true);
    //     setIsLoading(false);
    //     sendDefaultSelections();
    //   }
    // }, 8000); // 8 second timeout for mobile
    
    return () => {
      window.removeEventListener('message', handleMessage);
      // clearTimeout(readyTimeout);
    };
  }, [appReady]);
  const sendMessageToPlayCanvas = (message) => {
    const iframe = document.getElementById("playcanvas-app");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(message, "*");
    }
  };
  // Send default selections when app is ready
  const sendDefaultSelections = () => {
    if(localSavedConfig){
      sendConfigToPlayCanvas(localSavedConfig.config);
      localSavedCables?.forEach((cable, index) => {
        if(cable.systemType){
          sendMessageToPlayCanvas(`system:${cable.systemType}`);
          sendMessageToPlayCanvas(`cable_${index}:${cable.designId}`);
        } else {
          sendMessageToPlayCanvas(`cable_${index}:${cable.designId}`);
        }
      });
    }
    else{
    if (iframeRef.current && iframeRef.current.contentWindow) {
      // Only send default selections if they're not provided in the config
      if (!config.lightType && !config.lightAmount && !config.lightDesign) {
        // Default selections
        iframeRef.current.contentWindow.postMessage("light_type:ceiling", "*");
        iframeRef.current.contentWindow.postMessage("light_amount:1", "*");
        iframeRef.current.contentWindow.postMessage("cable_0:product_2", "*");
      } else {
        // Send configurations from props instead of defaults
        sendConfigToPlayCanvas(config);
      }
    }
  }
  };
  
  // Handle iframe load event
  useEffect(() => {
    const handleIframeLoad = () => {
      try {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          
          // For desktop browsers, set quality
          if (!isMobile) {
            iframeRef.current.contentWindow.postMessage("highdis", "*");
          }
          
          // For mobile browsers, we handle this differently with script injection
          // in the iframe onLoad event
          // if (isMobile) {
          //   setTimeout(() => {
          //     if (isLoading) {
          //       setAppReady(true);
          //       setIsLoading(false);
          //       // We don't call sendDefaultSelections() here as it's handled in the script injection
          //     }
          //   }, 5000); // 5 second timeout for mobile after iframe loads
          // }
        }
      } catch (error) {
        setHasError(true);
        setIsLoading(false);
      }
    };

    const handleIframeError = () => {
      console.error("Failed to load PlayCanvas iframe");
      setHasError(true);
      setIsLoading(false);
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
      iframe.addEventListener('error', handleIframeError);
    }

    // Set a timeout to handle cases where the iframe might not trigger events
    // const timeoutId = setTimeout(() => {
    //   if (isLoading) {
    //     console.warn("PlayCanvas iframe load timeout - forcing completion");
    //     setIsLoading(false);
    //     setAppReady(true);
    //   }
    // }, isMobile ? 8000 : 15000); // Shorter timeout for mobile

    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleIframeLoad);
        iframe.removeEventListener('error', handleIframeError);
      }
      // clearTimeout(timeoutId);
    };
  }, [isMobile, isLoading]);


  // Function to send configuration to PlayCanvas
  const sendConfigToPlayCanvas = (config) => {
    try {
      if (!iframeRef.current || !iframeRef.current.contentWindow || !config) return;
      
      // Only send configurations if the app is ready or we're forcing it
      // Send light type
      if (config.lightType) {
        iframeRef.current.contentWindow.postMessage(`light_type:${config.lightType}`, "*");
      }
      
      // Send light amount
      if (config.lightAmount !== undefined && config.lightAmount !== null) {
        iframeRef.current.contentWindow.postMessage(`light_amount:${config.lightAmount}`, "*");
      }
      if(config.baseType){
        iframeRef.current.contentWindow.postMessage(`base_type:${config.baseType}`, "*");
      }
       if(config.baseColor){
        iframeRef.current.contentWindow.postMessage(`base_color:${config.baseColor}`, "*");
       }
      // // Send cable options
      // if (config.cableColor) {
      //   iframeRef.current.contentWindow.postMessage(`cable_color:${config.cableColor}`, "*");
      // }
      
      // if (config.cableLength) {
      //   iframeRef.current.contentWindow.postMessage(`cable_length:${config.cableLength}`, "*");
      // }
      
      // Send pendant configurations if available
     
      
      // Send global design if single pendant
     
    } catch (error) {
      console.error("Error sending configuration to PlayCanvas:", error);
      setHasError(true);
    }
  };

  // Function to handle direct script injection for mobile devices
  const injectPlayCanvasScript = () => {
    try {
      if (!iframeRef.current || !iframeRef.current.contentWindow || !iframeRef.current.contentDocument) {
        console.error('Cannot access iframe content document');
        return;
      }
      
      const doc = iframeRef.current.contentDocument;
      
      // Create a script element to load the PlayCanvas engine
      const script = doc.createElement('script');
      script.src = 'https://code.playcanvas.com/playcanvas-stable.min.js';
      script.onload = () => {
        
        // Create a script to initialize the PlayCanvas application
        const initScript = doc.createElement('script');
        initScript.textContent = `
          // Initialize PlayCanvas application
          window.addEventListener('load', function() {
            var canvas = document.createElement('canvas');
            document.body.appendChild(canvas);
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            
            // Load the PlayCanvas app
            var app = new pc.Application(canvas);
            app.start();
            
            // Set up the app
            app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
            app.setCanvasResolution(pc.RESOLUTION_AUTO);
            
            // Notify parent window that app is ready
            window.parent.postMessage('app:ready1', '*');
            
            // Listen for messages from parent
            window.addEventListener('message', function(event) {
              // Handle messages here
            });
          });
        `;
        doc.body.appendChild(initScript);
      };
      
      // Set up the basic HTML structure
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>LIMI 3D Viewer</title>
          <style>
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #2B2D2F; }
            canvas { width: 100%; height: 100%; }
            .loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: white; }
          </style>
        </head>
        <body>
          <div class="loading">Loading LIMI 3D Viewer...</div>
        </body>
        </html>
      `);
      doc.close();
      
      // Add the script to the document
      doc.head.appendChild(script);
      
    } catch (error) {
      console.error('Error injecting PlayCanvas script:', error);
      setHasError(true);
      setIsLoading(false);
    }
  };
  
  return (
    <div className={`relative ${className} w-full h-full`}>
      {/* Enhanced Interactive Skeleton Loader - Only shown until app:ready1 message is received */}
      {!appReady && (
        <div id="playcanvas-loader" className="absolute inset-0 flex flex-col items-center justify-center bg-[#2B2D2F] z-10 overflow-hidden">
          {/* Background animated pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute bg-emerald-500 rounded-full"
                  style={{
                    // width: `${Math.random() * 10 + 5}px`,
                    // height: `${Math.random() * 10 + 5}px`,
                    // top: `${Math.random() * 100}%`,
                    // left: `${Math.random() * 100}%`,
                    // opacity: Math.random() * 0.5 + 0.25,
                    // animation: `float ${Math.random() * 10 + 10}s infinite linear`,
                    // animationDelay: `${Math.random() * 5}s`
                    width: '10px',
                    height: '10px',
                    top: '50%',
                    left: '50%',
                    opacity: 1,
                    animation: 'float 5s infinite linear',
                    animationDelay: '0s'
                  }}
                />
              ))}
            </div>
          </div>
          
          <div className="relative w-4/5 max-w-md aspect-square mb-8">
            {/* Ceiling */}
            <div className="absolute top-0 w-full h-8 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-t-lg shadow-md">
              {/* Ceiling mount */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-3 bg-gray-600 rounded-md"></div>
            </div>
            
            {/* Multiple pendants hanging from ceiling */}
            <div className="absolute top-0 left-1/4 w-1/5 aspect-square">
              {/* Pendant cable */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-20 bg-gray-600 origin-top animate-sway-slow"></div>
              {/* Pendant light */}
              <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full aspect-square rounded-full bg-gradient-to-br from-gray-700 to-gray-800 shadow-lg overflow-hidden animate-sway-slow">
                <div className="absolute inset-2 rounded-full bg-emerald-500 opacity-20 animate-pulse-slow"></div>
              </div>
            </div>
            
            {/* Main pendant being loaded */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 aspect-square">
              {/* Pendant cable with loading animation */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-24 bg-gradient-to-b from-gray-600 to-gray-700 origin-top animate-sway-reverse-slow">
                {/* Cable loading indicator */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                  <div className="w-full h-2 bg-emerald-500 opacity-40 animate-cable-loading"></div>
                </div>
              </div>
              
              {/* Main pendant light */}
              <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full aspect-square rounded-full bg-gradient-to-br from-gray-700 to-gray-800 shadow-lg overflow-hidden origin-top animate-sway-reverse-slow">
                {/* Pendant light effect */}
                <div className="absolute inset-2 rounded-full bg-emerald-500 opacity-30 animate-pulse-slow"></div>
                
                {/* Pendant detail */}
                <div className="absolute inset-4 rounded-full border border-gray-600"></div>
                
                {/* Loading indicator inside pendant */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1/2 h-1/2 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin"></div>
                </div>
              </div>
            </div>
            
            {/* Another pendant on the right */}
            <div className="absolute top-0 right-1/4 w-1/5 aspect-square">
              {/* Pendant cable */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-16 bg-gray-600 origin-top animate-sway-medium"></div>
              {/* Pendant light */}
              <div className="absolute top-16 left-1/2 -translate-x-1/2 w-full aspect-square rounded-full bg-gradient-to-br from-gray-700 to-gray-800 shadow-lg overflow-hidden animate-sway-medium">
                <div className="absolute inset-2 rounded-full bg-emerald-500 opacity-20 animate-pulse-slow"></div>
              </div>
            </div>
            
            {/* Glowing circle under main pendant */}
            <div className="absolute top-3/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/4 rounded-full bg-emerald-500 opacity-10 animate-ping-slow blur-md"></div>
            
            {/* Skeleton floor with reflection */}
            <div className="absolute bottom-0 w-full h-1/6 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-lg shadow-md">
              {/* Floor reflection */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-emerald-500 opacity-20 blur-sm"></div>
            </div>
            
            {/* Skeleton controls with hover effect */}
            <div className="absolute bottom-[-80px] w-full flex justify-center space-x-6">
              {[1, 2, 3].map((num) => (
                <div 
                  key={num}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 shadow-md flex items-center justify-center group cursor-pointer"
                  style={{ animationDelay: `${num * 0.2}s` }}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-800 group-hover:bg-emerald-900 transition-colors duration-300 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-gray-700 group-hover:bg-emerald-800 transition-colors duration-300 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center px-4 relative z-10">
            {/* Loading text with animated dots */}
            <div className="h-8 flex items-center justify-center mb-3">
              <div className="text-emerald-500 text-xl font-bold">Loading 3D Preview</div>
              <div className="loading-dots ml-2">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
            <div className="text-gray-400 text-sm animate-pulse">Preparing your LIMI experience</div>
            
            {/* Progress bar */}
            <div className="mt-6 w-64 h-2 bg-gray-800 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-emerald-500 animate-progress-indeterminate"></div>
            </div>
          </div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80 z-10">
          <div className="text-white text-center p-4">
            <div className="mb-2 text-red-500 text-4xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-xl font-bold mb-2">Failed to load 3D Preview</p>
            <p>Please check your connection and refresh the page.</p>
          </div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        id="playcanvas-app"
        title="3D Configurator Preview"
        // https://configurator.limilighting.com
        // src="https://playcanv.as/e/p/7c2273a2/"
        // src="https://limi-conf.vercel.app/"
        src='https://limi-configurator-temp.vercel.app/'
        // src='https://playcanv.as/e/p/7c2273a2/'
        // src='https://playcanv.as/e/p/7c2273a2/'
        allow="autoplay; fullscreen; vr"
        className={`w-full h-full transition-opacity duration-500 ${appReady ? 'opacity-100' : 'opacity-0'}`}
        style={{ border: 'none' }}
      ></iframe>
      
      {/* Overlay to prevent interaction issues during loading */}
      {!appReady && <div className="absolute inset-0 pointer-events-none z-10"></div>}
    </div>  
  );
};

export default PlayCanvasViewer;
