import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, money, formatDate } from '../api';
import { StatusBadge } from '../components/Layout';

const tabs = ['', 'draft', 'sent', 'paid', 'overdue'];

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ status, q }).toString();
    const timer = setTimeout(() => api('/invoices?' + params).then(setInvoices), 250);
    return () => clearTimeout(timer);
  }, [status, q]);

  return (
    <>
      <div className="page-head">
        <h1>Invoices</h1>
        <Link to="/invoices/new" className="btn btn-primary">+ New Invoice</Link>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="tabs">
            {tabs.map((t) => (
              <button key={t} className={status === t ? 'active' : ''} onClick={() => setStatus(t)}>
                {t || 'all'}
              </button>
            ))}
          </div>
          <input className="search" placeholder="Search by number or client…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <table className="table hover">
          <thead>
            <tr>
              <th>Invoice</th><th>Client</th><th>Issued</th><th>Due</th><th>Status</th><th className="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id} onClick={() => navigate(`/invoices/${i.id}`)}>
                <td><strong>{i.invoice_no}</strong></td>
                <td>{i.client_name}</td>
                <td>{formatDate(i.issue_date)}</td>
                <td>{formatDate(i.due_date)}</td>
                <td><StatusBadge status={i.status} /></td>
                <td className="right">{money(i.total)}</td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan="6" className="empty">No invoices found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
