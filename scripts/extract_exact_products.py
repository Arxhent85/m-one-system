import zipfile, xml.etree.ElementTree as ET

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

def parse_depo_products():
    products = {} # sku -> name
    
    with zipfile.ZipFile('Aktuelle daten/DEPO M ONE.xlsx', 'r') as zf:
        shared_strings = get_shared_strings(zf)
        sheet_xml = zf.read('xl/worksheets/sheet1.xml')
        root = ET.fromstring(sheet_xml)
        for row in root.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            cells = row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c')
            vals = []
            for cell in cells:
                v = cell.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                t = cell.attrib.get('t', '')
                if v is not None and v.text is not None:
                    val = shared_strings[int(v.text)] if t == 's' else v.text
                    vals.append(val)
                else:
                    vals.append('')
            if len(vals) >= 2:
                sku = str(vals[0]).replace('`', '').strip()
                name = str(vals[1]).strip()
                if sku.isdigit() and len(sku) >= 4 and name and 'EM' not in name and 'SHIFRA' not in sku:
                    products[sku] = name

    print(f'TOTAL OFFICIAL PRODUCTS IN DEPO M ONE: {len(products)}')
    print("export const ALL_PRODUCTS = [")
    for sku in sorted(products.keys()):
        clean_name = products[sku].replace("'", "\\'")
        print(f"  {{ id: 'p-{sku}', sku: '{sku}', name: '{clean_name}' }},")
    print("]")

if __name__ == '__main__':
    parse_depo_products()
