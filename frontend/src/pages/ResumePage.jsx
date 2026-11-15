import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { Alert, Spinner, fmtDate } from "../components/ui.jsx";

export default function ResumePage() {
  const [resumes, setResumes] = useState(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [expanded, setExpanded] = useState(null);
  const fileRef = useRef();

  const load = () => api("/api/resumes").then(setResumes).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function run(label, fn, success) {
    setError(""); setNotice(""); setBusy(label);
    try { await fn(); setNotice(success); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(""); }
  }

  const savePaste = (e) => {
    e.preventDefault();
    run("paste", () => api("/api/resumes/text", { method: "POST", body: { content: text } }).then(() => setText("")),
      "Resume saved and set as active.");
  };
  const upload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    run("upload", () => api("/api/resumes/upload", { method: "POST", form }), `Extracted text from ${file.name} and set it as active.`)
      .finally(() => { fileRef.current.value = ""; });
  };

  return (
    <div className="stack-lg">
      <div className="page-head"><h1>Your resume</h1></div>
      <p className="muted">Upload a PDF or paste your resume text. The active resume is used for every AI match.</p>
      <Alert onClose={() => setError("")}>{error}</Alert>
      <Alert kind="success" onClose={() => setNotice("")}>{notice}</Alert>

      <div className="grid-2">
        <section className="card stack">
          <h2>Upload PDF</h2>
          <p className="muted small">Text-based PDFs up to 5 MB. Scanned images can't be read — paste the text instead.</p>
          <label className="btn file-btn">
            {busy === "upload" ? <Spinner label="Reading PDF…" /> : "Choose PDF…"}
            <input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={upload} disabled={!!busy} hidden />
          </label>
        </section>
        <form className="card stack" onSubmit={savePaste}>
          <h2>Paste text</h2>
          <textarea rows={8} placeholder="Paste your full resume here…" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="row between">
            <small className="muted">{text.trim().length < 50 ? `${50 - text.trim().length} more characters needed` : `${text.trim().length} characters`}</small>
            <button className="btn primary" disabled={!!busy || text.trim().length < 50}>
              {busy === "paste" ? <Spinner label="Saving…" /> : "Save resume"}
            </button>
          </div>
        </form>
      </div>

      <section className="card">
        <h2>Saved resumes</h2>
        {!resumes ? <Spinner /> : resumes.length === 0 ? <p className="muted">No resume yet.</p> : (
          <ul className="list">
            {resumes.map((r) => (
              <li key={r.id}>
                <div className="row between wrap">
                  <div>
                    <strong>Resume #{r.id}</strong> <span className="muted small">· added {fmtDate(r.created_at)}</span>
                    {r.is_active && <span className="chip good">Active</span>}
                  </div>
                  <div className="row">
                    <button className="btn ghost sm" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>{expanded === r.id ? "Hide" : "View"}</button>
                    {!r.is_active && <button className="btn sm" disabled={!!busy} onClick={() => run("act", () => api(`/api/resumes/${r.id}/activate`, { method: "POST" }), "Active resume updated.")}>Make active</button>}
                    <button className="btn danger sm" disabled={!!busy} onClick={() => confirm("Delete this resume? Matches made with it are deleted too.") && run("del", () => api(`/api/resumes/${r.id}`, { method: "DELETE" }), "Resume deleted.")}>Delete</button>
                  </div>
                </div>
                {expanded === r.id ? <pre className="resume-text">{r.content}</pre> : <p className="muted small clamp">{r.content.slice(0, 220)}…</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
