import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatPrice } from "../constants.js";

// Item details + owner + contact (REQ-5)
export default function ListingDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listing(id).then((d) => setListing(d.listing)).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="error">{error} <Link to="/">Back to browse</Link></p>;
  if (!listing) return <p>Loading…</p>;

  const isOwner = listing.owner._id === user.id;

  const contact = async () => {
    setBusy(true);
    setError("");
    try {
      const { conversation } = await api.startChat(listing._id);
      navigate(`/chats/${conversation._id}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${listing.title}"? This can't be undone.`)) return;
    try {
      await api.deleteListing(listing._id);
      navigate("/my-listings");
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <article className="details">
      {listing.image ? (
        <img src={listing.image} alt={listing.title} className="details__img" />
      ) : (
        <div className="details__img card__img--empty" aria-hidden="true">{listing.title[0]}</div>
      )}

      <div className="details__info">
        <Link to="/" className="details__back">Back to browse</Link>
        <h1 className="page__title">{listing.title}</h1>
        <p className="card__price details__price">{formatPrice(listing.price)}</p>
        <p className="card__meta">{listing.category} · {listing.condition}</p>
        <p className="details__desc">{listing.description}</p>

        <p className="card__meta">
          Listed by <strong>{listing.owner.name}</strong> on {new Date(listing.createdAt).toLocaleDateString()}
        </p>

        {error && <p className="error" role="alert">{error}</p>}

        <div className="details__actions">
          {isOwner ? (
            <>
              <Link to={`/listings/${listing._id}/edit`} className="btn">Edit listing</Link>
              <button className="btn btn--danger" onClick={remove}>Delete</button>
            </>
          ) : (
            <button onClick={contact} disabled={busy} className="btn">
              {busy ? "Opening chat…" : `Message ${listing.owner.name}`}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
