// Thin fetch wrapper. Cookies are sent automatically (credentials: "include").
async function request(path, options = {}) {
  const isForm = options.body instanceof FormData;
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    // For FormData the browser sets the multipart Content-Type (with boundary) itself
    headers: isForm ? {} : { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || "Request failed.");
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // Module 1: auth
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),

  // Public seller profile
  user: (id) => request(`/users/${id}`),

  // Profile
  updateProfile: (formData) => request("/profile", { method: "PUT", body: formData }),
  changePassword: (body) => request("/profile/password", { method: "PUT", body: JSON.stringify(body) }),

  // Modules 2-4: listings (create/update take FormData because of the image upload)
  listings: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== "" && v != null));
    return request(`/listings?${qs}`);
  },
  myListings: () => request("/listings/mine"),
  listing: (id) => request(`/listings/${id}`),
  createListing: (formData) => request("/listings", { method: "POST", body: formData }),
  updateListing: (id, formData) => request(`/listings/${id}`, { method: "PUT", body: formData }),
  deleteListing: (id) => request(`/listings/${id}`, { method: "DELETE" }),

  // Module 5: chat (live messages travel over WebSocket, see pages/Chats.jsx)
  chats: () => request("/chats"),
  startChat: (listingId) => request("/chats", { method: "POST", body: JSON.stringify({ listingId }) }),
  wsTicket: () => request("/chats/ws-ticket"),
  unread: () => request("/chats/unread"),
  markRead: (conversationId) => request(`/chats/${conversationId}/read`, { method: "POST" }),
  messages: (conversationId) => request(`/chats/${conversationId}/messages`),
};