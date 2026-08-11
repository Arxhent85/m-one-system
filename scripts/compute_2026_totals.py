import os
import openpyxl
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')
folder = r'd:\M ONE SYSTEM APP\Aktuelle daten'

wb = openpyxl.load_workbook(os.path.join(folder, 'Daten 2026.xlsx'), data_only=True, read_only=True)
sheet = wb['Sheet1']

prod_totals = {}  # sku -> {name, qty, revenue}
cust_totals = {}  # c_name -> {c_nr, qty, revenue, count}
recent_orders = []

for i, row in enumerate(sheet.iter_rows(min_row=5, values_only=True)):
    if not any(row): continue
    faktura, datum, wert, status, a, k_nr, k_name, art_nr, art_name, stueck, agent, pct = (row[j] if j < len(row) else None for j in range(12))
    
    if not k_name and not art_nr: continue
    
    c_name = str(k_name).replace("'", "''").strip() if k_name else 'Laufkunde'
    c_nr = str(int(k_nr)) if isinstance(k_nr, (int, float)) else (str(k_nr).strip() if k_nr else '10000')
    sku = str(int(art_nr)) if isinstance(art_nr, (int, float)) else (str(art_nr).strip() if art_nr else '')
    p_name = str(art_name).replace("'", "''").strip() if art_name else ''
    
    try: val = float(wert) if wert is not None else 0.0
    except: val = 0.0
    
    try: qty = float(stueck) if stueck is not None else 1.0
    except: qty = 1.0
    
    date_str = str(datum)[:10] if datum else '2026-01-07'
    agent_str = str(agent).strip() if agent else 'Qerimi'
    
    if sku:
        if sku not in prod_totals:
            prod_totals[sku] = {'name': p_name, 'qty': 0, 'revenue': 0}
        prod_totals[sku]['qty'] += qty
        prod_totals[sku]['revenue'] += val
        
    if c_name:
        if c_name not in cust_totals:
            cust_totals[c_name] = {'c_nr': c_nr, 'qty': 0, 'revenue': 0, 'count': 0}
        cust_totals[c_name]['qty'] += qty
        cust_totals[c_name]['revenue'] += val
        cust_totals[c_name]['count'] += 1
        
    if len(recent_orders) < 50:
        recent_orders.append({
            'faktura': str(faktura) if faktura else f'FK-2026-{len(recent_orders)+1:04d}',
            'datum': date_str,
            'wert': val,
            'k_nr': c_nr,
            'k_name': c_name,
            'sku': sku,
            'prod_name': p_name,
            'qty': qty,
            'agent': agent_str
        })

wb.close()

sorted_prods = sorted(prod_totals.items(), key=lambda x: x[1]['revenue'], reverse=True)
sorted_custs = sorted(cust_totals.items(), key=lambda x: x[1]['revenue'], reverse=True)

print("Top 5 Products by 2026 Revenue:")
for sku, data in sorted_prods[:5]:
    print(f"  SKU {sku}: {data['name']} -> {data['revenue']:.2f} € ({data['qty']:.0f} Stk)")

print("\nTop 5 Customers by 2026 Revenue:")
for c_name, data in sorted_custs[:5]:
    print(f"  [{data['c_nr']}] {c_name} -> {data['revenue']:.2f} € ({data['count']} Käufe)")
