import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import ListingCard from "../components/ListingCard.jsx";

export default function MyListings() {
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
    } catch (e) {
      setError(e.message);
    }
  };

  if (!listings && !error) return <p>Loading your listings…</p>;

  return (
    <>
      <h1 className="page__title">My listings</h1>
      {error && <p className="error">{error}</p>}
      {listings && listings.length === 0 && (
        <p>You haven't listed anything yet. <Link to="/listings/new">Sell your first item.</Link></p>
      )}
      <div className="grid">
        {listings?.map((l) => (
          <ListingCard
            key={l._id}
            listing={l}
            actions={
              <>
                <Link to={`/listings/${l._id}/edit`} className="btn btn--ghost">Edit</Link>
                <button className="btn btn--danger" onClick={() => remove(l)}>Delete</button>
              </>
            }
          />
        ))}
      </div>
    </>
  );
}
