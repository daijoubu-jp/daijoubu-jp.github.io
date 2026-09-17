# -*- coding: utf-8 -*-
import json

vocab_data = [
    # =========================================================================
    # 1. 四字熟語 (Yojijukugo - 4-Character Idioms)
    # =========================================================================
    {
        "id": "ichigo-ichie",
        "word": "一期一会",
        "reading": "いちごいちえ",
        "romaji": "ichigo ichie",
        "category": "yojijukugo",
        "category_th": "สุภาษิต 4 ตัวอักษร (四字熟語)",
        "series": None,
        "meaning_th": "การพบกันเพียงครั้งเดียวในชีวิต (จงปฏิบัติต่อผู้อื่นด้วยความจริงใจเสมือนเป็นการพบกันครั้งสุดท้าย)",
        "meaning_en": "Once-in-a-lifetime encounter; cherish every moment",
        "ruby_html": "<ruby>一<rt>いち</rt></ruby><ruby>期<rt>ご</rt></ruby><ruby>一<rt>いち</rt></ruby><ruby>会<rt>え</rt></ruby>",
        "literal_breakdown": [
            {"char": "一", "meaning": "หนึ่ง"},
            {"char": "期", "meaning": "ช่วงเวลา / ชั่วชีวิต"},
            {"char": "一", "meaning": "หนึ่ง"},
            {"char": "会", "meaning": "การพบปะ / ประสบ"}
        ],
        "lore": "มีที่มาจากปรัชญาพิธีชงชาญี่ปุ่น (茶道) โดยปรมาจารย์ เซ็น โนะ ริคิว (千利休) สอนว่าแม้เจ้าบ้านและแขกจะเจอกันบ่อยครั้ง แต่การพบปะใน 'ขณะนี้' จะไม่มีวันเกิดขึ้นซ้ำสองได้อีก",
        "jlpt": 1,
        "kanken": "4級",
        "tags": ["ชงชา", "ปรัชญาชีวิต", "ข้อคิด"]
    },
    {
        "id": "jakuniku-kyoshoku",
        "word": "弱肉強食",
        "reading": "じゃくにくきょうしょく",
        "romaji": "jakuniku kyoushoku",
        "category": "yojijukugo",
        "category_th": "สุภาษิต 4 ตัวอักษร (四字熟語)",
        "series": None,
        "meaning_th": "ผู้อ่อนแอย่อมตกเป็นเหยื่อของผู้เข้มแข็ง (กฎแห่งป่าดงพงพี / ปลาใหญ่กินปลาเล็ก)",
        "meaning_en": "Survival of the fittest; the weak are meat the strong eat",
        "ruby_html": "<ruby>弱<rt>じゃく</rt></ruby><ruby>肉<rt>にく</rt></ruby><ruby>強<rt>きょう</rt></ruby><ruby>食<rt>しょく</rt></ruby>",
        "literal_breakdown": [
            {"char": "弱", "meaning": "อ่อนแอ"},
            {"char": "肉", "meaning": "เนื้อ / เหยื่อ"},
            {"char": "強", "meaning": "เข้มแข็ง / แข็งแกร่ง"},
            {"char": "食", "meaning": "กิน / กลืนกิน"}
        ],
        "lore": "มาจากข้อเขียนของกวีราชวงศ์ถัง หานอวี่ (韓愈) บรรยายธรรมชาติที่สัตว์ตัวเล็กเนื้อนุ่มมักกลายเป็นอาหารของสัตว์ที่แข็งแกร่งกว่า นิยมใช้เปรียบเทียบการต่อสู้ในสังคมและการทำธุรกิจ",
        "jlpt": 1,
        "kanken": "4級",
        "tags": ["ธรรมชาติ", "การต่อสู้", "สังคม"]
    },
    {
        "id": "kachou-fuugetsu",
        "word": "花鳥風月",
        "reading": "かちょうふうげつ",
        "romaji": "kachou fuugetsu",
        "category": "yojijukugo",
        "category_th": "สุภาษิต 4 ตัวอักษร (四字熟語)",
        "series": None,
        "meaning_th": "ความงามตามธรรมชาติ (บุปผา สกุณา สายลม และดวงจันทร์ / การดื่มด่ำความรื่นรมย์ของธรรมชาติ)",
        "meaning_en": "The beauties of nature; traditional Japanese aesthetic appreciation",
        "ruby_html": "<ruby>花<rt>か</rt></ruby><ruby>鳥<rt>ちょう</rt></ruby><ruby>風<rt>ふう</rt></ruby><ruby>月<rt>げつ</rt></ruby>",
        "literal_breakdown": [
            {"char": "花", "meaning": "ดอกไม้"},
            {"char": "鳥", "meaning": "นก"},
            {"char": "風", "meaning": "สายลม"},
            {"char": "月", "meaning": "ดวงจันทร์"}
        ],
        "lore": "คำสัญลักษณ์ตัวแทนแห่งสุนทรียศาสตร์ชั้นสูงของญี่ปุ่นโบราณ กวีและจิตรกรนิยมใช้ 4 สิ่งนี้เป็นตัวแทนแห่งฤดูกาลทั้งสี่และการแต่งบทกวีไฮกุ/วากะ",
        "jlpt": 1,
        "kanken": "4級",
        "tags": ["สุนทรียศาสตร์", "กวี", "ธรรมชาติ"]
    },
    {
        "id": "shichiten-hakki",
        "word": "七転八起",
        "reading": "しちてんはっき",
        "romaji": "shichiten hakki",
        "category": "yojijukugo",
        "category_th": "สุภาษิต 4 ตัวอักษร (四字熟語)",
        "series": None,
        "meaning_th": "ล้มเจ็ดครั้ง ลุกแปดครั้ง (ความพยายามไม่ย่อท้อต่ออุปสรรค)",
        "meaning_en": "Fall seven times, stand up eight; resilience and perseverance",
        "ruby_html": "<ruby>七<rt>しち</rt></ruby><ruby>転<rt>てん</rt></ruby><ruby>八<rt>はっ</rt></ruby><ruby>起<rt>き</rt></ruby>",
        "literal_breakdown": [
            {"char": "七", "meaning": "เจ็ด"},
            {"char": "転", "meaning": "ล้ม / กลิ้ง"},
            {"char": "八", "meaning": "แปด"},
            {"char": "起", "meaning": "ลุกขึ้น / ยืนหยัด"}
        ],
        "lore": "เป็นที่มาของตุ๊กตาล้มลุกดารุมะ (達磨) ซึ่งไม่ว่าจะถูกผลักให้ล้มกี่ครั้งก็จะเด้งกลับขึ้นมาตั้งตรงได้เสมอ เป็นสัญลักษณ์แห่งชัยชนะและความมานะบากบั่นของชาวญี่ปุ่น",
        "jlpt": 2,
        "kanken": "4級",
        "tags": ["กำลังใจ", "ดารุมะ", "ความพยายาม"]
    },
    {
        "id": "meikyou-shisui",
        "word": "明鏡止水",
        "reading": "めいきょうしすい",
        "romaji": "meikyou shisui",
        "category": "yojijukugo",
        "category_th": "สุภาษิต 4 ตัวอักษร (四字熟語)",
        "series": None,
        "meaning_th": "จิตใจที่สงบนิ่งและบริสุทธิ์ ไร้ความขุ่นมัว (ดั่งกระจกใสและผิวน้ำที่นิ่งสงบ)",
        "meaning_en": "A clear mirror and still water; serene and untroubled state of mind",
        "ruby_html": "<ruby>明<rt>めい</rt></ruby><ruby>鏡<rt>きょう</rt></ruby><ruby>止<rt>し</rt></ruby><ruby>水<rt>すい</rt></ruby>",
        "literal_breakdown": [
            {"char": "明", "meaning": "กระจ่าง / สว่าง"},
            {"char": "鏡", "meaning": "กระจกเงา"},
            {"char": "止", "meaning": "หยุด / นิ่งสงบ"},
            {"char": "水", "meaning": "น้ำ"}
        ],
        "lore": "มาจากคัมภีร์ *จวงจื่อ (荘子)* กล่าวว่าเมื่อน้ำนิ่งสนิท จึงจะสะท้อนภาพทุกสิ่งได้อย่างเที่ยงตรง จิตใจของคนเราเมื่อไร้ซึ่งกิเลสและความฟุ้งซ่าน ย่อมมองเห็นความจริงของสรรพสิ่ง",
        "jlpt": 1,
        "kanken": "3級",
        "tags": ["ปรัชญา", "เซน", "สมาธิ"]
    },
    {
        "id": "shinra-banshou",
        "word": "森羅万象",
        "reading": "しんらばんしょう",
        "romaji": "shinra banshou",
        "category": "yojijukugo",
        "category_th": "สุภาษิต 4 ตัวอักษร (四字熟語)",
        "series": None,
        "meaning_th": "สรรพสิ่งทั้งมวลในจักรวาล (ปรากฏการณ์และสิ่งมีชีวิตทุกสิ่งที่ดำรงอยู่)",
        "meaning_en": "All creation; all things under the sun in the universe",
        "ruby_html": "<ruby>森<rt>しん</rt></ruby><ruby>羅<rt>ら</rt></ruby><ruby>万<rt>ばん</rt></ruby><ruby>象<rt>しょう</rt></ruby>",
        "literal_breakdown": [
            {"char": "森", "meaning": "ป่าดึกดำบรรพ์ / เรียงรายหนาแน่น"},
            {"char": "羅", "meaning": "แผ่ขยาย / กว้างไกล"},
            {"char": "万", "meaning": "หมื่น / นับไม่ถ้วน"},
            {"char": "象", "meaning": "รูปธรรม / สภาพ / ปรากฏการณ์"}
        ],
        "lore": "คำศัพท์ทางพุทธศาสนานิกายมหายาน อธิบายความหลากหลายอันไร้ขอบเขตของธรรมชาติ นิยมพบบ่อยในมังงะและแฟนตาซีเมื่อพูดถึงพลังที่ควบคุมทุกสรรพสิ่งในจักรวาล",
        "jlpt": 1,
        "kanken": "3級",
        "tags": ["จักรวาล", "พุทธศาสนา", "ธรรมชาติ"]
    },
    {
        "id": "shippuu-jinrai",
        "word": "疾風迅雷",
        "reading": "しっぷうじんらい",
        "romaji": "shippuu jinrai",
        "category": "yojijukugo",
        "category_th": "สุภาษิต 4 ตัวอักษร (四字熟語)",
        "series": None,
        "meaning_th": "รวดเร็วปานลมพายุ ฉับพลันดั่งอสุนีบาต (การเคลื่อนไหวที่ฉับไว รุนแรง และไม่ทันตั้งตัว)",
        "meaning_en": "Swift as a gale, sudden as lightning; with lightning speed and fierce intensity",
        "ruby_html": "<ruby>疾<rt>しっ</rt></ruby><ruby>風<rt>ぷう</rt></ruby><ruby>迅<rt>じん</rt></ruby><ruby>雷<rt>らい</rt></ruby>",
        "literal_breakdown": [
            {"char": "疾", "meaning": "รวดเร็ว / ฉับพลัน"},
            {"char": "風", "meaning": "สายลม"},
            {"char": "迅", "meaning": "รวดเร็ว / ว่องไว"},
            {"char": "雷", "meaning": "สายฟ้า / ฟ้าร้อง"}
        ],
        "lore": "ปรากฏในคัมภีร์ *หลี่จี้ (礼記)* ใช้บรรยายการเคลื่อนทัพหรือความเร็วอันเหนือชั้น เป็นที่มาของชื่อท่าไม้ตายและคาถานินจาในหลายวรรณกรรมร่วมสมัย",
        "jlpt": 1,
        "kanken": "2級",
        "tags": ["ความเร็ว", "สายฟ้า", "กลยุทธ์"]
    },
    {
        "id": "gashin-shoutan",
        "word": "臥薪嘗胆",
        "reading": "がしんしょうたん",
        "romaji": "gashin shoutan",
        "category": "yojijukugo",
        "category_th": "สุภาษิต 4 ตัวอักษร (四字熟語)",
        "series": None,
        "meaning_th": "นอนบนฟืน ชิมดีสัตว์ขมขื่น (ยอมทนความยากลำบากแสนสาหัสเพื่อรอคอยวันล้างแค้นหรือประสบความสำเร็จ)",
        "meaning_en": "Sleeping on brushwood and tasting gall; enduring hardships to achieve vengeance/ambition",
        "ruby_html": "<ruby>臥<rt>が</rt></ruby><ruby>薪<rt>しん</rt></ruby><ruby>嘗<rt>しょう</rt></ruby><ruby>胆<rt>たん</rt></ruby>",
        "literal_breakdown": [
            {"char": "臥", "meaning": "นอนทอดกาย"},
            {"char": "薪", "meaning": "ท่อนฟืน / หนามฟืน"},
            {"char": "嘗", "meaning": "ชิม / ลิ้มรส"},
            {"char": "胆", "meaning": "ถุงน้ำดี (รสขม)"}
        ],
        "lore": "จากพงศาวดารศึกระหว่างแคว้นอู๋และแคว้นเยว่ในยุคชุนชิว ฟูชาทนนอนบนฟืนหนามเพื่อไม่ให้ลืมความแค้น ส่วนโกวเจี้ยนแขวนถุงน้ำดีไว้ชิมรสขมก่อนนอนทุกคืนเพื่อเตือนใจตนเอง",
        "jlpt": 1,
        "kanken": "2級",
        "tags": ["ประวัติศาสตร์", "ความมุ่งมั่น", "ความแค้น"]
    },
    {
        "id": "onko-chishin",
        "word": "温故知新",
        "reading": "おんこちしん",
        "romaji": "onko chishin",
        "category": "yojijukugo",
        "category_th": "สุภาษิต 4 ตัวอักษร (四字熟語)",
        "series": None,
        "meaning_th": "ทบทวนเรื่องเก่าเพื่อเข้าใจสิ่งใหม่ (ศึกษาประวัติศาสตร์และรากเหง้าเพื่อพัฒนาองค์ความรู้ใหม่)",
        "meaning_en": "Learning from the past to develop new perspectives",
        "ruby_html": "<ruby>温<rt>おん</rt></ruby><ruby>故<rt>こ</rt></ruby><ruby>知<rt>ち</rt></ruby><ruby>新<rt>しん</rt></ruby>",
        "literal_breakdown": [
            {"char": "温", "meaning": "อุ่น / ทบทวนสิ่งเดิม"},
            {"char": "故", "meaning": "เรื่องเก่า / ประวัติศาสตร์"},
            {"char": "知", "meaning": "ล่วงรู้ / เข้าใจ"},
            {"char": "新", "meaning": "สิ่งใหม่ / นวัตกรรม"}
        ],
        "lore": "คำสอนอันทรงคุณค่าจาก *คัมภีร์หลุนอวี่ (論語)* ของขงจื๊อ กล่าวว่า 'ผู้ที่สามารถทบทวนอดีตจนต่อยอดสู่ความรู้ใหม่ได้ ผู้นั้นจึงคู่ควรเป็นอาจารย์'",
        "jlpt": 2,
        "kanken": "4級",
        "tags": ["การเรียนรู้", "ขงจื๊อ", "ประวัติศาสตร์"]
    },
    {
        "id": "juunin-toiro",
        "word": "十人十色",
        "reading": "じゅうにんといろ",
        "romaji": "juunin toiro",
        "category": "yojijukugo",
        "category_th": "สุภาษิต 4 ตัวอักษร (四字熟語)",
        "series": None,
        "meaning_th": "สิบคนสิบสี (ต่างคนต่างความคิด จิตใจและรสนิยมของแต่ละคนย่อมแตกต่างกัน)",
        "meaning_en": "Ten people, ten colors; everyone has their own distinct personality",
        "ruby_html": "<ruby>十<rt>じゅう</rt></ruby><ruby>人<rt>にん</rt></ruby><ruby>十<rt>と</rt></ruby><ruby>色<rt>いろ</rt></ruby>",
        "literal_breakdown": [
            {"char": "十", "meaning": "สิบ"},
            {"char": "人", "meaning": "คน / มนุษย์"},
            {"char": "十", "meaning": "สิบ"},
            {"char": "色", "meaning": "สี / บุคลิกภาพ"}
        ],
        "lore": "สุภาษิตยอดนิยมที่คนญี่ปุ่นใช้พูดถึงการเคารพความหลากหลายและความเป็นปัจเจกของแต่ละบุคคล โดย 'สิบสี' สื่อถึงบุคลิกและเฉดความคิดที่มีเอกลักษณ์เฉพาะตัว",
        "jlpt": 2,
        "kanken": "5級",
        "tags": ["จิตวิทยา", "ความหลากหลาย", "ชีวิตประจำวัน"]
    },

    # =========================================================================
    # 2. 動物 (Animals in Kanji)
    # =========================================================================
    {
        "id": "animal-panda",
        "word": "熊猫",
        "reading": "パンダ",
        "romaji": "panda",
        "category": "animals",
        "category_th": "สัตว์ในคันจิ (動物)",
        "series": None,
        "meaning_th": "แพนด้า (หมีแมว)",
        "meaning_en": "Giant Panda",
        "ruby_html": "<ruby>熊<rt>パン</rt></ruby><ruby>猫<rt>ダ</rt></ruby>",
        "literal_breakdown": [
            {"char": "熊", "meaning": "หมี"},
            {"char": "猫", "meaning": "แมว"}
        ],
        "lore": "ภาษาญี่ปุ่นรับคำคันจิมาจากภาษาจีนดั้งเดิม ที่สังเกตว่าเจ้าสัตว์ชนิดนี้มีรูปร่างอ้วนกลมคล้ายหมี แต่มีดวงตากลมโตและกิริยาท่าทางขี้เล่นเหมือนแมว",
        "jlpt": 1,
        "kanken": "準1級",
        "tags": ["สัตว์เลี้ยงลูกด้วยนม", "สวนสัตว์", "คำทับศัพท์"]
    },
    {
        "id": "animal-dolphin",
        "word": "海豚",
        "reading": "いるか",
        "romaji": "iruka",
        "category": "animals",
        "category_th": "สัตว์ในคันจิ (動物)",
        "series": None,
        "meaning_th": "โลมา (หมูทะเล)",
        "meaning_en": "Dolphin",
        "ruby_html": "<ruby>海<rt>い</rt></ruby><ruby>豚<rt>るか</rt></ruby>",
        "literal_breakdown": [
            {"char": "海", "meaning": "ทะเล"},
            {"char": "豚", "meaning": "หมู"}
        ],
        "lore": "เป็นคำอ่านแบบพิเศษ (熟字訓: Jukujikun) คันจิตัว 豚 (หมู) มาจากลักษณะของเนื้อโลมาและเสียงร้องแหลมสั้นที่คนจีนและญี่ปุ่นโบราณเทียบเคียงกับหมู",
        "jlpt": 2,
        "kanken": "準1級",
        "tags": ["ทะเล", "Jukujikun", "สัตว์น้ำ"]
    },
    {
        "id": "animal-whale",
        "word": "鯨",
        "reading": "くじら",
        "romaji": "kujira",
        "category": "animals",
        "category_th": "สัตว์ในคันจิ (動物)",
        "series": None,
        "meaning_th": "วาฬ",
        "meaning_en": "Whale",
        "ruby_html": "<ruby>鯨<rt>くじら</rt></ruby>",
        "literal_breakdown": [
            {"char": "魚", "meaning": "หมวดปลา (Radical ปลา)"},
            {"char": "京", "meaning": "ใหญ่โตมโหฬาร / เมืองหลวง"}
        ],
        "lore": "ตัวอักษร 鯨 ประกอบด้วย 魚 (ปลา) + 京 (ยิ่งใหญ่/มหึมา) สื่อถึง 'สัตว์ทะเลที่มีขนาดตัวมโหฬารดั่งเมืองหลวง'",
        "jlpt": 1,
        "kanken": "2級",
        "tags": ["มหาสมุทร", "สัตว์น้ำ", "โจโยคันจิ"]
    },
    {
        "id": "animal-squid",
        "word": "烏賊",
        "reading": "いか",
        "romaji": "ika",
        "category": "animals",
        "category_th": "สัตว์ในคันจิ (動物)",
        "series": None,
        "meaning_th": "ปลาหมึก (โจรแห่งกาดำ)",
        "meaning_en": "Squid / Cuttlefish",
        "ruby_html": "<ruby>烏<rt>い</rt></ruby><ruby>賊<rt>か</rt></ruby>",
        "literal_breakdown": [
            {"char": "烏", "meaning": "อีกา"},
            {"char": "賊", "meaning": "โจร / ผู้ลักขโมย"}
        ],
        "lore": "นิทานพื้นบ้านจีนโบราณเล่าว่า ปลาหมึกมักลอยนิ่งแกล้งทำเป็นตายบนผิวน้ำ พอนกกาบินลงมาจะโฉบกิน ปลาหมึกจะตวัดหนวดยึดดึงนกกาจมลงไปกินในน้ำ จึงได้ฉายาว่า 'โจรปล้นอีกา'",
        "jlpt": 1,
        "kanken": "1級",
        "tags": ["อาหารทะเล", "Jukujikun", "นิทานโบราณ"]
    },
    {
        "id": "animal-octopus",
        "word": "蛸",
        "reading": "たこ",
        "romaji": "tako",
        "category": "animals",
        "category_th": "สัตว์ในคันจิ (動物)",
        "series": None,
        "meaning_th": "ปลาหมึกยักษ์ (ทาโกะ)",
        "meaning_en": "Octopus",
        "ruby_html": "<ruby>蛸<rt>たこ</rt></ruby>",
        "literal_breakdown": [
            {"char": "虫", "meaning": "หมวดสัตว์ตัวเล็ก/แมลง/สัตว์เลื้อยคลาน"},
            {"char": "肖", "meaning": "คล้ายคลึง / เลือนราง"}
        ],
        "lore": "บางครั้งเขียนเป็น 章魚 ในภาษาจีน แต่ในภาษาญี่ปุ่นนิยมใช้ตัว 蛸 (มีหมวดแมลง 虫 เพราะในอดีตนับสัตว์ไร้กระดูกสันหลังรวมในหมวดนี้)",
        "jlpt": 1,
        "kanken": "準1級",
        "tags": ["ทาโกะยากิ", "อาหารญี่ปุ่น", "สัตว์น้ำ"]
    },
    {
        "id": "animal-bat",
        "word": "蝙蝠",
        "reading": "こうもり",
        "romaji": "koumori",
        "category": "animals",
        "category_th": "สัตว์ในคันจิ (動物)",
        "series": None,
        "meaning_th": "ค้างคาว",
        "meaning_en": "Bat",
        "ruby_html": "<ruby>蝙<rt>こう</rt></ruby><ruby>蝠<rt>もり</rt></ruby>",
        "literal_breakdown": [
            {"char": "蝙", "meaning": "ค้างคาว (บินวนเวียน)"},
            {"char": "蝠", "meaning": "ค้างคาว (พ้องเสียงกับคำว่า 福 โชคลาภ)"}
        ],
        "lore": "ในวัฒนธรรมเอเชียโบราณ ค้างคาวเป็นสัตว์มงคลเนื่องจากคำว่า 蝠 (Fú) ออกเสียงพ้องกับ 福 (ความสุข/โชคลาภ) จึงมักปรากฏเป็นลวดลายประดับในกิโมโนและเครื่องปั้นดินเผา",
        "jlpt": 1,
        "kanken": "1級",
        "tags": ["สัตว์กลางคืน", "มงคล", "คันจิยาก"]
    },
    {
        "id": "animal-giraffe",
        "word": "麒麟",
        "reading": "きりん",
        "romaji": "kirin",
        "category": "animals",
        "category_th": "สัตว์ในคันจิ (動物)",
        "series": None,
        "meaning_th": "ยีราฟ (กิเลน)",
        "meaning_en": "Giraffe (originally Chinese mythological Qilin)",
        "ruby_html": "<ruby>麒<rt>き</rt></ruby><ruby>麟<rt>りん</rt></ruby>",
        "literal_breakdown": [
            {"char": "麒", "meaning": "กิเลนตัวผู้"},
            {"char": "麟", "meaning": "กิเลนตัวเมีย"}
        ],
        "lore": "เดิมทีคือสัตว์เทพ 'กิเลน' ในตำนาน เมื่อกองเรือเจิ้งเหอนำยีราฟตัวจริงจากแอฟริกามาถวายจักรพรรดิ ผู้คนตื่นตาตื่นใจกับคอยาวและลายจุด คิดว่าเป็นกิเลนมีชีวิต จึงกลายเป็นชื่อยีราฟจนถึงปัจจุบัน",
        "jlpt": 1,
        "kanken": "1級",
        "tags": ["ตำนาน", "สัตว์ป่า", "เบียร์คิริน"]
    },

    # =========================================================================
    # 3. 植物・花・果物 (Plants, Flowers & Fruits in Kanji)
    # =========================================================================
    {
        "id": "plant-sunflower",
        "word": "向日葵",
        "reading": "ひまわり",
        "romaji": "himawari",
        "category": "plants",
        "category_th": "พืช ดอกไม้ ผลไม้ (植物・花・果物)",
        "series": None,
        "meaning_th": "ดอกทานตะวัน",
        "meaning_en": "Sunflower",
        "ruby_html": "<ruby>向<rt>ひ</rt></ruby><ruby>日<rt>ま</rt></ruby><ruby>葵<rt>わり</rt></ruby>",
        "literal_breakdown": [
            {"char": "向", "meaning": "หันหน้าเข้าหา"},
            {"char": "日", "meaning": "ดวงอาทิตย์"},
            {"char": "葵", "meaning": "ดอกชบา / ดอกไม้ตระกูลมาลโลว์"}
        ],
        "lore": "คำอ่านพิเศษ (熟字訓) สื่อถึงลักษณะเด่นของดอกไม้ชนิดนี้ที่จะ 'หันหน้า (向) เข้าหาดวงอาทิตย์ (日)' ตลอดเวลาในยามกลางวัน",
        "jlpt": 2,
        "kanken": "準1級",
        "tags": ["ฤดูร้อน", "ดอกไม้", "Jukujikun"]
    },
    {
        "id": "plant-dandelion",
        "word": "蒲公英",
        "reading": "たんぽぽ",
        "romaji": "tanpopo",
        "category": "plants",
        "category_th": "พืช ดอกไม้ ผลไม้ (植物・花・果物)",
        "series": None,
        "meaning_th": "ดอกแดนดิไลออน (ทันโปโปะ)",
        "meaning_en": "Dandelion",
        "ruby_html": "<ruby>蒲<rt>たん</rt></ruby><ruby>公<rt>ぽ</rt></ruby><ruby>英<rt>ぽ</rt></ruby>",
        "literal_breakdown": [
            {"char": "蒲", "meaning": "ต้นกก / ธูปฤาษี"},
            {"char": "公", "meaning": "คุณธรรม / เป็นทางการ"},
            {"char": "英", "meaning": "ดอกบานสะพรั่ง / ดีเลิศ"}
        ],
        "lore": "ชื่อคันจิมาจากชื่อสมุนไพรโบราณในคัมภีร์แพทย์แผนจีน ปัจจุบันในชีวิตประจำวันนิยมเขียนด้วยฮิรางานะ たんぽぽ หรือคาตาคานะ タンポポ",
        "jlpt": 1,
        "kanken": "1級",
        "tags": ["ฤดูใบไม้ผลิ", "ดอกไม้ป่า", "สมุนไพร"]
    },
    {
        "id": "plant-hydrangea",
        "word": "紫陽花",
        "reading": "あじさい",
        "romaji": "ajisai",
        "category": "plants",
        "category_th": "พืช ดอกไม้ ผลไม้ (植物・花・果物)",
        "series": None,
        "meaning_th": "ดอกไฮเดรนเยีย (อาจิไซ - ดอกไม้แห่งฤดูฝน)",
        "meaning_en": "Hydrangea",
        "ruby_html": "<ruby>紫<rt>あじ</rt></ruby><ruby>陽<rt>さ</rt></ruby><ruby>花<rt>い</rt></ruby>",
        "literal_breakdown": [
            {"char": "紫", "meaning": "สีม่วง"},
            {"char": "陽", "meaning": "แสงตะวัน / พลังหยาง"},
            {"char": "花", "meaning": "ดอกไม้"}
        ],
        "lore": "ดอกไม้สัญลักษณ์แห่งฤดูฝน (梅雨) ของญี่ปุ่น สามารถเปลี่ยนสีกลีบดอกได้ตามความเป็นกรดด่างของดิน กวีราชวงศ์ถัง ป๋ายจวีอี้ เป็นผู้ตั้งชื่อคันจิ 'ดอกไม้สีม่วงสะท้อนแดด' นี้",
        "jlpt": 1,
        "kanken": "準1級",
        "tags": ["ฤดูฝน", "ดอกไม้", "โตเกียว"]
    },
    {
        "id": "plant-rose",
        "word": "薔薇",
        "reading": "ばら",
        "romaji": "bara",
        "category": "plants",
        "category_th": "พืช ดอกไม้ ผลไม้ (植物・花・果物)",
        "series": None,
        "meaning_th": "ดอกกุหลาบ",
        "meaning_en": "Rose",
        "ruby_html": "<ruby>薔<rt>ば</rt></ruby><ruby>薇<rt>ら</rt></ruby>",
        "literal_breakdown": [
            {"char": "薔", "meaning": "กุหลาบป่า (16 ขีด)"},
            {"char": "薇", "meaning": "เถากุหลาบ / ผักกูด (16 ขีด)"}
        ],
        "lore": "ถือเป็นหนึ่งในคันจิที่เขียนยากและมีจำนวนขีดเยอะที่สุดที่คนญี่ปุ่นมักนำมาเล่นเกมทายคำ (รวมสองตัว 32 ขีด!) ปัจจุบันจึงเขียนด้วย バラ เป็นหลัก",
        "jlpt": 1,
        "kanken": "1級",
        "tags": ["กุหลาบ", "ความรัก", "คันจิขีดเยอะ"]
    },
    {
        "id": "plant-apple",
        "word": "林檎",
        "reading": "りんご",
        "romaji": "ringo",
        "category": "plants",
        "category_th": "พืช ดอกไม้ ผลไม้ (植物・花・果物)",
        "series": None,
        "meaning_th": "แอปเปิล (ริงโกะ)",
        "meaning_en": "Apple",
        "ruby_html": "<ruby>林<rt>りん</rt></ruby><ruby>檎<rt>ご</rt></ruby>",
        "literal_breakdown": [
            {"char": "林", "meaning": "ป่าโปร่ง"},
            {"char": "檎", "meaning": "ผลไม้ป่า / นกชอบกิน"}
        ],
        "lore": "ตัว 檎 ในอักษรจีนโบราณแปลว่าผลไม้ที่มีนก (禽) บินมาชุมนุมกันกินในป่า (林) จึงนำมาตั้งเป็นชื่อผลแอปเปิลป่า",
        "jlpt": 2,
        "kanken": "準1級",
        "tags": ["ผลไม้", "อาโอโมริ", "ฤดูหนาว"]
    },
    {
        "id": "plant-lemon",
        "word": "檸檬",
        "reading": "レモン",
        "romaji": "remon",
        "category": "plants",
        "category_th": "พืช ดอกไม้ ผลไม้ (植物・花・果物)",
        "series": None,
        "meaning_th": "เลมอน (มะนาวเหลือง)",
        "meaning_en": "Lemon",
        "ruby_html": "<ruby>檸<rt>レ</rt></ruby><ruby>檬<rt>モン</rt></ruby>",
        "literal_breakdown": [
            {"char": "檸", "meaning": "ต้นเลมอน (17 ขีด)"},
            {"char": "檬", "meaning": "ผลเลมอน (17 ขีด)"}
        ],
        "lore": "โด่งดังในหมู่นักอ่านชาวญี่ปุ่นจากวรรณกรรมชิ้นเอกเรื่อง *檸檬 (Lemon)* ของ คาจิอิ โมโตจิโร่ (梶井基次郎) ซึ่งบรรยายความสดชื่นของเลมอนที่ช่วยเยียวยาจิตใจที่หดหู่",
        "jlpt": 1,
        "kanken": "1級",
        "tags": ["ผลไม้", "วรรณกรรม", "Ateji"]
    },

    # =========================================================================
    # 4. 国名 (Country Names in Ateji & 1-Kanji Abbreviations)
    # =========================================================================
    {
        "id": "country-thailand",
        "word": "泰国",
        "reading": "タイこく",
        "romaji": "taikoku",
        "category": "countries",
        "category_th": "ชื่อประเทศในคันจิ (国名・当て字)",
        "series": None,
        "meaning_th": "ประเทศไทย (อักษรย่อในข่าว: 泰 เช่น 日泰 = ญี่ปุ่น-ไทย)",
        "meaning_en": "Thailand (Abbreviation: 泰, e.g., Japan-Thailand relations: 日泰)",
        "ruby_html": "<ruby>泰<rt>タイ</rt></ruby><ruby>国<rt>こく</rt></ruby>",
        "literal_breakdown": [
            {"char": "泰", "meaning": "สงบสุข / ยิ่งใหญ่ / สันติ (ไท)"},
            {"char": "国", "meaning": "ประเทศ"}
        ],
        "lore": "ทางการญี่ปุ่นเลือกใช้ตัว 泰 (Tai/Yutaka) ซึ่งเป็นคันจิมงคลมีความหมายว่า 'ความสงบสุข ร่มเย็น และมั่นคงดั่งภูผา' มาทับศัพท์คำว่า 'ไทย' พาดหัวข่าวญี่ปุ่นจึงมักใช้ 泰 เช่น 日泰修好 (ความสัมพันธ์ทางการทูตญี่ปุ่น-ไทย)",
        "jlpt": 2,
        "kanken": "2級",
        "tags": ["ประเทศไทย", "Ateji", "การทูต"]
    },
    {
        "id": "country-usa",
        "word": "米国",
        "reading": "アメリカ / べいこく",
        "romaji": "beikoku",
        "category": "countries",
        "category_th": "ชื่อประเทศในคันจิ (国名・当て字)",
        "series": None,
        "meaning_th": "สหรัฐอเมริกา (อักษรย่อในข่าว: 米 เช่น 日米 = ญี่ปุ่น-สหรัฐฯ)",
        "meaning_en": "United States of America (Abbreviation: 米)",
        "ruby_html": "<ruby>米<rt>べい</rt></ruby><ruby>国<rt>こく</rt></ruby>",
        "literal_breakdown": [
            {"char": "米", "meaning": "เมล็ดข้าว / อะเมะ (America)"},
            {"char": "国", "meaning": "ประเทศ"}
        ],
        "lore": "ในยุคเอโดะตอนปลาย ญี่ปุ่นทับศัพท์คำว่า America เป็น 亜米利加 (อะ-เม-ริ-กะ) และเลือกตัดตัวกลางคือ 米 (เมะ/เบย์) มาใช้เป็นตัวย่อของประเทศจนถึงปัจจุบัน",
        "jlpt": 3,
        "kanken": "8級",
        "tags": ["สหรัฐอเมริกา", "ข่าว", "คำย่อพาดหัว"]
    },
    {
        "id": "country-uk",
        "word": "英国",
        "reading": "イギリス / えいこく",
        "romaji": "eikoku",
        "category": "countries",
        "category_th": "ชื่อประเทศในคันจิ (国名・当て字)",
        "series": None,
        "meaning_th": "สหราชอาณาจักร / ประเทศอังกฤษ (อักษรย่อในข่าว: 英)",
        "meaning_en": "United Kingdom / Great Britain (Abbreviation: 英)",
        "ruby_html": "<ruby>英<rt>えい</rt></ruby><ruby>国<rt>こく</rt></ruby>",
        "literal_breakdown": [
            {"char": "英", "meaning": "ยอดเยี่ยม / ฉลาดปราดเปรื่อง (Eng)"},
            {"char": "国", "meaning": "ประเทศ"}
        ],
        "lore": "ทับศัพท์มาจากคำว่า 英吉利 (อิง-กิ-ริส) และนำตัว 英 มาใช้เป็นตัวแทนของภาษาอังกฤษ (英語) และประเทศอังกฤษ (英国)",
        "jlpt": 4,
        "kanken": "7級",
        "tags": ["อังกฤษ", "ยุโรป", "ภาษา"]
    },
    {
        "id": "country-france",
        "word": "仏国",
        "reading": "フランス / ふっこく",
        "romaji": "fukkoku",
        "category": "countries",
        "category_th": "ชื่อประเทศในคันจิ (国名・当て字)",
        "series": None,
        "meaning_th": "ประเทศฝรั่งเศส (อักษรย่อในข่าว: 仏 เช่น 仏語 = ภาษาฝรั่งเศส)",
        "meaning_en": "France (Abbreviation: 仏)",
        "ruby_html": "<ruby>仏<rt>ふつ</rt></ruby><ruby>国<rt>こく</rt></ruby>",
        "literal_breakdown": [
            {"char": "仏", "meaning": "พระพุทธเจ้า / ฟุตสึ (France)"},
            {"char": "国", "meaning": "ประเทศ"}
        ],
        "lore": "ทับศัพท์มาจาก 仏蘭西 (ฟุ-รัง-ซึ) และตัดเหลือตัว 仏 (ฟุตสึ) ตัวเดียว แม้ตัวอักษรจะแปลว่า 'พระพุทธ' แต่เมื่อใช้เรียกประเทศจะหมายถึงฝรั่งเศส",
        "jlpt": 2,
        "kanken": "6級",
        "tags": ["ฝรั่งเศส", "ยุโรป", "Ateji"]
    },
    {
        "id": "country-germany",
        "word": "独国",
        "reading": "ドイツ / どっこく",
        "romaji": "dokkoku",
        "category": "countries",
        "category_th": "ชื่อประเทศในคันจิ (国名・当て字)",
        "series": None,
        "meaning_th": "ประเทศเยอรมนี (อักษรย่อในข่าว: 独 เช่น 独語 = ภาษาเยอรมัน)",
        "meaning_en": "Germany (Abbreviation: 独, from Deutsch)",
        "ruby_html": "<ruby>独<rt>どく</rt></ruby><ruby>国<rt>こく</rt></ruby>",
        "literal_breakdown": [
            {"char": "独", "meaning": "โดดเดี่ยว / ดอยต์ช์ (Deutsch)"},
            {"char": "国", "meaning": "ประเทศ"}
        ],
        "lore": "ทับศัพท์จากคำภาษาเยอรมัน 'Deutsch' เป็น 獨逸 (โดะ-อิ-สึ) และย่อเหลือ 独 คำว่า 独逸車 จึงแปลว่ารถยนต์สัญชาติเยอรมัน",
        "jlpt": 2,
        "kanken": "6級",
        "tags": ["เยอรมัน", "ยุโรป", "Ateji"]
    },
    {
        "id": "country-australia",
        "word": "豪州",
        "reading": "ごうしゅう",
        "romaji": "goushuu",
        "category": "countries",
        "category_th": "ชื่อประเทศในคันจิ (国名・当て字)",
        "series": None,
        "meaning_th": "ประเทศออสเตรเลีย (ทวีปออสเตรเลีย / ตัวย่อ: 豪 เช่น 豪ドル = ดอลลาร์ออสเตรเลีย)",
        "meaning_en": "Australia (Abbreviation: 豪)",
        "ruby_html": "<ruby>豪<rt>ごう</rt></ruby><ruby>州<rt>しゅう</rt></ruby>",
        "literal_breakdown": [
            {"char": "豪", "meaning": "หรูหรา / กล้าหาญ / ออส (Aus)"},
            {"char": "州", "meaning": "ทวีป / รัฐ"}
        ],
        "lore": "ทับศัพท์มาจาก 濠太剌利 (โก-ตะ-ระ-ริ) ต่อมาปรับเป็นตัว 豪 (Gou) ซึ่งมีความหมายมงคลว่าความสง่างามโอ่อ่า",
        "jlpt": 1,
        "kanken": "3級",
        "tags": ["ออสเตรเลีย", "โอเชียเนีย", "Ateji"]
    },

    # =========================================================================
    # 5. Bleach (บลีช เทพมรณะ - BLEACH)
    # =========================================================================
    {
        "id": "bleach-zanpakuto",
        "word": "斬魄刀",
        "reading": "ざんぱくとう",
        "romaji": "zanpakutou",
        "category": "anime-bleach",
        "category_th": "มังงะและอนิเมะ (Bleach)",
        "series": "Bleach (บลีช เทพมรณะ)",
        "meaning_th": "ดาบฟันวิญญาณ - อาวุธประจำกายของเหล่ายมทูตที่หล่อหลอมขึ้นจากวิญญาณของผู้ถือครอง",
        "meaning_en": "Soul-Cutter Sword (Zanpakuto); Soul Reaper weapon",
        "ruby_html": "<ruby>斬<rt>ざん</rt></ruby><ruby>魄<rt>ぱく</rt></ruby><ruby>刀<rt>とう</rt></ruby>",
        "literal_breakdown": [
            {"char": "斬", "meaning": "ตัด / สับ / ฟัน"},
            {"char": "魄", "meaning": "วิญญาณฝ่ายกายภาพ (คู่กับ 魂 วิญญาณฝ่ายจิต)"},
            {"char": "刀", "meaning": "ดาบ / มีด"}
        ],
        "lore": "อาจารย์ ไทโตะ คุโบะ จงใจเลือกใช้คันจิ 魄 (Haku) ที่หมายถึง 'วิญญาณฝ่ายกายภาพ/หยิน' ในลัทธิเต๋า แทนคำว่า 魂 (Tamashii) เพื่อสื่อว่าดาบนี้มีตัวตน กายเนื้อ และจิตวิญญาณเป็นของตนเอง",
        "jlpt": 1,
        "kanken": "1級",
        "tags": ["ดาบฟันวิญญาณ", "ยมทูต", "คุโบะ ไทโตะ"]
    },
    {
        "id": "bleach-bankai",
        "word": "卍解",
        "reading": "ばんかい",
        "romaji": "bankai",
        "category": "anime-bleach",
        "category_th": "มังงะและอนิเมะ (Bleach)",
        "series": "Bleach (บลีช เทพมรณะ)",
        "meaning_th": "บังไค (การปลดปล่อยขั้นสมบูรณ์ของดาบฟันวิญญาณ)",
        "meaning_en": "Bankai; final / complete release of Zanpakuto",
        "ruby_html": "<ruby>卍<rt>ばん</rt></ruby><ruby>解<rt>かい</rt></ruby>",
        "literal_breakdown": [
            {"char": "卍", "meaning": "มันจิ (สวัสดิกะมงคลทางพุทธ / ความสมบูรณ์นิรันดร์)"},
            {"char": "解", "meaning": "ปลดปล่อย / คลี่คลาย"}
        ],
        "lore": "ตัวอักษร 卍 (มันจิ) ในพุทธศาสนามหายานเป็นสัญลักษณ์ของ 'ความบริสุทธิ์รอบรู้รอบด้านและความเป็นนิรันดร์' บังไคจึงหมายถึงการปลดปล่อยพลังขั้นสูงสุดที่แท้จริงของดาบ",
        "jlpt": 2,
        "kanken": "1級",
        "tags": ["บังไค", "ท่าไม้ตาย", "พุทธศาสนา"]
    },
    {
        "id": "bleach-kyoka-suigetsu",
        "word": "鏡花水月",
        "reading": "きょうかすいげつ",
        "romaji": "kyouka suigetsu",
        "category": "anime-bleach",
        "category_th": "มังงะและอนิเมะ (Bleach)",
        "series": "Bleach (บลีช เทพมรณะ)",
        "meaning_th": "เคียวกะ ซุยเก็ตสึ (ดาบฟันวิญญาณของไอเซ็น โซสึเกะ / ภาพสะท้อนดอกไม้ในกระจก ดวงจันทร์บนผิวน้ำ สื่อถึงภาพลวงตาสัมบูรณ์)",
        "meaning_en": "Kyoka Suigetsu; mirror flower water moon (complete hypnosis illusion)",
        "ruby_html": "<ruby>鏡<rt>きょう</rt></ruby><ruby>花<rt>か</rt></ruby><ruby>水<rt>すい</rt></ruby><ruby>月<rt>げつ</rt></ruby>",
        "literal_breakdown": [
            {"char": "鏡", "meaning": "กระจกเงา"},
            {"char": "花", "meaning": "ดอกไม้"},
            {"char": "水", "meaning": "น้ำ"},
            {"char": "月", "meaning": "ดวงจันทร์"}
        ],
        "lore": "เป็นสำนวน สุภาษิต 4 ตัวอักษร (四字熟語) จริงของจีนโบราณ อุปมาถึงความงามที่มองเห็นได้แต่จับต้องไม่ได้ ไอเซ็นนำมาตั้งเป็นชื่อดาบสะกดจิตประสาทสัมผัสทั้งห้าอย่างสมบูรณ์แบบ",
        "jlpt": 1,
        "kanken": "3級",
        "tags": ["ไอเซ็น", "ภาพลวงตา", "四字熟語"]
    },
    {
        "id": "bleach-senbonzakura",
        "word": "千本桜",
        "reading": "せんぼんざくら",
        "romaji": "senbonzakura",
        "category": "anime-bleach",
        "category_th": "มังงะและอนิเมะ (Bleach)",
        "series": "Bleach (บลีช เทพมรณะ)",
        "meaning_th": "เซ็มบงซากุระ (พันซากุระ - ดาบฟันวิญญาณของคุจิกิ เบียคุยะ คมดาบสลายกลายเป็นใบมีดนับล้านสะท้อนแสงดั่งกลีบซากุระ)",
        "meaning_en": "Senbonzakura; thousand cherry blossoms",
        "ruby_html": "<ruby>千<rt>せん</rt></ruby><ruby>本<rt>ぼん</rt></ruby><ruby>桜<rt>ざくら</rt></ruby>",
        "literal_breakdown": [
            {"char": "千", "meaning": "พัน (นับพัน)"},
            {"char": "本", "meaning": "ลักษณนามนับต้นไม้ / สิ่งทรงยาว"},
            {"char": "桜", "meaning": "ดอกซากุระ"}
        ],
        "lore": "คำร่าย 'จงโปรยปราย... เซ็มบงซากุระ' (散れ、千本桜) เป็นหนึ่งในคำร่ายที่โด่งดังที่สุด ตัว 本 ทำหน้าที่เป็นลักษณนามนับต้นซากุระนับพันต้น",
        "jlpt": 3,
        "kanken": "8級",
        "tags": ["เบียคุยะ", "ซากุระ", "ดาบฟันวิญญาณ"]
    },

    # =========================================================================
    # 6. Naruto (นินจาคาถา นารูโตะ - NARUTO)
    # =========================================================================
    {
        "id": "naruto-rasengan",
        "word": "螺旋丸",
        "reading": "らせんがん",
        "romaji": "rasengan",
        "category": "anime-naruto",
        "category_th": "มังงะและอนิเมะ (Naruto)",
        "series": "Naruto (นินจาคาถา นารูโตะ)",
        "meaning_th": "กระสุนวงจักร - วิชาบีบอัดจักระแล้วหมุนวนด้วยความเร็วสูงสุดเป็นทรงกลม",
        "meaning_en": "Rasengan; spiraling sphere chakra technique",
        "ruby_html": "<ruby>螺<rt>ら</rt></ruby><ruby>旋<rt>せん</rt></ruby><ruby>丸<rt>がん</rt></ruby>",
        "literal_breakdown": [
            {"char": "螺", "meaning": "หอยก้นหอย / ขดเกลียว"},
            {"char": "旋", "meaning": "หมุนรอบ / วนเวียน"},
            {"char": "丸", "meaning": "ทรงกลม / ลูกแก้ว"}
        ],
        "lore": "คิดค้นโดยโฮคาเงะรุ่นที่ 4 นามิคเสะ มินาโตะ โดยอิงจากกระสุนสัตว์หาง คำว่า 螺旋 (Rasen) คือเส้นเกลียวสไปรัล สอดคล้องกับตราประจำตระกูลอุซึมากิ (うずまき = ลายก้นหอย)",
        "jlpt": 1,
        "kanken": "準1級",
        "tags": ["นารูโตะ", "กระสุนวงจักร", "จักระ"]
    },
    {
        "id": "naruto-sharingan",
        "word": "写輪眼",
        "reading": "しゃりんがん",
        "romaji": "sharingan",
        "category": "anime-naruto",
        "category_th": "มังงะและอนิเมะ (Naruto)",
        "series": "Naruto (นินจาคาถา นารูโตะ)",
        "meaning_th": "เนตรวงแหวน - ขีดจำกัดทางสายเลือดของตระกูลอุจิวะ สามารถคัดลอกวิชาและมองทะลุกระบวนท่า",
        "meaning_en": "Sharingan; copy wheel eye of the Uchiha clan",
        "ruby_html": "<ruby>写<rt>しゃ</rt></ruby><ruby>輪<rt>りん</rt></ruby><ruby>眼<rt>がん</rt></ruby>",
        "literal_breakdown": [
            {"char": "写", "meaning": "คัดลอก / ถ่ายทอดภาพ"},
            {"char": "輪", "meaning": "ล้อ / วงแหวน"},
            {"char": "眼", "meaning": "ดวงตา / เนตร"}
        ],
        "lore": "ประกอบด้วยคันจิ 写 (คัดลอก) + 輪 (ล้อ/วงแหวน) + 眼 (ดวงตา) สื่อถึงดวงตาที่มีลูกน้ำหมุนวนเป็นวงแหวนและสามารถ 'ก็อปปี้' วิชาของศัตรูได้ในชั่วพริบตา",
        "jlpt": 2,
        "kanken": "5級",
        "tags": ["อุจิวะ", "ซาสึเกะ", "ขีดจำกัดสายเลือด"]
    },
    {
        "id": "naruto-mangekyo",
        "word": "万華鏡",
        "reading": "まんげきょう",
        "romaji": "mangekyou",
        "category": "anime-naruto",
        "category_th": "มังงะและอนิเมะ (Naruto)",
        "series": "Naruto (นินจาคาถา นารูโตะ)",
        "meaning_th": "กล้องคาไลโดสโคป (กล้องสลับลายหมื่นบุปผา ใน 'เนตรวงแหวนกระจกเงาหมื่นบุปผา')",
        "meaning_en": "Kaleidoscope; as in Mangekyo Sharingan",
        "ruby_html": "<ruby>万<rt>まん</rt></ruby><ruby>華<rt>げ</rt></ruby><ruby>鏡<rt>きょう</rt></ruby>",
        "literal_breakdown": [
            {"char": "万", "meaning": "หมื่น / นับไม่ถ้วน"},
            {"char": "華", "meaning": "ดอกไม้ / ประกายเจิดจรัส"},
            {"char": "鏡", "meaning": "กระจกเงา"}
        ],
        "lore": "เดิมคือของเล่นคลาสสิกของญี่ปุ่น กล้องทรงกระบอกที่มีกระจกสะท้อนเม็ดลูกปัดจนเกิดเป็นลวดลายดอกไม้สะท้อนหมื่นเฉด อาจารย์คิชิโมโตะนำมาอุปมาลวดลายเนตรของอิทาจิและซาสึเกะ",
        "jlpt": 1,
        "kanken": "4級",
        "tags": ["เนตรวงแหวน", "อิทาจิ", "กระจกเงา"]
    },
    {
        "id": "naruto-chidori",
        "word": "千鳥",
        "reading": "ちどり",
        "romaji": "chidori",
        "category": "anime-naruto",
        "category_th": "มังงะและอนิเมะ (Naruto)",
        "series": "Naruto (นินจาคาถา นารูโตะ)",
        "meaning_th": "พันปักษา (วิชาสายฟ้าของฮาตาเกะ คาคาชิ และอุจิวะ ซาสึเกะ เสียงกระแสไฟดังคล้ายนกพันตัวร้อง)",
        "meaning_en": "Chidori; one thousand birds lightning technique",
        "ruby_html": "<ruby>千<rt>ち</rt></ruby><ruby>鳥<rt>どり</rt></ruby>",
        "literal_breakdown": [
            {"char": "千", "meaning": "พัน (1,000)"},
            {"char": "鳥", "meaning": "นก / ปักษา"}
        ],
        "lore": "มีที่มาจากชื่อดาบในตำนานจริงของขุนพล ทาจิบานะ โดเซ็ตสึ (立花道雪) ในยุคเซ็นโกคุ ที่เล่าว่าใช้ดาบเล่มนี้ฟันสายฟ้าที่ผ่าลงมาจนรอดชีวิต ดาบนั้นจึงได้ชื่อว่า 'จิโดริ (พันปักษา)' และต่อมาเปลี่ยนชื่อเป็น 'ไรคิริ (ตัดสายฟ้า)'",
        "jlpt": 3,
        "kanken": "9級",
        "tags": ["คาคาชิ", "ซาสึเกะ", "สายฟ้า"]
    },

    # =========================================================================
    # 7. Kimetsu no Yaiba (ดาบพิฆาตอสูร)
    # =========================================================================
    {
        "id": "kny-kimetsu",
        "word": "鬼滅",
        "reading": "きめつ",
        "romaji": "kimetsu",
        "category": "anime-kny",
        "category_th": "มังงะและอนิเมะ (Kimetsu no Yaiba)",
        "series": "Kimetsu no Yaiba (ดาบพิฆาตอสูร)",
        "meaning_th": "การพิฆาตอสูร (การปราบและกำจัดอสูรให้ดับสูญ)",
        "meaning_en": "Demon destruction / slaying",
        "ruby_html": "<ruby>鬼<rt>き</rt></ruby><ruby>滅<rt>めつ</rt></ruby>",
        "literal_breakdown": [
            {"char": "鬼", "meaning": "อสูร / ยักษ์ / ผีร้าย"},
            {"char": "滅", "meaning": "ดับสูญ / ทำลายล้าง / สิ้นสลาย"}
        ],
        "lore": "คำว่า 鬼滅 ไม่ใช่คำในพจนานุกรมทั่วไป แต่เป็นคำประสมใหม่ที่ อ.โคโยฮารุ โกโตเกะ ประดิษฐ์ขึ้นอย่างงดงาม โดยนำ 鬼 (อสูร) มารวมกับ 滅 (ดับสูญ เช่นคำว่า 滅亡 / 絶滅)",
        "jlpt": 1,
        "kanken": "3級",
        "tags": ["ดาบพิฆาตอสูร", "ทันจิโร่", "ชื่อเรื่อง"]
    },
    {
        "id": "kny-hashira",
        "word": "柱",
        "reading": "はしら",
        "romaji": "hashira",
        "category": "anime-kny",
        "category_th": "มังงะและอนิเมะ (Kimetsu no Yaiba)",
        "series": "Kimetsu no Yaiba (ดาบพิฆาตอสูร)",
        "meaning_th": "เสาหลัก - ตำแหน่งนักดาบผู้แข็งแกร่งที่สุด 9 คนของหน่วยพิฆาตอสูร",
        "meaning_en": "Hashira; Pillars of the Demon Slayer Corps",
        "ruby_html": "<ruby>柱<rt>はしら</rt></ruby>",
        "literal_breakdown": [
            {"char": "木", "meaning": "หมวดต้นไม้"},
            {"char": "主", "meaning": "เจ้า / นาย / แกนกลาง"}
        ],
        "lore": "ในลัทธิชินโตโบราณ คำว่า 柱 (เสา) ไม่เพียงแปลว่าเสาค้ำบ้าน แต่ยังถูกใช้เป็น 'ลักษณนามสำหรับนับเทพเจ้า' (神様を一柱、二柱と数える) การใช้คำนี้จึงยกย่องเหล่านักดาบว่าเปรียบประดุจเทพผู้ค้ำจุนมนุษยชาติ",
        "jlpt": 2,
        "kanken": "8級",
        "tags": ["เสาหลัก", "ชินโต", "วัฒนธรรมญี่ปุ่น"]
    },
    {
        "id": "kny-rengoku",
        "word": "煉獄",
        "reading": "れんごく",
        "romaji": "rengoku",
        "category": "anime-kny",
        "category_th": "มังงะและอนิเมะ (Kimetsu no Yaiba)",
        "series": "Kimetsu no Yaiba (ดาบพิฆาตอสูร)",
        "meaning_th": "แดนชำระบาป (เพลิงชำระวิญญาณ ในนามสกุลของ 'เร็นโกคุ เคียวจูโร่' เสาหลักเพลิง)",
        "meaning_en": "Purgatory; cleansing flame (Surname of Kyojuro Rengoku)",
        "ruby_html": "<ruby>煉<rt>れん</rt></ruby><ruby>獄<rt>ごく</rt></ruby>",
        "literal_breakdown": [
            {"char": "煉", "meaning": "หลอมด้วยไฟ / ชำระล้างด้วยความร้อน"},
            {"char": "獄", "meaning": "คุก / ขุมนรก"}
        ],
        "lore": "คำว่า 煉獄 มีความหมายตรงตัวในศาสนศาสตร์คือ 'แดนชำระ' (Purgatory) สถานที่ที่ดวงวิญญาณถูกหลอมชำระด้วยไฟบริสุทธิ์เพื่อล้างมลทิน เป็นชื่อที่สื่อถึงจิตวิญญาณอันลุกโชติช่วงของเคียวจูโร่",
        "jlpt": 1,
        "kanken": "準1級",
        "tags": ["เร็นโกคุ", "เสาหลักเพลิง", "ไฟ"]
    },
    {
        "id": "kny-nichirin",
        "word": "日輪刀",
        "reading": "にちりんとう",
        "romaji": "nichirintou",
        "category": "anime-kny",
        "category_th": "มังงะและอนิเมะ (Kimetsu no Yaiba)",
        "series": "Kimetsu no Yaiba (ดาบพิฆาตอสูร)",
        "meaning_th": "ดาบเพลิงสุริยัน - ดาบที่ตีขึ้นจากทรายเหล็กและหินแร่แดนอาทิตย์ส่อง ดูดซับแสงอาทิตย์เพื่อตัดคออสูร",
        "meaning_en": "Nichirin Blade; Sun Wheel Sword",
        "ruby_html": "<ruby>日<rt>にち</rt></ruby><ruby>輪<rt>りん</rt></ruby><ruby>刀<rt>とう</rt></ruby>",
        "literal_breakdown": [
            {"char": "日", "meaning": "พระอาทิตย์ / สุริยา"},
            {"char": "輪", "meaning": "กงล้อ / รัศมี"},
            {"char": "刀", "meaning": "ดาบ"}
        ],
        "lore": "คำว่า 日輪 (Nichirin) หมายถึง 'วงรัศมีของดวงอาทิตย์' เมื่อดาบสัมผัสกับมือของผู้ใช้ที่มีปราณต่างกัน คมดาบจะเปลี่ยนสีไปตามธาตุของผู้นั้น",
        "jlpt": 2,
        "kanken": "7級",
        "tags": ["ดาบสุริยัน", "แสงแดด", "อาวุธ"]
    },

    # =========================================================================
    # 8. Jujutsu Kaisen (มหาเวทย์ผนึกมาร)
    # =========================================================================
    {
        "id": "jjk-ryoiki-tenkai",
        "word": "領域展開",
        "reading": "りょういきてんかい",
        "romaji": "ryouiki tenkai",
        "category": "anime-jjk",
        "category_th": "มังงะและอนิเมะ (Jujutsu Kaisen)",
        "series": "Jujutsu Kaisen (มหาเวทย์ผนึกมาร)",
        "meaning_th": "กางอาณาเขต - สุดยอดวิชาไสยเวท สร้างพื้นที่แดนปิดล้อมโดยสมบูรณ์ที่การโจมตีจะการันตีการโดนเป้าหมาย 100%",
        "meaning_en": "Domain Expansion; pinnacle of jujutsu sorcery",
        "ruby_html": "<ruby>領<rt>りょう</rt></ruby><ruby>域<rt>いき</rt></ruby><ruby>展<rt>てん</rt></ruby><ruby>開<rt>かい</rt></ruby>",
        "literal_breakdown": [
            {"char": "領", "meaning": "ครอบครอง / อาณาเขต"},
            {"char": "域", "meaning": "แดน / พรมแดน"},
            {"char": "展", "meaning": "คลี่ออก / แผ่ขยาย"},
            {"char": "開", "meaning": "เปิดออก"}
        ],
        "lore": "วลีฮิตระดับปรากฏการณ์ที่แฟนการ์ตูนทั่วโลกจำขึ้นใจ สื่อถึงการฉายภาพโลกจำลองในจิตใจของผู้ใช้ไสยเวทออกมากักขังคู่ต่อสู้ในโลกจริง",
        "jlpt": 1,
        "kanken": "3級",
        "tags": ["กางอาณาเขต", "โกะโจ", "ไสยเวท"]
    },
    {
        "id": "jjk-muryo-kusho",
        "word": "無量空処",
        "reading": "むりょうくうしょ",
        "romaji": "muryou kuusho",
        "category": "anime-jjk",
        "category_th": "มังงะและอนิเมะ (Jujutsu Kaisen)",
        "series": "Jujutsu Kaisen (มหาเวทย์ผนึกมาร)",
        "meaning_th": "พื้นที่ว่างอันไร้ประมาณ (อาณาเขตของโกะโจ ซาโตรุ บังคับให้ศัตรูได้รับข้อมูลปริมาณมหาศาลไร้ขีดจำกัดจนสมองหยุดทำงาน)",
        "meaning_en": "Unlimited Void; Gojo Satoru's Domain Expansion",
        "ruby_html": "<ruby>無<rt>む</rt></ruby><ruby>量<rt>りょう</rt></ruby><ruby>空<rt>くう</rt></ruby><ruby>処<rt>しょ</rt></ruby>",
        "literal_breakdown": [
            {"char": "無", "meaning": "ไร้ / ไม่มี"},
            {"char": "量", "meaning": "ปริมาณ / ขีดจำกัด"},
            {"char": "空", "meaning": "ความว่างเปล่า / อากาศ"},
            {"char": "処", "meaning": "สถานที่ / มิติ"}
        ],
        "lore": "ดัดแปลงมาจากภูมิชั้นพรหมในพุทธปรัชญาฝ่ายอภิธรรม 'อากาสานัญจายตนภูมิ' (ดินแดนที่จิตหยั่งถึงความว่างเปล่าอันหาขอบเขตมิได้) ผู้ตกอยู่ภายในจะรับรู้ข้อมูลซ้ำไม่สิ้นสุดจนขยับตัวไม่ได้",
        "jlpt": 1,
        "kanken": "3級",
        "tags": ["โกะโจ ซาโตรุ", "อาณาเขต", "พุทธปรัชญา"]
    },
    {
        "id": "jjk-fukuma-mizushi",
        "word": "伏魔御廚子",
        "reading": "ふくまみづし",
        "romaji": "fukuma mizushi",
        "category": "anime-jjk",
        "category_th": "มังงะและอนิเมะ (Jujutsu Kaisen)",
        "series": "Jujutsu Kaisen (มหาเวทย์ผนึกมาร)",
        "meaning_th": "ศาลามารสถิต - อาณาเขตของราชาคำสาป เรียวเมน สุคุนะ คมดาบเฉือนตัดทุกสิ่งในรัศมี 200 เมตรจนกลายเป็นธุลี",
        "meaning_en": "Malevolent Shrine; Ryomen Sukuna's Domain Expansion",
        "ruby_html": "<ruby>伏<rt>ふく</rt></ruby><ruby>魔<rt>ま</rt></ruby><ruby>御<rt>み</rt></ruby><ruby>廚<rt>づ</rt></ruby><ruby>子<rt>し</rt></ruby>",
        "literal_breakdown": [
            {"char": "伏", "meaning": "สยบ / หมอบกราบ / กักขัง"},
            {"char": "魔", "meaning": "มาร / คำสาป"},
            {"char": "御", "meaning": "คำสุภาพยกย่อง (ของเทพเจ้า)"},
            {"char": "廚子", "meaning": "ตู้พระโบราณ / หอสถิตพระพุทธรูป"}
        ],
        "lore": "คำว่า 伏魔 มาจาก *สุยหู่จ้วน (108 ผู้กล้าเขาเหลียงซาน)* ตอนเปิดวิหารสยบมาร ส่วน 廚子 (มิซึชิ) คือตู้บรรจุวัตถุมงคลของวัดญี่ปุ่นโบราณ อุปมาถึงแท่นบูชาของจอมมารผู้แล่เฉือนทุกสรรพสิ่ง",
        "jlpt": 1,
        "kanken": "1級",
        "tags": ["สุคุนะ", "ศาลามาร", "ราชาคำสาป"]
    },
    {
        "id": "jjk-kokusen",
        "word": "黒閃",
        "reading": "こくせん",
        "romaji": "kokusen",
        "category": "anime-jjk",
        "category_th": "มังงะและอนิเมะ (Jujutsu Kaisen)",
        "series": "Jujutsu Kaisen (มหาเวทย์ผนึกมาร)",
        "meaning_th": "ประกายทมิฬ - ปรากฏการณ์พลังไสยเวทปะทุในเสี้ยว 0.000001 วินาทีหลังการปะทะ เพิ่มอนุภาพการทำลายล้างขึ้น 2.5 เท่า",
        "meaning_en": "Black Flash; spatial distortion impact",
        "ruby_html": "<ruby>黒<rt>こく</rt></ruby><ruby>閃<rt>せん</rt></ruby>",
        "literal_breakdown": [
            {"char": "黒", "meaning": "สีดำ / ทมิฬ"},
            {"char": "閃", "meaning": "ประกายแสงวูบวาบ / สายฟ้าแลบ"}
        ],
        "lore": "เมื่อพลังเวทและกายเนื้อผสานกันได้อย่างสมบูรณ์แบบ มิติจะบิดเบี้ยวเกิดเป็นประกายสายฟ้าสีดำทมิฬ ผู้ที่ปล่อยประกายทมิฬได้จะเข้าสู่สภาวะ 'โซน' (Zone) ดั่งนักกีฬามืออาชีพ",
        "jlpt": 1,
        "kanken": "3級",
        "tags": ["อิตาโดริ", "ประกายทมิฬ", "ไสยเวท"]
    }
]

