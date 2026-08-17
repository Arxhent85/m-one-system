import json
import openpyxl

# 1. Load exact commission rates from Provision.xlsx
wb = openpyxl.load_workbook('Aktuelle daten/Provision.xlsx')
sheet = wb.active
rates = {}
for r in list(sheet.iter_rows(values_only=True))[1:]:
    if r[0] is not None and r[1] is not None:
        sku = str(int(r[0])) if isinstance(r[0], (int, float)) else str(r[0]).strip()
        rates[sku] = round(float(r[1]), 4)

with open('lib/commissionRates.json', 'w', encoding='utf-8') as f:
    json.dump(rates, f, indent=2)

print(f"✅ Loaded {len(rates)} exact commission rates from Provision.xlsx into lib/commissionRates.json")

# 2. Strict Driver Attribution Function
def get_driver_strict(cust_number_raw):
    """
    STRIKTE ZUORDNUNG:
    - Beginnt die Kundennummer (nach Bereinigung von Bindestrichen/Leerzeichen/führender 0) mit '1' -> 100% Fahrer Qerimi
    - Beginnt die Kundennummer mit '2' -> 100% Fahrer Mensuri
    - Alles andere (z.B. '4', 'blq') -> Zentrale / Büro (keine Fahrerprovision)
    """
    if not cust_number_raw:
        return 'Zentrale'
    c = str(cust_number_raw).strip().replace('-', '').replace(' ', '').replace('.', '')
    if c.startswith('0'):
        c = c[1:]
    if c.startswith('1'):
        return 'Qerimi'
    elif c.startswith('2'):
        return 'Mensuri'
    return 'Zentrale'

with open('lib/mock2026Sales.json', 'r', encoding='utf-8') as f:
    sales = json.load(f)

stats = {
    'Mensuri': {'comm': 0.0, 'pieces': 0, 'orders': 0, 'volume': 0.0},
    'Qerimi': {'comm': 0.0, 'pieces': 0, 'orders': 0, 'volume': 0.0},
    'Zentrale': {'comm': 0.0, 'pieces': 0, 'orders': 0, 'volume': 0.0}
}

monthly = {}

for s in sales:
    cust = s.get('customer_number') or s.get('customerNumber') or ''
    driver = get_driver_strict(cust)
    date = (s.get('created_at') or s.get('date') or '2026-01-01')[:7]
    
    if date not in monthly:
        monthly[date] = {
            'Mensuri': {'comm': 0.0, 'pieces': 0, 'orders': 0, 'volume': 0.0},
            'Qerimi': {'comm': 0.0, 'pieces': 0, 'orders': 0, 'volume': 0.0},
            'Zentrale': {'comm': 0.0, 'pieces': 0, 'orders': 0, 'volume': 0.0}
        }
        
    order_comm = 0.0
    order_pieces = 0
    for it in s.get('items', []):
        sku = str(it.get('sku') or '').strip()
        qty = float(it.get('qty', 1) or 1)
        r = rates.get(sku, 0.0)
        order_comm += qty * r
        order_pieces += qty
        
    vol = float(s.get('total_amount', 0) or 0)
    
    stats[driver]['comm'] += order_comm
    stats[driver]['pieces'] += order_pieces
    stats[driver]['orders'] += 1
    stats[driver]['volume'] += vol
    
    monthly[date][driver]['comm'] += order_comm
    monthly[date][driver]['pieces'] += order_pieces
    monthly[date][driver]['orders'] += 1
    monthly[date][driver]['volume'] += vol

print("\n=== GESAMT 2026 (STRIKT NACH KUNDENNUMMER 1 = Qerimi, 2 = Mensuri) ===")
for d in ['Mensuri', 'Qerimi', 'Zentrale']:
    v = stats[d]
    print(f"{d:>8}: {v['comm']:>9.2f} EUR Provision | {v['pieces']:>7,.0f} Stk | {v['orders']:>4} Fakturen | {v['volume']:>10.2f} EUR Umsatz")

print(f"FAHRER PROVISION GESAMT (Mensuri + Qerimi): {stats['Mensuri']['comm'] + stats['Qerimi']['comm']:,.2f} EUR")

print("\n=== MONATLICHE LOHNABRECHNUNG (1. bis Monatsende) ===")
print("-" * 88)
for m in sorted(monthly.keys()):
    m_comm = monthly[m]['Mensuri']['comm']
    m_stk = monthly[m]['Mensuri']['pieces']
    q_comm = monthly[m]['Qerimi']['comm']
    q_stk = monthly[m]['Qerimi']['pieces']
    tot = m_comm + q_comm
    print(f"{m} | Mensuri (Kd 2xxxx): {m_comm:>8.2f} EUR ({m_stk:>5,.0f} Stk) | Qerimi (Kd 1xxxx): {q_comm:>8.2f} EUR ({q_stk:>5,.0f} Stk) | Auszahlung: {tot:>8.2f} EUR")
print("-" * 88)
