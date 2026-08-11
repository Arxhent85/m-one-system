import zipfile, xml.etree.ElementTree as ET, json

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

def parse_all_customers():
    customers = {}
    
    def add_customer(cust_no, company, city):
        cust_no = str(cust_no).replace('`', '').strip()
        company = str(company).strip()
        city = str(city).strip()
        
        # Skip numeric companies or headers
        if company.isdigit() or company in ['FIRMA', 'EMËRTIMI I ARTIKULLIT', 'PRODHUESI']:
            return
            
        if cust_no.isdigit() and len(cust_no) == 5 and cust_no[0] in ['1', '2', '3']:
            if cust_no not in customers or (city and not customers[cust_no]['city']):
                customers[cust_no] = {
                    'customer_number': cust_no,
                    'company_name': company,
                    'city': city,
                }

    # 1. KUNDENLISTE 2026.xlsm
    with zipfile.ZipFile('Aktuelle daten/KUNDENLISTE 2026.xlsm', 'r') as zf:
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
                    vals.append(str(val).strip())
                else:
                    vals.append('')
            if len(vals) >= 6:
                add_customer(vals[5], vals[1], vals[0])

    # 2. Daten 2026.xlsx
    with zipfile.ZipFile('Aktuelle daten/Daten 2026.xlsx', 'r') as zf:
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
                    vals.append(str(val).strip())
                else:
                    vals.append('')
            if len(vals) >= 3:
                c1, c2, c3 = vals[0], vals[1], vals[2]
                if c3.replace('`','').isdigit():
                    add_customer(c3, c2, c1)
                elif c1.replace('`','').isdigit():
                    add_customer(c1, c2, c3)

    sorted_custs = sorted(customers.values(), key=lambda x: int(x['customer_number']))
    
    for c in sorted_custs:
        num = c['customer_number']
        if num.startswith('1'):
            c['agent'] = 'Qerimi (Fahrzeug 2)'
        elif num.startswith('2'):
            c['agent'] = 'Mensuri (Fahrzeug 1)'
        elif num.startswith('3'):
            c['agent'] = 'Miloti'
        else:
            c['agent'] = 'M-ONE Admin'

    print(f'Total Clean Official 5-Digit Customers: {len(sorted_custs)}')
    
    with open('lib/mockCustomers.json', 'w', encoding='utf-8') as f:
        json.dump(sorted_custs, f, ensure_ascii=False, indent=2)

    print("First 10 Qerimi customers:")
    for c in [x for x in sorted_custs if x['agent'].startswith('Qerimi')][:10]:
        print(c)

    print("\nFirst 10 Mensuri customers:")
    for c in [x for x in sorted_custs if x['agent'].startswith('Mensuri')][:10]:
        print(c)

if __name__ == '__main__':
    parse_all_customers()
