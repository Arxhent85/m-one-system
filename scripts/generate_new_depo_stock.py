import zipfile
import xml.etree.ElementTree as ET
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

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
        qty = 0
        for cell in r[2:]:
            try:
                qty = int(round(float(cell)))
                break
            except ValueError:
                pass
        stock_dict[raw_sku] = {
            'sku': raw_sku,
            'name': name,
            'qty': qty
        }
    return stock_dict

# Read existing prices and names from lib/stockStore.ts
with open('lib/stockStore.ts', 'r', encoding='utf-8') as f:
    text = f.read()

existing_meta = {}
for line in text.splitlines():
    if 'sku:' in line and 'selling_price:' in line:
        m_sku = re.search(r"sku:\s*['\"]([^'\"]+)['\"]", line)
        m_name = re.search(r"name:\s*['\"]([^'\"]+)['\"]", line)
        m_pur = re.search(r"purchase_price:\s*([0-9.]+)", line)
        m_sel = re.search(r"selling_price:\s*([0-9.]+)", line)
        if m_sku:
            sku = m_sku.group(1)
            existing_meta[sku] = {
                'name': m_name.group(1) if m_name else '',
                'purchase_price': float(m_pur.group(1)) if m_pur else 1.50,
                'selling_price': float(m_sel.group(1)) if m_sel else 3.00,
            }

mone_new = parse_depot('Aktuelle daten/DEPO MONE 2026 -2.xlsx')
mensuri_new = parse_depot('Aktuelle daten/MENSURI depo 2.xlsx')
qerimi_new = parse_depot('Aktuelle daten/QERIMI DEPO 2.xlsx')

all_skus = sorted(list(set(list(mone_new.keys()) + list(mensuri_new.keys()) + list(qerimi_new.keys()))), key=lambda x: (int(x) if x.isdigit() else 999999, x))

print(f"Total Unique SKUs: {len(all_skus)}")

# Known names mapping for clean product descriptions
CLEAN_NAMES = {
    '11000': 'Bodenreiniger 4 Ltr',
    '12000': 'BAU CLEAN 4L',
    '16936': 'FELGENSILBER 400 ML',
    '17101': 'KÜHLERREINIGER 400 ML',
    '26736': 'HAFTGRUND 400 ml',
    '30276': 'Bio Blic Antikalk 750 ml',
    '31812': 'M-ONE LACK GELB',
    '31815': 'M-ONE LACK HELLGRAU',
    '31818': 'M ONE LACK ANTHRAZIT 400 ML',
    '31819': 'LACK FUERROT 400 ML',
    '31822': 'M-ONE GOLD SPRAY',
    '31824': 'M-ONE LACK BRAUN',
    '31827': 'M-ONE LACK GRUN',
    '31880': 'HAT LACK SCHWARZ 690°C 400 ML',
    '31903': 'M-ONE CHROM SPRAY 400 ML',
    '35108': 'M-ONE Sanitar Silikon Hellgrau',
    '35109': 'M-ONE Sanitar Silikon Silbergrau',
    '35110': 'M-ONE Sanitar Silikon transparent',
    '35111': 'M-ONE Sanitar Silikon Weiss',
    '35112': 'M-ONE Sanitar Silikon Schwarz',
    '35113': 'M-ONE Sanitar Silikon Bahamabeige',
    '35114': 'M-ONE Sanitar Silikon Braun',
    '35115': 'M-ONE Sanitar Silikon Grau',
    '35119': 'M-ONE Sanitar Silikon Jasemin',
    '35121': 'M-ONE Sanitar Silikon Manhatten',
    '35128': 'M-ONE Sanitar Silikon Anthrazit',
    '38136': 'KLARLACK 400 ML',
    '39505': 'M ONE Silikonspray 400ml',
    '44001': 'Fettspray 400ml',
    '49644': 'M ONE Rostlöser 400 ml',
    '50912': 'Universal Dichtung Schwarz',
    '51611': 'Universal Acryl 280 ml',
    '51612': 'Structural Acryl 280 ml',
    '51736': 'SCHWARZ GLANZED 400 ML',
    '51936': 'SCHWARZ MATT 400 ml',
    '54412': 'M ONE Bremsen&Teile Reiniger 500 ml',
    '55718': 'M ONE MOTORSTART 400ML',
    '56117': 'M ONE UBS 500ML',
    '66700': 'PROFI MONT DEKOR 280ml',
    '66701': 'PROFI MONT EXTREME 280 ml',
    '69236': 'WEISS GLANZED 400 ML',
    '72101': 'ZINK SPRAY 400 ML',
}

# Purchase and selling prices
PRICES = {
    '11000': (1.50, 8.00),
    '12000': (1.50, 3.00),
    '16936': (1.50, 3.50),
    '17101': (1.20, 3.10),
    '26736': (1.50, 2.00),
    '30276': (1.50, 3.50),
    '31812': (1.50, 2.50),
    '31815': (1.50, 2.50),
    '31818': (1.50, 2.50),
    '31819': (1.50, 2.50),
    '31822': (2.00, 2.50),
    '31824': (1.50, 2.50),
    '31827': (1.50, 2.50),
    '31880': (1.50, 3.50),
    '31903': (2.00, 3.80),
    '35108': (1.15, 4.00),
    '35109': (1.15, 4.00),
    '35110': (1.15, 4.00),
    '35111': (1.15, 4.00),
    '35112': (1.15, 4.00),
    '35113': (1.15, 4.00),
    '35114': (1.15, 4.00),
    '35115': (1.15, 4.00),
    '35119': (1.15, 4.00),
    '35121': (1.15, 4.00),
    '35128': (1.15, 4.00),
    '38136': (1.50, 2.50),
    '39505': (1.20, 3.00),
    '44001': (1.20, 3.50),
    '49644': (1.00, 2.00),
    '50912': (1.50, 8.00),
    '51611': (1.00, 1.25),
    '51612': (1.00, 2.30),
    '51736': (1.50, 2.50),
    '51936': (1.50, 2.50),
    '54412': (1.15, 2.00),
    '55718': (1.50, 3.50),
    '56117': (1.50, 4.00),
    '66700': (1.50, 3.00),
    '66701': (1.50, 5.80),
    '69236': (1.50, 3.00),
    '72101': (1.50, 4.20),
}

print("\n// === GENERATED INITIAL_DEPO_PRODUCTS ===")
for sku in all_skus:
    mone_qty = mone_new.get(sku, {}).get('qty', 0)
    name = CLEAN_NAMES.get(sku, existing_meta.get(sku, {}).get('name') or mone_new.get(sku, {}).get('name', 'Artikel'))
    pur, sel = PRICES.get(sku, (1.50, 3.00))
    print(f"  {{ id: 'p-{sku}', sku: '{sku}', name: '{name}', stock: {mone_qty}, unit: 'cope', purchase_price: {pur:.2f}, selling_price: {sel:.2f} }},")

print("\n// === GENERATED INITIAL_MENSURI_STOCK ===")
for sku in sorted(mensuri_new.keys(), key=lambda x: (int(x) if x.isdigit() else 999999, x)):
    q = mensuri_new[sku]['qty']
    print(f"  '{sku}': {q},")

print("\n// === GENERATED INITIAL_QERIMI_STOCK ===")
for sku in sorted(qerimi_new.keys(), key=lambda x: (int(x) if x.isdigit() else 999999, x)):
    q = qerimi_new[sku]['qty']
    print(f"  '{sku}': {q},")
