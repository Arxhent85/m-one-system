const fs = require('fs')
const path = require('path')

const dir = 'C:/Users/arxhe/.gemini/antigravity/brain/53e007e2-7ce8-4efe-b09b-c4af7bc84066/.system_generated/logs/chunks/transcript_full/'
const files = fs.readdirSync(dir)

for (let i = files.length - 1; i >= 0; i--) {
  const f = files[i]
  const content = fs.readFileSync(path.join(dir, f), 'utf-8')
  if (content.includes('ZAIMI;7.31.2026') && content.includes('INTERCOM NTP;07.01.2026')) {
    console.log('FOUND IN CHUNK:', f, 'Size:', content.length)
    const pos = content.indexOf('Aufbereitete Datenbasis')
    const endPos = content.indexOf('ZAIMI;7.31.2026;48,00', pos)
    const raw = content.substring(pos, endPos + 100)
    
    // Replace JSON encoded newlines
    const clean = raw
      .split('\\r\\n').join('\n')
      .split('\\n').join('\n')
      .split('\\"').join('"')

    fs.writeFileSync(path.join(__dirname, '../lib/raw2026Sales.csv'), clean)
    console.log('SAVED CLEAN CSV TO lib/raw2026Sales.csv! Length:', clean.length)
    break
  }
}
