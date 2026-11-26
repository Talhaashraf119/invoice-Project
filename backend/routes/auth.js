const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Company, User } = require('../models');
const auth = require('../middleware/auth');

function buildSession(user, company) {
  const token = jwt.sign(
    { id: user._id.toString(), companyId: company._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  return {
    token,
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
      companyName: company.name,
      currency: company.currency,
    },
  };
}

// Sign up = create a new company (tenant) + its first admin user
router.post('/register', async (req, res) => {
  const { companyName, name, email, password } = req.body;
  if (!companyName || !name || !email || !password)
    return res.status(400).json({ message: 'All fields are required' });
  if (password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  if (await User.exists({ email: email.toLowerCase().trim() }))
    return res.status(400).json({ message: 'Email is already registered' });

  const company = await Company.create({ name: companyName, email });
  try {
    const user = await User.create({
      company_id: company._id,
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role: 'admin',
    });
    res.status(201).json(buildSession(user, company));
  } catch (err) {
    await company.deleteOne(); // undo the company if the user could not be created
    throw err;
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').toLowerCase().trim() });
  if (!user || !(await bcrypt.compare(password || '', user.password)))
    return res.status(400).json({ message: 'Invalid email or password' });

  const company = await Company.findById(user.company_id);
  res.json(buildSession(user, company));
});

router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  const company = await Company.findById(req.user.companyId);
  res.json({ name: user.name, email: user.email, role: user.role, companyName: company.name, currency: company.currency });
});

module.exports = router;
