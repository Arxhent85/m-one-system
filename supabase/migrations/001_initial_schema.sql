-- ============================================================
-- M ONE ERP — SUPABASE MIGRATION 001
-- Vollständiges Datenbankschema mit Triggers, Functions & RLS
-- ============================================================

-- Erweiterungen aktivieren
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. SEQUENZEN für Auftragsnummern
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS sales_order_seq START 1;
CREATE SEQUENCE IF NOT EXISTS transfer_seq START 1;
CREATE SEQUENCE IF NOT EXISTS purchase_seq START 1;

-- ============================================================
-- 2. STANDORTE (Depot + Fahrzeuge)
-- ============================================================
CREATE TABLE IF NOT EXISTS locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  type        TEXT NOT NULL CHECK (type IN ('depot', 'vehicle')),
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE locations IS 'Lagerstandorte: Hauptdepot und mobile Fahrzeuge';
COMMENT ON COLUMN locations.type IS 'depot = Hauptlager, vehicle = Lieferfahrzeug';

-- ============================================================
-- 3. BENUTZER-PROFILE (linked to Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'driver', 'viewer')),
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  phone       TEXT,
  avatar_url  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Benutzerprofile: Admin/Innendienst und Fahrer/Außendienst';
COMMENT ON COLUMN profiles.location_id IS 'Für Fahrer: zugewiesenes Fahrzeug';

-- ============================================================
-- 4. PRODUKTKATEGORIEN
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  color       TEXT DEFAULT '#6272f4',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE categories IS 'Produktkategorien für die Sortierung';

-- ============================================================
-- 5. PRODUKTE
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku            TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  description    TEXT,
  category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
  unit           TEXT NOT NULL DEFAULT 'Stk',
  purchase_price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
  selling_price  NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  min_stock      INTEGER NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  barcode        TEXT,
  image_url      TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE products IS 'Produktstammdaten mit Preisen und Mindestbestand';
COMMENT ON COLUMN products.min_stock IS 'Globaler Mindestbestand; kann per Standort überschrieben werden';

-- ============================================================
-- 6. LAGERBESTÄNDE PRO STANDORT (Live-Bestandsspiegel)
-- Inspiriert von ERPNext tabBin: schneller Abruf ohne teure Aggregation
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  quantity    NUMERIC(10, 3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_stock   INTEGER CHECK (min_stock >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, location_id)
);

COMMENT ON TABLE stock_items IS 'Live-Bestand je (Produkt, Standort). Wird durch Trigger aktuell gehalten.';
COMMENT ON COLUMN stock_items.min_stock IS 'Standort-spezifischer Mindestbestand. Überschreibt products.min_stock.';

-- ============================================================
-- 7. STOCK LEDGER (unveränderlicher Audit-Trail)
-- Inspiriert von ERPNext Stock Ledger Entry + InvenTree StockItemTracking
-- NIEMALS direkt löschen oder updaten!
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_ledger (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  location_id    UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  entry_type     TEXT NOT NULL CHECK (entry_type IN (
                   'transfer_in',
                   'transfer_out',
                   'sale',
                   'purchase',
                   'adjustment',
                   'return'
                 )),
  quantity       NUMERIC(10, 3) NOT NULL,
  balance_after  NUMERIC(10, 3) NOT NULL,
  reference_id   UUID,
  reference_type TEXT CHECK (reference_type IN ('transfer', 'sale', 'purchase', 'adjustment')),
  unit_price     NUMERIC(10, 2),
  notes          TEXT,
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE stock_ledger IS 'Unveränderlicher Buchungsjournal aller Lagerbewegungen. Niemals updaten oder löschen!';

-- Index für Analytics-Queries
CREATE INDEX IF NOT EXISTS idx_stock_ledger_product ON stock_ledger(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_location ON stock_ledger(location_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_reference ON stock_ledger(reference_id);

-- ============================================================
-- 8. LAGER-UMLAGERUNGEN (Header)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_transfers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number  TEXT NOT NULL UNIQUE,
  from_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  to_location_id   UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
  notes            TEXT,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  confirmed_at     TIMESTAMPTZ,
  cancelled_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT different_locations CHECK (from_location_id != to_location_id)
);

COMMENT ON TABLE stock_transfers IS 'Umlagerungsbelege: Depot → Fahrzeug oder Fahrzeug → Depot';

-- ============================================================
-- 9. UMLAGERUNGS-POSITIONEN
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_transfer_id UUID NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity          NUMERIC(10, 3) NOT NULL CHECK (quantity > 0),
  UNIQUE(stock_transfer_id, product_id)
);

-- ============================================================
-- 10. KUNDEN
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name    TEXT NOT NULL,
  contact_person  TEXT,
  email           TEXT,
  phone           TEXT,
  address         TEXT,
  city            TEXT,
  postal_code     TEXT,
  customer_type   TEXT NOT NULL DEFAULT 'regular' CHECK (customer_type IN ('regular', 'premium', 'wholesale')),
  discount_pct    NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (discount_pct >= 0 AND discount_pct <= 100),
  notes           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE customers IS 'Kundenstammdaten mit Sonderkonditionen';

CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_name);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);

