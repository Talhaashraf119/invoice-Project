# InvoiceFlow — Multi-Tenant Invoice & Billing SaaS

A SaaS web application where any business can sign up, get its own private workspace,
manage clients, create invoices, and track payments and revenue.

**Stack:** React (Vite) · Node.js + Express · MongoDB Atlas (Mongoose) · JWT authentication

---

## Features

- **Multi-tenant workspaces:** each company that signs up gets fully isolated data
- **Authentication:** register / login with JWT, passwords hashed with bcrypt
- **Dashboard:** total revenue, outstanding amount, overdue count, 6-month revenue chart, recent invoices
- **Clients:** add, edit, delete, search, with invoice count and total billed per client
- **Invoices:** line items, automatic numbering (INV-0001…), tax, statuses (Draft → Sent → Paid), automatic **Overdue** detection, search and filters, print / save as PDF
- **Settings:** company profile shown on invoices, currency, default tax rate

## Folder structure

```
invoice-saas/
├── package.json             # build/start scripts for deployment
├── backend/
│   ├── server.js            # Express app, route mounting, error handler
│   ├── db.js                # MongoDB connection
│   ├── models.js            # Mongoose models: Company, User, Client, Invoice
│   ├── middleware/auth.js   # JWT check → req.user.companyId
│   └── routes/              # auth, company, clients, invoices, dashboard
└── frontend/
    └── src/
        ├── api.js           # fetch wrapper + helpers
        ├── App.jsx          # routes
        ├── components/Layout.jsx
        └── pages/           # Auth, Dashboard, Invoices, InvoiceForm, InvoiceView, Clients, Settings
```

## 1. MongoDB Atlas setup

1. Create a free account at https://cloud.mongodb.com and create a free **M0** cluster.
2. **Database Access** → add a database user (username + password).
3. **Network Access** → add IP address `0.0.0.0/0` (allow from anywhere, required for the hosted backend).
4. **Connect → Drivers** → copy the connection string.
5. Paste it into `backend/.env` as `MONGO_URI`, replace `<password>`, and add the database name `invoice_saas` before the `?`:
   ```
   MONGO_URI=mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/invoice_saas?retryWrites=true&w=majority
   ```
   Collections are created automatically. No schema import is needed.

## 2. Run locally

**Requirement:** Node.js 18+

```
cd backend
npm install
npm run dev               # http://localhost:5000
```
In a second terminal:
```
cd frontend
npm install
npm run dev               # open http://localhost:5173
```
On Windows you can double-click `setup.bat` (first time) or `start.bat` instead.

## 3. Deploy (Render, one service)

1. Push the project to GitHub (`.env` and `node_modules` must not be pushed).
2. On https://render.com → **New → Web Service** → select the repo.
3. Settings:
   - **Root Directory:** leave empty
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Environment Variables:** `MONGO_URI` and `JWT_SECRET` (same values as in `.env`)
4. Deploy. The Express server serves both the API (`/api/...`) and the React app at the same URL.
   Check `https://your-app.onrender.com/api/health` → `{"status":"ok"}`.

**Separate frontend (optional):** if the frontend is deployed on Vercel/Netlify, set
`VITE_API_URL=https://your-backend.onrender.com` there and deploy the backend alone with
Root Directory `backend`, build `npm install`, start `npm start`.

## Architecture

### Multi-tenancy (shared database, shared collections)
- All tenants share one database. Every business collection (`users`, `clients`, `invoices`) has a `company_id` field (indexed).
- On login the server signs a JWT containing `{ id, companyId, role }`.
- `middleware/auth.js` verifies the token and sets `req.user`.
- **Every query** includes `company_id: req.user.companyId`, so one company can never read or change another company's data, even by guessing IDs. Requesting another company's invoice returns 404.

### Request flow
```
React page → api.js (adds Bearer token) → Express route → auth middleware
→ Mongoose query filtered by company_id → JSON response → React state
```

### Data model
```
companies 1───* users
companies 1───* clients 1───* invoices (items embedded inside each invoice)
```
- **Line items are embedded** in the invoice document. They are always read and written together with the invoice, so one document = one invoice (the MongoDB way, no joins needed).
- Unique index on `(company_id, invoice_no)`: each company has its own invoice number sequence.
- A client that has invoices cannot be deleted.

### Data integrity
- **Totals are computed on the server.** Values sent from the browser are never trusted.
- **Invoice numbering** uses MongoDB's atomic `$inc` on the company's `next_invoice_no`, so two invoices created at the same moment never get the same number.
- **Overdue** is calculated, not stored: `status = 'sent' AND due_date < today`.
- **Dashboard** figures use MongoDB aggregation pipelines (`$match`, `$group`, `$cond`).

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Create company + admin user |
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/auth/me | Current user |
| GET / PUT | /api/company | Company settings |
| GET / POST | /api/clients | List / create clients |
| PUT / DELETE | /api/clients/:id | Update / delete client |
| GET / POST | /api/invoices | List (`?status=&q=`) / create |
| GET / PUT / DELETE | /api/invoices/:id | View / update / delete |
| PATCH | /api/invoices/:id/status | Change status |
| GET | /api/dashboard | Stats, chart and recent invoices |
| GET | /api/health | Health check for hosting |

## Possible future work
Team invites with member roles, subscription plans with Stripe, emailing invoices as PDF, recurring invoices, and a super-admin panel.
"# invoice-Project" 
