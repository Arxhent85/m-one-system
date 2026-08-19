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

def analyze_file(filepath, label):
    rows = parse_excel(filepath)
    print(f"\n==========================================")
    print(f"FILE: {label} ({filepath})")
    print(f"Total Rows: {len(rows)}")
    print(f"==========================================")
    for i, r in enumerate(rows[:10]):
        print(f"Row {i:02d}: {r}")
    print(f"... and last 5 rows:")
    for i, r in enumerate(rows[-5:], start=len(rows)-5):
        print(f"Row {i:02d}: {r}")

if __name__ == '__main__':
    analyze_file('Aktuelle daten/DEPO MONE 2026 -2.xlsx', 'DEPO MONE 2026 -2')
    analyze_file('Aktuelle daten/MENSURI depo 2.xlsx', 'MENSURI depo 2')
    analyze_file('Aktuelle daten/QERIMI DEPO 2.xlsx', 'QERIMI DEPO 2')
