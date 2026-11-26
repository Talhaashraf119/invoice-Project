const router = require('express').Router();
const mongoose = require('mongoose');
const { Client, Invoice } = require('../models');
const { attachClientNames } = require('./invoices');

router.get('/', async (req, res) => {
  const companyId = new mongoose.Types.ObjectId(req.user.companyId);
  const today = new Date(new Date().toISOString().slice(0, 10));

  const [stats = {}] = await Invoice.aggregate([
    { $match: { company_id: companyId } },
    {
      $group: {
        _id: null,
        revenue: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] } },
        outstanding: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, '$total', 0] } },
        overdue_count: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'sent'] }, { $lt: ['$due_date', today] }] }, 1, 0] } },
        invoice_count: { $sum: 1 },
      },
    },
  ]);
  const client_count = await Client.countDocuments({ company_id: companyId });

  // Paid revenue for the last 6 months (months with no revenue show 0)
  const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5, 1));
  const monthly = await Invoice.aggregate([
    { $match: { company_id: companyId, status: 'paid', issue_date: { $gte: from } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$issue_date' } }, amount: { $sum: '$total' } } },
  ]);
  const chart = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
    const key = d.toISOString().slice(0, 7);
    chart.push({
      month: d.toLocaleString('en', { month: 'short', timeZone: 'UTC' }),
      amount: monthly.find((m) => m._id === key)?.amount || 0,
    });
  }

  const recent = await attachClientNames(await Invoice.find({ company_id: companyId }).sort({ createdAt: -1 }).limit(5));

  res.json({
    revenue: stats.revenue || 0,
    outstanding: stats.outstanding || 0,
    overdue_count: stats.overdue_count || 0,
    invoice_count: stats.invoice_count || 0,
    client_count,
    chart,
    recent,
  });
});

module.exports = router;
