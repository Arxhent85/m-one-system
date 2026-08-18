import json

with open('lib/mockCustomers.json', 'r', encoding='utf-8') as f:
    customers = json.load(f)

# Check if 40000 exists
found = any(c.get('customer_number') == '40000' for c in customers)

if not found:
    new_customer = {
        "id": "cust-40000",
        "customer_number": "40000",
        "company_name": "M ONE CENTRALE",
        "city": "FUSHE KOSOVE",
        "agent": "M-ONE Zentrale (Hauptlager)",
        "phone": "+383 44 123 456",
        "customer_type": "Zentrale / Großkunde",
        "notes": "Kundennr: 40000 | Ort: FUSHE KOSOVE | Tour: M-ONE Zentrale (Hauptlager)",
        "is_active": True,
        "latitude": 42.638898,
        "longitude": 21.096494,
        "google_maps_url": "https://www.google.com/maps/search/?api=1&query=42.638898,21.096494",
        "total_orders": 0,
        "total_volume": 0.0
    }
    # Insert right before 40001 or at appropriate position
    idx_40001 = next((i for i, c in enumerate(customers) if c.get('customer_number') == '40001'), len(customers))
    customers.insert(idx_40001, new_customer)
    
    with open('lib/mockCustomers.json', 'w', encoding='utf-8') as f:
        json.dump(customers, f, ensure_ascii=False, indent=2)
    print(f"Successfully added customer 40000 (M ONE CENTRALE) to lib/mockCustomers.json! Total customers: {len(customers)}")
else:
    print("Customer 40000 already exists.")
