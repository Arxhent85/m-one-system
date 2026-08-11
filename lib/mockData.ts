// ============================================================
// M ONE ERP — REAL 2026 COMPANY DATA
// Generiert aus: Daten 2026.xlsx, DEPO M ONE.xlsx, KUNDENLISTE 2026.xlsm
// ============================================================

export const MOCK_LOCATIONS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Hauptlager Depot (M-ONE)', type: 'depot', description: 'Zentrales Hauptlager', is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Fahrzeug 1 (Depo Mensuri)', type: 'vehicle', description: 'Lieferfahrzeug Mensuri', is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Fahrzeug 2 (Depo Qerimi)', type: 'vehicle', description: 'Lieferfahrzeug Qerimi', is_active: true, created_at: '2026-01-01T00:00:00Z' },
]

export const MOCK_CATEGORIES = [
  { id: 'cat-silikon', name: 'Silikon & Dichtstoffe', description: 'Sanitärsilikone & Acryl', color: '#6272f4', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-lacke', name: 'Farbe & Spruhlacke', description: 'Farbsprays & Grundierung', color: '#10b981', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-reiniger', name: 'Reinigung & Pflege', description: 'Bodenreiniger & Entfetter', color: '#f59e0b', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-kleber', name: 'Montage & Kleber', description: 'Profi Mont Dekor & Extreme', color: '#8b5cf6', created_at: '2026-01-01T00:00:00Z' },
]

export const MOCK_PRODUCTS = [
  {
    id: 'prod-35109',
    sku: '35109',
    name: 'M-ONE Sanitar Silikon Silbergrau',
    description: 'Sanitär Silikon hochwertige Dichtung 280ml',
    category_id: 'cat-silikon',
    unit: 'cope',
    purchase_price: 1.15,
    selling_price: 2.30,
    min_stock: 50,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    categories: MOCK_CATEGORIES[0],
  },
  {
    id: 'prod-35110',
    sku: '35110',
    name: 'M-ONE Sanitar Silikon transparent',
    description: 'Sanitär Silikon transparent 280ml',
    category_id: 'cat-silikon',
    unit: 'cope',
    purchase_price: 1.15,
    selling_price: 2.30,
    min_stock: 50,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    categories: MOCK_CATEGORIES[0],
  },
  {
    id: 'prod-54412',
    sku: '54412',
    name: 'M ONE Bremsen&Teile Reininger 500 ml',
    description: 'Effektiver Entfetter & Bremsenreiniger',
    category_id: 'cat-reiniger',
    unit: 'cope',
    purchase_price: 1.15,
    selling_price: 2.30,
    min_stock: 100,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    categories: MOCK_CATEGORIES[2],
  },
  {
    id: 'prod-49644',
    sku: '49644',
    name: 'M ONE Rostlöser 400 ml',
    description: 'Rostlöser Spray 400ml',
    category_id: 'cat-reiniger',
    unit: 'cope',
    purchase_price: 1.00,
    selling_price: 2.00,
    min_stock: 100,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    categories: MOCK_CATEGORIES[2],
  },
  {
    id: 'prod-31819',
    sku: '31819',
    name: 'LACK FUERROT 400 ML',
    description: 'Sprühlack Feuerrot 400ml',
    category_id: 'cat-lacke',
    unit: 'cope',
    purchase_price: 1.50,
    selling_price: 3.00,
    min_stock: 50,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    categories: MOCK_CATEGORIES[1],
  },
]

export const MOCK_STOCK_ALERTS = [
  {
    location_id: '22222222-2222-2222-2222-222222222222',
    location_name: 'Fahrzeug 1 (Depo Mensuri)',
    location_type: 'vehicle',
    product_id: 'prod-29802',
    product_name: 'M ONE Handwaschpaste 500 ml',
    sku: '29802',
    unit: 'cope',
    current_stock: 8,
    threshold: 20,
    stock_status: 'low_stock',
  },
  {
    location_id: '33333333-3333-3333-3333-333333333333',
    location_name: 'Fahrzeug 2 (Depo Qerimi)',
    location_type: 'vehicle',
    product_id: 'prod-31818',
    product_name: 'M ONE LACK ANTHRAZIT 400 ML',
    sku: '31818',
    unit: 'cope',
    current_stock: 6,
    threshold: 15,
    stock_status: 'low_stock',
  },
]

export const MOCK_ORDERS: any[] = []


export const MOCK_CUSTOMERS = [
  {
    customer_id: 'cust-40003',
    customer_number: '40003',
    company_name: 'ARBENI BIOBLIC',
    city: 'PRISHTINE',
    customer_type: 'regular',
    discount_pct: 0,
    total_orders: 77,
    total_revenue: 6104.55,
    days_since_last_order: 2,
    open_amount: 0,
  },
  {
    customer_id: 'cust-20307',
    customer_number: '20307',
    company_name: 'CONDOR',
    city: 'RAHOVEC',
    customer_type: 'regular',
    discount_pct: 0,
    total_orders: 114,
    total_revenue: 5049.50,
    days_since_last_order: 3,
    open_amount: 0,
  },
  {
    customer_id: 'cust-10240',
    customer_number: '10240',
    company_name: 'ARPO',
    city: 'PRISHTINE',
    customer_type: 'regular',
    discount_pct: 0,
    total_orders: 82,
    total_revenue: 4493.20,
    days_since_last_order: 3,
    open_amount: 0,
  },
]

export const MOCK_PRODUCT_SUMMARY: any[] = []


export const MOCK_LOCATION_PERFORMANCE = [
  {
    location_id: '11111111-1111-1111-1111-111111111111',
    location_name: 'Hauptlager Depot (M-ONE)',
    type: 'depot',
    total_orders: 1450,
    total_revenue: 95400.00,
    unique_customers: 240,
    total_transfers_received: 0,
  },
  {
    location_id: '22222222-2222-2222-2222-222222222222',
    location_name: 'Fahrzeug 1 (Depo Mensuri)',
    type: 'vehicle',
    total_orders: 1280,
    total_revenue: 58400.00,
    unique_customers: 171,
    total_transfers_received: 45,
  },
  {
    location_id: '33333333-3333-3333-3333-333333333333',
    location_name: 'Fahrzeug 2 (Depo Qerimi)',
    type: 'vehicle',
    total_orders: 1267,
    total_revenue: 41814.45,
    unique_customers: 267,
    total_transfers_received: 38,
  },
]
