import { useEffect, useState } from 'react';
import { api, money } from '../api';

const empty = { name: '', email: '', phone: '', address: '' };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null); // null = modal closed
  const [error, setError] = useState('');

  const load = () => api('/clients').then(setClients);
  useEffect(() => { load(); }, []);

  const open = (client = empty) => { setError(''); setForm({ ...client }); };
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function save(e) {
    e.preventDefault();
    try {
      if (form.id) await api('/clients/' + form.id, { method: 'PUT', body: form });
      else await api('/clients', { method: 'POST', body: form });
      setForm(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(c) {
    if (!confirm(`Delete client "${c.name}"?`)) return;
    try {
      await api('/clients/' + c.id, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  const list = clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="page-head">
        <h1>Clients</h1>
        <button className="btn btn-primary" onClick={() => open()}>+ Add Client</button>
      </div>

      <div className="card">
        <div className="toolbar">
          <input className="search" placeholder="Search clients…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th className="right">Invoices</th><th className="right">Total billed</th><th /></tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td className="right">{c.invoice_count}</td>
                <td className="right">{money(c.total_billed)}</td>
                <td className="right nowrap">
                  <button className="link-btn" onClick={() => open(c)}>Edit</button>
                  <button className="link-btn danger" onClick={() => remove(c)}>Delete</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan="6" className="empty">No clients found</td></tr>}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="modal-bg" onClick={() => setForm(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <h3>{form.id ? 'Edit Client' : 'Add Client'}</h3>
            {error && <div className="alert">{error}</div>}
            <label>Name *</label>
            <input name="name" value={form.name} onChange={change} required />
            <label>Email</label>
            <input type="email" name="email" value={form.email || ''} onChange={change} />
            <label>Phone</label>
            <input name="phone" value={form.phone || ''} onChange={change} />
            <label>Address</label>
            <input name="address" value={form.address || ''} onChange={change} />
            <div className="actions">
              <button type="button" className="btn btn-light" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn btn-primary">Save</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
