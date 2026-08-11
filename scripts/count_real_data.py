import os
import openpyxl

folder_path = r'd:\M ONE SYSTEM APP\Aktuelle daten'

def count_file(filename, sheet_name):
    wb = openpyxl.load_workbook(os.path.join(folder_path, filename), data_only=True, read_only=True)
    sheet = wb[sheet_name]
    count = sum(1 for row in sheet.iter_rows(values_only=True) if any(row))
    wb.close()
    return count - 1  # Minus header

print(f"Produkte (Sheet Produkte): {count_file('KUNDENLISTE 2026.xlsm', 'Produkte')} Datensätze")
print(f"Kunden (Sheet KUNDEN): {count_file('KUNDENLISTE 2026.xlsm', 'KUNDEN')} Datensätze")
print(f"Depot M-ONE Bestände: {count_file('DEPO M ONE.xlsx', 'Tabelle1')} Positionen")
print(f"Depot Mensuri Bestände: {count_file('DEPO MENSURI.xlsx', 'Tabelle1')} Positionen")
print(f"Depot Qerimi Bestände: {count_file('DEPO QERIMI.xlsx', 'Tabelle1')} Positionen")
print(f"Aufträge 2026 Historie: {count_file('Daten 2026.xlsx', 'Sheet1')} Verkäufe")
