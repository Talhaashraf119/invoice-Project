import { useEffect, useState } from 'react';
import { api, getUser } from '../api';

export default function Settings() {
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState({});

  useEffect(() => { api('/company').then(setForm); }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function save(e) {
    e.preventDefault();
    try {
      await api('/company', { method: 'PUT', body: form });
      // keep the sidebar name and currency in sync
      localStorage.setItem('user', JSON.stringify({ ...getUser(), companyName: form.name, currency: form.currency }));
      setMsg({ ok: 'Settings saved' });
    } catch (err) {
      setMsg({ error: err.message });
    }
  }

  if (!form) return <p className="muted">Loading…</p>;

  return (
    <>
      <div className="page-head"><h1>Company Settings</h1></div>

      <form className="card narrow" onSubmit={save}>
        {msg.ok && <div className="alert success">{msg.ok}</div>}
        {msg.error && <div className="alert">{msg.error}</div>}

        <h3>Business profile</h3>
        <p className="muted">These details appear on every invoice you send.</p>
        <label>Company name</label>
        <input name="name" value={form.name || ''} onChange={change} required />
        <div className="form-row">
          <div><label>Email</label><input type="email" name="email" value={form.email || ''} onChange={change} /></div>
          <div><label>Phone</label><input name="phone" value={form.phone || ''} onChange={change} /></div>
        </div>
        <label>Address</label>
        <input name="address" value={form.address || ''} onChange={change} />

        <h3>Billing</h3>
        <div className="form-row">
          <div>
            <label>Currency</label>
            <select name="currency" value={form.currency} onChange={change}>
              {['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label>Default tax rate (%)</label>
            <input type="number" min="0" max="100" step="0.01" name="tax_rate" value={form.tax_rate} onChange={change} />
          </div>
        </div>

        <div className="actions">
          <button className="btn btn-primary">Save settings</button>
        </div>
      </form>
    </>
  );
}
