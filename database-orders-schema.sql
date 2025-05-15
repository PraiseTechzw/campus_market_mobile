-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  listing_id INTEGER REFERENCES listings(id),
  accommodation_id INTEGER REFERENCES accommodations(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  reference_number VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_order_item CHECK (
    (listing_id IS NOT NULL AND accommodation_id IS NULL) OR
    (listing_id IS NULL AND accommodation_id IS NOT NULL)
  )
);

-- Order transactions table
CREATE TABLE IF NOT EXISTS order_transactions (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  transaction_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  provider VARCHAR(50),
  provider_transaction_id VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policies for orders
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable RLS on order_transactions
ALTER TABLE order_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for order_transactions
CREATE POLICY "Users can view their own order transactions"
  ON order_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_transactions.order_id
    AND orders.user_id = auth.uid()
  ));
