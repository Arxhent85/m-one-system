import os
import openpyxl

folder_path = r'd:\M ONE SYSTEM APP\Aktuelle daten'
wb_depo = openpyxl.load_workbook(os.path.join(folder_path, 'DEPO M ONE.xlsx'), data_only=True, read_only=True)
sheet = wb_depo['Tabelle1']

print("==================================================")
print("DIE ECHTEN 46 PRODUKTE AUS DEPO M ONE.xlsx")
print("==================================================\n")

count = 0
for row in sheet.iter_rows(min_row=3, values_only=True):
    if not any(row):
        continue
    shifra, emertimi, prodhuesi, brendi, sasia, njm = (row[i] if i < len(row) else None for i in range(6))
    if not shifra and not emertimi:
        continue
    sku = str(shifra).replace('`', '').strip() if shifra else f"SKU-{count+1}"
    name = str(emertimi).strip()
    unit = str(njm).strip() if njm else 'cope'
    qty = sasia if sasia is not None else 0
    count += 1
    print(f"{count:02d}. SKU: {sku:<10} | Name: {name:<45} | Bestand: {qty} {unit}")

wb_depo.close()
print(f"\nGesamtzahl echter aktiver Produkte: {count}")
