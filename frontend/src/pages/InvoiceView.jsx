import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, money, formatDate } from '../api';
import { StatusBadge } from '../components/Layout';

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inv, setInv] = useState(null);
  const [company, setCompany] = useState({});

  const load = () => api('/invoices/' + id).then(setInv);

  useEffect(() => {
    load();
    api('/company').then(setCompany);
  }, [id]);

  async function setStatus(status) {
    await api(`/invoices/${id}/status`, { method: 'PATCH', body: { status } });
    load();
  }

  async function remove() {
    if (!confirm(`Delete invoice ${inv.invoice_no}? This cannot be undone.`)) return;
    await api('/invoices/' + id, { method: 'DELETE' });
    navigate('/invoices');
  }

  if (!inv) return <p className="muted">Loading…</p>;

  return (
    <>
      <div className="page-head no-print">
        <h1>{inv.invoice_no} <StatusBadge status={inv.status} /></h1>
        <div className="actions">
          {inv.status === 'draft' && <button className="btn btn-light" onClick={() => setStatus('sent')}>Mark as sent</button>}
          {inv.status !== 'paid' && <button className="btn btn-success" onClick={() => setStatus('paid')}>Mark as paid</button>}
          {inv.status === 'paid' && <button className="btn btn-light" onClick={() => setStatus('sent')}>Mark unpaid</button>}
          <Link to={`/invoices/${id}/edit`} className="btn btn-light">Edit</Link>
          <button className="btn btn-light" onClick={() => window.print()}>Print / PDF</button>
          <button className="btn btn-danger" onClick={remove}>Delete</button>
        </div>
      </div>

      <div className="card invoice-paper">
        <div className="paper-head">
          <div>
            <h2>{company.name}</h2>
            <p className="muted">{company.address}<br />{company.email} {company.phone && `· ${company.phone}`}</p>
          </div>
          <div className="right">
            <h2 className="paper-title">INVOICE</h2>
            <p><strong>{inv.invoice_no}</strong></p>
            <p className="muted">Issued: {formatDate(inv.issue_date)}<br />Due: {formatDate(inv.due_date)}</p>
          </div>
        </div>

        <div className="bill-to">
          <small className="muted">BILL TO</small>
          <strong>{inv.client_name}</strong>
          <span className="muted">{inv.client_address}</span>
          <span className="muted">{inv.client_email} {inv.client_phone && `· ${inv.client_phone}`}</span>
        </div>

        <table className="table">
          <thead>
            <tr><th>Description</th><th className="right">Qty</th><th className="right">Price</th><th className="right">Amount</th></tr>
          </thead>
          <tbody>
            {inv.items.map((it, i) => (
              <tr key={i}>
                <td>{it.description}</td>
                <td className="right">{it.quantity}</td>
                <td className="right">{money(it.price)}</td>
                <td className="right">{money(it.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="form-bottom">
          <div>{inv.notes && <><small className="muted">NOTES</small><p>{inv.notes}</p></>}</div>
          <div className="totals">
            <div><span>Subtotal</span><span>{money(inv.subtotal)}</span></div>
            <div><span>Tax ({inv.tax_rate}%)</span><span>{money(inv.tax)}</span></div>
            <div className="grand"><span>Total</span><span>{money(inv.total)}</span></div>
          </div>
        </div>
      </div>
    </>
  );
}