-- ============================================================
-- 11. VERKAUFSAUFTRÄGE
-- ============================================================
CREATE TABLE IF NOT EXISTS sales_orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     TEXT NOT NULL UNIQUE,
  customer_id      UUID REFERENCES customers(id) ON DELETE SET NULL,
  location_id      UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
                     'draft', 'confirmed', 'delivered', 'invoiced', 'cancelled'
                   )),
  payment_method   TEXT CHECK (payment_method IN ('cash', 'invoice', 'card', 'transfer')),
  payment_status   TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
                     'pending', 'paid', 'partial', 'overdue'
                   )),
  subtotal         NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_amount  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax_rate         NUMERIC(5, 2) NOT NULL DEFAULT 0,
  tax_amount       NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount     NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes            TEXT,
  delivery_address TEXT,
  due_date         DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sales_orders IS 'Verkaufsaufträge von Fahrzeugen oder Depot';

CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_location ON sales_orders(location_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_created ON sales_orders(created_at DESC);

-- ============================================================
-- 12. AUFTRAGS-POSITIONEN
-- ============================================================
CREATE TABLE IF NOT EXISTS sales_order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id  UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity        NUMERIC(10, 3) NOT NULL CHECK (quantity > 0),
  unit_price      NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  discount_pct    NUMERIC(5, 2) NOT NULL DEFAULT 0,
  total_price     NUMERIC(10, 2) NOT NULL DEFAULT 0,
  UNIQUE(sales_order_id, product_id)
);

-- ============================================================
-- 13. KUNDEN-AKTIVITÄTSLOG (CRM)
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  action_type  TEXT NOT NULL CHECK (action_type IN (
                 'sale', 'note', 'delivery', 'payment',
                 'contact', 'complaint', 'discount'
               )),
  description  TEXT NOT NULL,
  reference_id UUID,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_logs_customer ON customer_logs(customer_id, created_at DESC);

-- ============================================================
-- TRIGGERS: Auto-Aktualisierung von updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_sales_orders_updated_at
  BEFORE UPDATE ON sales_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_stock_items_updated_at
  BEFORE UPDATE ON stock_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGERS: Auto-Nummern generieren
-- ============================================================
CREATE OR REPLACE FUNCTION generate_sales_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'SO-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                        LPAD(nextval('sales_order_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sales_order_number
  BEFORE INSERT ON sales_orders
  FOR EACH ROW EXECUTE FUNCTION generate_sales_order_number();

CREATE OR REPLACE FUNCTION generate_transfer_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transfer_number IS NULL OR NEW.transfer_number = '' THEN
    NEW.transfer_number := 'TRF-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                           LPAD(nextval('transfer_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transfer_number
  BEFORE INSERT ON stock_transfers
  FOR EACH ROW EXECUTE FUNCTION generate_transfer_number();

