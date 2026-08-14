import json
import os

log_path = r'C:\Users\arxhe\.gemini\antigravity\brain\53e007e2-7ce8-4efe-b09b-c4af7bc84066\.system_generated\logs\transcript_full.jsonl'

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        if not line.strip():
            continue
        try:
            obj = json.loads(line)
            content = obj.get('content', '')
            if 'das sind die neuen daten für das jahr 2026' in content and 'Aufbereitete Datenbasis' in content:
                print(f"Found user message in step {obj.get('step_index')}")
                idx = content.find('Aufbereitete Datenbasis')
                csv_text = content[idx:]
                out_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'raw2026Sales.csv')
                with open(out_path, 'w', encoding='utf-8') as out:
                    out.write(csv_text)
                print(f"Saved pure CSV to lib/raw2026Sales.csv! Length: {len(csv_text)}")
                break
        except Exception as e:
            pass
