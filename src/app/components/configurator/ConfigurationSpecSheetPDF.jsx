"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  enrichCablesForSpecSheet,
  resolveConfiguratorAssetUrl,
} from "./configuratorUtils";

const EMERALD = [80, 200, 120];
const CHARLESTON = [43, 45, 47];
const WHITE = [255, 255, 255];
const GRAY_100 = [243, 244, 246];
const GRAY_500 = [107, 114, 128];

const LOGO_ICON_PATH = "/images/svgLogos/__Logo_Icon_White.svg";
const LOGO_WORDMARK_PATH = "/images/svgLogos/__Wordmark_White.svg";

function cap(str) {
  if (!str || typeof str !== "string") return "—";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function resolveEnv(config, sceneList) {
  const v = config?.environment;
  if (!v || v === "noScene" || v === "no_scene") return "No Scene";
  if (Array.isArray(sceneList)) {
    const m = sceneList.find(
      (sc) =>
        sc._id === v ||
        sc.sceneName?.toLowerCase().replace(/\s+/g, "_") === v
    );
    if (m) return `${m.sceneName} (${m._id || v})`;
  }
  return cap(v);
}

/**
 * Load an image as PNG data URL + natural aspect ratio for jsPDF addImage.
 * Tries fetch (API/CDN with CORS) then falls back to Image + canvas (same-origin SVG, etc.).
 */
async function loadImageForPdf(url) {
  const resolved = resolveConfiguratorAssetUrl(url) || url;
  if (!resolved || typeof resolved !== "string") return null;

  const blobToDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });

  const rasterizeToPng = (img, maxPx = 512) =>
    new Promise((resolve) => {
      try {
        const w = img.naturalWidth || img.width || 1;
        const h = img.naturalHeight || img.height || 1;
        const scale = Math.min(maxPx / w, maxPx / h, 1);
        const cw = Math.max(1, Math.round(w * scale));
        const ch = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, cw, ch);
        const dataUrl = canvas.toDataURL("image/png");
        resolve({
          dataUrl,
          aspect: cw / ch,
        });
      } catch {
        resolve(null);
      }
    });

  try {
    const res = await fetch(resolved, { mode: "cors", credentials: "omit" });
    if (res.ok) {
      const blob = await res.blob();
      const type = (blob.type || "").toLowerCase();
      if (
        type.includes("png") ||
        type.includes("jpeg") ||
        type.includes("jpg") ||
        type.includes("webp") ||
        type.includes("gif")
      ) {
        const dataUrl = await blobToDataUrl(blob);
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = async () => {
            const out = await rasterizeToPng(img);
            resolve(out);
          };
          img.onerror = () => resolve(null);
          img.src = dataUrl;
        });
      }
    }
  } catch {
    /* try Image path */
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      const out = await rasterizeToPng(img);
      resolve(out);
    };
    img.onerror = () => resolve(null);
    img.src = resolved;
  });
}

function drawImageMm(doc, dataUrl, x, y, heightMm, aspect) {
  if (!dataUrl || !aspect) return;
  const wMm = Math.min(heightMm * aspect, 45);
  const hMm = heightMm;
  doc.addImage(dataUrl, "PNG", x, y, wMm, hMm);
}

/**
 * Generate a LIMI specification-sheet PDF and return it as a Blob.
 * Embeds header logos and pendant thumbnails when URLs load (CORS / same-origin).
 */