-- ============================================================
-- TRIGGER: Profile auto-anlegen wenn neuer Auth-User angelegt wird
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'driver')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNKTION: LAGER-UMLAGERUNG BESTÄTIGEN (Atomare DB-Transaktion)
-- Aufruf via Supabase RPC: supabase.rpc('confirm_stock_transfer', { p_transfer_id, p_user_id })
-- ============================================================
CREATE OR REPLACE FUNCTION confirm_stock_transfer(
  p_transfer_id UUID,
  p_user_id     UUID
)
RETURNS JSONB AS $$
DECLARE
  v_transfer    stock_transfers%ROWTYPE;
  v_item        stock_transfer_items%ROWTYPE;
  v_from_qty    NUMERIC;
  v_to_qty      NUMERIC;
  v_items_count INTEGER := 0;
BEGIN
  -- 1. Transfer laden und sperren (verhindert Race Conditions)
  SELECT * INTO v_transfer
  FROM stock_transfers
  WHERE id = p_transfer_id AND status = 'draft'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transfer nicht gefunden oder bereits verarbeitet: ' || p_transfer_id
    );
  END IF;

  -- 2. Alle Positionen verarbeiten
  FOR v_item IN
    SELECT * FROM stock_transfer_items
    WHERE stock_transfer_id = p_transfer_id
  LOOP
    v_items_count := v_items_count + 1;

    -- Quell-Bestand prüfen und sperren
    SELECT quantity INTO v_from_qty
    FROM stock_items
    WHERE product_id = v_item.product_id
      AND location_id = v_transfer.from_location_id
    FOR UPDATE;

    IF v_from_qty IS NULL OR v_from_qty < v_item.quantity THEN
      -- Rollback durch Exception
      RAISE EXCEPTION 'Unzureichender Bestand für Produkt % am Quell-Standort. Verfügbar: %, Benötigt: %',
        v_item.product_id, COALESCE(v_from_qty, 0), v_item.quantity;
    END IF;

    -- ABGANG: Quell-Standort reduzieren
    UPDATE stock_items
    SET quantity = quantity - v_item.quantity,
        updated_at = NOW()
    WHERE product_id = v_item.product_id
      AND location_id = v_transfer.from_location_id;

    -- ZUGANG: Ziel-Standort erhöhen (INSERT ON CONFLICT = UPSERT)
    INSERT INTO stock_items (product_id, location_id, quantity)
    VALUES (v_item.product_id, v_transfer.to_location_id, v_item.quantity)
    ON CONFLICT (product_id, location_id)
    DO UPDATE SET
      quantity = stock_items.quantity + EXCLUDED.quantity,
      updated_at = NOW();

    -- Aktuellen Bestand am Quell-Standort ermitteln (nach Abgang)
    SELECT quantity INTO v_from_qty
    FROM stock_items
    WHERE product_id = v_item.product_id
      AND location_id = v_transfer.from_location_id;

    -- Stock Ledger: ABGANG buchen
    INSERT INTO stock_ledger (
      product_id, location_id, entry_type, quantity,
      balance_after, reference_id, reference_type, user_id
    ) VALUES (
      v_item.product_id, v_transfer.from_location_id,
      'transfer_out', -v_item.quantity,
      COALESCE(v_from_qty, 0), p_transfer_id, 'transfer', p_user_id
    );

    -- Aktuellen Bestand am Ziel-Standort ermitteln (nach Zugang)
    SELECT quantity INTO v_to_qty
    FROM stock_items
    WHERE product_id = v_item.product_id
      AND location_id = v_transfer.to_location_id;

    -- Stock Ledger: ZUGANG buchen
    INSERT INTO stock_ledger (
      product_id, location_id, entry_type, quantity,
      balance_after, reference_id, reference_type, user_id
    ) VALUES (
      v_item.product_id, v_transfer.to_location_id,
      'transfer_in', v_item.quantity,
      COALESCE(v_to_qty, 0), p_transfer_id, 'transfer', p_user_id
    );
  END LOOP;

  IF v_items_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transfer hat keine Positionen'
    );
  END IF;

  -- 3. Transfer als bestätigt markieren
  UPDATE stock_transfers
  SET status = 'confirmed',
      confirmed_at = NOW()
  WHERE id = p_transfer_id;

  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', p_transfer_id,
    'items_processed', v_items_count
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNKTION: VERKAUFSAUFTRAG BESTÄTIGEN (Bestand abbuchen)
-- Aufruf via Supabase RPC: supabase.rpc('confirm_sales_order', { p_order_id, p_user_id })
-- ============================================================
CREATE OR REPLACE FUNCTION confirm_sales_order(
  p_order_id UUID,
  p_user_id  UUID
)
RETURNS JSONB AS $$
DECLARE
  v_order     sales_orders%ROWTYPE;
  v_item      sales_order_items%ROWTYPE;
  v_qty_after NUMERIC;
  v_items_count INTEGER := 0;
