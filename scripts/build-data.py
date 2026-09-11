import json
import glob
import os

def build_minified_json():
    print("Building minified kanji database...")
    
    # Files in order of level
    level_files = [
      'kanken-10.json', 'kanken-9.json', 'kanken-8.json', 'kanken-7.json',
      'kanken-6.json',  'kanken-5.json', 'kanken-4.json', 'kanken-3.json',
      'kanken-jun2.json', 'kanken-2.json', 'kanken-jun1.json', 'kanken-1.json'
    ]
    
    all_kanji = []
    
    for file in level_files:
        filepath = os.path.join('data', 'kanji-levels', file)
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                all_kanji.extend(data)
                print(f"Loaded {len(data)} kanji from {file}")
        else:
            print(f"Warning: {file} not found!")

    output_path = os.path.join('data', 'kanji.min.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        # separators=(',', ':') removes all whitespace
        json.dump(all_kanji, f, ensure_ascii=False, separators=(',', ':'))
        
    print(f"Success! Built {output_path} with {len(all_kanji)} total kanji.")
    print(f"File size: {os.path.getsize(output_path) / 1024 / 1024:.2f} MB")

if __name__ == "__main__":
    build_minified_json()
