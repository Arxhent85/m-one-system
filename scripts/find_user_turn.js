const fs = require('fs')
const path = require('path')

const dir = 'C:/Users/arxhe/.gemini/antigravity/brain/53e007e2-7ce8-4efe-b09b-c4af7bc84066/.system_generated/logs/chunks/transcript_full/'
const files = fs.readdirSync(dir)

for (const f of files) {
  const lines = fs.readFileSync(path.join(dir, f), 'utf-8').split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    try {
      const obj = JSON.parse(lines[i])
      if (obj.content && obj.content.includes('Aufbereitete Datenbasis') && obj.content.includes('ZAIMI;7.31.2026')) {
        console.log(`FOUND in file ${f} line ${i}, type: ${obj.type}, source: ${obj.source}, content len: ${obj.content.length}`)
        const start = obj.content.indexOf('Aufbereitete Datenbasis')
        const end = obj.content.indexOf('ZAIMI;7.31.2026;48,00 ?;;;10547;#NV;35121;M-ONE Sanitar Silikon;12;Qerimi;0,17', start)
        const pureCsv = obj.content.substring(start, end !== -1 ? end + 100 : start + 50000)
        fs.writeFileSync(path.join(__dirname, '../lib/raw2026Sales.csv'), pureCsv)
        console.log('SUCCESS! Wrote', pureCsv.length, 'bytes to lib/raw2026Sales.csv')
        process.exit(0)
      }
    } catch(e) {}
  }
}
console.log('Not found in any chunk as parsed JSON object!')
