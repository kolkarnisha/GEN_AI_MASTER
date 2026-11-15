import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { Alert, ScoreRing, Spinner, fmtDate } from "../components/ui.jsx";

function SaveForm({ match, onSaved }) {
  const [form, setForm] = useState({ company: match.company_guess || "", role: match.role_guess || "", job_url: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const app = await api(`/api/matches/${match.id}/save`, { method: "POST", body: { ...form, job_url: form.job_url || null } });
      onSaved(app);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <form className="stack save-form" onSubmit={save}>
      <h3>Save to pipeline as Wishlist</h3>
      <div className="grid-3">
        <label>Company<input required value={form.company} onChange={set("company")} /></label>
        <label>Role<input required value={form.role} onChange={set("role")} /></label>
        <label>Job link <span className="muted">(optional)</span><input type="url" placeholder="https://…" value={form.job_url} onChange={set("job_url")} /></label>
      </div>
      <Alert>{error}</Alert>
      <div><button className="btn primary" disabled={busy}>{busy ? <Spinner label="Saving…" /> : "Save to Wishlist"}</button></div>
    </form>
  );
}

function MatchResult({ match, onSaved }) {
  const [copied, setCopied] = useState(null);
  const copy = (text, i) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(i); setTimeout(() => setCopied(null), 1500); });
  };
  const verdict = match.fit_score >= 75 ? "Strong fit" : match.fit_score >= 50 ? "Partial fit" : "Weak fit";
  return (
    <section className="card stack-lg result">
      <div className="result-head">
        <ScoreRing score={match.fit_score} />
        <div>
          <h2>{verdict}</h2>
          <p className="muted">
            {match.role_guess || "This role"}{match.company_guess ? ` at ${match.company_guess}` : ""} · scored against your active resume
          </p>
        </div>
      </div>
      <div>
        <h3>Missing skills</h3>
        {match.missing_skills.length === 0 ? <p className="muted">Nothing important missing — nice.</p> : (
          <div className="chips">{match.missing_skills.map((s) => <span key={s} className="chip warn">{s}</span>)}</div>
        )}
      </div>
      <div>
        <h3>Tailored resume bullets</h3>
        <ol className="bullets">
          {match.suggested_bullets.map((b, i) => (
            <li key={i}>
              <span>{b}</span>
              <button className="btn ghost sm" type="button" onClick={() => copy(b, i)}>{copied === i ? "Copied ✓" : "Copy"}</button>
            </li>
          ))}
        </ol>
      </div>
      {match.application_id ? (
        <Alert kind="success">Saved to your pipeline. <Link to="/pipeline">Open pipeline →</Link></Alert>
      ) : (
        <SaveForm match={match} onSaved={onSaved} />
      )}
    </section>
  );
}

export default function MatchPage() {
  const [resume, setResume] = useState(undefined);
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const loadHistory = () => api("/api/matches").then(setHistory).catch(() => {});
  useEffect(() => {
    api("/api/resumes/active").then(setResume).catch((e) => { setResume(null); setError(e.message); });
    loadHistory();
  }, []);

  useEffect(() => {
    if (!busy) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [busy]);

  async function runMatch(e) {
    e.preventDefault();
    setBusy(true); setError(""); setResult(null);
    try {
      setResult(await api("/api/matches", { method: "POST", body: { job_description: jd } }));
      loadHistory();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  const onSaved = (app) => { setResult((r) => ({ ...r, application_id: app.id })); loadHistory(); };
  const tooShort = jd.trim().length < 50;

  return (
    <div className="stack-lg">
      <div className="page-head"><h1>AI Resume Match</h1></div>

      {resume === undefined ? <Spinner /> : resume === null ? (
        <Alert kind="info">You need a resume first. <Link to="/resume">Add your resume →</Link></Alert>
      ) : (
        <p className="muted small">Matching against <strong>Resume #{resume.id}</strong> (active). <Link to="/resume">Change</Link></p>
      )}

      <form className="card stack" onSubmit={runMatch}>
        <label htmlFor="jd"><h2>Job description</h2></label>
        <textarea id="jd" rows={10} placeholder="Paste the full job posting here — title, company, responsibilities and requirements…"
          value={jd} onChange={(e) => setJd(e.target.value)} disabled={busy} />
        <div className="row between wrap">
          <small className="muted">{tooShort ? `${50 - jd.trim().length} more characters needed` : `${jd.trim().length} characters`}</small>
          <button className="btn primary" disabled={busy || tooShort || !resume}>
            {busy ? <Spinner label={`Analysing… ${elapsed}s`} /> : "Get fit score"}
          </button>
        </div>
        {busy && <p className="muted small">Claude is comparing your resume with the posting. This usually takes 5–15 seconds.</p>}
      </form>

      <Alert onClose={() => setError("")}>{error}</Alert>
      {result && <MatchResult match={result} onSaved={onSaved} />}

      {history.length > 0 && (
        <section className="card">
          <h2>Recent matches</h2>
          <ul className="list">
            {history.map((m) => (
              <li key={m.id} className="row between wrap clickable" onClick={() => { setResult(m); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                <div className="history-text">
                  <span className={`score-pill ${m.fit_score >= 75 ? "good" : m.fit_score >= 50 ? "mid" : "low"}`}>{m.fit_score}</span>
                  <span className="clamp-1">{m.job_description.split("\n")[0].slice(0, 90)}</span>
                </div>
                <span className="muted small">{fmtDate(m.created_at)}{m.application_id && <span className="chip good">Saved</span>}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
