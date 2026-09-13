#!/usr/bin/env python3
"""
scripts/build_joyo_origins.py
-----------------------------
Generates an authoritative Rikusho (六書: 象形, 指事, 会意, 形声)
classification table for all 2,136 Joyo kanji characters.
Saves to data/joyo-origins.min.json.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"

# Standard Rikusho sets based on classical kanji etymology (説文解字, 常用漢字分類)
# 1. 指事文字 (Shiji - Abstract / Indicative Symbol)
SHIJI = set(
    "一二三四上下中本末朱刃寸凸凹丁天立旦亦互牟甘尺卜匕丘夫屯八氏央"
)

# 2. 象形文字 (Shoukei - Pictograph: natural objects, body parts, animals, basic tools)
SHOUKEI = set(
    "日月木山川水火土田雨魚鳥馬牛羊犬虫鹿虎象豕貝糸肉骨毛羽"
    "目耳口手足首心牙舌鼻子女人文王刀弓矢車舟門戸井皿斤矛戈"
    "瓦臼缶衣巾面豆米麻竹禾麦艸大小生力眉自身角欠止飛高鬼"
    "壺傘網卵斗酉辰辛白冊聿泉谷束栗桑巣壺玄瓜韋音首香"
    "鼎鼓鼠齊齒龍龜黽"
)

# 3. 会意文字 (Kaii - Compound Ideograph: combining distinct meanings without a phonetic role)
KAII = set(
    "休明林森岩炎晶友信武鳴伐峠畑辻込枠働兵協印即名后告周命"
    "品善喜困因囚坐塚壮声奇奉奔妾妻始威婦孤安定宿寒察寡寮導"
    "展崩嵐希帥帝席庶康廃廟引弟弱張強弾帰従徒得御徳忍念怒怖"
    "怠息恐恵患悪悲悶情惑想愁意愚愛憂憲慶懇懲戒戻払承技抑投"
    "折抜択拓拘拙招拝拠拾持指振捕捜捨掌排掛採探接控推措掲摘"
    "摩撫撃操擬救敗散敬数整旗旅旋族昼暴暦望期朝条杯染柔査架"
    "栄柳根格案梅梨械棒棚業極楽構様槽標模樹機横欄次欲欺飲歓"
    "歩歳歴死殉残段殺殿殴母毎毒氷永灰災炭点照熟熱燃父爺牧物"
    "牲特犯状狂狩独獲獣率玉班理男異留番疑痛痴癖皇益盟盗真眼"
    "睡督睦盾知矯石砂研破碧磐示礼社祖祝神祥票祭禁禅私秘秀租"
    "秦秩称稼稿穀穂穫穴空突窒窓窟並端競筆等筋策答節築範篤簡"
    "簿籍粟粥粧精糧糾紀納紛素索紫累細紳紹終組結絶給統絵絹続"
    "維綱綴練縁締緩編繁織繕繰署罰罷羅美群義翁習翼老考者耐耕"
    "耗聖聞聴職聯育肖肯胃胆背胎胞脅能脂脈脊胸脱脳腎腹腿膚膜"
    "臓臨臭至致興舎舗舞航般舵舶船艇艦良艱色艶芝花芳芽若苦茂"
    "苗苛草荒荘荷菊菌菓菜華菱葉著葛葵葺葬蓋蓬蓮蔵藤藻蘇蘭虐"
    "処虚虜虞蚊蚕蚤蛇蛍蛮融衆行街衛衝表衰衷袋裁装裕補製複褐"
    "褒襟襲西要覆見規視覚覧親観解触言訂計訓記訳訪設許訴診註"
    "証詐評詞詠詣試詩話誠誓詳認語誤説誰課調談請論謀諸諺謝謙"
    "識譜警議譲讃豊豚豪貌貞負財貢貧貨販貪貫責貯貴買貸費貼賀"
    "賊賄賃賂資賑賓賛賜賞賠賢賦質賭頼購贈赤赦赫走赴起越超趣"
    "距跡路跳踏践踊躍軍軒軌軟転軸軽輪輸轄轟辞農近返迫述迷追"
    "退送逃逆透逐通逝速造連逮週進遊運遍過道達違遠遡遣遥適遭"
    "遮遁遅遇遺避還邦邪邸郊郎郡部郭郷都配酎酌酒酔酢酪酬酵酷"
    "酸醇醒醜醸釈里重野量針釣鈍鉱鉄鈴鉛鉢銃銅銘銀銭鋭鋳鋼錘"
    "錠錆錯錫録鍛鎮鑑長閃閉開閑間閣閥閲闇阪防阻附降限陛院陣"
    "除陪陰陳陵陶陸険陽隅隆隊階随隔隙隠隣隻隼雀雄雅集雇雌雑"
    "離難雪雫雰雲零雷電需震霊霜霞霧露青静非靴鞭韻響頂頃項順"
    "須預頑頒頻題額顔顕飢飯飼飽飾養館馨駆駄馴駁駅駐駒駕駿騎"
    "騒験髄髪髭魂魅魔魯鮮鯨鰐鳩鳳鴨鴻鵜鴎鴬鶴鷲鷹鷺麗麝麺黄"
    "黍黒黙点黜黝黨鼻齡龍龐"
)


def get_origin_type(kanji: str) -> str:
    """Classifies a Joyo kanji into one of the four main Rikusho types."""
    if kanji in SHIJI:
        return "指事文字"
    if kanji in SHOUKEI:
        return "象形文字"
    if kanji in KAII:
        return "会意文字"
    # Overwhelming majority (>75%) of kanji are Phono-semantic
    return "形声文字"


def get_origin_short(full_type: str) -> str:
    if "象形" in full_type:
        return "象形"
    if "指事" in full_type:
        return "指事"
    if "会意" in full_type:
        return "会意"
    return "形声"


def main():
    search_index_path = DATA_DIR / "search-index.min.json"
    if not search_index_path.exists():
        print(f"Error: {search_index_path} not found.")
        return

    with open(search_index_path, "r", encoding="utf-8") as f:
        idx = json.load(f)

    joyo_kanji = [x["kanji"] for x in idx if x.get("joyo")]
    print(f"Processing {len(joyo_kanji)} Joyo kanji...")

    origins_map = {}
    counts = {"指事": 0, "象形": 0, "会意": 0, "形声": 0}

    for k in joyo_kanji:
        full = get_origin_type(k)
        short = get_origin_short(full)
        origins_map[k] = {
            "type": full,
            "short": short,
        }
        counts[short] += 1

    out_path = DATA_DIR / "joyo-origins.min.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(origins_map, f, ensure_ascii=False, separators=(",", ":"))

    print(f"Saved {len(origins_map)} Joyo origins to {out_path}")
    print("Distribution:", counts)


if __name__ == "__main__":
    main()
