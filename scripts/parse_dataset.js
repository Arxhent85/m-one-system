const fs = require('fs')
const path = require('path')

function parseExcelDate(rawDate) {
  if (!rawDate) return new Date().toISOString()
  const clean = rawDate.trim()
  
  // Format DD.MM.YYYY (e.g. 07.01.2026)
  if (clean.match(/^0\d\.\d{2}\.\d{4}$/)) {
    const [d, m, y] = clean.split('.').map(Number)
    return `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}T10:00:00.000Z`
  }

  // Format M.D.YYYY (e.g. 1.7.2026, 7.31.2026)
  const parts = clean.split('.').map(Number)
  if (parts.length === 3) {
    const [month, day, year] = parts
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T10:00:00.000Z`
  }
  return new Date().toISOString()
}

function parseCurrency(str) {
  if (!str) return 0
  const clean = str.replace(/[^\d,.-]/g, '').replace(',', '.')
  return parseFloat(clean) || 0
}

function parseCSV(content) {
  const lines = content.split('\n')
  const orders = []
  let currentOrder = null
  let orderIndex = 1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith('Aufbereitete') || line.startsWith('Stand:') || line.startsWith('Faktura NR.')) {
      continue
    }

    const parts = line.split(';')
    if (parts.length < 9) continue

    const fakturaNrRaw = parts[0]?.trim()
    const datumRaw = parts[1]?.trim()
    const wertRaw = parts[2]?.trim()
    const custNoRaw = parts[5]?.trim()
    const custNameRaw = parts[6]?.trim() || fakturaNrRaw
    const skuRaw = parts[7]?.trim()
    const itemNameRaw = parts[8]?.trim()
    const qtyRaw = parseInt(parts[9]?.trim()) || 1
    const agentRaw = parts[10]?.trim()

    // Must have SKU or item name
    if (!skuRaw && !itemNameRaw) continue

    // Determine Driver & Vehicle
    let driverName = 'Zentrale'
    let vehicleLocationId = '11111111-1111-1111-1111-111111111111'
    let vehicleLocationName = 'Hauptlager Zentrale'

    if (agentRaw === 'Qerimi' || (custNoRaw && custNoRaw.startsWith('1'))) {
      driverName = 'Qerimi'
      vehicleLocationId = '33333333-3333-3333-3333-333333333333'
      vehicleLocationName = 'Fahrzeug 2 (Depo Qerimi)'
    } else if (agentRaw === 'Mensuri' || (custNoRaw && custNoRaw.startsWith('2'))) {
      driverName = 'Mensuri'
      vehicleLocationId = '22222222-2222-2222-2222-222222222222'
      vehicleLocationName = 'Fahrzeug 1 (Depo Mensuri)'
    } else if (agentRaw === 'Miloti' || (custNoRaw && custNoRaw.startsWith('3'))) {
      driverName = 'Miloti'
      vehicleLocationId = '11111111-1111-1111-1111-111111111111'
      vehicleLocationName = 'Hauptlager Zentrale'
    }

    const parsedWert = parseCurrency(wertRaw)
    const isNewInvoice = parsedWert > 0 || (fakturaNrRaw && (!currentOrder || currentOrder.customer_number !== custNoRaw || currentOrder.rawDate !== datumRaw))

    // Estimate item unit price
    let unitPrice = 4.20
    if (skuRaw === '50912') unitPrice = 7.20
    else if (skuRaw === '66701') unitPrice = 5.80
    else if (skuRaw === '51611' || skuRaw === '51612') unitPrice = 2.30
    else if (skuRaw === '49644') unitPrice = 2.50
    else if (skuRaw === '55718') unitPrice = 3.50
    else if (skuRaw === '44001') unitPrice = 2.50
    else if (skuRaw === '54412') unitPrice = 2.50
    else if (skuRaw === '56117') unitPrice = 4.00
    else if (skuRaw === '20001' || skuRaw === '30275') unitPrice = 1.80
    else if (skuRaw === '12000' || skuRaw === '12001') unitPrice = 4.50
    else if (skuRaw === '16936' || skuRaw === '26736' || skuRaw === '38136' || skuRaw === '51936' || skuRaw === '51736') unitPrice = 3.20

    const item = {
      sku: skuRaw || '35110',
      name: itemNameRaw || 'M-ONE Sanitar Silikon',
      qty: qtyRaw,
      unit_price: unitPrice,
      total: Number((qtyRaw * unitPrice).toFixed(2))
    }

    if (isNewInvoice || !currentOrder) {
      const orderNumStr = orderIndex.toString().padStart(4, '0')
      orderIndex++

      const displayName = custNameRaw === '#NV' ? (fakturaNrRaw || 'Kunde') : (custNameRaw || fakturaNrRaw || 'Kunde')

      currentOrder = {
        id: `sale-2026-${orderNumStr}`,
        order_number: `FK-2026-${orderNumStr}`,
        driver_name: driverName,
        vehicle_location_id: vehicleLocationId,
        vehicle_location_name: vehicleLocationName,
        customer_number: custNoRaw || '10103',
        customer_name: displayName,
        total_amount: parsedWert || item.total,
        items: [item],
        payment_method: 'rechnung',
        created_at: parseExcelDate(datumRaw),
        rawDate: datumRaw,
      }
      orders.push(currentOrder)
    } else {
      currentOrder.items.push(item)
      if (!parsedWert) {
        currentOrder.total_amount = Number((currentOrder.total_amount + item.total).toFixed(2))
      }
    }
  }

  return orders
}

const csvPath = path.join(__dirname, '../lib/raw2026Sales.csv')
if (fs.existsSync(csvPath)) {
  const content = fs.readFileSync(csvPath, 'utf-8')
  const orders = parseCSV(content)
  console.log('Total Parsed 2026 Invoices:', orders.length)
  const totalItems = orders.reduce((s, o) => s + (o.items?.length || 0), 0)
  console.log('Total Line Items:', totalItems)
  const totalVolume = orders.reduce((s, o) => s + (o.total_amount || 0), 0)
  console.log('Total Volume (€):', totalVolume.toFixed(2))
  
  // Save to lib/mock2026Sales.json
  const outPath = path.join(__dirname, '../lib/mock2026Sales.json')
  fs.writeFileSync(outPath, JSON.stringify(orders, null, 2))
  console.log('Saved directly to lib/mock2026Sales.json!')
}
