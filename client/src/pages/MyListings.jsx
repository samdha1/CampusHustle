import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useToast } from "../context/ToastContext.jsx";
import ListingCard from "../components/ListingCard.jsx";

export default function MyListings() {
  const toast = useToast();
  const [listings, setListings] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.myListings().then((d) => setListings(d.listings)).catch((e) => setError(e.message));
  }, []);

  const remove = async (listing) => {
    if (!window.confirm(`Delete "${listing.title}"? This can't be undone.`)) return;
    try {
      await api.deleteListing(listing._id);
      setListings((prev) => prev.filter((l) => l._id !== listing._id));
      toast.success("Listing deleted.");
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="page__title">My listings</h1>
          <p className="page__sub">Items you are selling. Edit or remove them any time.</p>
        </div>
        <Link to="/listings/new" className="btn btn--accent">Sell an item</Link>
      </div>

      {error && <p className="error">{error}</p>}
      {!listings && !error && (
        <div className="grid" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card card--skeleton" />)}
        </div>
      )}

      {listings && listings.length === 0 && (
        <div className="empty">
          <div className="empty__icon" aria-hidden="true">📦</div>
          <h2>You haven't listed anything yet</h2>
          <p>Got books, gadgets or furniture you no longer need? Someone on campus does.</p>
          <Link to="/listings/new" className="btn">Sell your first item</Link>
        </div>
      )}

      <div className="grid">
        {listings?.map((l) => (
          <ListingCard
            key={l._id}
            listing={l}
            actions={
              <>
                <Link to={`/listings/${l._id}/edit`} className="btn btn--ghost btn--sm">Edit</Link>
                <button className="btn btn--danger btn--sm" onClick={() => remove(l)}>Delete</button>
              </>
            }
          />
        ))}
      </div>
    </>
  );
}