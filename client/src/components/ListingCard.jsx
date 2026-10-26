import { useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice, timeAgo } from "../constants.js";
import Avatar from "./Avatar.jsx";

// `actions` lets a page add buttons (Edit / Delete) under the card.
// Without actions, the card shows the seller (avatar + name, linking to their profile).
export default function ListingCard({ listing, actions }) {
  const to = `/listings/${listing._id}`;
  const [broken, setBroken] = useState(false); // show the placeholder if the image can't load
  return (
    <article className="card">
      <Link to={to} className="card__media" aria-label={`View ${listing.title}`}>
        {listing.image && !broken ? (
          <img src={listing.image} alt="" className="card__img" loading="lazy" onError={() => setBroken(true)} />
        ) : (
          <div className="card__img card__img--empty" aria-hidden="true">{listing.title[0]}</div>
        )}
        <span className="card__chip">{listing.category}</span>
      </Link>

      <div className="card__body">
        <div className="card__top">
          <h3><Link to={to}>{listing.title}</Link></h3>
          <p className="card__price">{formatPrice(listing.price)}</p>
        </div>
        <p className="card__meta">{listing.condition} · {timeAgo(listing.createdAt)}</p>

        {actions ? (
          <div className="card__actions">{actions}</div>
        ) : (
          listing.owner?.name && (
            <Link to={`/users/${listing.owner._id}`} className="card__seller">
              <Avatar user={listing.owner} size={26} />
              <span>{listing.owner.name}</span>
            </Link>
          )
        )}
      </div>
    </article>
  );
}