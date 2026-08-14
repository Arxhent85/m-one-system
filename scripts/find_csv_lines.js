const fs = require('fs')

const logPath = 'C:/Users/arxhe/.gemini/antigravity/brain/53e007e2-7ce8-4efe-b09b-c4af7bc84066/.system_generated/logs/transcript_full.jsonl'
const lines = fs.readFileSync(logPath, 'utf-8').split('\n')

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Aufbereitete Datenbasis')) {
    try {
      const o = JSON.parse(lines[i])
      console.log('Line', i, 'Type:', o.type, 'Source:', o.source, 'Content length:', o.content ? o.content.length : 0)
    } catch(e) {
      console.log('Line', i, 'JSON parse error:', e.message)
    }
  }
}
