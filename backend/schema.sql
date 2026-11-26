-- Invoice SaaS database schema (MySQL 8)
-- Multi-tenant design: every business table has company_id,
-- so each company only ever sees its own data.

CREATE DATABASE IF NOT EXISTS invoice_saas;
USE invoice_saas;

CREATE TABLE IF NOT EXISTS companies (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  email           VARCHAR(150),
  phone           VARCHAR(50),
  address         VARCHAR(255),
  currency        VARCHAR(10)   NOT NULL DEFAULT 'PKR',
  tax_rate        DECIMAL(5,2)  NOT NULL DEFAULT 0,
  next_invoice_no INT           NOT NULL DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('admin','member') NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clients (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(150),
  phone      VARCHAR(50),
  address    VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoices (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  client_id  INT NOT NULL,
  invoice_no VARCHAR(20) NOT NULL,
  issue_date DATE NOT NULL,
  due_date   DATE NOT NULL,
  status     ENUM('draft','sent','paid') NOT NULL DEFAULT 'draft',
  subtotal   DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate   DECIMAL(5,2)  NOT NULL DEFAULT 0,
  tax        DECIMAL(12,2) NOT NULL DEFAULT 0,
  total      DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes      TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_company_invoice (company_id, invoice_no),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id)  REFERENCES clients(id)   ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id  INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity    DECIMAL(10,2) NOT NULL,
  price       DECIMAL(12,2) NOT NULL,
  amount      DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);
