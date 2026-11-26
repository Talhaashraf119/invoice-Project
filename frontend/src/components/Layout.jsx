import { NavLink, Outlet } from 'react-router-dom';
import { getUser, logout } from '../api';

const links = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/invoices', label: 'Invoices', icon: '🧾' },
  { to: '/clients', label: 'Clients', icon: '👥' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Layout() {
  const user = getUser();
  return (
    <div className="app">
      <aside className="sidebar no-print">
        <div className="brand">
          <span className="logo">IF</span> InvoiceFlow
        </div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}>
              <span className="icon">{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="tenant">
          <small>Workspace</small>
          <strong>{user.companyName}</strong>
        </div>
      </aside>

      <div className="main">
        <header className="topbar no-print">
          <span>
            Welcome, <strong>{user.name}</strong>
          </span>
          <button className="btn btn-light" onClick={logout}>Logout</button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}
