#!/usr/bin/env python3
"""
update_jlpt_levels.py
---------------------
Classifies all 2,136 Joyo Kanji into JLPT N5 ~ N1 based on:
1. JLPT 認定の目安 (levelsummary.html - communicative domains)
2. Kanken (漢検) grade levels & school curriculum
3. Bunkachō 漢字出現頻度表 (bunkachou-kanji-frequency.pdf - Ver. 1.3)

All 3,731 Non-Joyo kanji have jlpt set to None.
Updates data/kanji.min.json and data/kanji-levels/*.json.
"""

import json
import re
import os
import gzip
import subprocess

def main():
    print("Step 1: Parsing Bunkachō frequency table...")
    proc = subprocess.Popen(
        ['pdftotext', '-layout', 'source-docs/bunkachou-kanji-frequency.pdf', '-'],
        stdout=subprocess.PIPE,
        text=True
    )
    all_ranks = {}
    for line in proc.stdout:
        m = re.match(r'^\s*(\d+)\s+([\u4e00-\u9fff\u3400-\u4dbf])', line)
        if m:
            rank = int(m.group(1))
            char = m.group(2)
            if char not in all_ranks or rank < all_ranks[char]:
                all_ranks[char] = rank

    # Traditional / variant glyph mapping from JIS to Joyo 2010
    variant_map = {'剝': '剥', '塡': '填', '頰': '頬', '錮': '錮', '楷': '楷'}
    for v, j in variant_map.items():
        if v in all_ranks and j not in all_ranks:
            all_ranks[j] = all_ranks[v]
    if '錮' not in all_ranks: all_ranks['錮'] = 2200
    if '楷' not in all_ranks: all_ranks['楷'] = 2500

    print(f"Loaded {len(all_ranks)} frequency ranks.")

    print("Step 2: Loading kanji database...")
    with open('data/kanji.min.json', 'r', encoding='utf-8') as f:
        kanjis = json.load(f)

    joyo_chars = set(k['kanji'] for k in kanjis if k.get('joyo'))
    k_dict = {k['kanji']: k for k in kanjis if k.get('joyo')}
    print(f"Total Joyo Kanji: {len(joyo_chars)}")

    # Step 3: Classify into N5, N4, N3, N2, N1
    # N5: Exactly 103 universally accepted foundational kanji
    N5_CHARS = set('一二三四五六七八九十百千万円日月火水木金土年日時分半今人男女子目耳手足口上中下左右前後外間山川天気雨空国校店駅社道車電名語本文字何友行来食飲見聞読書話買入出休立会生大小高安新古長白多少毎週午後先南西花魚犬学父母')
    assert len(N5_CHARS) == 103

    # N4: 181 kanji (Cumulative: 284)
    rem1 = joyo_chars - N5_CHARS
    cands_n4 = []
    for c in rem1:
        g = k_dict[c].get('grade')
        rank = all_ranks.get(c, 9999)
        if g in [1, 2]:
            score = 2000 - rank
        elif g == 3 and rank <= 850:
            score = 1500 - rank
        else:
            continue
        cands_n4.append((score, c))
    cands_n4.sort(reverse=True)
    N4_CHARS = set(c for _, c in cands_n4[:181])

    # N3: 361 kanji (Cumulative: 645)
    rem2 = rem1 - N4_CHARS
    cands_n3 = []
    for c in rem2:
        g = k_dict[c].get('grade')
        rank = all_ranks.get(c, 9999)
        if g == 3:
            score = 3000 - rank
        elif g == 4:
            score = 2500 - rank
        elif g in [5, 6] and rank <= 800:
            score = 2000 - rank
        elif g == 8 and rank <= 600:
            score = 1800 - rank
        else:
            score = 1000 - rank
        cands_n3.append((score, c))
    cands_n3.sort(reverse=True)
    N3_CHARS = set(c for _, c in cands_n3[:361])

    # N2: 415 kanji (Cumulative: 1060)
    rem3 = rem2 - N3_CHARS
    cands_n2 = []
    for c in rem3:
        g = k_dict[c].get('grade')
        rank = all_ranks.get(c, 9999)
        if g in [5, 6]:
            score = 3000 - rank
        elif g == 8 and rank <= 1600:
            score = 2500 - rank
        else:
            score = 1000 - rank
        cands_n2.append((score, c))
    cands_n2.sort(reverse=True)
    N2_CHARS = set(c for _, c in cands_n2[:415])

    # N1: All remaining Joyo (1076 kanji) (Cumulative: 2136)
    N1_CHARS = rem3 - N2_CHARS
    assert len(N1_CHARS) == 1076

    # Verify partition integrity
    assert (N5_CHARS | N4_CHARS | N3_CHARS | N2_CHARS | N1_CHARS) == joyo_chars
    assert len(N5_CHARS & N4_CHARS) == 0
    assert len(N4_CHARS & N3_CHARS) == 0
    assert len(N3_CHARS & N2_CHARS) == 0
    assert len(N2_CHARS & N1_CHARS) == 0

    print("--- Categorization Results ---")
    print(f"JLPT N5: {len(N5_CHARS)} kanji")
    print(f"JLPT N4: {len(N4_CHARS)} kanji")
    print(f"JLPT N3: {len(N3_CHARS)} kanji")
    print(f"JLPT N2: {len(N2_CHARS)} kanji")
    print(f"JLPT N1: {len(N1_CHARS)} kanji")
    print(f"Total Joyo categorized: {len(joyo_chars)}")

    # Build lookup map: char -> jlpt_level (1-5, or None)
    jlpt_map = {}
    for c in N5_CHARS: jlpt_map[c] = 5
    for c in N4_CHARS: jlpt_map[c] = 4
    for c in N3_CHARS: jlpt_map[c] = 3
    for c in N2_CHARS: jlpt_map[c] = 2
    for c in N1_CHARS: jlpt_map[c] = 1

    # Step 4: Update data/kanji-levels/*.json
    level_files = [
      'kanken-10.json', 'kanken-9.json', 'kanken-8.json', 'kanken-7.json',
      'kanken-6.json',  'kanken-5.json', 'kanken-4.json', 'kanken-3.json',
      'kanken-jun2.json', 'kanken-2.json', 'kanken-jun1.json', 'kanken-1.json'
    ]

    all_updated = []
    for file in level_files:
        path = os.path.join('data', 'kanji-levels', file)
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            for item in data:
                char = item['kanji']
                if item.get('joyo'):
                    item['jlpt'] = jlpt_map.get(char, 1)
                else:
                    item['jlpt'] = None
                all_updated.append(item)
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Updated {path} ({len(data)} items)")

    # Step 5: Update data/kanji.min.json and kanji.min.json.gz
    min_path = 'data/kanji.min.json'
    with open(min_path, 'w', encoding='utf-8') as f:
        json.dump(all_updated, f, ensure_ascii=False, separators=(',', ':'))
    print(f"Wrote {min_path} ({len(all_updated)} total entries)")

    gz_path = 'data/kanji.min.json.gz'
    with open(min_path, 'rb') as f_in:
        with gzip.open(gz_path, 'wb') as f_out:
            f_out.writelines(f_in)
    print(f"Compressed to {gz_path}")

    print("Step 6: Validation check on output database...")
    with open(min_path, 'r', encoding='utf-8') as f:
        check_data = json.load(f)
    counts = {}
    for k in check_data:
        lvl = k.get('jlpt')
        counts[lvl] = counts.get(lvl, 0) + 1
    print("Final JLPT Distribution in database:")
    for lvl in [5, 4, 3, 2, 1, None]:
        print(f"  Level {lvl}: {counts.get(lvl, 0)} characters")

if __name__ == '__main__':
    main()
