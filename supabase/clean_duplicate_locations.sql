-- ============================================================
-- CLEANUP: NUR DIE 3 OFFIZIELLEN STANDORTE BEHALTEN
-- Hauptlager Depot (M-ONE), Fahrzeug 1 (Depo Mensuri), Fahrzeug 2 (Depo Qerimi)
-- ============================================================

-- 1. Verweise in stock_items und sales_orders loeschen, die auf alte Test-Standorte zeigen
DELETE FROM stock_items 
WHERE location_id NOT IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

UPDATE sales_orders 
SET location_id = '22222222-2222-2222-2222-222222222222'
WHERE location_id NOT IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

-- 2. Alte Test-Standorte aus der locations Tabelle loeschen
DELETE FROM locations 
WHERE id NOT IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

-- 3. Sicherstellen, dass die 3 offiziellen Standorte exakt heissen
INSERT INTO locations (id, name, type, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Hauptlager Depot (M-ONE)', 'depot', 'Zentrales Hauptlager'),
  ('22222222-2222-2222-2222-222222222222', 'Fahrzeug 1 (Depo Mensuri)', 'vehicle', 'Lieferfahrzeug Mensuri'),
  ('33333333-3333-3333-3333-333333333333', 'Fahrzeug 2 (Depo Qerimi)', 'vehicle', 'Lieferfahrzeug Qerimi')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type;