BEGIN
  -- 1. Auftrag laden und sperren
  SELECT * INTO v_order
  FROM sales_orders
  WHERE id = p_order_id AND status = 'draft'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Auftrag nicht gefunden oder bereits verarbeitet: ' || p_order_id
    );
  END IF;

  -- 2. Alle Positionen verarbeiten
  FOR v_item IN
    SELECT * FROM sales_order_items
    WHERE sales_order_id = p_order_id
  LOOP
    v_items_count := v_items_count + 1;

    -- Bestand prüfen und atomisch abbuchen
    UPDATE stock_items
    SET quantity = quantity - v_item.quantity,
        updated_at = NOW()
    WHERE product_id = v_item.product_id
      AND location_id = v_order.location_id
      AND quantity >= v_item.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Unzureichender Bestand für Produkt % am Standort %',
        v_item.product_id, v_order.location_id;
    END IF;

    -- Bestand nach Abbuchung
    SELECT quantity INTO v_qty_after
    FROM stock_items
    WHERE product_id = v_item.product_id
      AND location_id = v_order.location_id;

    -- Stock Ledger buchen
    INSERT INTO stock_ledger (
      product_id, location_id, entry_type, quantity,
      balance_after, reference_id, reference_type, unit_price, user_id
    ) VALUES (
      v_item.product_id, v_order.location_id,
      'sale', -v_item.quantity,
      COALESCE(v_qty_after, 0), p_order_id, 'sale', v_item.unit_price, p_user_id
    );
  END LOOP;

  -- 3. Customer Log erstellen (wenn Kunde vorhanden)
  IF v_order.customer_id IS NOT NULL THEN
    INSERT INTO customer_logs (
      customer_id, action_type, description, reference_id, user_id
    ) VALUES (
      v_order.customer_id,
      'sale',
      'Verkauf bestätigt: Auftrag ' || v_order.order_number || ' | Betrag: ' ||
        to_char(v_order.total_amount, 'FM99999990.00') || ' EUR',
      p_order_id,
      p_user_id
    );
  END IF;

  -- 4. Auftrag bestätigen
  UPDATE sales_orders
  SET status = 'confirmed',
      updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'order_number', v_order.order_number,
    'items_processed', v_items_count
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ANALYTICS VIEWS
-- ============================================================

-- Produkt-Umsatz-Übersicht
CREATE OR REPLACE VIEW v_product_sales_summary AS
SELECT
  p.id                                              AS product_id,
  p.name                                            AS product_name,
  p.sku,
  cat.name                                          AS category,
  p.purchase_price,
  p.selling_price,
  COUNT(DISTINCT so.id)                             AS order_count,
  COALESCE(SUM(soi.quantity), 0)                    AS total_qty_sold,
  COALESCE(SUM(soi.total_price), 0)                 AS total_revenue,
  COALESCE(SUM(soi.total_price - (p.purchase_price * soi.quantity)), 0) AS total_profit,
  CASE WHEN COALESCE(SUM(soi.total_price), 0) > 0
    THEN ROUND(
      (COALESCE(SUM(soi.total_price - (p.purchase_price * soi.quantity)), 0) /
       COALESCE(SUM(soi.total_price), 1)) * 100, 2)
    ELSE 0
  END                                               AS profit_margin_pct
