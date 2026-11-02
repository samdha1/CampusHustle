import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "../components/Avatar.jsx";
import ListingCard from "../components/ListingCard.jsx";

// Public profile of a seller: photo, name, department, bio and what they are selling.
export default function UserProfile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const [person, setPerson] = useState(null);
  const [listings, setListings] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setPerson(null);
    setListings(null);
    setError("");
    api.user(id).then((d) => setPerson(d.user)).catch((e) => setError(e.message));
    api.listings({ owner: id }).then((d) => setListings(d.listings)).catch(() => setListings([]));
  }, [id]);

  if (me?.id === id) return <Navigate to="/profile" replace />;
  if (error) {
    return (
      <div className="public-profile public-profile__state">
        <p className="error">{error} <Link to="/browse">Back to browse</Link></p>
      </div>
    );
  }
  if (!person) return <div className="public-profile public-profile__state" role="status">Loading profile…</div>;

  return (
    <div className="public-profile">
      <section className="pubprofile">
        <Avatar user={person} size={96} />
        <div>
          <h1 className="page__title">{person.name}</h1>
          {person.department && <p className="pubprofile__dept">{person.department}</p>}
          {person.bio && <p className="pubprofile__bio">{person.bio}</p>}
          <p className="card__meta">Member since {new Date(person.createdAt).toLocaleDateString()}</p>
        </div>
      </section>

      <section className="public-profile__listings" aria-labelledby="public-listings-title">
        <h2 className="section__title" id="public-listings-title">Selling now</h2>
        {!listings && <p className="public-profile__empty" role="status">Loading listings…</p>}
        {listings && listings.length === 0 && <p className="public-profile__empty">{person.name} has nothing listed right now.</p>}
        {listings && listings.length > 0 && (
          <div className="grid public-profile__grid">
            {listings.map((l) => <ListingCard key={l._id} listing={l} />)}
          </div>
        )}
      </section>
    </div>
  );
}