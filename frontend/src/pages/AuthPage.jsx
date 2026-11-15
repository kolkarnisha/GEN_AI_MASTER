import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { Alert, Spinner } from "../components/ui.jsx";

export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (isSignup && form.password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    try {
      if (isSignup) await signup(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand big"><span className="logo">H</span> HireTrack <em>AI</em></div>
        <p className="muted">Tailor your resume to every job and track every application in one place.</p>
        <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
        <form onSubmit={submit} className="stack">
          {isSignup && (
            <label>Name<input required autoComplete="name" value={form.name} onChange={set("name")} /></label>
          )}
          <label>Email<input required type="email" autoComplete="email" value={form.email} onChange={set("email")} /></label>
          <label>Password
            <input required type="password" autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={isSignup ? 8 : undefined} value={form.password} onChange={set("password")} />
            {isSignup && <small className="muted">At least 8 characters.</small>}
          </label>
          <Alert>{error}</Alert>
          <button className="btn primary" disabled={busy}>
            {busy ? <Spinner label={isSignup ? "Creating account…" : "Logging in…"} /> : isSignup ? "Sign up" : "Log in"}
          </button>
        </form>
        <p className="muted switch">
          {isSignup ? <>Already have an account? <Link to="/login">Log in</Link></>
                    : <>New here? <Link to="/signup">Create an account</Link></>}
        </p>
      </div>
    </div>
  );
}
