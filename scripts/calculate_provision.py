import json
import openpyxl

wb = openpyxl.load_workbook('Aktuelle daten/Provision.xlsx')
sheet = wb.active
rates = {}
for r in list(sheet.iter_rows(values_only=True))[1:]:
    if r[0] is not None and r[1] is not None:
        sku = str(int(r[0])) if isinstance(r[0], (int, float)) else str(r[0]).strip()
        rates[sku] = round(float(r[1]), 4)

with open('lib/commissionRates.json', 'w', encoding='utf-8') as f:
    json.dump(rates, f, indent=2)
print(f"✅ Saved {len(rates)} commission rates to lib/commissionRates.json")

with open('lib/mock2026Sales.json', 'r', encoding='utf-8') as f:
    sales = json.load(f)

mensuri_comm = 0.0
qerimi_comm = 0.0
mensuri_qty = 0
qerimi_qty = 0
monthly = {}

for s in sales:
    cust = str(s.get('customer_number') or '')
    driver = s.get('driver_name') or ('Mensuri' if cust.startswith('2') else 'Qerimi')
    date = (s.get('created_at') or '2026-01-01')[:7]
    c = 0.0
    total_q = 0
    for it in s.get('items', []):
        sku = str(it.get('sku') or '').strip()
        qty = float(it.get('qty', 1) or 1)
        r = rates.get(sku, 0.0)
        c += qty * r
        total_q += qty

    is_mensuri = 'mensuri' in driver.lower() or cust.startswith('2')
    if is_mensuri:
        mensuri_comm += c
        mensuri_qty += total_q
    else:
        qerimi_comm += c
        qerimi_qty += total_q

    if date not in monthly:
        monthly[date] = {'mensuri': 0.0, 'qerimi': 0.0, 'total': 0.0, 'mensuri_qty': 0, 'qerimi_qty': 0}
    if is_mensuri:
        monthly[date]['mensuri'] += c
        monthly[date]['mensuri_qty'] += total_q
    else:
        monthly[date]['qerimi'] += c
        monthly[date]['qerimi_qty'] += total_q
    monthly[date]['total'] += c

print(f"MENSURI TOTAL: {mensuri_comm:.2f} € ({mensuri_qty:,} Stück)")
print(f"QERIMI TOTAL: {qerimi_comm:.2f} € ({qerimi_qty:,} Stück)")
print(f"GESAMT PROVISION: {mensuri_comm + qerimi_comm:.2f} € ({mensuri_qty + qerimi_qty:,} Stück)")
print("\n--- MONATLICHE AUFSCHLÜSSELUNG ---")
for k in sorted(monthly.keys()):
    v = monthly[k]
    m_eur = v['mensuri']
    q_eur = v['qerimi']
    tot = v['total']
    print(f"{k}: Mensuri = {m_eur:>8.2f} € ({v['mensuri_qty']} Stk) | Qerimi = {q_eur:>8.2f} € ({v['qerimi_qty']} Stk) | Gesamt = {tot:>8.2f} €")
