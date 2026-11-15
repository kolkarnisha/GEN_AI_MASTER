import { useEffect, useMemo, useState } from "react";
import { api, STAGES } from "../api.js";
import ApplicationModal from "../components/ApplicationModal.jsx";
import { Alert, Spinner, fmtDate, fmtDateTime } from "../components/ui.jsx";

function Card({ app, onOpen, onMove, onDragStart }) {
  const next = app.interviews.find((i) => new Date(i.scheduled_at) >= new Date());
  return (
    <article className="kcard" draggable onDragStart={(e) => onDragStart(e, app)} onClick={() => onOpen(app)}
      tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen(app)}>
      <strong>{app.company}</strong>
      <span className="muted">{app.role}</span>
      {app.applied_date && <span className="small muted">Applied {fmtDate(app.applied_date)}</span>}
      {next && <span className="small interview-tag">📅 {fmtDateTime(next.scheduled_at)}{next.round ? ` · ${next.round}` : ""}</span>}
      {app.match_id && <span className="chip ai">AI matched</span>}
      <select className="move" aria-label="Move to stage" value={app.stage}
        onClick={(e) => e.stopPropagation()} onChange={(e) => onMove(app, e.target.value)}>
        {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
      </select>
    </article>
  );
}

export default function Pipeline() {
  const [apps, setApps] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null | "new" | app id
  const [dragOver, setDragOver] = useState(null);
  const [query, setQuery] = useState("");

  const load = () => api("/api/applications").then(setApps).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (apps || []).filter((a) => !q || `${a.company} ${a.role}`.toLowerCase().includes(q));
  }, [apps, query]);

  async function move(app, stage) {
    if (app.stage === stage) return;
    const prev = apps;
    setApps(apps.map((a) => (a.id === app.id ? { ...a, stage } : a))); // optimistic
    try {
      const saved = await api(`/api/applications/${app.id}/stage`, { method: "PATCH", body: { stage } });
      setApps((list) => list.map((a) => (a.id === saved.id ? saved : a)));
    } catch (e) { setApps(prev); setError(`Couldn't move ${app.company}: ${e.message}`); }
  }

  const onDragStart = (e, app) => { e.dataTransfer.setData("text/plain", String(app.id)); e.dataTransfer.effectAllowed = "move"; };
  const onDrop = (e, stage) => {
    e.preventDefault(); setDragOver(null);
    const app = apps.find((a) => a.id === Number(e.dataTransfer.getData("text/plain")));
    if (app) move(app, stage);
  };

  const current = typeof modal === "number" ? apps?.find((a) => a.id === modal) : null;

  return (
    <div className="stack-lg">
      <div className="page-head">
        <h1>Application pipeline</h1>
        <div className="row">
          <input className="search" type="search" placeholder="Search company or role" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="btn primary" onClick={() => setModal("new")}>+ Add application</button>
        </div>
      </div>
      <Alert onClose={() => setError("")}>{error}</Alert>
      {!apps ? <Spinner label="Loading applications…" /> : (
        <div className="board">
          {STAGES.map((s) => {
            const items = filtered.filter((a) => a.stage === s.key);
            return (
              <section key={s.key} className={`column stage-col-${s.key.toLowerCase()} ${dragOver === s.key ? "over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(s.key); }}
                onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setDragOver(null)}
                onDrop={(e) => onDrop(e, s.key)}>
                <header><span>{s.label}</span><span className="count">{items.length}</span></header>
                <div className="cards">
                  {items.map((a) => <Card key={a.id} app={a} onOpen={(x) => setModal(x.id)} onMove={move} onDragStart={onDragStart} />)}
                  {items.length === 0 && <p className="drop-hint">Drop here</p>}
                </div>
              </section>
            );
          })}
        </div>
      )}
      {(modal === "new" || current) && (
        <ApplicationModal
          key={modal}
          app={modal === "new" ? null : current}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
          onDeleted={(id) => { setModal(null); setApps((l) => l.filter((a) => a.id !== id)); }}
          refresh={load}
        />
      )}
    </div>
  );
}