export async function generateSpecSheetPdf(payload) {
  const { name, savedAt, modelId, config, configSummary, sceneList, thumbnail } =
    payload;
  const rows = enrichCablesForSpecSheet(payload.cables || []);
  const envLabel = resolveEnv(config, sceneList);
  const shades = configSummary?.shades || config?.shades || {};
  const dateStr = savedAt
    ? new Date(savedAt).toLocaleString(undefined, {
        dateStyle: "long",
        timeStyle: "short",
      })
    : "—";

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  const [iconAsset, wordAsset, previewAsset, footerWordAsset, ...pendantAssets] =
    await Promise.all([
      loadImageForPdf(`${origin}${LOGO_ICON_PATH}`),
      loadImageForPdf(`${origin}${LOGO_WORDMARK_PATH}`),
      thumbnail ? loadImageForPdf(thumbnail) : Promise.resolve(null),
      loadImageForPdf(`${origin}/images/svgLogos/__Wordmark_Black.svg`),
      ...rows.map((r) =>
        r.imageUrl ? loadImageForPdf(r.imageUrl) : Promise.resolve(null)
      ),
    ]);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const marginL = 18;
  const marginR = 18;
  const contentW = W - marginL - marginR;
  let y = 0;

  // ===== HEADER BAR =====
  doc.setFillColor(...CHARLESTON);
  doc.rect(0, 0, W, 18, "F");

  let headerX = marginL;
  if (iconAsset?.dataUrl) {
    drawImageMm(doc, iconAsset.dataUrl, headerX, 4, 9, iconAsset.aspect);
    headerX += 9 * iconAsset.aspect + 3;
  }
  if (wordAsset?.dataUrl) {
    drawImageMm(doc, wordAsset.dataUrl, headerX, 5.5, 6, wordAsset.aspect);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...WHITE);
    doc.text("LIMI", headerX, 12);
  }

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...WHITE);
  doc.text("CONFIGURATION SPECIFICATION", W - marginR, 11, { align: "right" });

  y = 26;

  // ===== CONFIG NAME + META =====
  doc.setTextColor(...CHARLESTON);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(name || "Untitled Configuration", marginL, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY_500);
  let metaLine = `Generated on ${dateStr}`;
  if (modelId) metaLine += `  ·  Model ID: ${modelId}`;
  doc.text(metaLine, marginL, y);
  y += 7;

  // ===== INTRO =====
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY_500);
  const introText =
    "This document is an auto-generated specification sheet for a custom LIMI lighting configuration. " +
    "It details every aspect of the selected setup — including mounting, pendant selection, material finishes, " +
    "and lighting parameters — so it can be accurately quoted, manufactured, or reloaded in the configurator at any time.";
  const introLines = doc.splitTextToSize(introText, contentW);
  doc.text(introLines, marginL, y);
  y += introLines.length * 3.2 + 4;

  // ===== CONFIGURATION PREVIEW (optional image) =====
  if (previewAsset?.dataUrl) {
    if (y > 220) {
      doc.addPage();
      y = 16;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...CHARLESTON);
    doc.text("CONFIGURATION PREVIEW", marginL, y);
    y += 2;
    doc.setFillColor(...EMERALD);
    doc.rect(marginL, y + 1, contentW, 0.6, "F");
    y += 5;
    const maxPreviewW = Math.min(contentW - 2, 85);
    const maxPreviewH = 55;
    let imgW = maxPreviewW;
    let imgH = imgW / Math.max(previewAsset.aspect, 0.3);
    if (imgH > maxPreviewH) {
      imgH = maxPreviewH;
      imgW = imgH * previewAsset.aspect;
    }
    doc.setDrawColor(229, 231, 235);
    doc.rect(marginL, y, imgW + 2, imgH + 2);
    try {
      doc.addImage(
        previewAsset.dataUrl,
        "PNG",
        marginL + 1,
        y + 1,
        imgW,
        imgH
      );
    } catch {
      /* ignore */
    }
    y += imgH + 8;
  }

  // ===== SECTION HELPER =====
  function sectionTitle(title) {
    if (y > 265) {
      doc.addPage();
      y = 16;
    }
    doc.setFillColor(...EMERALD);
    doc.rect(marginL, y + 1, contentW, 0.6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...CHARLESTON);
    doc.text(title.toUpperCase(), marginL, y);
    y += 6;
  }

  function kvRow(label, value) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(55, 65, 81);
    doc.text(label, marginL, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...CHARLESTON);
    doc.text(String(value ?? "—"), marginL + 42, y);
    y += 4.5;
  }

  // ===== GENERAL SPECIFICATION =====
  sectionTitle("General Specification");
  kvRow("Light type", cap(config?.lightType));
  if (config?.lightType === "ceiling") {
    kvRow("Base type", cap(config?.baseType));
  }
  kvRow("Number of lights", String(config?.lightAmount ?? "—"));
  kvRow("Base colour", cap(config?.baseColor));
  kvRow("Environment preset", envLabel);
  kvRow("Configuration type", cap(config?.configurationType));
  y += 3;

  // ===== LIGHTING PARAMETERS =====
  sectionTitle("Lighting Parameters");
  kvRow("Brightness", `${config?.brightness ?? "—"}%`);
  kvRow("Colour temperature", `${config?.colorTemperature ?? "—"}K`);
  kvRow(
    "Lighting enabled",
    typeof config?.lighting === "boolean"
      ? config.lighting
        ? "Yes"
        : "No"
      : "—"
  );
  y += 3;

  // ===== INDIVIDUAL PARTS TABLE =====
  sectionTitle("Individual Parts & Pendants");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY_500);
  doc.text(
    "Each row corresponds to a cable slot in your configuration, matched against product entries in the LIMI catalogue.",
    marginL,
    y
  );
  y += 5;

  const tableBody = rows.map((row) => {
    const finishParts = [];
    if (row.assignment?.hasGlass) finishParts.push("Glass");
    if (row.assignment?.hasSilver) finishParts.push("Silver");
    if (row.assignment?.hasGold) finishParts.push("Gold");

    return [
      String(row.slot),
      " ",
      cap(row.displayDesign),
      row.assignment?.systemType ? row.assignment.systemType.toUpperCase() : "—",
      finishParts.length > 0 ? finishParts.join(", ") : "—",
      row.cableSize,
      cap(row.connectorColor),
      cap(row.cableColor),
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: marginL, right: marginR },
    head: [
      [
        "#",
        "Image",
        "Design",
        "System",
        "Finish",
        "Cable Size",
        "Connector",
        "Cable Colour",
      ],
    ],
    body: tableBody,
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: CHARLESTON,
      lineColor: [229, 231, 235],
      lineWidth: 0.2,
      minCellHeight: 11,
    },
    headStyles: {
      fillColor: CHARLESTON,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 7,
      halign: "left",
    },
    alternateRowStyles: {
      fillColor: GRAY_100,
    },
    columnStyles: {
      0: { cellWidth: 6, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 12, halign: "center" },
      2: { cellWidth: 22, fontStyle: "bold" },
      3: { cellWidth: 32, fontStyle: "bold" },
      4: { cellWidth: 22 },
      5: { cellWidth: 20, fontSize: 7 },
      6: { cellWidth: 20, fontSize: 7 },
      7: { cellWidth: 20, fontSize: 7 },
    },
    didDrawCell: (data) => {
      if (data.section !== "body" || data.column.index !== 1) return;
      const idx = data.row.index;
      const asset = pendantAssets[idx];
      if (!asset?.dataUrl) return;
      const pad = 1;
      const cellH = data.cell.height - pad * 2;
      const cellW = data.cell.width - pad * 2;
      const h = Math.min(cellH, 8);
      const w = Math.min(h * asset.aspect, cellW);
      const x = data.cell.x + (data.cell.width - w) / 2;
      const yPos = data.cell.y + (data.cell.height - h) / 2;
      try {
        doc.addImage(asset.dataUrl, "PNG", x, yPos, w, h);
      } catch {
        /* ignore */
      }
    },
  });

  y = doc.lastAutoTable.finalY + 6;

  // ===== SHADES =====
  if (Object.keys(shades).length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 16;
    }
    sectionTitle("Shade Selections");
    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...CHARLESTON);
    const shadesText = JSON.stringify(shades, null, 2);
    const shadesLines = doc.splitTextToSize(shadesText, contentW);
    doc.text(shadesLines, marginL, y);
    y += shadesLines.length * 3 + 4;
  }

  // ===== FOOTER (on every page) =====
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pH = doc.internal.pageSize.getHeight();

    doc.setFillColor(...EMERALD);
    doc.rect(marginL, pH - 12, contentW, 0.6, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY_500);
    doc.text(
      "LIMI AI — The Ambient AI Infrastructure for Your Space  ·  limiai.co",
      marginL,
      pH - 7
    );

    if (footerWordAsset?.dataUrl) {
      drawImageMm(
        doc,
        footerWordAsset.dataUrl,
        W - marginR - 22,
        pH - 9,
        4,
        footerWordAsset.aspect
      );
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...CHARLESTON);
      doc.text("LIMI", W - marginR, pH - 7, { align: "right" });
    }
  }

  return doc.output("blob");
}

export default generateSpecSheetPdf;