with open('data/vocabulary.json', 'w', encoding='utf-8') as f:
    json.dump(vocab_data, f, ensure_ascii=False, indent=2)

print(f"Successfully generated data/vocabulary.json with {len(vocab_data)} entries.")

more_vocab = [
    # More Animals
    {
        "id": "animal-fox",
        "word": "狐",
        "reading": "きつね",
        "romaji": "kitsune",
        "category": "animals",
        "category_th": "สัตว์ในคันจิ (動物)",
        "series": None,
        "meaning_th": "จิ้งจอก (สัญลักษณ์ผู้ส่งสารแห่งเทพเจ้าอินาริ)",
        "meaning_en": "Fox; Kitsune",
        "ruby_html": "<ruby>狐<rt>きつね</rt></ruby>",
        "literal_breakdown": [
            {"char": "犭", "meaning": "หมวดสัตว์สี่เท้า"},
            {"char": "瓜", "meaning": "แตง / ผลไม้ทรงกลมรี (เสียง Ko)"}
        ],
        "lore": "ในความเชื่อชินโต จิ้งจอกสีขาว (白狐: เบียกโกะ) เป็นสัตว์รับใช้ประจำศาลเจ้าอินาริ มีพลังแปลงกายและบันดาลความอุดมสมบูรณ์ในการเกษตรและการค้า",
        "jlpt": 2,
        "kanken": "3級",
        "tags": ["ชินโต", "ศาลเจ้า", "อินาริ"]
    },
    {
        "id": "animal-tanuki",
        "word": "狸",
        "reading": "たぬき",
        "romaji": "tanuki",
        "category": "animals",
        "category_th": "สัตว์ในคันจิ (動物)",
        "series": None,
        "meaning_th": "ทานุกิ (จิ้งจอกแรคคูนญี่ปุ่น - เจ้าแห่งการแปลงกายและโชคลาภ)",
        "meaning_en": "Japanese Raccoon Dog; Tanuki",
        "ruby_html": "<ruby>狸<rt>たぬき</rt></ruby>",
        "literal_breakdown": [
            {"char": "犭", "meaning": "หมวดสัตว์สี่เท้า"},
            {"char": "里", "meaning": "หมู่บ้าน / ชนบท"}
        ],
        "lore": "ประกอบด้วยคันจิ สัตว์สี่เท้า (犭) + หมู่บ้าน (里) สื่อถึงสัตว์ป่าที่อาศัยอยู่ใกล้ชิดกับหมู่บ้านมนุษย์ หน้าร้านอาหารญี่ปุ่นมักตั้งรูปปั้นดินเผาทานุกิพุงพลุ้ยสวมหมวกฟางเพื่อเรียกทรัพย์",
        "jlpt": 1,
        "kanken": "準1級",
        "tags": ["โชคลาภ", "รูปปั้น", "นิทานพื้นบ้าน"]
    },
    {
        "id": "animal-owl",
        "word": "梟",
        "reading": "ふくろう",
        "romaji": "fukurou",
        "category": "animals",
        "category_th": "สัตว์ในคันจิ (動物)",
        "series": None,
        "meaning_th": "นกฮูก (สัญลักษณ์แห่งปัญญาและไร้ความทุกข์ยาก 不苦労)",
        "meaning_en": "Owl",
        "ruby_html": "<ruby>梟<rt>ふくろう</rt></ruby>",
        "literal_breakdown": [
            {"char": "鳥", "meaning": "นก"},
            {"char": "木", "meaning": "ต้นไม้"}
        ],
        "lore": "คนญี่ปุ่นนิยมเลี้ยงและมอบเครื่องรางนกฮูกให้กัน เพราะคำว่า Fukurou พ้องเสียงกับ 不苦労 (ฟุคุโร = ปราศจากความทุกข์ยากลำบาก) และ 福来朗 (ฟุคุไรโร = โชคลาภเข้ามาสู่ชีวิต)",
        "jlpt": 1,
        "kanken": "準1級",
        "tags": ["นกฮูก", "โชคลาภ", "ความสุข"]
    },
    {
        "id": "animal-frog",
        "word": "蛙",
        "reading": "かえる",
        "romaji": "kaeru",
        "category": "animals",
        "category_th": "สัตว์ในคันจิ (動物)",
        "series": None,
        "meaning_th": "กบ (สัญลักษณ์แห่งการเดินทางกลับอย่างปลอดภัย 帰る)",
        "meaning_en": "Frog",
        "ruby_html": "<ruby>蛙<rt>かえる</rt></ruby>",
        "literal_breakdown": [
            {"char": "虫", "meaning": "หมวดสัตว์เล็ก"},
            {"char": "圭", "meaning": "หยกมงคล / ดินทับถม"}
        ],
        "lore": "คำว่ากบในภาษาญี่ปุ่น (Kaeru) พ้องเสียงกับกริยา 帰る (กลับบ้าน) ชาวญี่ปุ่นจึงนิยมพกเครื่องรางรูปกบติดตัวเมื่อต้องเดินทางไกล เพื่ออวยพรให้ 'กลับบ้านอย่างปลอดภัย' และเงินทองที่จ่ายไป 'ไหลกลับมา'",
        "jlpt": 2,
        "kanken": "3級",
        "tags": ["เดินทางปลอดภัย", "เครื่องราง", "เล่นคำพ้องเสียง"]
    },
    {
        "id": "animal-butterfly",
        "word": "蝶",
        "reading": "ちょう",
        "romaji": "chou",
        "category": "animals",
        "category_th": "สัตว์ในคันจิ (動物)",
        "series": None,
        "meaning_th": "ผีเสื้อ (สัญลักษณ์แห่งการเปลี่ยนผ่านและดวงวิญญาณ)",
        "meaning_en": "Butterfly",
        "ruby_html": "<ruby>蝶<rt>ちょう</rt></ruby>",
        "literal_breakdown": [
            {"char": "虫", "meaning": "หมวดแมลง"},
            {"char": "枼", "meaning": "ใบไม้บางแบน / แผ่กว้าง"}
        ],
        "lore": "ในวรรณคดีและอนิเมะญี่ปุ่น (เช่น ดาบพิฆาตอสูรของชิโนบุ หรือบลีชของผีเสื้อนรก) ผีเสื้อเป็นสัญลักษณ์เชื่อมโยงระหว่างโลกมนุษย์และปรโลก รวมถึงการกำเนิดใหม่",
        "jlpt": 1,
        "kanken": "2級",
        "tags": ["แมลง", "ผีเสื้อ", "ความงาม"]
    },

    # More Plants & Fruits
    {
        "id": "plant-watermelon",
        "word": "西瓜",
        "reading": "すいか",
        "romaji": "suika",
        "category": "plants",
        "category_th": "พืช ดอกไม้ ผลไม้ (植物・花・果物)",
        "series": None,
        "meaning_th": "แตงโม (แตงจากทิศตะวันตก)",
        "meaning_en": "Watermelon",
        "ruby_html": "<ruby>西<rt>すい</rt></ruby><ruby>瓜<rt>か</rt></ruby>",
        "literal_breakdown": [
            {"char": "西", "meaning": "ทิศตะวันตก"},
            {"char": "瓜", "meaning": "แตง"}
        ],
        "lore": "ในอดีตแตงโมเดินทางจากทวีปแอฟริกาผ่านเส้นทางสายไหมเข้าสู่ประเทศจีนทางทิศตะวันตก จึงได้ชื่อว่า 'แตงตะวันตก' เป็นผลไม้สัญลักษณ์คู่กับกิจกรรมตีแตงโม (スイカ割り) ในฤดูร้อนญี่ปุ่น",
        "jlpt": 2,
        "kanken": "準1級",
        "tags": ["ฤดูร้อน", "แตงโม", "ผลไม้"]
    },
    {
        "id": "plant-cherry-blossom",
        "word": "桜",
        "reading": "さくら",
        "romaji": "sakura",
        "category": "plants",
        "category_th": "พืช ดอกไม้ ผลไม้ (植物・花・果物)",
        "series": None,
        "meaning_th": "ดอกซากุระ (ดอกไม้ประจำชาติและสัญลักษณ์แห่งการเริ่มต้นใหม่)",
        "meaning_en": "Cherry Blossom; Sakura",
        "ruby_html": "<ruby>桜<rt>さくら</rt></ruby>",
        "literal_breakdown": [
            {"char": "木", "meaning": "ต้นไม้"},
            {"char": "ツ", "meaning": "กลีบดอกไม้เรียงราย"},
            {"char": "女", "meaning": "หญิงงาม / อ่อนช้อย"}
        ],
        "lore": "ซากุระจะบานสะพรั่งในช่วงปลายเดือนมีนาคมถึงเมษายน ซึ่งตรงกับช่วงเปิดเทอมและเริ่มต้นปีงบประมาณใหม่ของญี่ปุ่น กลีบดอกที่ร่วงโรยเร็วเป็นตัวแทนของแนวคิด 'มุโจ' (無常) ความไม่เที่ยงแท้ของชีวิต",
        "jlpt": 3,
        "kanken": "6級",
        "tags": ["ฤดูใบไม้ผลิ", "ฮานามิ", "ดอกไม้ประจำชาติ"]
    },

    # More Manga & Anime (Bleach, Naruto, Kimetsu, Jujutsu, Hunter x Hunter, FMA)
    {
        "id": "bleach-kido",
        "word": "鬼道",
        "reading": "きどう",
        "romaji": "kidou",
        "category": "anime-bleach",
        "category_th": "มังงะและอนิเมะ (Bleach)",
        "series": "Bleach (บลีช เทพมรณะ)",
        "meaning_th": "วิถีมาร - ศาสตร์เวทมนตร์ขั้นสูงของเหล่ายมทูต แบ่งเป็น วิถีทำลาย (破道) และวิถีพันธนาการ (縛道)",
        "meaning_en": "Kido; Demon Arts / Soul Reaper magic spells",
        "ruby_html": "<ruby>鬼<rt>き</rt></ruby><ruby>道<rt>どう</rt></ruby>",
        "literal_breakdown": [
            {"char": "鬼", "meaning": "มาร / ยักษ์ / อสูร"},
            {"char": "道", "meaning": "วิถี / ศาสตร์ / หนทาง"}
        ],
        "lore": "การร่ายบทสวดก่อนปล่อยวิถีมาร (詠唱: เอโช) เพื่อปลดปล่อยพลังทำลายเต็ม 100% เป็นเอกลักษณ์การใช้ภาษาบทกวีที่ทรงเสน่ห์และงดงามที่สุดของ อ.ไทโตะ คุโบะ",
        "jlpt": 2,
        "kanken": "7級",
        "tags": ["วิถีมาร", "คาถา", "ยมทูต"]
    },
    {
        "id": "bleach-arrancar",
        "word": "破面",
        "reading": "アランカル / はめん",
        "romaji": "arankaru",
        "category": "anime-bleach",
        "category_th": "มังงะและอนิเมะ (Bleach)",
        "series": "Bleach (บลีช เทพมรณะ)",
        "meaning_th": "อารันคาร์ (ฮอลโลว์ที่ทำลายหน้ากากของตนเพื่อได้รับพลังของยมทูต)",
        "meaning_en": "Arrancar; broken mask (Hollow with Soul Reaper powers)",
        "ruby_html": "<ruby>破<rt>アラン</rt></ruby><ruby>面<rt>カル</rt></ruby>",
        "literal_breakdown": [
            {"char": "破", "meaning": "ทำลาย / แตกหัก / กะเทาะ"},
            {"char": "面", "meaning": "หน้ากาก / ใบหน้า"}
        ],
        "lore": "ตัวอักษร 破面 เขียนด้วยคันจิที่มีความหมายตรงตัวว่า 'หน้ากากแตก' แต่กำกับเสียงอ่าน (Gikun) ด้วยภาษาสเปน 'Arrancar' (แปลว่าฉีกหรือกระชากออก)",
        "jlpt": 2,
        "kanken": "7級",
        "tags": ["ฮอลโลว์", "เอสปาด้า", "Ateji/Gikun"]
    },
    {
        "id": "naruto-kagebunshin",
        "word": "影分身",
        "reading": "かげぶんしん",
        "romaji": "kage bunshin",
        "category": "anime-naruto",
        "category_th": "มังงะและอนิเมะ (Naruto)",
        "series": "Naruto (นินจาคาถา นารูโตะ)",
        "meaning_th": "แยกเงาพันร่าง (วิชาแยกเงาที่มีกายเนื้อจริง แตกต่างจากวิชาแยกร่างลวงตาทั่วไป)",
        "meaning_en": "Shadow Clone; solid shadow duplicate technique",
        "ruby_html": "<ruby>影<rt>かげ</rt></ruby><ruby>分<rt>ぶん</rt></ruby><ruby>身<rt>しん</rt></ruby>",
        "literal_breakdown": [
            {"char": "影", "meaning": "เงา"},
            {"char": "分", "meaning": "แบ่ง / แยกออก"},
            {"char": "身", "meaning": "ร่างกาย / ตัวตน"}
        ],
        "lore": "วิชาต้องห้ามระดับจูนินที่โฮคาเงะรุ่นที่ 2 โทบิรามะ คิดค้นขึ้น ความพิเศษคือร่างแยกมีกายเนื้อจริงและเมื่อสลายตัว ความรู้และประสบการณ์ทั้งหมดจะส่งกลับคืนสู่ร่างจริง",
        "jlpt": 3,
        "kanken": "7級",
        "tags": ["นารูโตะ", "วิชานินจา", "คาถาเงา"]
    },
    {
        "id": "naruto-akatsuki",
        "word": "暁",
        "reading": "あかつき",
        "romaji": "akatsuki",
        "category": "anime-naruto",
        "category_th": "มังงะและอนิเมะ (Naruto)",
        "series": "Naruto (นินจาคาถา นารูโตะ)",
        "meaning_th": "แสงอุษา / แสงแรกแห่งรุ่งอรุณ (กลุ่มนินจาถอนตัวในชุดคลุมลายเมฆสีแดง)",
        "meaning_en": "Dawn / Daybreak; the rogue ninja organization Akatsuki",
        "ruby_html": "<ruby>暁<rt>あかつき</rt></ruby>",
        "literal_breakdown": [
            {"char": "日", "meaning": "ดวงอาทิตย์"},
            {"char": "尭", "meaning": "สูงส่ง / เด่นตระหง่าน"}
        ],
        "lore": "คำว่า 暁 ในภาษาญี่ปุ่นหมายถึงท้องฟ้าช่วงใกล้รุ่งก่อนที่ดวงอาทิตย์จะโผล่พ้นขอบฟ้า ยาฮิโกะผู้ก่อตั้งกลุ่มตั้งชื่อนี้ด้วยความหวังว่ากลุ่มจะนำ 'แสงสว่างแห่งสันติภาพ' มาสู่โลกนินจาอันมืดมิด",
        "jlpt": 1,
        "kanken": "4級",
        "tags": ["แสงอุษา", "เพน", "อิทาจิ"]
    },
    {
        "id": "naruto-rinnegan",
        "word": "輪廻眼",
        "reading": "りんねがん",
        "romaji": "rinnegan",
        "category": "anime-naruto",
        "category_th": "มังงะและอนิเมะ (Naruto)",
        "series": "Naruto (นินจาคาถา นารูโตะ)",
        "meaning_th": "เนตรสังสาระ (สุดยอดเนตรแห่งเซียน 6 วิถี สามารถควบคุมความเป็นความตายและวัฏสงสาร)",
        "meaning_en": "Rinnegan; Saṃsāra Eye / Wheel of Reincarnation",
        "ruby_html": "<ruby>輪<rt>りん</rt></ruby><ruby>廻<rt>ね</rt></ruby><ruby>眼<rt>がん</rt></ruby>",
        "literal_breakdown": [
            {"char": "輪", "meaning": "กงล้อ"},
            {"char": "廻", "meaning": "หมุนเวียน / วนกลับ"},
            {"char": "眼", "meaning": "ดวงตา / เนตร"}
        ],
        "lore": "มาจากคำศัพท์ทางพุทธศาสนา 'สังสารวัฏ' (輪廻: รินเนะ) วงล้อแห่งการเวียนว่ายตายเกิดใน 6 ภพภูมิ (นรก, เปรต, อสุรกาย, เดรัจฉาน, มนุษย์, สวรรค์) สะท้อนผ่านวิถีทั้ง 6 ของเพน",
        "jlpt": 1,
        "kanken": "2級",
        "tags": ["เนตรสังสาระ", "เพน", "พุทธศาสนา"]
    },
    {
        "id": "kny-zen-shuchu",
        "word": "全集中",
        "reading": "ぜんしゅうちゅう",
        "romaji": "zen shuuchuu",
        "category": "anime-kny",
        "category_th": "มังงะและอนิเมะ (Kimetsu no Yaiba)",
        "series": "Kimetsu no Yaiba (ดาบพิฆาตอสูร)",
        "meaning_th": "เพ่งสมาธิรวมปราณ (สูดอากาศเข้าสู่ปอดให้เต็มที่ เร่งอัตราการไหลเวียนโลหิตและชีพจรเพื่อดึงศักยภาพสูงสุดของร่างกาย)",
        "meaning_en": "Total Concentration Breathing",
        "ruby_html": "<ruby>全<rt>ぜん</rt></ruby><ruby>集<rt>しゅう</rt></ruby><ruby>中<rt>ちゅう</rt></ruby>",
        "literal_breakdown": [
            {"char": "全", "meaning": "ทั้งหมด / ครบถ้วน"},
            {"char": "集", "meaning": "รวบรวม"},
            {"char": "中", "meaning": "ศูนย์กลาง / ท่ามกลาง"}
        ],
        "lore": "วลียอดฮิตที่แพร่หลายในโรงเรียนญี่ปุ่นจนครูและผู้ปกครองนำมาพูดกับเด็กๆ เวลาให้อ่านหนังสือสอบ '全集中、勉強の呼吸!' (เพ่งจิตรวมสมาธิ... ปราณแห่งการอ่านหนังสือ!)",
        "jlpt": 3,
        "kanken": "8級",
        "tags": ["รวมปราณ", "ทันจิโร่", "สมาธิ"]
    },
    {
        "id": "kny-akaza",
        "word": "猗窩座",
        "reading": "あかざ",
        "romaji": "akaza",
        "category": "anime-kny",
        "category_th": "มังงะและอนิเมะ (Kimetsu no Yaiba)",
        "series": "Kimetsu no Yaiba (ดาบพิฆาตอสูร)",
        "meaning_th": "อาคาสะ (อสูรข้างขึ้นลำดับที่ 3 ผู้ใช้หมัดมวยศิลปะการต่อสู้ระยะประชิด)",
        "meaning_en": "Akaza; Upper Rank Three demon",
        "ruby_html": "<ruby>猗<rt>あ</rt></ruby><ruby>窩<rt>か</rt></ruby><ruby>座<rt>ざ</rt></ruby>",
        "literal_breakdown": [
            {"char": "猗", "meaning": "สุนัขตอน / สัตว์ที่ถูกจองจำล่ามโซ่"},
            {"char": "窩", "meaning": "โพรงถ้ำ / รังซ่อนตัว"},
            {"char": "座", "meaning": "ที่นั่ง / บัลลังก์"}
        ],
        "lore": "คันจิตัว 猗 เป็นอักษรหายากระดับ 漢検 1級 สื่อถึงสุนัขที่ถูกกักขัง สะท้อนอดีตอันแสนเจ็บปวดของฮาคุจิ (ชื่อเดิมตอนเป็นมนุษย์) ที่ถูกตราหน้าว่าเป็นขโมยและถูกเฆี่ยนตีจนชีวิตพังทลาย",
        "jlpt": 1,
        "kanken": "1級",
        "tags": ["อาคาสะ", "อสูรข้างขึ้น", "คันจิยากมาก"]
    },
    {
        "id": "jjk-sukuna",
        "word": "両面宿儺",
        "reading": "りょうめんすくな",
        "romaji": "ryoumen sukuna",
        "category": "anime-jjk",
        "category_th": "มังงะและอนิเมะ (Jujutsu Kaisen)",
        "series": "Jujutsu Kaisen (มหาเวทย์ผนึกมาร)",
        "meaning_th": "เรียวเมน สุคุนะ (ราชาแห่งคำสาป ผู้มี 4 แขนและ 2 ใบหน้าในร่างเดียว)",
        "meaning_en": "Ryomen Sukuna; King of Curses",
        "ruby_html": "<ruby>両<rt>りょう</rt></ruby><ruby>面<rt>めん</rt></ruby><ruby>宿<rt>すく</rt></ruby><ruby>儺<rt>な</rt></ruby>",
        "literal_breakdown": [
            {"char": "両", "meaning": "ทั้งสอง / คู่"},
            {"char": "面", "meaning": "ใบหน้า / หน้ากาก"},
            {"char": "宿", "meaning": "พักพิง / สถิตอยู่"},
            {"char": "儺", "meaning": "พิธีขับไล่ภูตผีปีศาจ"}
        ],
        "lore": "มีที่มาจากบันทึกประวัติศาสตร์โบราณ *นิฮงโชกิ (日本書紀)* เขียนขึ้นในศตวรรษที่ 8 บรรยายถึงวีรบุรุษหรืออสูรกายแห่งแคว้นฮิดะ (ปัจจุบันคือจังหวัดกิฟุ) ที่มีสองหน้าสี่แขนและถือธนูสองคัน",
        "jlpt": 1,
        "kanken": "1級",
        "tags": ["สุคุนะ", "ราชาคำสาป", "ประวัติศาสตร์ญี่ปุ่น"]
    },
    {
        "id": "hxh-nen",
        "word": "念能力",
        "reading": "ねんのうりょく",
        "romaji": "nen nouryoku",
        "category": "anime-other",
        "category_th": "มังงะและอนิเมะยอดฮิต",
        "series": "Hunter x Hunter (ฮันเตอร์ x ฮันเตอร์)",
        "meaning_th": "พลังเน็น - ระบบควบคุมพลังชีวิต (ออร่า) ที่รั่วไหลออกจากร่างกาย แบ่งเป็น 6 สายตามธรรมชาติของผู้ใช้",
        "meaning_en": "Nen ability; manipulation of life energy / aura in Hunter x Hunter",
        "ruby_html": "<ruby>念<rt>ねん</rt></ruby><ruby>能<rt>のう</rt></ruby><ruby>力<rt>りょく</rt></ruby>",
        "literal_breakdown": [
            {"char": "念", "meaning": "จิตตั้งมั่น / ความปรารถนาในใจ"},
            {"char": "能", "meaning": "ความสามารถ / ศักยภาพ"},
            {"char": "力", "meaning": "พลัง / กำลัง"}
        ],
        "lore": "อ.โยชิฮิโระ โทงาชิ วางโครงสร้างระบบพลังเน็นโดยใช้ 4 มหาวิถีหลัก: เท็น (纏: ห่อหุ้ม), เซ็ตสึ (絶: ปิดกั้น), เร็น (練: ขยายผล), ฮัตสึ (発: ปลดปล่อย) ซึ่งอิงจากคันจิการฝึกสมาธิของศาสนาเซน",
        "jlpt": 2,
        "kanken": "5級",
        "tags": ["ฮันเตอร์", "พลังเน็น", "ระบบต่อสู้"]
    },
    {
        "id": "fma-toka-kokan",
        "word": "等価交換",
        "reading": "とうかこうかん",
        "romaji": "touka koukan",
        "category": "anime-other",
        "category_th": "มังงะและอนิเมะยอดฮิต",
        "series": "Fullmetal Alchemist (แขนกลคนแปรธาตุ)",
        "meaning_th": "การแลกเปลี่ยนที่เท่าเทียม - กฎเหล็กพื้นฐานที่สุดของการเล่นแร่แปรธาตุ 'หากปรารถนาสิ่งใด จำต้องจ่ายด้วยสิ่งที่มีมูลค่าเท่ากัน'",
        "meaning_en": "Equivalent Exchange; absolute law of alchemy",
        "ruby_html": "<ruby>等<rt>とう</rt></ruby><ruby>価<rt>か</rt></ruby><ruby>交<rt>こう</rt></ruby><ruby>換<rt>かん</rt></ruby>",
        "literal_breakdown": [
            {"char": "等", "meaning": "เท่ากัน / เสมอภาค"},
            {"char": "価", "meaning": "มูลค่า / ราคา"},
            {"char": "交", "meaning": "สลับ / แลกเปลี่ยน"},
            {"char": "換", "meaning": "เปลี่ยน / โอนย้าย"}
        ],
        "lore": "หลักปรัชญาหัวใจสำคัญของเรื่องที่ อ.ฮิโรมุ อาราคาวะ นำมาจากหลักการอนุรักษ์มวลสารในวิชาเคมี และวิถีชีวิตครอบครัวชาวไร่ของตนในฮอกไกโด 'ไม่ลงแรง ก็ไม่ได้ผลผลิต'",
        "jlpt": 1,
        "kanken": "4級",
        "tags": ["แปรธาตุ", "เอ็ดเวิร์ด", "ปรัชญา"]
    }
]

with open('data/vocabulary.json', 'r', encoding='utf-8') as f:
    existing = json.load(f)

existing.extend(more_vocab)

with open('data/vocabulary.json', 'w', encoding='utf-8') as f:
    json.dump(existing, f, ensure_ascii=False, indent=2)

print(f"Total vocabulary items now: {len(existing)}")
