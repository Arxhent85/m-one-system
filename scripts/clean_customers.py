import json

def clean_customers():
    with open('lib/mockCustomers.json', 'r', encoding='utf-8') as f:
        custs = json.load(f)

    # Filter out duplicate/typo rows (20635, 20636, 20803)
    cleaned = []
    for c in custs:
        num = c['customer_number']
        name = c['company_name']
        if num in ['20635', '20636', '20803']:
            continue
        cleaned.append(c)

    print(f'Cleaned customer list size: {len(cleaned)} (removed typos 20635, 20636, 20803)')

    with open('lib/mockCustomers.json', 'w', encoding='utf-8') as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    clean_customers()
