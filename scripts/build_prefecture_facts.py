#!/usr/bin/env python3
"""
build_prefecture_facts.py
Creates content/prefectures/<slug>.md, one file per prefecture, seeded with the
canonical prefecture table below plus population/area fetched from Wikidata.

The markdown is the single source of truth for prefecture data; run
`python3 scripts/compile_content.py` (compile_prefectures) to rebuild
data/prefectures.json.

This importer is additive: it only creates files that do not already exist, so
curated content (etymology, places, products) is never overwritten. Use
--force to overwrite existing files (dev convenience).

Sources:
  - Wikidata SPARQL endpoint (CC0) for population (P1082) and area (P2046).
  - Canonical table copied from scripts/build_prefectures_map.py.

Usage:
  python3 scripts/build_prefecture_facts.py [--force] [--validate]
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREFECTURES_DIR = os.path.join(BASE_DIR, "content", "prefectures")

SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"
USER_AGENT = "daijoubu-jp-build-facts"
FETCH_RETRIES = 3
RETRY_BACKOFF_S = 60

# Keep this table in sync with scripts/build_prefectures_map.py (verbatim copy).
# code, slug, romaji, name_ja, name_th, region_ja, hira, capital, capital_hira, flower, tree, bird
PREFECTURES = [
    ("01","hokkaido","Hokkaido","北海道","ฮอกไกโด","北海道地方","ほっかいどう","札幌市","さっぽろし","ハマナス","エゾマツ","タンチョウ"),
    ("02","aomori","Aomori","青森県","อาโอโมริ","東北地方","あおもりけん","青森市","あおもりし","リンゴの花","ヒバ","ハクチョウ"),
    ("03","iwate","Iwate","岩手県","อิวาเตะ","東北地方","いわてけん","盛岡市","もりおかし","キリ","ナンブアカマツ","キジ"),
    ("04","miyagi","Miyagi","宮城県","มิยากิ","東北地方","みやぎけん","仙台市","せんだいし","ミヤギノハギ","ケヤキ","ガン"),
    ("05","akita","Akita","秋田県","อากิตะ","東北地方","あきたけん","秋田市","あきたし","フキノトウ","アキタスギ","ヤマドリ"),
    ("06","yamagata","Yamagata","山形県","ยามากาตะ","東北地方","やまがたけん","山形市","やまがたし","ベニバナ","サクランボ","オシドリ"),
    ("07","fukushima","Fukushima","福島県","ฟุกุชิมะ","東北地方","ふくしまけん","福島市","ふくしまし","ネモトシャクナゲ","ケヤキ","キビタキ"),
    ("08","ibaraki","Ibaraki","茨城県","อิบารากิ","関東地方","いばらきけん","水戸市","みとし","バラ","ウメ","ヒバリ"),
    ("09","tochigi","Tochigi","栃木県","โทจิกิ","関東地方","とちぎけん","宇都宮市","うつのみやし","ヤシオツツジ","トチノキ","オオルリ"),
    ("10","gunma","Gunma","群馬県","กุมมะ","関東地方","ぐんまけん","前橋市","まえばしし","レンゲツツジ","クロマツ","ヤマドリ"),
    ("11","saitama","Saitama","埼玉県","ไซตามะ","関東地方","さいたまけん","さいたま市","さいたまし","サクラソウ","ケヤキ","シラコバト"),
    ("12","chiba","Chiba","千葉県","ชิบะ","関東地方","ちばけん","千葉市","ちばし","ナノハナ","マキ","ホオジロ"),
    ("13","tokyo","Tokyo","東京都","โตเกียว","関東地方","とうきょうと","新宿区","しんじゅくく","ソメイヨシノ","イチョウ","ユリカモメ"),
    ("14","kanagawa","Kanagawa","神奈川県","คานากาวะ","関東地方","かながわけん","横浜市","よこはまし","ヤマユリ","イチョウ","カモメ"),
    ("15","niigata","Niigata","新潟県","นีงาตะ","中部地方","にいがたけん","新潟市","にいがたし","チューリップ","ユキツバキ","トキ"),
    ("16","toyama","Toyama","富山県","โทยามะ","中部地方","とやまけん","富山市","とやまし","チューリップ","タテヤマスギ","ライチョウ"),
    ("17","ishikawa","Ishikawa","石川県","อิชิกาวะ","中部地方","いしかわけん","金沢市","かなざわし","クロユリ","アテ","イヌワシ"),
    ("18","fukui","Fukui","福井県","ฟุกุอิ","中部地方","ふくいけん","福井市","ふくいし","スイセン","マツ","ツグミ"),
    ("19","yamanashi","Yamanashi","山梨県","ยามานาชิ","中部地方","やまなしけん","甲府市","こうふし","フジザクラ","カエデ","ウグイス"),
    ("20","nagano","Nagano","長野県","นากาโนะ","中部地方","ながのけん","長野市","ながのし","リンドウ","シラカバ","ライチョウ"),
    ("21","gifu","Gifu","岐阜県","กิฟุ","中部地方","ぎふけん","岐阜市","ぎふし","レンゲソウ","イチイ","ライチョウ"),
    ("22","shizuoka","Shizuoka","静岡県","ชิซุโอกะ","中部地方","しずおかけん","静岡市","しずおかし","ツツジ","モクセイ","サンコウチョウ"),
    ("23","aichi","Aichi","愛知県","ไอจิ","中部地方","あいちけん","名古屋市","なごやし","カキツバタ","ハナノキ","コノハズク"),
    ("24","mie","Mie","三重県","มิเอะ","近畿地方","みえけん","津市","つし","ハナショウブ","ジングウスギ","シロチドリ"),
    ("25","shiga","Shiga","滋賀県","ชิงะ","近畿地方","しがけん","大津市","おおつし","シャクナゲ","モミジ","カイツブリ"),
    ("26","kyoto","Kyoto","京都府","เกียวโต","近畿地方","きょうとふ","京都市","きょうとし","シダレザクラ","キタヤマスギ","オオミズナギドリ"),
    ("27","osaka","Osaka","大阪府","โอซากะ","近畿地方","おおさかふ","大阪市","おおさかし","ウメ・サクラソウ","イチョウ","モズ"),
    ("28","hyogo","Hyogo","兵庫県","เฮียวโกะ","近畿地方","ひょうごけん","神戸市","こうべし","ノジギク","クスノキ","コウノトリ"),
    ("29","nara","Nara","奈良県","นาระ","近畿地方","ならけん","奈良市","ならし","ナラノヤエザクラ","スギ","コマドリ"),
    ("30","wakayama","Wakayama","和歌山県","วากายามะ","近畿地方","わかやまけん","和歌山市","わかやまし","ウメ","ウバメガシ","メジロ"),
    ("31","tottori","Tottori","鳥取県","ทตโตริ","中国地方","とっとりけん","鳥取市","とっとりし","ナシの花","ダイセンキャラボク","オシドリ"),
    ("32","shimane","Shimane","島根県","ชิมาเนะ","中国地方","しまねけん","松江市","まつえし","ボタン","クロマツ","ハクチョウ"),
    ("33","okayama","Okayama","岡山県","โอกายามะ","中国地方","おかやまけん","岡山市","おかやまし","モモの花","アカマツ","キジ"),
    ("34","hiroshima","Hiroshima","広島県","ฮิโรชิมะ","中国地方","ひろしまけん","広島市","ひろしまし","モミジ","モミジ","アビ"),
    ("35","yamaguchi","Yamaguchi","山口県","ยามากุจิ","中国地方","やまぐちけん","山口市","やまぐちし","ナツミカンの花","アカマツ","ナベヅル"),
    ("36","tokushima","Tokushima","徳島県","โทกุชิมะ","四国地方","とくしまけん","徳島市","とくしまし","スダチの花","ヤマモモ","シラサギ"),
    ("37","kagawa","Kagawa","香川県","คากาวะ","四国地方","かがわけん","高松市","たかまつし","オリーブ","オリーブ","ホトトギス"),
    ("38","ehime","Ehime","愛媛県","เอฮิเมะ","四国地方","えひめけん","松山市","まつやまし","ミカンの花","マツ","コマドリ"),
    ("39","kochi","Kochi","高知県","โคจิ","四国地方","こうちけん","高知市","こうちし","ヤマモモ","ヤナセスギ","ヤイロチョウ"),
    ("40","fukuoka","Fukuoka","福岡県","ฟุกุโอกะ","九州・沖縄地方","ふくおかけん","福岡市","ふくおかし","ウメ","ツツジ","ウグイス"),
    ("41","saga","Saga","佐賀県","ซากะ","九州・沖縄地方","さがけん","佐賀市","さがし","クスの花","クスノキ","カササギ"),
    ("42","nagasaki","Nagasaki","長崎県","นางาซากิ","九州・沖縄地方","ながさきけん","長崎市","ながさきし","ウンゼンツツジ","ヒノキ","オシドリ"),
    ("43","kumamoto","Kumamoto","熊本県","คุมาโมโตะ","九州・沖縄地方","くまもとけん","熊本市","くまもとし","リンドウ","クスノキ","ヒバリ"),
    ("44","oita","Oita","大分県","โออิตะ","九州・沖縄地方","おおいたけん","大分市","おおいたし","ブンゴウメ","ブンゴウメ","メジロ"),
    ("45","miyazaki","Miyazaki","宮崎県","มิยาซากิ","九州・沖縄地方","みやざきけん","宮崎市","みやざきし","ハマユウ","ヤマザクラ","コシジロヤマドリ"),
    ("46","kagoshima","Kagoshima","鹿児島県","คาโกชิมะ","九州・沖縄地方","かごしまけん","鹿児島市","かごしまし","ミヤマキリシマ","クスノキ","ルリカケス"),
    ("47","okinawa","Okinawa","沖縄県","โอกินาวะ","九州・沖縄地方","おきなわけん","那覇市","なはし","デイゴ","リュウキュウマツ","ノグチゲラ"),
]

NAME_TO_META = {row[3]: row for row in PREFECTURES}

# P1082 rows are fetched per statement (not via truthy wdt:) so the
# point-in-time qualifier (P585) gives population_year; ranks resolve ties.
SPARQL_TEMPLATE = """SELECT ?item ?nameJa ?nameEn ?population ?rank ?popTime ?area WHERE {
  ?item {P31_CLAUSE} wd:Q50337 .
  ?item rdfs:label ?nameJa .
  FILTER(LANG(?nameJa) = "ja")
  OPTIONAL {
    ?item p:P1082 ?pstmt .
    ?pstmt ps:P1082 ?population .
    ?pstmt wikibase:rank ?rank .
    OPTIONAL { ?pstmt pq:P585 ?popTime . }
  }
  OPTIONAL { ?item rdfs:label ?nameEn . FILTER(LANG(?nameEn) = "en") }
  OPTIONAL { ?item wdt:P2046 ?area . }
}"""

NARROW_QUERY = SPARQL_TEMPLATE.replace("{P31_CLAUSE}", "wdt:P31")
WIDE_QUERY = SPARQL_TEMPLATE.replace("{P31_CLAUSE}", "wdt:P31/wdt:P279*")

RANK_WEIGHT = {"PreferredRank": 2, "NormalRank": 1, "DeprecatedRank": 0}


def fetch_sparql(query):
    url = SPARQL_ENDPOINT + "?query=" + urllib.parse.quote(query)
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/sparql-results+json",
        },
    )
    last_error = None
    for attempt in range(FETCH_RETRIES):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if 400 <= error.code < 500 and error.code != 429:
                print(f"❌ SPARQL request rejected (HTTP {error.code}); not retrying: {error}")
                sys.exit(1)
            last_error = error
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            last_error = error
        print(f"   ⚠️  SPARQL attempt {attempt + 1}/{FETCH_RETRIES} failed: {last_error}")
        if attempt < FETCH_RETRIES - 1:
            wait = RETRY_BACKOFF_S * (attempt + 1)
            print(f"   ⏳ Retrying in {wait}s ...")
            time.sleep(wait)
    print(f"❌ SPARQL fetch failed after {FETCH_RETRIES} attempts: {last_error}")
    sys.exit(1)


def collect_items(bindings):
    by_item = {}
    for binding in bindings:
        item = binding["item"]["value"]
        rec = by_item.setdefault(item, {"nameJa": None, "nameEn": set(), "pops": [], "area": None})
        rec["nameJa"] = binding["nameJa"]["value"]
        if "nameEn" in binding:
            rec["nameEn"].add(binding["nameEn"]["value"])
        if "population" in binding:
            rank = binding.get("rank", {}).get("value", "").rsplit("#", 1)[-1]
            rec["pops"].append((rank, binding.get("popTime", {}).get("value"), binding["population"]["value"]))
        if rec["area"] is None and "area" in binding:
            rec["area"] = binding["area"]["value"]
    return by_item


def en_label_matches(romaji, name_en):
    lowered = name_en.lower()
    return lowered in (romaji.lower(), romaji.lower() + " prefecture", romaji.lower() + " metropolis")


def pick_population(rec):
    if not rec["pops"]:
        return None, None
    ranked = sorted(
        rec["pops"],
        key=lambda p: (RANK_WEIGHT.get(p[0], 0), p[1] or ""),
        reverse=True,
    )
    rank, pop_time, value = ranked[0]
    year = pop_time[:4] if pop_time else None
    return value, year


def match_prefectures(by_item):
    matches = {}
    for name_ja, meta in NAME_TO_META.items():
        candidates = [item for item, rec in by_item.items() if rec["nameJa"] == name_ja]
        if len(candidates) > 1:
            romaji = meta[2]
            filtered = [
                item
                for item in candidates
                if any(en_label_matches(romaji, en) for en in by_item[item]["nameEn"])
            ]
            if len(filtered) == 1:
                candidates = filtered
        if len(candidates) != 1:
            print(f"❌ Name {name_ja!r} matched {len(candidates)} Wikidata items; expected exactly 1.")
            sys.exit(1)
        matches[name_ja] = candidates[0]
    return matches


def render_file(meta, population, pop_year, area):
    code, slug, romaji, name_ja, name_th, region, hira, capital, capital_hira, flower, tree, bird = meta
    lines = [
        f"## {name_ja}",
        "",
        f"- code: {code}",
        f"- slug: {slug}",
        f"- name_ja: {name_ja}",
        f"- name_hira: {hira}",
        f"- name_romaji: {romaji}",
        f"- name_th: {name_th}",
        f"- region: {region}",
        f"- capital: {capital}",
        f"- capital_reading: {capital_hira}",
        f"- population: {population if population else ''}",
    ]
    if pop_year:
        lines.append(f"- population_year: {pop_year}")
    lines += [
        f"- area_km2: {area if area else ''}",
        f"- flower: {flower}",
        f"- tree: {tree}",
        f"- bird: {bird}",
        "- etymology:",
        "",
        "### Places",
        "",
        "### Products",
        "",
    ]
    return "\n".join(lines)


def validate():
    errors = []
    if not os.path.isdir(PREFECTURES_DIR):
        print(f"❌ Missing directory: {PREFECTURES_DIR}")
        sys.exit(1)
    files = sorted(f for f in os.listdir(PREFECTURES_DIR) if f.endswith(".md"))
    expected_files = {meta[1] + ".md" for meta in PREFECTURES}
    missing = sorted(expected_files - set(files))
    extra = sorted(set(files) - expected_files)
    if missing:
        errors.append(f"missing files: {missing}")
    if extra:
        errors.append(f"unexpected files: {extra}")
    if len(files) != 47:
        errors.append(f"expected 47 markdown files, found {len(files)}")

    required_fields = ["code", "slug", "name_ja", "name_hira", "name_romaji", "name_th",
                       "region", "capital", "capital_reading", "population",
                       "population_year", "area_km2", "flower", "tree", "bird", "etymology"]

    for meta in PREFECTURES:
        code, slug, _, name_ja, _, _, _, _, _, _, _, _ = meta
        path = os.path.join(PREFECTURES_DIR, slug + ".md")
        if not os.path.exists(path):
            continue
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
        lines = text.split("\n")
        if not lines or lines[0] != f"## {name_ja}":
            errors.append(f"{slug}: heading must be '## {name_ja}', got {lines[0] if lines else '<empty>'!r}")
        fields = {}
        for line in lines:
            if line.startswith("### "):
                break
            stripped = line
            if stripped.startswith("- ") and ":" in stripped:
                key, _, value = stripped[2:].partition(":")
                fields[key.strip()] = value.strip()
        for field in required_fields:
            if field not in fields:
                errors.append(f"{slug}: missing field {field}")
            elif not fields[field]:
                errors.append(f"{slug}: empty field {field}")

        section = None
        counts = {"Places": 0, "Products": 0}
        for line in lines:
            if line.startswith("### "):
                section = line[4:].strip()
            elif line.startswith("- ") and section in counts:
                counts[section] += 1
        for section, minimum in (("Places", 3), ("Products", 3)):
            if counts[section] < minimum:
                errors.append(f"{slug}: {section.lower()} count {counts[section]} < {minimum}")

    if errors:
        print(f"❌ Validation failed with {len(errors)} problem(s):")
        for error in errors:
            print(f"   - {error}")
        sys.exit(1)
    print("✅ Validation passed: 47 prefecture files complete (fields, etymology, >=3 places, >=3 products).")


def main():
    parser = argparse.ArgumentParser(description="Create content/prefectures/<slug>.md files.")
    parser.add_argument("--force", action="store_true", help="Overwrite existing files (default: additive only).")
    parser.add_argument("--validate", action="store_true", help="Validate existing files instead of creating.")
    args = parser.parse_args()

    if args.validate:
        validate()
        return

    print(f"⬇️  Fetching prefecture facts from Wikidata ({date.today().isoformat()}) ...")
    by_item = collect_items(fetch_sparql(NARROW_QUERY)["results"]["bindings"])
    found_names = {rec["nameJa"] for rec in by_item.values()}
    if not set(NAME_TO_META) <= found_names:
        print("   Narrow P31 query missed some names; retrying with wdt:P31/wdt:P279* ...")
        by_item = collect_items(fetch_sparql(WIDE_QUERY)["results"]["bindings"])
    matches = match_prefectures(by_item)

    created = 0
    skipped = 0
    empty_stats = []
    os.makedirs(PREFECTURES_DIR, exist_ok=True)
    for meta in PREFECTURES:
        slug = meta[1]
        path = os.path.join(PREFECTURES_DIR, slug + ".md")
        if os.path.exists(path) and not args.force:
            skipped += 1
            continue
        rec = by_item[matches[meta[3]]]
        population, pop_year = pick_population(rec)
        if not population or not rec["area"]:
            empty_stats.append(slug)
        with open(path, "w", encoding="utf-8") as f:
            f.write(render_file(meta, population, pop_year, rec["area"]))
        created += 1

    print(f"✅ Created {created} files, skipped {skipped} existing. Fetch date: {date.today().isoformat()}")
    pop_year_counts = sum(1 for meta in PREFECTURES if pick_population(by_item[matches[meta[3]]])[1])
    print(f"   population_year available for {pop_year_counts}/47 prefectures.")
    if empty_stats:
        print(f"   ⚠️  Missing population or area for: {', '.join(empty_stats)}")


if __name__ == "__main__":
    main()
