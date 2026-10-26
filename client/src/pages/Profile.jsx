import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "../components/Avatar.jsx";

const none = { type: "", text: "" };

export default function Profile() {
  const { user, setUser } = useAuth();

  // ----- details form -----
  const [form, setForm] = useState({ name: user.name, department: user.department || "", bio: user.bio || "" });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [status, setStatus] = useState(none);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!file) return setPreview("");
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const pickFile = (e) => {
    const f = e.target.files[0];
    if (f && f.size > 2 * 1024 * 1024) {
      setStatus({ type: "error", text: "Image must be 2 MB or smaller." });
      e.target.value = "";
      return;
    }
    setStatus(none);
    setFile(f || null);
    setRemoveAvatar(false);
  };

  const saveDetails = async (e) => {
    e.preventDefault();
    setStatus(none);
    setBusy(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (file) data.append("image", file);
      if (removeAvatar) data.append("removeAvatar", "true");

      const { user: updated } = await api.updateProfile(data);
      setUser(updated);
      setFile(null);
      setRemoveAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
      setStatus({ type: "success", text: "Profile updated." });
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  // ----- password form -----
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwStatus, setPwStatus] = useState(none);
  const [pwBusy, setPwBusy] = useState(false);

  const updatePw = (e) => setPw({ ...pw, [e.target.name]: e.target.value });

  const savePassword = async (e) => {
    e.preventDefault();
    setPwStatus(none);
    if (pw.newPassword.length < 8) return setPwStatus({ type: "error", text: "New password must be at least 8 characters." });
    if (!/[A-Za-z]/.test(pw.newPassword) || !/\d/.test(pw.newPassword))
      return setPwStatus({ type: "error", text: "New password needs at least one letter and one number." });
    if (pw.newPassword !== pw.confirm) return setPwStatus({ type: "error", text: "New passwords do not match." });

    setPwBusy(true);
    try {
      await api.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
      setPwStatus({ type: "success", text: "Password updated." });
    } catch (err) {
      setPwStatus({ type: "error", text: err.message });
    } finally {
      setPwBusy(false);
    }
  };

  const shown = { name: form.name, avatar: removeAvatar ? "" : preview || user.avatar };
  const Status = ({ s }) =>
    s.text ? <p className={s.type === "error" ? "error" : "success"} role={s.type === "error" ? "alert" : "status"}>{s.text}</p> : null;

  return (
    <div className="profile">
      <h1 className="page__title">Your profile</h1>

      <section className="panel">
        <div className="profile__head">
          <Avatar user={shown} size={84} />
          <div>
            <strong className="profile__name">{user.name}</strong>
            <span className="card__meta">{user.email}</span>
            <span className="card__meta">Member since {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <form onSubmit={saveDetails} className="stack">
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" value={form.name} onChange={update} maxLength={60} required />

          <label htmlFor="email">Email</label>
          <input id="email" value={user.email} disabled />
          <small>Your campus email can't be changed.</small>

          <label htmlFor="department">Department / branch (optional)</label>
          <input id="department" name="department" value={form.department} onChange={update} maxLength={60} placeholder="e.g. Computer Science, 3rd year" />

          <label htmlFor="bio">About you (optional)</label>
          <textarea id="bio" name="bio" rows={3} value={form.bio} onChange={update} maxLength={200} />
          <small>{form.bio.length}/200</small>

          <label htmlFor="image">Profile photo (JPG, PNG or WebP, up to 2 MB)</label>
          <input id="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={pickFile} ref={fileRef} />
          {(user.avatar || file) && !removeAvatar && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setRemoveAvatar(true);
                setFile(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              Remove photo
            </button>
          )}
          {removeAvatar && <small>The photo will be removed when you save.</small>}

          <Status s={status} />
          <button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
        </form>
      </section>

      <section className="panel">
        <h2 className="panel__title">Change password</h2>
        <form onSubmit={savePassword} className="stack">
          <label htmlFor="currentPassword">Current password</label>
          <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={updatePw} required />

          <label htmlFor="newPassword">New password</label>
          <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" value={pw.newPassword} onChange={updatePw} required />
          <small>At least 8 characters, with a letter and a number.</small>

          <label htmlFor="confirm">Confirm new password</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" value={pw.confirm} onChange={updatePw} required />

          <Status s={pwStatus} />
          <button type="submit" disabled={pwBusy}>{pwBusy ? "Updating…" : "Update password"}</button>
        </form>
      </section>
    </div>
  );
}
