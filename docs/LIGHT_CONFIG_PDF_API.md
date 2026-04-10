# Light configuration PDF — backend contract

This document describes what the **limi-configurator** frontend expects so the backend can store PDFs (upload from configurator) and serve them (download from portal / profile).

---

## 1. Upload PDF (after save in configurator)

**Already implemented on the frontend**

- **Method:** `POST`
- **Path:** `/admin/products/light-configs/pdf` (full URL via `buildApi1Url`, e.g. `https://dev.api1.limitless-lighting.co.uk/admin/products/light-configs/pdf`)
- **Headers:** `Authorization: <dashboard token>` (same as other admin calls)
- **Body:** `multipart/form-data`
  - `pdf` — file (`.pdf` blob)
  - `configName` — string (human-readable name)
  - `user_id` — string (optional, when available)
  - `light_config_id` — string (optional; frontend polls until the main save returns an id, then uploads with this field)

**Suggested response (JSON)**

```json
{
  "success": true,
  "light_config_id": "…",
  "pdfUrl": "https://…/storage/…/spec.pdf",
  "pdf_key": "s3-key-or-path"
}
```

Fields can be minimal; the frontend currently only checks HTTP status. Returning `light_config_id` and a stable `pdfUrl` (or storage key) helps support downloads.

---

## 2. Download PDF (portal & “Load configuration” modal)

**Frontend calls**

- **Method:** `GET`
- **Path:** `/admin/products/light-configs/:lightConfigId/pdf`
- **Headers:** `Authorization: <same token as other user/admin calls>`

### Option A — Direct PDF (recommended)

- **Status:** `200`
- **Header:** `Content-Type: application/pdf`
- **Body:** raw PDF bytes

The frontend saves the blob as `LIMI-Config-<id>.pdf` (or uses a provided filename pattern).

### Option B — Signed URL (CDN / S3)

- **Status:** `200`
- **Header:** `Content-Type: application/json`
- **Body:**

```json
{
  "pdfUrl": "https://cdn.example.com/…/spec.pdf?signature=…",
  "expiresAt": "2026-04-11T12:00:00.000Z"
}
```

Optional aliases the frontend also accepts: `pdf_url`, `url`, or nested under `data.pdfUrl` / `data.url`.

If `pdfUrl` is same-origin or CORS-enabled, the file is downloaded. If fetch fails (e.g. opaque CORS), the UI may open the URL in a new tab.

---

## 3. List / detail — optional fields

So the UI can show “PDF available” or hide the button:

**On `GET /admin/products/users/light-configs` (list) or `GET /admin/products/light-configs/:id` (detail), optional:**

```json
{
  "_id": "…",
  "name": "My kitchen",
  "pdfUrl": "https://…",
  "hasPdf": true,
  "pdfUpdatedAt": "2026-04-10T…"
}
```

Not required for the first version; the Download button can always call `GET …/pdf` and show an error if `404`.

---

## 4. Errors

| Status | Meaning (suggested) |
|--------|---------------------|
| `401` / `403` | Not allowed to access this config |
| `404` | Config or PDF not found |
| `501` | PDF not generated yet |

---

## 5. Summary for backend dev

1. **POST** `…/light-configs/pdf` — accept multipart `pdf` + metadata; persist; link to `light_config_id`.
2. **GET** `…/light-configs/:id/pdf` — return **either** raw PDF **or** JSON with `pdfUrl`.

Same base host and auth style as existing `…/light-configs` routes.
