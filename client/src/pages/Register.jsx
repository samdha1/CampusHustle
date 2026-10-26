import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
      return setError("Password needs at least one letter and one number.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");

    setBusy(true);
    try {
      const u = await register({ name: form.name, email: form.email, password: form.password });
      toast.success(`Welcome to Campus Hustle, ${u.name.split(" ")[0]}!`);
      navigate("/browse", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      heading="Create your account"
      blurb="List what you don't need. Find what you do. Keep it on campus."
    >
      <form onSubmit={submit} noValidate>
        <label htmlFor="name">Full name</label>
        <input id="name" name="name" autoComplete="name" value={form.name} onChange={update} required />

        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={update} required />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={update} required />
        <small>At least 8 characters, with a letter and a number.</small>

        <label htmlFor="confirm">Confirm password</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={update} required />

        {error && <p className="error" role="alert">{error}</p>}

        <button type="submit" className="btn btn--block" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="switch">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}