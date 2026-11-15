// Thin fetch wrapper: adds the JWT, turns API errors into readable messages.
const BASE = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "hiretrack_token";

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } },
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

function detailToMessage(detail) {
  if (!detail) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    // FastAPI validation errors
    return detail.map((d) => {
      const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : "";
      const msg = (d.msg || "").replace(/^Value error, /, "");
      return field && field !== "body" ? `${field}: ${msg}` : msg;
    }).join("; ");
  }
  return null;
}

export async function api(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers["Content-Type"] = "application/json"; payload = JSON.stringify(body); }

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError("Can't reach the server. Is the backend running on port 8000?", 0);
  }
  if (res.status === 401 && token && !path.startsWith("/api/auth/login")) {
    onUnauthorized();
  }
  if (res.status === 204) return null;
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) {
    throw new ApiError(detailToMessage(data?.detail) || `Request failed (${res.status})`, res.status);
  }
  return data;
}

export const STAGES = [
  { key: "WISHLIST", label: "Wishlist" },
  { key: "APPLIED", label: "Applied" },
  { key: "INTERVIEW", label: "Interview" },
  { key: "OFFER", label: "Offer" },
  { key: "REJECTED", label: "Rejected" },
];
export const stageLabel = (k) => STAGES.find((s) => s.key === k)?.label ?? k;
