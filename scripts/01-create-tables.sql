-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'United States',
  customer_since DATE DEFAULT CURRENT_DATE,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create gemstones table for inventory
CREATE TABLE IF NOT EXISTS gemstones (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- diamond, ruby, sapphire, emerald, etc.
  cut VARCHAR(50), -- round, princess, emerald, etc.
  carat_weight DECIMAL(6,3),
  color VARCHAR(20),
  clarity VARCHAR(10),
  origin VARCHAR(100),
  certification VARCHAR(100),
  cost_price DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'available', -- available, sold, reserved
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  gemstone_id INTEGER REFERENCES gemstones(id),
  purchase_date DATE DEFAULT CURRENT_DATE,
  sale_price DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50), -- cash, credit_card, check, wire_transfer
  payment_status VARCHAR(20) DEFAULT 'completed', -- pending, completed, refunded
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_purchases_customer ON purchases(customer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_gemstones_status ON gemstones(status);