FROM products p
LEFT JOIN categories cat ON cat.id = p.category_id
LEFT JOIN sales_order_items soi ON soi.product_id = p.id
LEFT JOIN sales_orders so ON so.id = soi.sales_order_id
  AND so.status NOT IN ('cancelled', 'draft')
WHERE p.is_active = TRUE
GROUP BY p.id, p.name, p.sku, cat.name, p.purchase_price, p.selling_price;

-- Kunden-Übersicht
CREATE OR REPLACE VIEW v_customer_summary AS
SELECT
  c.id                                              AS customer_id,
  c.company_name,
  c.contact_person,
  c.phone,
  c.city,
  c.customer_type,
  c.discount_pct,
  COUNT(DISTINCT so.id)                             AS total_orders,
  COALESCE(SUM(so.total_amount), 0)                 AS total_revenue,
  MAX(so.created_at)                                AS last_order_date,
  EXTRACT(DAY FROM (NOW() - MAX(so.created_at)))    AS days_since_last_order,
  COALESCE(SUM(CASE WHEN so.payment_status = 'pending' THEN so.total_amount ELSE 0 END), 0) AS open_amount
FROM customers c
LEFT JOIN sales_orders so ON so.customer_id = c.id
  AND so.status NOT IN ('cancelled', 'draft')
WHERE c.is_active = TRUE
GROUP BY c.id, c.company_name, c.contact_person, c.phone, c.city, c.customer_type, c.discount_pct;

-- Bestandswarnungen (Mindestbestand unterschritten)
CREATE OR REPLACE VIEW v_stock_alerts AS
SELECT
  si.location_id,
  l.name                                            AS location_name,
  l.type                                            AS location_type,
  si.product_id,
  p.name                                            AS product_name,
  p.sku,
  p.unit,
  si.quantity                                       AS current_stock,
  COALESCE(si.min_stock, p.min_stock)               AS threshold,
  CASE
    WHEN si.quantity = 0                                         THEN 'out_of_stock'
    WHEN si.quantity <= COALESCE(si.min_stock, p.min_stock)     THEN 'low_stock'
    ELSE 'ok'
  END                                               AS stock_status
FROM stock_items si
JOIN products p ON p.id = si.product_id
JOIN locations l ON l.id = si.location_id
WHERE p.is_active = TRUE
  AND l.is_active = TRUE
  AND si.quantity <= COALESCE(si.min_stock, p.min_stock);

-- Fahrzeug-Performance
CREATE OR REPLACE VIEW v_location_performance AS
SELECT
  lo.id                                             AS location_id,
  lo.name                                           AS location_name,
  lo.type,
  COUNT(DISTINCT so.id)                             AS total_orders,
  COALESCE(SUM(so.total_amount), 0)                 AS total_revenue,
  COUNT(DISTINCT so.customer_id)                    AS unique_customers,
  COUNT(DISTINCT st.id)                             AS total_transfers_received
FROM locations lo
LEFT JOIN sales_orders so ON so.location_id = lo.id
  AND so.status NOT IN ('cancelled', 'draft')
LEFT JOIN stock_transfers st ON st.to_location_id = lo.id
  AND st.status = 'confirmed'
WHERE lo.is_active = TRUE
GROUP BY lo.id, lo.name, lo.type;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_ledger         ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_logs        ENABLE ROW LEVEL SECURITY;

-- Helper Function: Aktuelle User-Rolle abrufen
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper Function: Ist aktueller User Admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES RLS
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid() OR is_admin());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid() OR is_admin());

CREATE POLICY "profiles_admin_insert" ON profiles
  FOR INSERT WITH CHECK (is_admin());

