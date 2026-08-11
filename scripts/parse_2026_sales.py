import os
import openpyxl
import sys

sys.stdout.reconfigure(encoding='utf-8')
folder = r'd:\M ONE SYSTEM APP\Aktuelle daten'

wb = openpyxl.load_workbook(os.path.join(folder, 'Daten 2026.xlsx'), data_only=True, read_only=True)
sheet = wb['Sheet1']

orders = []
total_revenue = 0
total_quantity = 0

for i, row in enumerate(sheet.iter_rows(min_row=5, values_only=True)):
    if not any(row): continue
    faktura, datum, wert, status, a, k_nr, k_name, art_nr, art_name, stueck, agent, pct = (row[j] if j < len(row) else None for j in range(12))
    
    if not k_name and not art_nr: continue
    
    c_name = str(k_name).replace("'", "''").strip() if k_name else 'Laufkunde'
    c_nr = str(int(k_nr)) if isinstance(k_nr, (int, float)) else (str(k_nr).strip() if k_nr else '10000')
    sku = str(int(art_nr)) if isinstance(art_nr, (int, float)) else (str(art_nr).strip() if art_nr else '')
    prod_name = str(art_name).replace("'", "''").strip() if art_name else ''
    
    try: val = float(wert) if wert is not None else 0.0
    except: val = 0.0
    
    try: qty = float(stueck) if stueck is not None else 1.0
    except: qty = 1.0
    
    date_str = str(datum)[:10] if datum else '2026-01-07'
    agent_str = str(agent).strip() if agent else 'Qerimi'
    
    total_revenue += val
    total_quantity += qty
    
    orders.append({
        'faktura': faktura,
        'datum': date_str,
        'wert': val,
        'k_nr': c_nr,
        'k_name': c_name,
        'sku': sku,
        'prod_name': prod_name,
        'qty': qty,
        'agent': agent_str
    })

wb.close()
print(f"Total Sales Lines Parsed: {len(orders)}")
print(f"Total 2026 Revenue: {total_revenue:.2f} €")
print(f"Total Units Sold: {total_quantity:.0f} Stk")
