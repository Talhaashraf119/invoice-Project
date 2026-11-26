import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money, formatDate } from '../api';
import { StatusBadge } from '../components/Layout';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api('/dashboard').then(setData);
  }, []);

  if (!data) return <p className="muted">Loading…</p>;

  const max = Math.max(...data.chart.map((c) => c.amount), 1);
  const cards = [
    { label: 'Total Revenue', value: money(data.revenue), tone: 'green' },
    { label: 'Outstanding', value: money(data.outstanding), tone: 'blue' },
    { label: 'Overdue Invoices', value: data.overdue_count, tone: 'red' },
    { label: 'Clients', value: data.client_count, tone: 'gray' },
  ];

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <Link to="/invoices/new" className="btn btn-primary">+ New Invoice</Link>
      </div>

      <div className="stats">
        {cards.map((c) => (
          <div key={c.label} className={`stat stat-${c.tone}`}>
            <small>{c.label}</small>
            <strong>{c.value}</strong>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Revenue (last 6 months)</h3>
          <div className="chart">
            {data.chart.map((c) => (
              <div key={c.month} className="bar-col" title={money(c.amount)}>
                <div className="bar" style={{ height: `${(c.amount / max) * 100}%` }} />
                <span>{c.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Recent Invoices</h3>
          {data.recent.length === 0 ? (
            <p className="muted">No invoices yet. <Link to="/invoices/new">Create your first invoice</Link></p>
          ) : (
            <table className="table">
              <tbody>
                {data.recent.map((i) => (
                  <tr key={i.id}>
                    <td><Link to={`/invoices/${i.id}`}>{i.invoice_no}</Link><br /><small className="muted">{i.client_name}</small></td>
                    <td><small className="muted">Due {formatDate(i.due_date)}</small></td>
                    <td className="right">{money(i.total)}<br /><StatusBadge status={i.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
