import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('lib/mock2026Sales.json', 'r', encoding='utf-8') as f:
    sales = json.load(f)

arpo_sales = [s for s in sales if str(s.get('customer_number')) == '10240']
arpo_sales.sort(key=lambda s: s.get('date') or s.get('created_at') or '', reverse=True)

print(f"Anzahl Rechnungen für ARPO (10240): {len(arpo_sales)}")
for s in arpo_sales[:5]:
    dt = s.get('date') or s.get('created_at') or ''
    amt = s.get('total_amount', 0)
    nr = s.get('order_number')
    items = s.get('items', [])
    print(f"\nFaktura: {nr} | Datum: {dt} | Gesamtbetrag: {amt:.2f} € | Positionen: {len(items)}")
    for it in items:
        sku = it.get('sku')
        name = it.get('name')
        qty = it.get('qty')
        price = it.get('unit_price')
        tot = it.get('total')
        print(f"  • [{sku}] {name}: {qty} Stk. x {price:.2f} € = {tot:.2f} €")
