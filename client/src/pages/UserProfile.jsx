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

  if (me.id === id) return <Navigate to="/profile" replace />;
  if (error) return <p className="error">{error} <Link to="/browse">Back to browse</Link></p>;
  if (!person) return <p>Loading…</p>;

  return (
    <>
      <section className="pubprofile">
        <Avatar user={person} size={96} />
        <div>
          <h1 className="page__title">{person.name}</h1>
          {person.department && <p className="pubprofile__dept">{person.department}</p>}
          {person.bio && <p className="pubprofile__bio">{person.bio}</p>}
          <p className="card__meta">Member since {new Date(person.createdAt).toLocaleDateString()}</p>
        </div>
      </section>

      <h2 className="section__title">Selling now</h2>
      {!listings && <p>Loading listings…</p>}
      {listings && listings.length === 0 && <p className="page__sub">{person.name} has nothing listed right now.</p>}
      {listings && listings.length > 0 && (
        <div className="grid">
          {listings.map((l) => <ListingCard key={l._id} listing={l} />)}
        </div>
      )}
    </>
  );
}