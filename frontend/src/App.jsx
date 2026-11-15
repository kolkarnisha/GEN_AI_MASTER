import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "./auth.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MatchPage from "./pages/MatchPage.jsx";
import Pipeline from "./pages/Pipeline.jsx";
import ResumePage from "./pages/ResumePage.jsx";
import { Spinner } from "./components/ui.jsx";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="center-page"><Spinner label="Loading…" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function Layout({ children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const links = [
    ["/", "Dashboard"], ["/pipeline", "Pipeline"], ["/match", "AI Match"], ["/resume", "Resume"],
  ];
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand"><span className="logo">H</span> HireTrack <em>AI</em></div>
        <button className="menu-btn" aria-label="Menu" onClick={() => setOpen((o) => !o)}>☰</button>
        <nav className={open ? "open" : ""} onClick={() => setOpen(false)}>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"}>{label}</NavLink>
          ))}
        </nav>
        <div className="user">
          <span className="user-name" title={user.email}>{user.name}</span>
          <button className="btn ghost sm" onClick={logout}>Log out</button>
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();
  const authed = (el) => <RequireAuth><Layout>{el}</Layout></RequireAuth>;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <AuthPage mode="signup" />} />
      <Route path="/" element={authed(<Dashboard />)} />
      <Route path="/pipeline" element={authed(<Pipeline />)} />
      <Route path="/match" element={authed(<MatchPage />)} />
      <Route path="/resume" element={authed(<ResumePage />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
