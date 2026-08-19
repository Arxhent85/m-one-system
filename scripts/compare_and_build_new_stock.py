import zipfile
import xml.etree.ElementTree as ET
import json
import os

def get_shared_strings(zf):
    if 'xl/sharedStrings.xml' not in zf.namelist():
        return []
    xml_content = zf.read('xl/sharedStrings.xml')
    root = ET.fromstring(xml_content)
    strings = []
    for elem in root.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
        text = ''.join([t.text for t in elem.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t') if t.text])
        strings.append(text)
    return strings

def parse_excel(filepath):
    rows = []
    with zipfile.ZipFile(filepath, 'r') as zf:
        shared_strings = get_shared_strings(zf)
        sheet_name = 'xl/worksheets/sheet1.xml'
        if sheet_name not in zf.namelist():
            sheets = [n for n in zf.namelist() if n.startswith('xl/worksheets/') and n.endswith('.xml')]
            if sheets:
                sheet_name = sheets[0]
        sheet_xml = zf.read(sheet_name)
        root = ET.fromstring(sheet_xml)
        for row in root.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            cells = row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c')
            vals = []
            for cell in cells:
                v = cell.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                t = cell.attrib.get('t', '')
                if v is not None and v.text is not None:
                    val = shared_strings[int(v.text)] if t == 's' else v.text
                    vals.append(str(val).strip())
                else:
                    vals.append('')
            if any(vals):
                rows.append(vals)
    return rows

def parse_depot(filepath):
    rows = parse_excel(filepath)
    stock_dict = {}
    for r in rows:
        if not r or len(r) < 3:
            continue
        raw_sku = r[0].replace('`', '').strip()
        if not raw_sku.isdigit():
            continue
        name = r[1].strip()
        # Find quantity: it is in index 2 (or the first numeric value after name)
        qty_str = r[2].strip()
        try:
            qty = int(float(qty_str))
        except ValueError:
            qty = 0
            for cell in r[2:]:
                try:
                    qty = int(float(cell))
                    break
                except ValueError:
                    pass
        stock_dict[raw_sku] = {
            'sku': raw_sku,
            'name': name,
            'qty': qty
        }
    return stock_dict

if __name__ == '__main__':
    mone_new = parse_depot('Aktuelle daten/DEPO MONE 2026 -2.xlsx')
    mensuri_new = parse_depot('Aktuelle daten/MENSURI depo 2.xlsx')
    qerimi_new = parse_depot('Aktuelle daten/QERIMI DEPO 2.xlsx')

    print(f"DEPO MONE 2026 -2: {len(mone_new)} items, total qty = {sum(x['qty'] for x in mone_new.values())}")
    print(f"MENSURI depo 2:    {len(mensuri_new)} items, total qty = {sum(x['qty'] for x in mensuri_new.values())}")
    print(f"QERIMI DEPO 2:     {len(qerimi_new)} items, total qty = {sum(x['qty'] for x in qerimi_new.values())}")

    all_skus = sorted(list(set(list(mone_new.keys()) + list(mensuri_new.keys()) + list(qerimi_new.keys()))))
    print(f"\nUNION OF ALL SKUs: {len(all_skus)} unique products")

    print("\nSKU    | MONE QTY | MENSURI QTY | QERIMI QTY | TOTAL | NAME")
    print("-" * 80)
    for sku in all_skus:
        m_qty = mone_new.get(sku, {}).get('qty', 0)
        men_qty = mensuri_new.get(sku, {}).get('qty', 0)
        q_qty = qerimi_new.get(sku, {}).get('qty', 0)
        name = mone_new.get(sku, {}).get('name') or mensuri_new.get(sku, {}).get('name') or qerimi_new.get(sku, {}).get('name')
        tot = m_qty + men_qty + q_qty
        print(f"{sku:<6} | {m_qty:>8} | {men_qty:>11} | {q_qty:>10} | {tot:>5} | {name}")
