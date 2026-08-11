import zipfile
import xml.etree.ElementTree as ET

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
        # Try sheet1 first
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

def extract_stock(filepath, label):
    rows = parse_excel(filepath)
    print(f'\n===== {label} =====')
    print(f'Total rows: {len(rows)}')
    for i, row in enumerate(rows[:60]):
        print(f'  Row {i:02d}: {row}')

if __name__ == '__main__':
    extract_stock('Aktuelle daten/DEPO M ONE 1.xlsx', 'DEPO M ONE 1')
    extract_stock('Aktuelle daten/MENSURI DEPO 1.xlsx', 'MENSURI DEPO 1')
    extract_stock('Aktuelle daten/QERIMI DEPO 1.xlsx', 'QERIMI DEPO 1')
