import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('lib/mock2026Sales.json', 'r', encoding='utf-8') as f:
    sales = json.load(f)

for target_month in ['2026-07', '2026-08', '2026-06']:
    print(f"\n====================== MONAT {target_month} ======================")
    for target_driver in ['Mensuri', 'Qerimi']:
        total_comm = 0.0
        total_qty = 0.0
        total_vol = 0.0
        orders_count = 0
        skus = {}
        for s in sales:
            dt = s.get('date') or s.get('created_at', '')[:10]
            d = s.get('driver_name', '')
            cust = str(s.get('customer_number', ''))
            
            driver = 'Qerimi' if ('qerimi' in d.lower() or cust.startswith('1')) else ('Mensuri' if ('mensuri' in d.lower() or cust.startswith('2')) else 'Zentrale')
            if driver == target_driver and dt.startswith(target_month):
                orders_count += 1
                total_vol += float(s.get('total_amount') or 0)
                for it in s.get('items', []):
                    sku = str(it.get('sku', '')).strip()
                    qty = float(it.get('qty') or 0)
                    rate = float(it.get('rate') or 0)
                    total_qty += qty
                    if sku not in skus:
                        skus[sku] = {'name': it.get('name'), 'qty': 0, 'rate': rate, 'comm': 0.0}
                    skus[sku]['qty'] += qty
                    skus[sku]['comm'] += qty * rate
        
        comm = sum(x['comm'] for x in skus.values())
        fix_salary = 137.50
        total_salary = comm + fix_salary
        print(f"Fahrer: {target_driver}")
        print(f"  Fakturen: {orders_count}")
        print(f"  Verkaufsvolumen: {total_vol:.2f} €")
        print(f"  Verkaufte Stückzahl: {total_qty:.0f} Stk.")
        print(f"  Anzahl Positionen: {len(skus)}")
        print(f"  1. Stück-Provision: {comm:.2f} €")
        print(f"  2. Fixlohn Basis: {fix_salary:.2f} €")
        print(f"  -> TOTALER LOHN (Auszahlung): {total_salary:.2f} €")
