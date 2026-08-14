import json

log_path = r'C:\Users\arxhe\.gemini\antigravity\brain\53e007e2-7ce8-4efe-b09b-c4af7bc84066\.system_generated\logs\transcript_full.jsonl'

with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if 'INTERCOM NTP' in line:
            print(f"Line {idx} length: {len(line)} contains ZAIMI: {'ZAIMI' in line}")
