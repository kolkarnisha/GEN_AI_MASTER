import { useEffect } from "react";

export function Spinner({ label }) {
  return <span className="spinner-wrap" role="status"><span className="spinner" />{label && <span>{label}</span>}</span>;
}

export function Alert({ kind = "error", children, onClose }) {
  if (!children) return null;
  return (
    <div className={`alert ${kind}`} role={kind === "error" ? "alert" : "status"}>
      <span>{children}</span>
      {onClose && <button className="alert-x" aria-label="Dismiss" onClick={onClose}>×</button>}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="alert-x" aria-label="Close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ScoreRing({ score, size = 120 }) {
  const r = 52, c = 2 * Math.PI * r;
  const tone = score >= 75 ? "good" : score >= 50 ? "mid" : "low";
  return (
    <svg className={`score-ring ${tone}`} width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={`Fit score ${score} out of 100`}>
      <circle cx="60" cy="60" r={r} className="track" />
      <circle cx="60" cy="60" r={r} className="bar" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} transform="rotate(-90 60 60)" />
      <text x="60" y="58" textAnchor="middle" className="num">{score}</text>
      <text x="60" y="78" textAnchor="middle" className="den">/ 100</text>
    </svg>
  );
}

export const fmtDate = (d) => d ? new Date(d + (d.length === 10 ? "T00:00:00" : "")).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
export const fmtDateTime = (d) => d ? new Date(d).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
