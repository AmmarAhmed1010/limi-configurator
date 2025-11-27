// Utility to listen for iframe messages starting with 'cable_'
export function listenForCableMessages(callback) {
  function handleMessage(event) {
    if (typeof event.data === "string" && event.data.startsWith("cable_")) {
      callback(event.data, event);
    }
    console.log("cableeeee")
  }
  window.addEventListener("message", handleMessage);
  // Return cleanup
  return () => window.removeEventListener("message", handleMessage);
}
export function listenForOffconfigMessages(callback) {
  function handleMessage(event) {
    if (typeof event.data === "string" && event.data.startsWith("offconfig")) {
      callback(event.data, event);
    }
  }
  window.addEventListener("message", handleMessage);
  // Return cleanup
  return () => window.removeEventListener("message", handleMessage);
}
// Add to iframeCableMessageHandler.js
export function listenForAppReady1(callback) {
  function handleMessage(event) {
    if (typeof event.data === "string" && event.data === "app:ready1") {
      callback(event.data, event);
    }
  }
  window.addEventListener("message", handleMessage);
  // Return cleanup
  return () => window.removeEventListener("message", handleMessage);
}

export function listenForScreenshotUploadMessages(callback) {
  function handleMessage(event) {
    if (
      typeof event.data === "string" &&
      event.data.startsWith("ScreenShot : /uploads/screen_shot/")
    ) {
      callback(event.data, event);
    }
  }
  window.addEventListener("message", handleMessage);
  // Return cleanup
  return () => window.removeEventListener("message", handleMessage);
}
// NEW: Listen for selected cable messages like 'selectedcable: 0, 1, 2;'
export function listenForSelectedCableMessages(callback) {
  function handleMessage(event) {
    if (
      typeof event.data === "string" &&
      event.data.toLowerCase().startsWith("selectedcable:")
    ) {
      callback(event.data, event);
    }
  }
  window.addEventListener("message", handleMessage);
  // Return cleanup function
  return () => window.removeEventListener("message", handleMessage);
}
export function listenForModelIdMessages(callback) {
  function handleMessage(event) {
    if (typeof event.data === "string" && event.data.startsWith("model_id")) {
      callback(event.data, event);
    }
  }
  window.addEventListener("message", handleMessage);
  // Return cleanup
  // return () => window.removeEventListener('message', handleMessage);
}

export function listenForMouseOverMessages(callback) {
  function handleMessage(event) {
    if (
      typeof event.data === "string" &&
      event.data.startsWith("MousepointerChange")
    ) {
      callback(event.data, event);
    }
  }
  window.addEventListener("message", handleMessage);
  // Return cleanup
  // return () => window.removeEventListener('message', handleMessage);
}
export function listenForMouseOutMessages(callback) {
  function handleMessage(event) {
    if (
      typeof event.data === "string" &&
      event.data.startsWith("MousepointerNormal")
    ) {
      callback(event.data, event);
    }
  }
  window.addEventListener("message", handleMessage);
}

export function listenForWallbaseColorMessages(callback) {
  function handleMessage(event) {
    if (typeof event.data === "string" && event.data === "wallbaseColor") {
      callback(event.data, event);
    }
  }
  window.addEventListener("message", handleMessage);
  // Return cleanup
  return () => window.removeEventListener("message", handleMessage);
}
export function listenForConnectorColorMessages(callback) {
  function handleMessage(event) {
    if (typeof event.data === "string" && event.data === "connectorColor") {
      callback(event.data, event);
    }
  }
  window.addEventListener("message", handleMessage);
  // Return cleanup
  return () => window.removeEventListener("message", handleMessage);
}

// Listen for loading screen messages
export function listenForLoadingMessages(callback) {
  function handleMessage(event) {
    if (typeof event.data === "string" && event.data === "loadingOff") {
      callback(event.data, event);
    }
  }
  window.addEventListener("message", handleMessage);
  // Return cleanup
  return () => window.removeEventListener("message", handleMessage);
}

// Listen for loadingOffMount messages
export function listenForLoadingOffMountMessages(callback) {
  function handleMessage(event) {
    if (typeof event.data === "string" && event.data === "loadingOffMount") {
      callback(event.data, event);
    }
  }
  window.addEventListener("message", handleMessage);
  // Return cleanup
  return () => window.removeEventListener("message", handleMessage);
}
