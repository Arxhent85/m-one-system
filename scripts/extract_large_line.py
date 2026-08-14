import json
import os

log_path = r'C:\Users\arxhe\.gemini\antigravity\brain\53e007e2-7ce8-4efe-b09b-c4af7bc84066\.system_generated\logs\transcript_full.jsonl'

with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if len(line) > 40000 and 'INTERCOM NTP' in line:
            print(f"Line {idx} length: {len(line)}")
            start_pos = line.find('INTERCOM NTP;07.01.2026')
            end_pos = line.find('ZAIMI;7.31.2026', start_pos)
            print(f"start_pos: {start_pos}, end_pos: {end_pos}")
            if start_pos != -1 and end_pos != -1:
                snippet = line[start_pos:end_pos+100]
                clean = snippet.replace('\\r\\n', '\n').replace('\\n', '\n').replace('\\"', '"')
                header = "Aufbereitete Datenbasis;;;;;;;;;;;\n;;;;;;;;;;;\nStand: 03.08.2026;;296.929 ?;;;;;;;85.264;;\nFaktura NR.;Datum;Wert;Status;a;Kunden Nr.;Kundenname;Artikel;Artikelname;Stück;Agent;%\n"
                full_csv = header + clean
                out_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'raw2026Sales.csv')
                with open(out_path, 'w', encoding='utf-8') as out:
                    out.write(full_csv)
                print(f"SAVED FULL CSV! Total bytes: {len(full_csv)}")
                break
