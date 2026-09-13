#!/usr/bin/env python3
"""
build_prefectures_map.py
Builds data/prefectures-map.json: simplified SVG path geometry for the 47
Japanese prefectures, matched against the canonical prefecture table below.

Source: https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson
Licence: MIT (dataofjapan/land; derived from MLIT 国土数値情報, CC BY 4.0 —
see about.html).

Usage:
  python3 scripts/build_prefectures_map.py [--source /path/to/japan.geojson]

This is generated reference data (not markdown-sourced). It is committed and
excluded from the markdown drift check; output is validated at build time
(count, size, geometry sanity).
"""

import argparse
import hashlib
import json
import math
import os
import sys
import urllib.request

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
OUT = os.path.join(DATA_DIR, "prefectures-map.json")

SOURCE_URL = "https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson"
# Recorded for provenance; a mismatch is a warning, not an error.
EXPECTED_SHA256 = "b2fa31a9ce37c006904a06b8afcaeaf5ceeff40ae365eca167e09fbfff052f00"

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

LAT_CORRECTION = math.cos(math.radians(36.5))
SCALE = 1000.0
TOLERANCE = 0.05
PAD = 10.0
MAX_SIZE_KB = 2000

# Set once in main() so projected paths fit "0 0 W H"; bounds pass fills these.
OFFSET_X = 0.0
OFFSET_Y = 0.0


def read_source(path):
    if path:
        with open(path, "rb") as f:
            return f.read()
    print(f"⬇️  Downloading japan.geojson ...")
    request = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "daijoubu-jp-build-prefectures-map"})
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read()


def iter_rings(geometry):
    gtype = geometry["type"]
    if gtype == "Polygon":
        polys = [geometry["coordinates"]]
    elif gtype == "MultiPolygon":
        polys = geometry["coordinates"]
    else:
        raise ValueError(f"Unsupported geometry type: {gtype}")
    for poly in polys:
        yield from poly


def project(lon, lat):
    lon_rad = math.radians(lon)
    lat_rad = math.radians(lat)
    return (lon_rad * LAT_CORRECTION * SCALE, -lat_rad * SCALE)


def simplify_ring(points, tolerance):
    n = len(points)
    if n < 3:
        return points[:]
    keep = [False] * n
    keep[0] = keep[n - 1] = True
    stack = [(0, n - 1)]
    while stack:
        start, end = stack.pop()
        if end <= start + 1:
            continue
        ax, ay = points[start]
        bx, by = points[end]
        dx, dy = bx - ax, by - ay
        seg_len = math.hypot(dx, dy)
        max_dist = -1.0
        max_idx = -1
        for i in range(start + 1, end):
            px, py = points[i]
            if seg_len == 0:
                dist = math.hypot(px - ax, py - ay)
            else:
                dist = abs(dx * (py - ay) - dy * (px - ax)) / seg_len
            if dist > max_dist:
                max_dist = dist
                max_idx = i
        if max_dist > tolerance:
            keep[max_idx] = True
            stack.append((start, max_idx))
            stack.append((max_idx, end))
    return [points[i] for i in range(n) if keep[i]]


def ring_coords(points, tolerance):
    pts = simplify_ring([project(lon, lat) for lon, lat in points], tolerance)
    coords = []
    prev = None
    for x, y in pts:
        xy = (round(x, 2), round(y, 2))
        if xy != prev:
            coords.append(xy)
            prev = xy
    if len(coords) > 1 and coords[0] == coords[-1]:
        coords.pop()
    return coords if len(coords) >= 3 else []


def feature_coords(geometry, tolerance):
    coords = []
    for ring in iter_rings(geometry):
        c = ring_coords(ring, tolerance)
        if c:
            coords.append(c)
    return coords


def ring_to_path(coords):
    return "M " + " L ".join(f"{x + OFFSET_X:.2f},{y + OFFSET_Y:.2f}" for x, y in coords) + " Z"


def feature_to_path(coords_list):
    return " ".join(ring_to_path(c) for c in coords_list)


def main():
    global OFFSET_X, OFFSET_Y

    parser = argparse.ArgumentParser(description="Build data/prefectures-map.json.")
    parser.add_argument("--source", help="Path to a local japan.geojson instead of downloading.")
    args = parser.parse_args()

    raw = read_source(args.source)
    digest = hashlib.sha256(raw).hexdigest()
    print(f"   sha256: {digest}")
    if digest != EXPECTED_SHA256:
        print("   ⚠️  sha256 differs from the recorded source; output may change.")

    data = json.loads(raw)

    feature_coord_lists = []
    for feat in data["features"]:
        feature_coord_lists.append(feature_coords(feat["geometry"], TOLERANCE))

    if not any(feature_coord_lists):
        print("❌ Source geometry has no usable coordinates.")
        sys.exit(1)
    minx = min(pt[0] for coords in feature_coord_lists for c in coords for pt in c)
    maxx = max(pt[0] for coords in feature_coord_lists for c in coords for pt in c)
    miny = min(pt[1] for coords in feature_coord_lists for c in coords for pt in c)
    maxy = max(pt[1] for coords in feature_coord_lists for c in coords for pt in c)
    OFFSET_X = -minx + PAD
    OFFSET_Y = -miny + PAD

    paths = {}
    seen = set()
    for feat, coords_list in zip(data["features"], feature_coord_lists):
        props = feat["properties"]
        name = props.get("nam_ja")
        meta = NAME_TO_META.get(name)
        if meta is None:
            print(f"❌ Unmatched geometry name: {name!r}")
            sys.exit(1)
        raw_id = props.get("id")
        if not isinstance(raw_id, int):
            print(f"❌ Missing or invalid id for {name!r}.")
            sys.exit(1)
        code = f"{raw_id:02d}"
        if code != meta[0]:
            print(f"❌ Geometry id {code} does not match table code {meta[0]} for {name}.")
            sys.exit(1)
        if name in seen:
            print(f"❌ Duplicate geometry feature for {name!r}.")
            sys.exit(1)
        if not coords_list:
            print(f"❌ Empty geometry for {name!r}.")
            sys.exit(1)
        seen.add(name)
        paths[meta[0]] = feature_to_path(coords_list)

    missing = [row[0] for row in PREFECTURES if row[0] not in paths]
    if missing:
        print(f"❌ No geometry found for codes: {', '.join(missing)}")
        sys.exit(1)

    width = round(maxx - minx + 2 * PAD, 2)
    height = round(maxy - miny + 2 * PAD, 2)
    payload = {
        "viewBox": f"0 0 {width} {height}",
        "prefectures": [
            {"code": row[0], "slug": row[1], "name_ja": row[3], "path": paths[row[0]]}
            for row in sorted(PREFECTURES)
        ],
    }

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = os.path.getsize(OUT) / 1024
    print(f"✅ Wrote {len(payload['prefectures'])} prefecture paths ({size_kb:.0f} KB) to {OUT}")
    if len(payload["prefectures"]) != 47:
        print("❌ Expected 47 prefecture paths.")
        sys.exit(1)
    if size_kb > MAX_SIZE_KB:
        print(f"❌ Output exceeds {MAX_SIZE_KB} KB budget.")
        sys.exit(1)


if __name__ == "__main__":
    main()
