import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { CATEGORIES, CONDITIONS } from "../constants.js";

const empty = { title: "", description: "", price: "", category: "Other", condition: "Good" };

// One form for both "Sell an item" (/listings/new) and "Edit" (/listings/:id/edit)
export default function ListingForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(empty);
  const [currentImage, setCurrentImage] = useState("");
  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    if (!editing) return;
    api.listing(id)
      .then(({ listing }) => {
        if (listing.owner._id !== user.id) return navigate("/my-listings", { replace: true });
        const { title, description, price, category, condition } = listing;
        setForm({ title, description, price, category, condition });
        setCurrentImage(listing.image);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const pickFile = (e) => {
    const f = e.target.files[0];
    if (f && f.size > 2 * 1024 * 1024) {
      setError("Image must be 2 MB or smaller.");
      e.target.value = "";
      return;
    }
    setError("");
    setFile(f || null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (file) data.append("image", file);
      if (removeImage) data.append("removeImage", "true");

      if (editing) await api.updateListing(id, data);
      else await api.createListing(data);
      navigate("/my-listings");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div className="formpage">
      <h1 className="page__title">{editing ? "Edit listing" : "Sell an item"}</h1>
      <form onSubmit={submit}>
        <label htmlFor="title">Item name</label>
        <input id="title" name="title" value={form.title} onChange={update} maxLength={80} required />

        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={5} value={form.description} onChange={update} maxLength={1000} required />

        <label htmlFor="price">Price (₹)</label>
        <input id="price" name="price" type="number" min="0" step="1" value={form.price} onChange={update} required />

        <div className="row">
          <div>
            <label htmlFor="category">Category</label>
            <select id="category" name="category" value={form.category} onChange={update}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="condition">Condition</label>
            <select id="condition" name="condition" value={form.condition} onChange={update}>
              {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <label htmlFor="image">Photo (JPG, PNG or WebP, up to 2 MB)</label>
        {currentImage && !removeImage && !file && (
          <div className="current-img">
            <img src={currentImage} alt="Current" />
            <button type="button" className="btn btn--ghost" onClick={() => setRemoveImage(true)}>Remove photo</button>
          </div>
        )}
        <input id="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={pickFile} />

        {error && <p className="error" role="alert">{error}</p>}

        <div className="row row--actions">
          <button type="submit" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save changes" : "Publish listing"}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
