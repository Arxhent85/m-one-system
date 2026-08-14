import re
import os

log_path = r'C:\Users\arxhe\.gemini\antigravity\brain\53e007e2-7ce8-4efe-b09b-c4af7bc84066\.system_generated\logs\transcript_full.jsonl'
with open(log_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Find the user prompt with the sales data
match = re.search(r'Aufbereitete Datenbasis.*?ZAIMI;7\.31\.2026;48,00 \?;+10547;#NV;35121;M-ONE Sanitar Silikon;12;Qerimi;0,17', text, re.DOTALL)

if match:
    raw_csv = match.group(0)
    # Clean escaped chars from json
    clean_csv = raw_csv.replace(r'\r\n', '\n').replace(r'\n', '\n').replace(r'\"', '"')
    out_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'raw2026Sales.csv')
    with open(out_path, 'w', encoding='utf-8') as out:
        out.write(clean_csv)
    print(f"Successfully extracted {len(clean_csv)} characters of CSV!")
else:
    print("Regex did not match complete block, searching partials...")
    start_idx = text.rfind('Aufbereitete Datenbasis')
    end_idx = text.find('ZAIMI;7.31.2026', start_idx)
    if start_idx != -1 and end_idx != -1:
        raw_csv = text[start_idx:end_idx+100]
        clean_csv = raw_csv.replace(r'\r\n', '\n').replace(r'\n', '\n').replace(r'\"', '"')
        out_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'raw2026Sales.csv')
        with open(out_path, 'w', encoding='utf-8') as out:
            out.write(clean_csv)
        print(f"Successfully extracted {len(clean_csv)} characters using rfind!")
    else:
        print(f"Indices: start={start_idx}, end={end_idx}")
