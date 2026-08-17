import json

with open('lib/commissionRates.json', 'r', encoding='utf-8') as f:
    rates = json.load(f)

with open('lib/mock2026Sales.json', 'r', encoding='utf-8') as f:
    sales = json.load(f)

def get_driver(cust_raw):
    c = str(cust_raw or '').strip().replace('-', '').replace(' ', '').replace('.', '')
    if c.startswith('0'):
        c = c[1:]
    if c.startswith('1'):
        return 'Qerimi'
    elif c.startswith('2'):
        return 'Mensuri'
    return 'Zentrale'

july_mensuri = [s for s in sales if (s.get('created_at') or '')[:7] == '2026-07' and get_driver(s.get('customer_number')) == 'Mensuri']

print(f"July 2026 Mensuri Invoices: {len(july_mensuri)}")

items_map = {}
total_comm = 0
total_stk = 0

for s in july_mensuri:
    for it in s.get('items', []):
        sku = str(it.get('sku') or '').strip()
        qty = float(it.get('qty', 1) or 1)
        r = rates.get(sku, 0.0)
        c = qty * r
        total_comm += c
        total_stk += qty
        if sku not in items_map:
            items_map[sku] = {'sku': sku, 'name': it.get('name', 'Artikel'), 'qty': 0, 'rate': r, 'comm': 0.0}
        items_map[sku]['qty'] += qty
        items_map[sku]['comm'] += c

print(f"Total July Mensuri Commission: {total_comm:.2f} EUR ({total_stk:,.0f} Stk)")
print("\nTop 15 Items for Mensuri in July 2026:")
for sku, it in sorted(items_map.items(), key=lambda x: x[1]['comm'], reverse=True)[:15]:
    print(f"  {sku:>6} | {it['name']:<35} | {it['qty']:>6,.0f} Stk | {it['rate']:>4.2f} EUR/Stk | {it['comm']:>7.2f} EUR")

print(f"\nIst 20001 (BioBlic Universalreiniger) in Mensuris Juli-Liste? -> {'JA' if '20001' in items_map else 'NEIN (Erfolgreich entfernt, da Kunde ARBENI BIOBLIC 40003 ist)'}")
