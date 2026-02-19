"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaSpinner } from "react-icons/fa";

const PlayCanvasViewer = ({
  config = {},
  isDarkMode,
  className = "",
  loadcanvas,

  localSavedCables,
  localSavedConfig,
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
      const isMobileDevice =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent.toLowerCase()
        );
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Listen for messages from the PlayCanvas iframe
  useEffect(() => {
    const handleMessage = (event) => {
      // Check if the message is from our iframe
      if (event.data === "loadingOffMount") {
        setAppReady(true);
        setIsLoading(false);
        // Send default selections after app is ready
        // sendDefaultSelections();
      }
      if (event.data === "load") {
      }
    };

    window.addEventListener("message", handleMessage);

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
      window.removeEventListener("message", handleMessage);
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
    if (localSavedConfig) {
      sendConfigToPlayCanvas(localSavedConfig.config);
      localSavedCables?.forEach((cable, index) => {
        if (cable.systemType) {
          sendMessageToPlayCanvas(`system:${cable.systemType}`);
          sendMessageToPlayCanvas(`cable_${index}:${cable.designId}`);
        } else {
          sendMessageToPlayCanvas(`cable_${index}:${cable.designId}`);
        }
      });
    } else {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        // Only send default selections if they're not provided in the config
        if (!config.lightType && !config.lightAmount && !config.lightDesign) {
          // Default selections
          iframeRef.current.contentWindow.postMessage(
            "light_type:ceiling",
            "*"
          );
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
      iframe.addEventListener("load", handleIframeLoad);
      iframe.addEventListener("error", handleIframeError);
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
        iframe.removeEventListener("load", handleIframeLoad);
        iframe.removeEventListener("error", handleIframeError);
      }
      // clearTimeout(timeoutId);
    };
  }, [isMobile, isLoading]);

  // Function to send configuration to PlayCanvas
  const sendConfigToPlayCanvas = (config) => {
    try {
      if (!iframeRef.current || !iframeRef.current.contentWindow || !config)
        return;

      // Only send configurations if the app is ready or we're forcing it
      // Send light type
      if (config.lightType) {
        iframeRef.current.contentWindow.postMessage(
          `light_type:${config.lightType}`,
          "*"
        );
      }

      // Send light amount
      if (config.lightAmount !== undefined && config.lightAmount !== null) {
        iframeRef.current.contentWindow.postMessage(
          `light_amount:${config.lightAmount}`,
          "*"
        );
      }
      if (config.baseType) {
        iframeRef.current.contentWindow.postMessage(
          `base_type:${config.baseType}`,
          "*"
        );
      }
      if (config.baseColor) {
        iframeRef.current.contentWindow.postMessage(
          `base_color:${config.baseColor}`,
          "*"
        );
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
      if (
        !iframeRef.current ||
        !iframeRef.current.contentWindow ||
        !iframeRef.current.contentDocument
      ) {
        console.error("Cannot access iframe content document");
        return;
      }

      const doc = iframeRef.current.contentDocument;

      // Create a script element to load the PlayCanvas engine
      const script = doc.createElement("script");
      script.src = "https://code.playcanvas.com/playcanvas-stable.min.js";
      script.onload = () => {
        // Create a script to initialize the PlayCanvas application
        const initScript = doc.createElement("script");
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
      console.error("Error injecting PlayCanvas script:", error);
      setHasError(true);
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative ${className} w-full h-full`}>
      {/* Enhanced Interactive Skeleton Loader - Only shown until app:ready1 message is received */}
      {!appReady && (
        <div
          id="playcanvas-loader"
          className="absolute inset-0 flex flex-col items-center justify-center bg-[#2B2D2F] z-10 overflow-hidden"
        >
          <div className="flex flex-col items-center justify-center space-y-16">
            {/* Logo */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Spinner - Adjusted size */}
              <div className="absolute inset-0 border-2 border-t-white border-transparent rounded-full animate-spin"></div>
              {/* Logo with adjusted size and spacing */}
              <div className="w-16 h-16 flex items-center justify-center">
                <img
                  src="/images/svgLogos/__Logo_Icon_White.svg"
                  alt="LIMI Logo"
                  className="w-full h-full object-contain"
                  style={{
                    minWidth: "64px",
                    minHeight: "64px",
                  }}
                />
              </div>  
            </div>
            {/* Loading text with adjusted spacing */}
            <p className="text-white mt-12 text-lg font-medium px-4 text-center">
              Preparing your 3D LIMI experience
            </p>
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80 z-10">
          <div className="text-white text-center p-4">
            <div className="mb-2 text-red-500 text-4xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
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
        // https://configurator.limilighting
          // https://configurator.limilighting
        // src="https://playcanv.as/e/p/7c2273a2/"
        // src="https://limi-conf.vercel.app/"
        // src='https://limi-configurator-temp.vercel.app/'
        // src='https://limiliveconfigurator.vercel.app/'
        src='https://limi-configurator-dev.vercel.app/'
        allow="autoplay; fullscreen; vr"
        className={`w-full h-full min-h-screen transition-opacity duration-500 ${
          appReady ? "opacity-100" : "opacity-0"
        }`}
        style={{ border: "none" }}
      ></iframe>

      {/* Overlay to prevent interaction issues during loading */}
      {!appReady && (
        <div className="absolute inset-0 pointer-events-none z-10"></div>
      )}
    </div>
  );
};

export default PlayCanvasViewer;
