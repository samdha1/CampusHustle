export const CATEGORIES = ["Books", "Electronics", "Furniture", "Clothing", "Stationery", "Other"];
export const CONDITIONS = ["New", "Like new", "Good", "Fair"];

export const formatPrice = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

// "5 min ago", "yesterday", "12 Oct"
export function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 172800) return "yesterday";
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)} days ago`;
  return new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}