const fs = require('fs')
const path = require('path')

const logPath = 'C:/Users/arxhe/.gemini/antigravity/brain/53e007e2-7ce8-4efe-b09b-c4af7bc84066/.system_generated/logs/transcript_full.jsonl'
const lines = fs.readFileSync(logPath, 'utf-8').split('\n')

let found = false
for (let i = lines.length - 1; i >= 0; i--) {
  if (!lines[i].trim()) continue
  try {
    const o = JSON.parse(lines[i])
    if (o.type === 'USER_INPUT' && o.content && o.content.includes('Aufbereitete Datenbasis')) {
      console.log('Found exact USER_INPUT message! Step:', o.step_index, 'Content length:', o.content.length)
      const csv = o.content.substring(o.content.indexOf('Aufbereitete Datenbasis'))
      fs.writeFileSync(path.join(__dirname, '../lib/raw2026Sales.csv'), csv)
      console.log('Wrote pure CSV to lib/raw2026Sales.csv! Length:', csv.length)
      found = true
      break
    }
  } catch(e) {}
}

if (!found) {
  console.log('USER_INPUT not found by JSON parse!')
}
