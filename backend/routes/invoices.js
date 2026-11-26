const router = require('express').Router();
const mongoose = require('mongoose');
const { Company, Client, Invoice } = require('../models');

const startOfToday = () => new Date(new Date().toISOString().slice(0, 10));

// "overdue" is not stored: a sent invoice past its due date is overdue
function withStatus(invoice) {
  const data = invoice.toJSON();
  if (data.status === 'sent' && invoice.due_date < startOfToday()) data.status = 'overdue';
  return data;
}

// Totals are always calculated on the server, never trusted from the browser
function calculate(items, taxRate) {
  const clean = (items || [])
    .filter((it) => it.description && Number(it.quantity) > 0)
    .map((it) => {
      const quantity = Number(it.quantity);
      const price = Number(it.price) || 0;
      return { description: it.description, quantity, price, amount: +(quantity * price).toFixed(2) };
    });
  const subtotal = +clean.reduce((sum, it) => sum + it.amount, 0).toFixed(2);
  const tax = +((subtotal * Number(taxRate)) / 100).toFixed(2);
  return { items: clean, subtotal, tax, total: +(subtotal + tax).toFixed(2) };
}

async function validate(req) {
  const { client_id, issue_date, due_date, items } = req.body;
  if (!client_id || !issue_date || !due_date) return 'Client, issue date and due date are required';
  if (due_date < issue_date) return 'Due date cannot be before issue date';
  if (!calculate(items, 0).items.length) return 'Add at least one item';
  if (!mongoose.isValidObjectId(client_id) || !(await Client.exists({ _id: client_id, company_id: req.user.companyId })))
    return 'Invalid client';
}

// Adds client_name to a list of invoices
async function attachClientNames(invoices) {
  const clients = await Client.find({ _id: { $in: invoices.map((i) => i.client_id) } }).select('name');
  const names = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  return invoices.map((i) => ({ ...withStatus(i), client_name: names[i.client_id.toString()] }));
}

// List with optional ?status= and ?q= (search by number or client)
router.get('/', async (req, res) => {
  const { status, q } = req.query;
  const filter = { company_id: req.user.companyId };

  if (status === 'draft' || status === 'paid') filter.status = status;
  if (status === 'sent') Object.assign(filter, { status: 'sent', due_date: { $gte: startOfToday() } });
  if (status === 'overdue') Object.assign(filter, { status: 'sent', due_date: { $lt: startOfToday() } });

  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const clients = await Client.find({ company_id: req.user.companyId, name: regex }).select('_id');
    filter.$or = [{ invoice_no: regex }, { client_id: { $in: clients.map((c) => c._id) } }];
  }

  const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
  res.json(await attachClientNames(invoices));
});

router.get('/:id', async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, company_id: req.user.companyId });
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  const client = await Client.findById(invoice.client_id);
  res.json({
    ...withStatus(invoice),
    client_name: client?.name,
    client_email: client?.email,
    client_phone: client?.phone,
    client_address: client?.address,
  });
});

router.post('/', async (req, res) => {
  const error = await validate(req);
  if (error) return res.status(400).json({ message: error });

  // $inc is atomic, so two invoices created at the same time never get the same number
  const company = await Company.findByIdAndUpdate(req.user.companyId, { $inc: { next_invoice_no: 1 } });
  const t = calculate(req.body.items, company.tax_rate);

  const invoice = await Invoice.create({
    company_id: req.user.companyId,
    client_id: req.body.client_id,
    invoice_no: 'INV-' + String(company.next_invoice_no).padStart(4, '0'),
    issue_date: req.body.issue_date,
    due_date: req.body.due_date,
    status: req.body.status === 'sent' ? 'sent' : 'draft',
    items: t.items,
    subtotal: t.subtotal,
    tax_rate: company.tax_rate,
    tax: t.tax,
    total: t.total,
    notes: req.body.notes,
  });
  res.status(201).json({ id: invoice.id });
});

router.put('/:id', async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, company_id: req.user.companyId });
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  const error = await validate(req);
  if (error) return res.status(400).json({ message: error });

  const t = calculate(req.body.items, invoice.tax_rate);
  Object.assign(invoice, {
    client_id: req.body.client_id,
    issue_date: req.body.issue_date,
    due_date: req.body.due_date,
    notes: req.body.notes,
    items: t.items,
    subtotal: t.subtotal,
    tax: t.tax,
    total: t.total,
  });
  await invoice.save();
  res.json({ id: invoice.id });
});

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['draft', 'sent', 'paid'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

  const invoice = await Invoice.findOneAndUpdate({ _id: req.params.id, company_id: req.user.companyId }, { status });
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  res.json({ message: 'Status updated' });
});

router.delete('/:id', async (req, res) => {
  const result = await Invoice.deleteOne({ _id: req.params.id, company_id: req.user.companyId });
  if (!result.deletedCount) return res.status(404).json({ message: 'Invoice not found' });
  res.json({ message: 'Invoice deleted' });
});

module.exports = router;
module.exports.attachClientNames = attachClientNames;
