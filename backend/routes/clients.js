const router = require('express').Router();
const mongoose = require('mongoose');
const { Client, Invoice } = require('../models');

// Every query is filtered by company_id = tenant isolation

router.get('/', async (req, res) => {
  const companyId = new mongoose.Types.ObjectId(req.user.companyId);
  const clients = await Client.find({ company_id: companyId }).sort({ name: 1 });

  // Invoice count and total billed per client
  const stats = await Invoice.aggregate([
    { $match: { company_id: companyId } },
    { $group: { _id: '$client_id', invoice_count: { $sum: 1 }, total_billed: { $sum: '$total' } } },
  ]);
  const byClient = Object.fromEntries(stats.map((s) => [s._id.toString(), s]));

  res.json(clients.map((c) => ({
    ...c.toJSON(),
    invoice_count: byClient[c.id]?.invoice_count || 0,
    total_billed: byClient[c.id]?.total_billed || 0,
  })));
});

router.post('/', async (req, res) => {
  const { name, email, phone, address } = req.body;
  if (!name) return res.status(400).json({ message: 'Client name is required' });

  const client = await Client.create({ company_id: req.user.companyId, name, email, phone, address });
  res.status(201).json({ id: client.id });
});

router.put('/:id', async (req, res) => {
  const { name, email, phone, address } = req.body;
  if (!name) return res.status(400).json({ message: 'Client name is required' });

  const client = await Client.findOneAndUpdate(
    { _id: req.params.id, company_id: req.user.companyId },
    { name, email, phone, address }
  );
  if (!client) return res.status(404).json({ message: 'Client not found' });
  res.json({ message: 'Client updated' });
});

router.delete('/:id', async (req, res) => {
  const filter = { _id: req.params.id, company_id: req.user.companyId };
  if (!(await Client.exists(filter))) return res.status(404).json({ message: 'Client not found' });
  if (await Invoice.exists({ client_id: req.params.id, company_id: req.user.companyId }))
    return res.status(400).json({ message: 'This client has invoices. Delete those invoices first.' });

  await Client.deleteOne(filter);
  res.json({ message: 'Client deleted' });
});

module.exports = router;