-- LOCATIONS RLS (alle authentifizierten User können lesen)
CREATE POLICY "locations_select_authenticated" ON locations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "locations_admin_write" ON locations
  FOR ALL USING (is_admin());

-- CATEGORIES RLS
CREATE POLICY "categories_select_authenticated" ON categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "categories_admin_write" ON categories
  FOR ALL USING (is_admin());

-- PRODUCTS RLS
CREATE POLICY "products_select_authenticated" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "products_admin_write" ON products
  FOR ALL USING (is_admin());

-- STOCK ITEMS RLS
CREATE POLICY "stock_items_select_authenticated" ON stock_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "stock_items_admin_write" ON stock_items
  FOR ALL USING (is_admin());

-- STOCK LEDGER RLS (nur lesen für alle; schreiben nur durch SECURITY DEFINER functions)
CREATE POLICY "stock_ledger_select_authenticated" ON stock_ledger
  FOR SELECT USING (auth.role() = 'authenticated');

-- STOCK TRANSFERS RLS
CREATE POLICY "transfers_select_authenticated" ON stock_transfers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "transfers_insert_authenticated" ON stock_transfers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "transfers_update_own_or_admin" ON stock_transfers
  FOR UPDATE USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "transfers_items_select" ON stock_transfer_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "transfers_items_insert" ON stock_transfer_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "transfers_items_delete_draft" ON stock_transfer_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM stock_transfers st
      WHERE st.id = stock_transfer_id
        AND st.status = 'draft'
        AND (st.user_id = auth.uid() OR is_admin())
    )
  );

-- CUSTOMERS RLS
CREATE POLICY "customers_select_authenticated" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "customers_admin_write" ON customers
  FOR ALL USING (is_admin());

CREATE POLICY "customers_driver_insert" ON customers
  FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'driver'));

-- SALES ORDERS RLS
CREATE POLICY "sales_orders_select" ON sales_orders
  FOR SELECT USING (
    is_admin() OR user_id = auth.uid()
  );

CREATE POLICY "sales_orders_insert_authenticated" ON sales_orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "sales_orders_update_own_or_admin" ON sales_orders
  FOR UPDATE USING (user_id = auth.uid() OR is_admin());

-- SALES ORDER ITEMS RLS
CREATE POLICY "sales_order_items_select" ON sales_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales_orders so
      WHERE so.id = sales_order_id
        AND (so.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "sales_order_items_insert" ON sales_order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales_orders so
      WHERE so.id = sales_order_id
        AND so.status = 'draft'
        AND (so.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "sales_order_items_delete_draft" ON sales_order_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM sales_orders so
      WHERE so.id = sales_order_id
        AND so.status = 'draft'
        AND (so.user_id = auth.uid() OR is_admin())
    )
  );

-- CUSTOMER LOGS RLS
CREATE POLICY "customer_logs_select_authenticated" ON customer_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "customer_logs_insert_authenticated" ON customer_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA: Initiale Standorte
-- ============================================================
INSERT INTO locations (name, type, description) VALUES
  ('Hauptdepot', 'depot',   'Hauptlager und Ausgangspunkt aller Umlagerungen'),
  ('Fahrzeug 1', 'vehicle', 'Lieferfahrzeug 1 – mobiler Verkaufspunkt'),
  ('Fahrzeug 2', 'vehicle', 'Lieferfahrzeug 2 – mobiler Verkaufspunkt')
ON CONFLICT (name) DO NOTHING;

-- Beispiel-Kategorien
INSERT INTO categories (name, description, color) VALUES
  ('Getränke',      'Flüssigkeiten, Wasser, Säfte, Softdrinks', '#3b82f6'),
  ('Lebensmittel',  'Haltbare Lebensmittel und Trockenwaren',    '#22c55e'),
  ('Reinigung',     'Reinigungsmittel und Hygieneartikel',       '#f59e0b'),
  ('Sonstiges',     'Verschiedene Artikel',                      '#8b5cf6')
ON CONFLICT (name) DO NOTHING;
