import { Link } from "react-router-dom";
import { formatPrice } from "../constants.js";

// `actions` lets a page add buttons (Edit / Delete) under the card.
export default function ListingCard({ listing, actions }) {
  const to = `/listings/${listing._id}`;
  return (
    <article className="card">
      <Link to={to} aria-label={`View ${listing.title}`}>
        {listing.image ? (
          <img src={listing.image} alt="" className="card__img" loading="lazy" />
        ) : (
          <div className="card__img card__img--empty" aria-hidden="true">{listing.title[0]}</div>
        )}
      </Link>
      <div className="card__body">
        <h3><Link to={to}>{listing.title}</Link></h3>
        <p className="card__price">{formatPrice(listing.price)}</p>
        <p className="card__meta">{listing.category} · {listing.condition}</p>
        {listing.owner?.name && <p className="card__meta">Listed by {listing.owner.name}</p>}
        {actions && <div className="card__actions">{actions}</div>}
      </div>
    </article>
  );
}
