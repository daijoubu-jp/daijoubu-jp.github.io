#!/usr/bin/env python3
"""
enrich_kanji_data.py
--------------------
Enriches kanji database by:
1. Downloading and parsing KANJIDIC2 XML.
2. Replacing placeholder English meanings with authentic KANJIDIC2 definitions.
3. Translating English definitions to Thai for all kanji that currently have placeholder Thai strings.
4. Preserving and updating all kanji-levels/*.json and data/kanji.min.json.
"""

import os
import json
import gzip
import time
import requests
import urllib.request
import xml.etree.ElementTree as ET

def get_kanjidic():
    cache_path = 'data/kanjidic2.xml.gz'
    if not os.path.exists(cache_path):
        print("Downloading kanjidic2.xml.gz...")
        url = 'http://www.edrdg.org/kanjidic/kanjidic2.xml.gz'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=60) as resp:
            with open(cache_path, 'wb') as f:
                f.write(resp.read())
        print("Downloaded and cached kanjidic2.xml.gz.")

    print("Parsing kanjidic2.xml.gz...")
    with gzip.open(cache_path, 'rb') as f:
        root = ET.fromstring(f.read())

    kanjidic = {}
    for ch in root.findall('character'):
        lit = ch.find('literal').text
        meanings = [m.text for m in ch.findall('.//meaning') if 'm_lang' not in m.attrib]
        onyomi = [r.text for r in ch.findall('.//reading') if r.attrib.get('r_type') == 'ja_on']
        kunyomi = [r.text for r in ch.findall('.//reading') if r.attrib.get('r_type') == 'ja_kun']
        kanjidic[lit] = {
            'meanings': meanings,
            'onyomi': onyomi,
            'kunyomi': kunyomi
        }
    print(f"Loaded {len(kanjidic)} entries from KANJIDIC2.")
    return kanjidic

def translate_batch(phrases):
    if not phrases:
        return []
    url = 'https://translate.googleapis.com/translate_a/single'
    text = '\n'.join(phrases)
    params = {'client': 'gtx', 'sl': 'en', 'tl': 'th', 'dt': 't', 'q': text}
    for attempt in range(3):
        try:
            r = requests.get(url, params=params, timeout=15)
            if r.status_code == 200:
                data = r.json()
                translated_lines = ''.join(part[0] for part in data[0]).split('\n')
                if len(translated_lines) == len(phrases):
                    return [t.strip() for t in translated_lines]
                # Fallback if split length doesn't match perfectly
                res = []
                for p in phrases:
                    sub_p = {'client': 'gtx', 'sl': 'en', 'tl': 'th', 'dt': 't', 'q': p}
                    sub_r = requests.get(url, params=sub_p, timeout=5)
                    res.append(sub_r.json()[0][0][0].strip())
                return res
        except Exception as e:
            time.sleep(1)
    return phrases

def main():
    kanjidic = get_kanjidic()

    # Load all current kanji
    level_files = [
      'kanken-10.json', 'kanken-9.json', 'kanken-8.json', 'kanken-7.json',
      'kanken-6.json',  'kanken-5.json', 'kanken-4.json', 'kanken-3.json',
      'kanken-jun2.json', 'kanken-2.json', 'kanken-jun1.json', 'kanken-1.json'
    ]

    all_data = {}
    for f in level_files:
        path = os.path.join('data', 'kanji-levels', f)
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as fp:
                all_data[f] = json.load(fp)

    # Collect English phrases that need Thai translation
    translation_cache_file = 'data/translation_cache.json'
    trans_cache = {}
    if os.path.exists(translation_cache_file):
        with open(translation_cache_file, 'r', encoding='utf-8') as f:
            trans_cache = json.load(f)

    # Collect all needed translations
    needed_phrases = set()
    for f, items in all_data.items():
        for item in items:
            char = item['kanji']
            m_th = item.get('meanings_th', [])
            m_en = item.get('meanings_en', [])
            
            # Check if placeholder
            is_placeholder_th = not m_th or any('คันจิระดับ' in t for t in m_th)
            is_placeholder_en = not m_en or any('Kanji Kentei Level' in e or 'Kanken Level' in e for e in m_en)
            
            if is_placeholder_en and char in kanjidic:
                new_en = kanjidic[char]['meanings']
                if new_en:
                    item['meanings_en'] = new_en
            
            if is_placeholder_th:
                cur_en = item.get('meanings_en', [])
                for p in cur_en[:3]:
                    clean_p = p.strip().lower()
                    if clean_p and clean_p not in trans_cache:
                        needed_phrases.add(clean_p)

    print(f"Total phrases needing translation: {len(needed_phrases)}")
    
    # Batch translate in chunks of 40
    phrase_list = list(needed_phrases)
    batch_size = 40
    for i in range(0, len(phrase_list), batch_size):
        chunk = phrase_list[i:i+batch_size]
        print(f"Translating batch {i // batch_size + 1} / {(len(phrase_list) + batch_size - 1) // batch_size}...")
        results = translate_batch(chunk)
        for orig, tr in zip(chunk, results):
            trans_cache[orig] = tr
        time.sleep(0.1)

    # Save translation cache
    with open(translation_cache_file, 'w', encoding='utf-8') as f:
        json.dump(trans_cache, f, ensure_ascii=False, indent=2)

    # Apply translations to all items
    total_enriched = 0
    for f, items in all_data.items():
        for item in items:
            char = item['kanji']
            m_th = item.get('meanings_th', [])
            is_placeholder_th = not m_th or any('คันจิระดับ' in t for t in m_th)

            if is_placeholder_th:
                cur_en = item.get('meanings_en', [])
                new_th = []
                for p in cur_en[:3]:
                    clean_p = p.strip().lower()
                    if clean_p in trans_cache and trans_cache[clean_p] not in new_th:
                        new_th.append(trans_cache[clean_p])
                if new_th:
                    item['meanings_th'] = new_th
                    total_enriched += 1

            # Ensure on/kun readings are filled if missing
            if char in kanjidic:
                if not item.get('onyomi') and kanjidic[char]['onyomi']:
                    item['onyomi'] = kanjidic[char]['onyomi']
                if not item.get('kunyomi') and kanjidic[char]['kunyomi']:
                    item['kunyomi'] = kanjidic[char]['kunyomi']

        # Save back to file
        path = os.path.join('data', 'kanji-levels', f)
        with open(path, 'w', encoding='utf-8') as fp:
            json.dump(items, fp, ensure_ascii=False, indent=2)
        print(f"Saved {path}")

    print(f"Enriched {total_enriched} kanji with authentic Thai and English meanings.")

    # Rebuild data/kanji.min.json and gz
    all_kanji = []
    for f in level_files:
        all_kanji.extend(all_data[f])

    min_path = 'data/kanji.min.json'
    with open(min_path, 'w', encoding='utf-8') as fp:
        json.dump(all_kanji, fp, ensure_ascii=False, separators=(',', ':'))
    print(f"Wrote {min_path} ({len(all_kanji)} entries)")

    gz_path = 'data/kanji.min.json.gz'
    with open(min_path, 'rb') as f_in:
        with gzip.open(gz_path, 'wb') as f_out:
            f_out.writelines(f_in)
    print(f"Compressed to {gz_path}")

if __name__ == '__main__':
    main()
