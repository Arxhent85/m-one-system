import json

with open('lib/mock2026Sales.json', 'r', encoding='utf-8') as f:
    sales = json.load(f)

mensuri_july_items = {}
mensuri_july_orders = 0
mensuri_july_vol = 0.0
mensuri_july_qty = 0

for s in sales:
    dt = s.get('date') or s.get('created_at', '')[:10]
    driver = s.get('driver_name', '')
    cust_no = str(s.get('customer_number', ''))
    
    if ('mensuri' in driver.lower() or cust_no.startswith('2')) and dt.startswith('2026-07'):
        mensuri_july_orders += 1
        mensuri_july_vol += float(s.get('total_amount') or 0)
        for it in s.get('items', []):
            sku = str(it.get('sku', '')).strip()
            qty = float(it.get('qty') or 0)
            rate = float(it.get('rate') or 0)
            mensuri_july_qty += qty
            if sku not in mensuri_july_items:
                mensuri_july_items[sku] = {'name': it.get('name'), 'qty': 0, 'rate': rate, 'commission': 0.0}
            mensuri_july_items[sku]['qty'] += qty
            mensuri_july_items[sku]['commission'] += qty * rate

total_comm = sum(x['commission'] for x in mensuri_july_items.values())
print(f'Mensuri July 2026:')
print(f'  Orders: {mensuri_july_orders}')
print(f'  Volume: {mensuri_july_vol:.2f} EUR')
print(f'  Pieces: {mensuri_july_qty}')
print(f'  Distinct SKUs: {len(mensuri_july_items)}')
print(f'  Total Commission: {total_comm:.2f} EUR')

print('\nAll distinct SKUs sorted:')
for sku, info in sorted(mensuri_july_items.items(), key=lambda x: (int(x[0]) if x[0].isdigit() else 999999, x[0])):
    n = info['name']
    q = info['qty']
    r = info['rate']
    c = info['commission']
    print(f'  {sku}: {n} | qty={q} | rate={r} | comm={c:.2f} EUR')
