import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { formatPrice, timeAgo } from "../constants.js";
import Avatar from "../components/Avatar.jsx";

// Item details + owner + contact (REQ-5)
export default function ListingDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    api.listing(id).then((d) => setListing(d.listing)).catch((e) => setError(e.message));
  }, [id]);

  if (error && !listing) return <p className="error">{error} <Link to="/browse">Back to browse</Link></p>;
  if (!listing) return <p>Loading…</p>;

  const isOwner = listing.owner._id === user.id;

  const contact = async () => {
    setBusy(true);
    try {
      const { conversation } = await api.startChat(listing._id);
      toast.success(`Chat with ${listing.owner.name} is ready. Say hello!`);
      navigate(`/chats/${conversation._id}`);
    } catch (e) {
      toast.error(e.message);
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${listing.title}"? This can't be undone.`)) return;
    try {
      await api.deleteListing(listing._id);
      toast.success("Listing deleted.");
      navigate("/my-listings");
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <article className="details">
      <div className="details__media">
        {listing.image && !broken ? (
          <img src={listing.image} alt={listing.title} className="details__img" onError={() => setBroken(true)} />
        ) : (
          <div className="details__img card__img--empty" aria-hidden="true">{listing.title[0]}</div>
        )}
      </div>

      <div className="details__info">
        <Link to="/browse" className="details__back">← Back to browse</Link>
        <div className="details__tags">
          <span className="tag">{listing.category}</span>
          <span className="tag tag--green">{listing.condition}</span>
        </div>
        <h1 className="details__title">{listing.title}</h1>
        <p className="details__price">{formatPrice(listing.price)}</p>
        <p className="details__desc">{listing.description}</p>

        <Link to={isOwner ? "/profile" : `/users/${listing.owner._id}`} className="seller">
          <Avatar user={listing.owner} size={48} />
          <div>
            <strong>{isOwner ? "You" : listing.owner.name}</strong>
            <span className="card__meta">
              {listing.owner.department ? `${listing.owner.department} · ` : ""}
              Listed {timeAgo(listing.createdAt)}
            </span>
          </div>
        </Link>

        {error && <p className="error" role="alert">{error}</p>}

        <div className="details__actions">
          {isOwner ? (
            <>
              <Link to={`/listings/${listing._id}/edit`} className="btn">Edit listing</Link>
              <button className="btn btn--danger" onClick={remove}>Delete</button>
            </>
          ) : (
            <button onClick={contact} disabled={busy} className="btn btn--lg">
              {busy ? "Opening chat…" : `Message ${listing.owner.name}`}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}