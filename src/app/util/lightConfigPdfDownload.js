import { buildApi1Url } from "../config/api.config";

/**
 * Download a saved light-configuration PDF from the API.
 *
 * Backend contract (see docs/LIGHT_CONFIG_PDF_API.md):
 * - Preferred: GET …/light-configs/:id/pdf → binary PDF (Content-Type: application/pdf)
 * - Alternate: same URL returns JSON { pdfUrl } → we fetch that URL and download
 *
 * @param {string} configId - Mongo/object id of the saved light config
 * @param {{ fileName?: string }} [options]
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function downloadLightConfigPdf(configId, options = {}) {
  if (!configId || typeof window === "undefined") {
    return { ok: false, error: "Missing configuration id" };
  }

  const token = localStorage.getItem("limiToken");
  const safeName =
    (options.fileName || `LIMI-Config-${String(configId)}`)
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-") || "configuration.pdf";
  const fileName = safeName.endsWith(".pdf") ? safeName : `${safeName}.pdf`;

  const url = buildApi1Url(
    `/admin/products/light-configs/${encodeURIComponent(configId)}/pdf`
  );

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: token } : {}),
      },
    });

    const ct = (res.headers.get("content-type") || "").toLowerCase();

    if (res.ok && ct.includes("application/pdf")) {
      const blob = await res.blob();
      triggerBlobDownload(blob, fileName);
      return { ok: true };
    }

    if (res.ok && ct.includes("application/json")) {
      const data = await res.json();
      const pdfUrl =
        data.pdfUrl ||
        data.pdf_url ||
        data.url ||
        data.data?.pdfUrl ||
        data.data?.url;

      if (pdfUrl && typeof pdfUrl === "string") {
        const r2 = await fetch(pdfUrl, { mode: "cors" });
        if (!r2.ok) {
          window.open(pdfUrl, "_blank", "noopener,noreferrer");
          return { ok: true };
        }
        const blob = await r2.blob();
        triggerBlobDownload(blob, fileName);
        return { ok: true };
      }

      return {
        ok: false,
        error: "PDF URL missing in API response (expected pdfUrl or url)",
      };
    }

    const errText = await res.text().catch(() => "");
    return {
      ok: false,
      error: errText || `HTTP ${res.status}`,
    };
  } catch (e) {
    return {
      ok: false,
      error: e?.message || "Network error",
    };
  }
}

function triggerBlobDownload(blob, fileName) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}
