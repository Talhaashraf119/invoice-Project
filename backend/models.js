const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const ObjectId = Schema.Types.ObjectId;

// Sends "id" instead of "_id" and dates as 'YYYY-MM-DD' to the frontend
const toJSON = {
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.password;
    for (const key of ['issue_date', 'due_date']) {
      if (ret[key] instanceof Date) ret[key] = ret[key].toISOString().slice(0, 10);
    }
    return ret;
  },
};
const options = { timestamps: true, toJSON };

// Tenant: every company that signs up
const Company = model('Company', new Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  address: String,
  currency: { type: String, default: 'PKR' },
  tax_rate: { type: Number, default: 0 },
  next_invoice_no: { type: Number, default: 1 },
}, options));

const User = model('User', new Schema({
  company_id: { type: ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'admin' },
}, options));

const Client = model('Client', new Schema({
  company_id: { type: ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true },
  email: String,
  phone: String,
  address: String,
}, options));

// Line items are embedded inside the invoice (one document per invoice)
const itemSchema = new Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  amount: { type: Number, required: true },
}, { _id: false });

const invoiceSchema = new Schema({
  company_id: { type: ObjectId, ref: 'Company', required: true, index: true },
  client_id: { type: ObjectId, ref: 'Client', required: true },
  invoice_no: { type: String, required: true },
  issue_date: { type: Date, required: true },
  due_date: { type: Date, required: true },
  status: { type: String, enum: ['draft', 'sent', 'paid'], default: 'draft' },
  items: [itemSchema],
  subtotal: Number,
  tax_rate: Number,
  tax: Number,
  total: Number,
  notes: String,
}, options);
invoiceSchema.index({ company_id: 1, invoice_no: 1 }, { unique: true });

const Invoice = model('Invoice', invoiceSchema);

module.exports = { Company, User, Client, Invoice };
