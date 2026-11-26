import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, money, today } from '../api';

const emptyItem = { description: '', quantity: 1, price: 0 };

// Used for both "New Invoice" and "Edit Invoice"
export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [taxRate, setTaxRate] = useState(0);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    client_id: '',
    issue_date: today(),
    due_date: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
    notes: 'Thank you for your business.',
    items: [{ ...emptyItem }],
  });

  useEffect(() => {
    api('/clients').then(setClients);
    if (id) {
      api('/invoices/' + id).then((inv) => {
        setForm({ client_id: inv.client_id, issue_date: inv.issue_date, due_date: inv.due_date, notes: inv.notes || '', items: inv.items });
        setTaxRate(inv.tax_rate);
      });
    } else {
      api('/company').then((c) => setTaxRate(c.tax_rate));
    }
  }, [id]);

  const set = (field, value) => setForm({ ...form, [field]: value });
  const setItem = (index, field, value) =>
    set('items', form.items.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  const addItem = () => set('items', [...form.items, { ...emptyItem }]);
  const removeItem = (index) => set('items', form.items.filter((_, i) => i !== index));

  // Live preview only — the server recalculates the real totals
  const subtotal = form.items.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.price || 0), 0);
  const tax = (subtotal * taxRate) / 100;

  async function save(status) {
    setError('');
    try {
      const res = id
        ? await api('/invoices/' + id, { method: 'PUT', body: form })
        : await api('/invoices', { method: 'POST', body: { ...form, status } });
      navigate('/invoices/' + res.id);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>{id ? 'Edit Invoice' : 'New Invoice'}</h1>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="card">
        <div className="form-row">
          <div>
            <label>Client</label>
            <select value={form.client_id} onChange={(e) => set('client_id', e.target.value)}>
              <option value="">Select a client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {clients.length === 0 && <small className="muted">No clients yet — <Link to="/clients">add a client</Link> first.</small>}
          </div>
          <div>
            <label>Issue date</label>
            <input type="date" value={form.issue_date} onChange={(e) => set('issue_date', e.target.value)} />
          </div>
          <div>
            <label>Due date</label>
            <input type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
          </div>
        </div>

        <table className="table items">
          <thead>
            <tr><th>Description</th><th style={{ width: 110 }}>Qty</th><th style={{ width: 150 }}>Price</th><th className="right" style={{ width: 150 }}>Amount</th><th style={{ width: 40 }} /></tr>
          </thead>
          <tbody>
            {form.items.map((it, i) => (
              <tr key={i}>
                <td><input value={it.description} placeholder="Item or service" onChange={(e) => setItem(i, 'description', e.target.value)} /></td>
                <td><input type="number" min="0" step="any" value={it.quantity} onChange={(e) => setItem(i, 'quantity', e.target.value)} /></td>
                <td><input type="number" min="0" step="any" value={it.price} onChange={(e) => setItem(i, 'price', e.target.value)} /></td>
                <td className="right">{money(Number(it.quantity || 0) * Number(it.price || 0))}</td>
                <td>{form.items.length > 1 && <button className="icon-btn" onClick={() => removeItem(i)}>✕</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-light" onClick={addItem}>+ Add item</button>

        <div className="form-bottom">
          <div>
            <label>Notes</label>
            <textarea rows="3" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
          <div className="totals">
            <div><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div><span>Tax ({taxRate}%)</span><span>{money(tax)}</span></div>
            <div className="grand"><span>Total</span><span>{money(subtotal + tax)}</span></div>
          </div>
        </div>

        <div className="actions">
          <button className="btn btn-light" onClick={() => navigate(-1)}>Cancel</button>
          {id ? (
            <button className="btn btn-primary" onClick={() => save()}>Save changes</button>
          ) : (
            <>
              <button className="btn btn-light" onClick={() => save('draft')}>Save as draft</button>
              <button className="btn btn-primary" onClick={() => save('sent')}>Save &amp; mark sent</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
