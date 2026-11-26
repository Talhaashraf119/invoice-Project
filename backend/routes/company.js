const router = require('express').Router();
const { Company } = require('../models');

// Company profile (shown on invoices) and billing settings
router.get('/', async (req, res) => {
  const company = await Company.findById(req.user.companyId).select('name email phone address currency tax_rate');
  res.json(company);
});

router.put('/', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admin can change settings' });

  const { name, email, phone, address, currency, tax_rate } = req.body;
  if (!name) return res.status(400).json({ message: 'Company name is required' });

  await Company.findByIdAndUpdate(req.user.companyId, {
    name, email, phone, address,
    currency: currency || 'PKR',
    tax_rate: Number(tax_rate) || 0,
  });
  res.json({ message: 'Settings saved' });
});

module.exports = router;
