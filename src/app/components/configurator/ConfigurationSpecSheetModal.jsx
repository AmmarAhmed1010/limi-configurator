"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateSpecSheetPdf } from "./ConfigurationSpecSheetPDF";

export function ConfigurationSpecSheetModal({
  isOpen,
  onClose,
  payload,
  onPdfBlob,
}) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const blobRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !payload) {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      blobRef.current = null;
      return;
    }

    setGenerating(true);

    const timer = setTimeout(() => {
      (async () => {
        try {
          const blob = await generateSpecSheetPdf(payload);
          blobRef.current = blob;
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
          if (onPdfBlob) onPdfBlob(blob);
        } catch (err) {
          console.error("[SpecSheet] PDF generation failed:", err);
        } finally {
          setGenerating(false);
        }
      })();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, payload]);

  const handleDownload = useCallback(() => {
    if (!blobRef.current || !payload) return;
    const fileName = `LIMI-Config-${(payload.name || "untitled")
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase()}.pdf`;

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blobRef.current);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }, [payload]);

  if (!payload) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="spec-sheet-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "rgba(0,0,0,0.85)",
            overflow: "hidden",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Toolbar */}
          <div
            style={{
              width: "100%",
              maxWidth: 900,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 8,
              padding: "12px 16px",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={handleDownload}
              disabled={generating || !pdfUrl}
              className="rounded-md bg-[#50C878] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3da861] transition-colors shadow-lg disabled:opacity-50"
            >
              {generating ? "Generating…" : "Download PDF"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-[#2B2D2F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a3c3e] transition-colors shadow-lg border border-gray-600"
            >
              Close
            </button>
          </div>

          {/* PDF Preview */}
          <div
            style={{
              flex: 1,
              width: "100%",
              maxWidth: 900,
              overflow: "hidden",
              borderRadius: 8,
              marginBottom: 16,
              background: "#525659",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {generating && (
              <div className="text-white text-base font-medium animate-pulse">
                Generating your specification sheet…
              </div>
            )}

            {!generating && pdfUrl && (
              <iframe
                src={pdfUrl}
                title="Configuration Specification PDF"
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  borderRadius: 8,
                }}
              />
            )}

            {!generating && !pdfUrl && (
              <div className="text-gray-400 text-sm">
                Failed to generate PDF. Please try again.
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ConfigurationSpecSheetModal;
