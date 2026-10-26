import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await login(form);
      toast.success(`Welcome back, ${u.name.split(" ")[0]}!`);
      navigate(location.state?.from?.pathname || "/browse", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      heading="Log in"
      blurb="Buy, sell and chat about items with students on your campus."
    >
      <form onSubmit={submit} noValidate>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={update} required />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={update} required />

        {error && <p className="error" role="alert">{error}</p>}

        <button type="submit" className="btn btn--block" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      </form>
      <p className="switch">
        New to Campus Hustle? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}