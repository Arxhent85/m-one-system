-- ============================================================
-- M ONE ERP — PUBLIC READ ACCESS PERMISSIONS
-- erlaubt das Auslesen der Artikel, Bestände & Kunden in der App
-- ============================================================

-- Products RLS Policy
DROP POLICY IF EXISTS "Products readable by authenticated users" ON products;
CREATE POLICY "Products readable by public"
  ON products FOR SELECT TO public USING (true);

-- Categories RLS Policy
DROP POLICY IF EXISTS "Categories readable by authenticated users" ON categories;
CREATE POLICY "Categories readable by public"
  ON categories FOR SELECT TO public USING (true);

-- Locations RLS Policy
DROP POLICY IF EXISTS "Locations readable by authenticated users" ON locations;
CREATE POLICY "Locations readable by public"
  ON locations FOR SELECT TO public USING (true);

-- Stock Items RLS Policy
DROP POLICY IF EXISTS "Stock items readable by authenticated users" ON stock_items;
CREATE POLICY "Stock items readable by public"
  ON stock_items FOR SELECT TO public USING (true);

-- Customers RLS Policy
DROP POLICY IF EXISTS "Customers readable by authenticated users" ON customers;
CREATE POLICY "Customers readable by public"
  ON customers FOR SELECT TO public USING (true);

-- Sales Orders RLS Policy
DROP POLICY IF EXISTS "Sales orders readable by authenticated users" ON sales_orders;
CREATE POLICY "Sales orders readable by public"
  ON sales_orders FOR SELECT TO public USING (true);
