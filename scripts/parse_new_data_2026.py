import openpyxl
import json
from datetime import datetime

wb = openpyxl.load_workbook('Aktuelle daten/NEW DATA 2026.xlsx', data_only=True)
sheet = wb['Tabelle1']
rows = list(sheet.iter_rows(values_only=True))[4:]

print(f"Total rows in sheet: {len(rows)}")

orders = []
current_order = None

for idx, r in enumerate(rows):
    if all(c is None for c in r):
        continue
    
    fak = r[0]
    dt = r[1]
    val = r[2]
    cust_nr = r[5]
    cust_name = r[6]
    sku = r[7]
    art_name = r[8]
    qty = r[9]
    agent = r[10]
    rate = r[11]
    
    # Check if this row is the start of a new invoice
    # In Excel, a new invoice row has Wert (val) is not None, or date/fak is present
    is_new = (val is not None)
    
    if is_new or current_order is None:
        if current_order:
            orders.append(current_order)
            
        dt_str = dt.isoformat() if isinstance(dt, datetime) else str(dt or '')
        if not dt_str and current_order and current_order.get('date'):
            dt_str = current_order['date']
            
        current_order = {
            'order_number': f"FK-2026-{len(orders)+1:04d}",
            'invoice_ref': str(fak or '').strip(),
            'date': dt_str,
            'created_at': dt_str,
            'total_amount': float(val) if val is not None else 0.0,
            'customer_number': str(cust_nr or '').strip(),
            'customer_name': str(cust_name or fak or '').strip(),
            'agent': str(agent or '').strip(),
            'items': []
        }
    
    if current_order:
        current_order['items'].append({
            'sku': str(sku).strip() if sku is not None else '',
            'name': str(art_name).strip() if art_name is not None else 'Artikel',
            'qty': float(qty) if qty is not None else 1.0,
            'rate': float(rate) if rate is not None else 0.0,
            'unit_price': 0.0
        })

if current_order:
    orders.append(current_order)

print(f"Total parsed orders: {len(orders)}")
total_line_items = sum(len(o['items']) for o in orders)
print(f"Total line items: {total_line_items}")
total_qty = sum(sum(it['qty'] for it in o['items']) for o in orders)
print(f"Total quantity: {total_qty:,.0f} Stück")
total_sales_volume = sum(o['total_amount'] for o in orders)
print(f"Total sales volume: {total_sales_volume:,.2f} EUR")

# Check date range
dates = [o['date'][:10] for o in orders if o.get('date')]
if dates:
    print(f"Date range: {min(dates)} to {max(dates)}")

# Check Driver breakdown
def get_driver_strict(cust_raw, agent_raw):
    c = str(cust_raw or '').strip().replace('-', '').replace(' ', '').replace('.', '')
    if c.startswith('0'):
        c = c[1:]
    if c.startswith('1'):
        return 'Qerimi'
    elif c.startswith('2'):
        return 'Mensuri'
    ag = str(agent_raw or '').lower()
    if 'qerimi' in ag:
        return 'Qerimi'
    if 'mensuri' in ag:
        return 'Mensuri'
    return 'Zentrale'

stats = {'Mensuri': {'comm': 0.0, 'pieces': 0, 'orders': 0, 'volume': 0.0},
         'Qerimi': {'comm': 0.0, 'pieces': 0, 'orders': 0, 'volume': 0.0},
         'Zentrale': {'comm': 0.0, 'pieces': 0, 'orders': 0, 'volume': 0.0}}

monthly = {}

for o in orders:
    driver = get_driver_strict(o['customer_number'], o['agent'])
    m_key = o['date'][:7] if o['date'] else '2026-01'
    if m_key not in monthly:
        monthly[m_key] = {'Mensuri': {'comm': 0.0, 'pieces': 0},
                          'Qerimi': {'comm': 0.0, 'pieces': 0},
                          'Zentrale': {'comm': 0.0, 'pieces': 0}}
    
    order_comm = sum(it['qty'] * it['rate'] for it in o['items'])
    order_pieces = sum(it['qty'] for it in o['items'])
    
    stats[driver]['comm'] += order_comm
    stats[driver]['pieces'] += order_pieces
    stats[driver]['orders'] += 1
    stats[driver]['volume'] += o['total_amount']
    
    monthly[m_key][driver]['comm'] += order_comm
    monthly[m_key][driver]['pieces'] += order_pieces

print("\n=== SUMMARY NEW DATA 2026 ===")
for d, v in stats.items():
    print(f"{d:>8}: {v['comm']:>10.2f} EUR Provision | {v['pieces']:>7,.0f} Stk | {v['orders']:>5} Fakturen | {v['volume']:>12,.2f} EUR")

print("\n=== MONTHLY BREAKDOWN (Januar - August 2026) ===")
for m in sorted(monthly.keys()):
    m_val = monthly[m]['Mensuri']['comm']
    m_stk = monthly[m]['Mensuri']['pieces']
    q_val = monthly[m]['Qerimi']['comm']
    q_stk = monthly[m]['Qerimi']['pieces']
    tot = m_val + q_val
    print(f"{m} | Mensuri: {m_val:>8.2f} EUR ({m_stk:>5,.0f} Stk) | Qerimi: {q_val:>8.2f} EUR ({q_stk:>5,.0f} Stk) | Auszahlung: {tot:>8.2f} EUR")
