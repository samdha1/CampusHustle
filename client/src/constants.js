export const CATEGORIES = ["Books", "Electronics", "Furniture", "Clothing", "Stationery", "Other"];
export const CONDITIONS = ["New", "Like new", "Good", "Fair"];

export const formatPrice = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
