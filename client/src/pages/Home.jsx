import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import ListingCard from "../components/ListingCard.jsx";
import { CATEGORIES, CONDITIONS } from "../constants.js";

const initial = { q: "", category: "", condition: "", minPrice: "", maxPrice: "", sort: "newest" };

// Browse page: search, filter and sort (REQ-4)
export default function Home() {
  const [filters, setFilters] = useState(initial);
  const [listings, setListings] = useState(null);
  const [error, setError] = useState("");

  // Re-fetch when filters change; the short delay avoids a request on every keystroke
  useEffect(() => {
    let ignore = false;
    const t = setTimeout(() => {
      api.listings(filters)
        .then((d) => !ignore && (setListings(d.listings), setError("")))
        .catch((e) => !ignore && setError(e.message));
    }, 300);
    return () => {
      ignore = true;
      clearTimeout(t);
    };
  }, [filters]);

  const set = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(initial);

  return (
    <>
      <h1 className="page__title">Browse items</h1>

      <form className="filters" onSubmit={(e) => e.preventDefault()} role="search">
        <input
          className="filters__search"
          name="q"
          type="search"
          placeholder="Search by name or description"
          aria-label="Search items"
          value={filters.q}
          onChange={set}
        />
        <select name="category" value={filters.category} onChange={set} aria-label="Category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select name="condition" value={filters.condition} onChange={set} aria-label="Condition">
          <option value="">Any condition</option>
          {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input name="minPrice" type="number" min="0" placeholder="Min ₹" aria-label="Minimum price" value={filters.minPrice} onChange={set} />
        <input name="maxPrice" type="number" min="0" placeholder="Max ₹" aria-label="Maximum price" value={filters.maxPrice} onChange={set} />
        <select name="sort" value={filters.sort} onChange={set} aria-label="Sort by">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
        {isFiltered && (
          <button type="button" className="btn btn--ghost" onClick={() => setFilters(initial)}>Clear filters</button>
        )}
      </form>

      {error && <p className="error">{error}</p>}
      {!listings && !error && <p>Loading listings…</p>}

      {listings && listings.length === 0 && (
        <p>
          {isFiltered ? "No items match these filters." : "No items listed yet."}{" "}
          {!isFiltered && <Link to="/listings/new">Be the first to sell something.</Link>}
        </p>
      )}
      {listings && listings.length > 0 && (
        <div className="grid">
          {listings.map((l) => <ListingCard key={l._id} listing={l} />)}
        </div>
      )}
    </>
  );
}
