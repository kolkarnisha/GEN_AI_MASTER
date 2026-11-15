import { useEffect, useState } from "react";
import { api, STAGES } from "../api.js";
import { Alert, Modal, Spinner, fmtDateTime } from "./ui.jsx";

const ROUNDS = ["HR", "Technical", "Final"];

function InterviewSection({ app, onChange }) {
  const [form, setForm] = useState({ scheduled_at: "", round: "Technical", notes: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api(`/api/applications/${app.id}/interviews`, { method: "POST", body: { ...form, notes: form.notes || null } });
      setForm({ ...form, scheduled_at: "", notes: "" });
      await onChange();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  async function remove(id) {
    try { await api(`/api/interviews/${id}`, { method: "DELETE" }); await onChange(); }
    catch (err) { setError(err.message); }
  }

  return (
    <div className="stack">
      <h3>Interviews</h3>
      {app.interviews.length === 0 ? <p className="muted small">No interviews scheduled.</p> : (
        <ul className="list compact">
          {app.interviews.map((i) => (
            <li key={i.id} className="row between">
              <span>{fmtDateTime(i.scheduled_at)} {i.round && <span className="chip">{i.round}</span>}{i.notes && <span className="muted small"> · {i.notes}</span>}</span>
              <button className="btn ghost sm" onClick={() => remove(i.id)} aria-label="Remove interview">Remove</button>
            </li>
          ))}
        </ul>
      )}
      <form className="grid-3 align-end" onSubmit={add}>
        <label>Date & time<input required type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} /></label>
        <label>Round
          <input list="rounds" value={form.round} onChange={(e) => setForm({ ...form, round: e.target.value })} />
          <datalist id="rounds">{ROUNDS.map((r) => <option key={r} value={r} />)}</datalist>
        </label>
        <button className="btn" disabled={busy}>{busy ? <Spinner /> : "Add interview"}</button>
      </form>
      <Alert>{error}</Alert>
    </div>
  );
}

export default function ApplicationModal({ app, onClose, onSaved, onDeleted, refresh }) {
  const isNew = !app;
  const [form, setForm] = useState({
    company: app?.company || "", role: app?.role || "", stage: app?.stage || "WISHLIST",
    job_url: app?.job_url || "", applied_date: app?.applied_date || "", notes: app?.notes || "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Adding an interview can move the application server-side; keep the form in sync.
  useEffect(() => {
    if (app) setForm((f) => ({ ...f, stage: app.stage, applied_date: app.applied_date || f.applied_date }));
  }, [app?.stage, app?.applied_date]);

  async function save(e) {
    e.preventDefault();
    setBusy(true); setError("");
    const fields = { company: form.company, role: form.role, job_url: form.job_url || null,
                     applied_date: form.applied_date || null, notes: form.notes || null };
    try {
      let saved;
      if (isNew) {
        saved = await api("/api/applications", { method: "POST", body: { ...fields, stage: form.stage } });
      } else {
        saved = await api(`/api/applications/${app.id}`, { method: "PATCH", body: fields });
        if (form.stage !== app.stage) {
          saved = await api(`/api/applications/${app.id}/stage`, { method: "PATCH", body: { stage: form.stage } });
        }
      }
      onSaved(saved);
    } catch (err) { setError(err.message); setBusy(false); }
  }

  async function remove() {
    if (!confirm(`Delete ${app.company} — ${app.role}? Its interviews are deleted too.`)) return;
    setBusy(true);
    try { await api(`/api/applications/${app.id}`, { method: "DELETE" }); onDeleted(app.id); }
    catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <Modal title={isNew ? "New application" : `${app.company} — ${app.role}`} onClose={onClose}>
      <form className="stack" onSubmit={save}>
        <div className="grid-2">
          <label>Company<input required value={form.company} onChange={set("company")} autoFocus={isNew} /></label>
          <label>Role<input required value={form.role} onChange={set("role")} /></label>
          <label>Stage
            <select value={form.stage} onChange={set("stage")}>
              {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </label>
          <label>Applied date<input type="date" value={form.applied_date} onChange={set("applied_date")} /></label>
        </div>
        <label>Job link<input type="url" placeholder="https://…" value={form.job_url} onChange={set("job_url")} /></label>
        <label>Notes<textarea rows={3} value={form.notes} onChange={set("notes")} /></label>
        <Alert>{error}</Alert>
        <div className="row between">
          {!isNew ? <button type="button" className="btn danger" onClick={remove} disabled={busy}>Delete</button> : <span />}
          <div className="row">
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            <button className="btn primary" disabled={busy}>{busy ? <Spinner label="Saving…" /> : isNew ? "Add application" : "Save changes"}</button>
          </div>
        </div>
      </form>
      {!isNew && <><hr /><InterviewSection app={app} onChange={refresh} /></>}
    </Modal>
  );
}
