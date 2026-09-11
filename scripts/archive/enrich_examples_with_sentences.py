# -*- coding: utf-8 -*-
import json
import glob
import os

# Example vocabulary with authentic Japanese sentences and Thai translations
SENTENCE_DATA = {
    "一": [
        {
            "word": "一日", "reading": "ついたち / いちにち", "meaning_en": "1st day of month / one day", "meaning_th": "วันที่ 1 / หนึ่งวัน",
            "sentence_ja": "毎月一日は神社にお参りします。", "sentence_th": "ทุกวันที่หนึ่งของเดือนฉันจะไปไหว้พระที่ศาลเจ้า"
        },
        {
            "word": "一番", "reading": "いちばん", "meaning_en": "number one, best", "meaning_th": "อันดับหนึ่ง, ที่สุด",
            "sentence_ja": "健康が何よりも一番大切です。", "sentence_th": "สุขภาพเป็นสิ่งสำคัญที่สุดเหนือสิ่งอื่นใด"
        },
        {
            "word": "一人", "reading": "ひとり", "meaning_en": "one person, alone", "meaning_th": "คนเดียว, หนึ่งคน",
            "sentence_ja": "週末は一人で映画を見に行きました。", "sentence_th": "สุดสัปดาห์ฉันไปดูภาพยนตร์คนเดียว"
        }
    ],
    "日": [
        {
            "word": "日本", "reading": "にほん", "meaning_en": "Japan", "meaning_th": "ประเทศญี่ปุ่น",
            "sentence_ja": "来年、日本へ桜を見に行きたいです。", "sentence_th": "ปีหน้าฉันอยากไปดูซากุระที่ประเทศญี่ปุ่น"
        },
        {
            "word": "今日", "reading": "きょう", "meaning_en": "today", "meaning_th": "วันนี้",
            "sentence_ja": "今日の天気はとてもいいですね。", "sentence_th": "วันนี้อากาศดีมากเลยนะครับ"
        },
        {
            "word": "日曜日", "reading": "にちようび", "meaning_en": "Sunday", "meaning_th": "วันอาทิตย์",
            "sentence_ja": "日曜日は家族とゆっくり過ごします。", "sentence_th": "วันอาทิตย์ฉันใช้เวลาพักผ่อนสบายๆ กับครอบครัว"
        }
    ],
    "月": [
        {
            "word": "月曜日", "reading": "げつようび", "meaning_en": "Monday", "meaning_th": "วันจันทร์",
            "sentence_ja": "月曜日から新しい仕事が始まります。", "sentence_th": "งานใหม่จะเริ่มตั้งแต่วันจันทร์"
        },
        {
            "word": "満月", "reading": "まんげつ", "meaning_en": "full moon", "meaning_th": "พระจันทร์เต็มดวง",
            "sentence_ja": "今夜は空にきれいな満月が出ています。", "sentence_th": "คืนนี้มีพระจันทร์เต็มดวงสวยงามลอยเด่นบนท้องฟ้า"
        },
        {
            "word": "今月", "reading": "こんげつ", "meaning_en": "this month", "meaning_th": "เดือนนี้",
            "sentence_ja": "今月は日本語能力試験があります。", "sentence_th": "เดือนนี้มีการสอบวัดระดับภาษาญี่ปุ่น (JLPT)"
        }
    ],
    "木": [
        {
            "word": "木曜日", "reading": "もくようび", "meaning_en": "Thursday", "meaning_th": "วันพฤหัสบดี",
            "sentence_ja": "木曜日の午後に会議があります。", "sentence_th": "ช่วงบ่ายวันพฤหัสบดีมีการประชุม"
        },
        {
            "word": "大木", "reading": "たいぼく", "meaning_en": "large tree", "meaning_th": "ต้นไม้ใหญ่",
            "sentence_ja": "神社には樹齢数百年の大木があります。", "sentence_th": "ที่ศาลเจ้ามีต้นไม้ใหญ่อายุหลายร้อยปี"
        },
        {
            "word": "木造", "reading": "もくぞう", "meaning_en": "wooden, made of wood", "meaning_th": "สร้างด้วยไม้",
            "sentence_ja": "京都には歴史ある木造建築が多いです。", "sentence_th": "ที่เกียวโตมีสถาปัตยกรรมไม้เก่าแก่ทางประวัติศาสตร์มากมาย"
        }
    ],
    "山": [
        {
            "word": "富士山", "reading": "ふじさん", "meaning_en": "Mt. Fuji", "meaning_th": "ภูเขาไฟฟูจิ",
            "sentence_ja": "富士山は日本で一番高い山です。", "sentence_th": "ภูเขาไฟฟูจิเป็นภูเขาที่สูงที่สุดในประเทศญี่ปุ่น"
        },
        {
            "word": "火山", "reading": "かざん", "meaning_en": "volcano", "meaning_th": "ภูเขาไฟ",
            "sentence_ja": "日本にはたくさんの活火山があります。", "sentence_th": "ในประเทศญี่ปุ่นมีภูเขาไฟที่ยังมีพลังอยู่มากมาย"
        },
        {
            "word": "山登り", "reading": "やまのぼり", "meaning_en": "mountain climbing", "meaning_th": "การปีนเขา",
            "sentence_ja": "秋の連休に友達と山登りに行きました。", "sentence_th": "ช่วงวันหยุดยาวฤดูใบไม้ร่วงฉันไปปีนเขากับเพื่อนๆ"
        }
    ],
    "水": [
        {
            "word": "水曜日", "reading": "すいようび", "meaning_en": "Wednesday", "meaning_th": "วันพุธ",
            "sentence_ja": "水曜日は定休日です。", "sentence_th": "วันพุธเป็นวันหยุดประจำของร้าน"
        },
        {
            "word": "水泳", "reading": "すいえい", "meaning_en": "swimming", "meaning_th": "การว่ายน้ำ",
            "sentence_ja": "毎朝、健康のために水泳をしています。", "sentence_th": "ฉันว่ายน้ำทุกเช้าเพื่อสุขภาพ"
        },
        {
            "word": "冷水", "reading": "れいすい", "meaning_en": "cold water", "meaning_th": "น้ำเย็น",
            "sentence_ja": "運動の後に冷水を一杯飲みました。", "sentence_th": "หลังออกกำลังกายฉันดื่มน้ำเย็นไปหนึ่งแก้ว"
        }
    ],
    "火": [
        {
            "word": "火曜日", "reading": "かようび", "meaning_en": "Tuesday", "meaning_th": "วันอังคาร",
            "sentence_ja": "火曜日に燃えるゴミを出します。", "sentence_th": "วันอังคารเป็นวันทิ้งขยะที่เผาได้"
        },
        {
            "word": "花火", "reading": "はなび", "meaning_en": "fireworks", "meaning_th": "ดอกไม้ไฟ",
            "sentence_ja": "夏の夜に川沿いで花火大会を楽しみました。", "sentence_th": "ในคืนฤดูร้อนฉันเพลิดเพลินกับเทศกาลดอกไม้ไฟริมแม่น้ำ"
        },
        {
            "word": "火事", "reading": "かじ", "meaning_en": "fire, conflagration", "meaning_th": "อัคคีภัย, ไฟไหม้",
            "sentence_ja": "冬は空気が乾燥するので火事に気をつけましょう。", "sentence_th": "ในฤดูหนาวอากาศแห้งจึงควรระมัดระวังเรื่องไฟไหม้"
        }
    ],
    "花": [
        {
            "word": "花見", "reading": "はなみ", "meaning_en": "cherry blossom viewing", "meaning_th": "การชมดอกไม้ (ฮานามิ)",
            "sentence_ja": "春になると公園で花見をします。", "sentence_th": "เมื่อเข้าสู่ฤดูใบไม้ผลิ ผู้คนจะไปชมดอกไม้ที่สวนสาธารณะ"
        },
        {
            "word": "生け花", "reading": "いけばな", "meaning_en": "flower arrangement", "meaning_th": "การจัดดอกไม้แบบญี่ปุ่น",
            "sentence_ja": "母は生け花の教室に通っています。", "sentence_th": "คุณแม่ไปเรียนคลาสจัดดอกไม้แบบญี่ปุ่น"
        },
        {
            "word": "花束", "reading": "はなたば", "meaning_en": "bouquet", "meaning_th": "ช่อดอกไม้",
            "sentence_ja": "誕生日にきれいな花束をもらいました。", "sentence_th": "ฉันได้รับช่อดอกไม้สวยงามในวันเกิด"
        }
    ],
    "空": [
        {
            "word": "空港", "reading": "くうこう", "meaning_en": "airport", "meaning_th": "สนามบิน",
            "sentence_ja": "電車で成田空港へ向かいました。", "sentence_th": "ฉันนั่งรถไฟมุ่งหน้าไปยังสนามบินนาริตะ"
        },
        {
            "word": "空気", "reading": "くうき", "meaning_en": "air, atmosphere", "meaning_th": "อากาศ, บรรยากาศ",
            "sentence_ja": "山の上は空気が澄んでいておいしいです。", "sentence_th": "บนยอดเขาอากาศบริสุทธิ์สดชื่นมาก"
        },
        {
            "word": "青空", "reading": "あおぞら", "meaning_en": "blue sky", "meaning_th": "ท้องฟ้าสีคราม",
            "sentence_ja": "見上げると一面の青空が広がっていました。", "sentence_th": "เมื่อแหงนมองขึ้นไป ท้องฟ้าสีครามแผ่กว้างสุดสายตา"
        }
    ],
    "雨": [
        {
            "word": "大雨", "reading": "おおあめ", "meaning_en": "heavy rain", "meaning_th": "ฝนตกหนัก",
            "sentence_ja": "大雨のため電車が一時運転を見合わせました。", "sentence_th": "เนื่องจากฝนตกหนัก รถไฟจึงหยุดให้บริการชั่วคราว"
        },
        {
            "word": "雨季", "reading": "うき", "meaning_en": "rainy season", "meaning_th": "ฤดูฝน",
            "sentence_ja": "タイの雨季はスコールがよく降ります。", "sentence_th": "ในฤดูฝนของประเทศไทยมักมีฝนซู่ตกหนัก"
        },
        {
            "word": "梅雨", "reading": "つゆ", "meaning_en": "rainy season (June-July in Japan)", "meaning_th": "ฤดูฝนสึยุในญี่ปุ่น",
            "sentence_ja": "六月になると日本は梅雨の時期に入ります。", "sentence_th": "พอถึงเดือนมิถุนายน ประเทศญี่ปุ่นจะเข้าสู่ช่วงฤดูฝนสึยุ"
        }
    ],
    "字": [
        {
            "word": "文字", "reading": "もじ", "meaning_en": "letter, character", "meaning_th": "ตัวอักษร",
            "sentence_ja": "この本は文字が大きくて読みやすいです。", "sentence_th": "หนังสือเล่มนี้ตัวอักษรใหญ่และอ่านง่าย"
        },
        {
            "word": "数字", "reading": "すうじ", "meaning_en": "number, numeral", "meaning_th": "ตัวเลข",
            "sentence_ja": "暗証番号の数字を四桁入力してください。", "sentence_th": "กรุณากรอกตัวเลขรหัสผ่าน 4 หลัก"
        }
    ],
    "心": [
        {
            "word": "安心", "reading": "あんしん", "meaning_en": "peace of mind, relief", "meaning_th": "ความสบายใจ, โล่งอก",
            "sentence_ja": "無事に到着したと聞いて安心しました。", "sentence_th": "พอได้ยินว่าเดินทางถึงอย่างปลอดภัยก็รู้สึกโล่งอกสบายใจ"
        },
        {
            "word": "心理学", "reading": "しんりがく", "meaning_en": "psychology", "meaning_th": "จิตวิทยา",
            "sentence_ja": "大学で臨床心理学を専攻しています。", "sentence_th": "ฉันกำลังเรียนเอกจิตวิทยาคลินิกที่มหาวิทยาลัย"
        },
        {
            "word": "中心", "reading": "ちゅうしん", "meaning_en": "center, core", "meaning_th": "ใจกลาง, ศูนย์กลาง",
            "sentence_ja": "町の中心部に新しいショッピングモールができました。", "sentence_th": "มีห้างสรรพสินค้าใหม่สร้างขึ้นที่ใจกลางเมือง"
        }
    ],
    "星": [
        {
            "word": "星座", "reading": "せいざ", "meaning_en": "constellation", "meaning_th": "กลุ่มดาว",
            "sentence_ja": "冬の夜空にオリオン座がはっきりと見えます。", "sentence_th": "บนท้องฟ้ายามค่ำคืนในฤดูหนาวมองเห็นกลุ่มดาวนายพรานได้อย่างชัดเจน"
        },
        {
            "word": "流れ星", "reading": "ながれぼし", "meaning_en": "shooting star", "meaning_th": "ดาวตก, ผีพุ่งไต้",
            "sentence_ja": "流れ星に願い事を三回唱えました。", "sentence_th": "ฉันอธิษฐานขอพรกับดาวตกสามครั้ง"
        }
    ],
    "海": [
        {
            "word": "海外", "reading": "かいがい", "meaning_en": "overseas, abroad", "meaning_th": "ต่างประเทศ",
            "sentence_ja": "将来は海外で働きたいと考えています。", "sentence_th": "ในอนาคตฉันคิดว่าอยากไปทำงานที่ต่างประเทศ"
        },
        {
            "word": "海水浴", "reading": "かいすいよく", "meaning_en": "swimming in the sea", "meaning_th": "การเล่นน้ำทะเล",
            "sentence_ja": "夏休みに家族で海水浴に行きました。", "sentence_th": "ในวันหยุดฤดูร้อนฉันไปเล่นน้ำทะเลกับครอบครัว"
        },
        {
            "word": "日本海", "reading": "にほんかい", "meaning_en": "Sea of Japan", "meaning_th": "ทะเลญี่ปุ่น",
            "sentence_ja": "日本海側は冬になると大雪が降ります。", "sentence_th": "ฝั่งทะเลญี่ปุ่นพอถึงฤดูหนาวหิมะจะตกหนักมาก"
        }
    ],
    "風": [
        {
            "word": "台風", "reading": "たいふう", "meaning_en": "typhoon", "meaning_th": "พายุไต้ฝุ่น",
            "sentence_ja": "台風が近づいているので外出を控えてください。", "sentence_th": "เนื่องจากพายุไต้ฝุ่นกำลังใกล้เข้ามา โปรดงดเว้นการออกไปข้างนอก"
        },
        {
            "word": "和風", "reading": "わふう", "meaning_en": "Japanese style", "meaning_th": "สไตล์ญี่ปุ่น",
            "sentence_ja": "和風パスタの味付けには醤油がよく使われます。", "sentence_th": "พาสต้าสไตล์ญี่ปุ่นมักปรุงรสด้วยโชยุ"
        },
        {
            "word": "風邪", "reading": "かぜ", "meaning_en": "common cold", "meaning_th": "ไข้หวัด",
            "sentence_ja": "風邪をひいたので今日は早く寝ます。", "sentence_th": "เพราะเป็นหวัดวันนี้ฉันจึงจะรีบนอนแต่หัวค่ำ"
        }
    ],
    "語": [
        {
            "word": "日本語", "reading": "にほんご", "meaning_en": "Japanese language", "meaning_th": "ภาษาญี่ปุ่น",
            "sentence_ja": "毎日日本語の漢字を練習しています。", "sentence_th": "ฉันฝึกคัดคันจิภาษาญี่ปุ่นทุกวัน"
        },
        {
            "word": "タイ語", "reading": "タイご", "meaning_en": "Thai language", "meaning_th": "ภาษาไทย",
            "sentence_ja": "彼はタイ語を流暢に話すことができます。", "sentence_th": "เขาสามารถพูดภาษาไทยได้อย่างคล่องแคล่ว"
        },
        {
            "word": "英語", "reading": "えいご", "meaning_en": "English language", "meaning_th": "ภาษาอังกฤษ",
            "sentence_ja": "英語で道案内をしました。", "sentence_th": "ฉันช่วยบอกทางเป็นภาษาอังกฤษ"
        },
        {
            "word": "単語", "reading": "たんご", "meaning_en": "word, vocabulary", "meaning_th": "คำศัพท์",
            "sentence_ja": "新しい単語をノートにメモしました。", "sentence_th": "ฉันจดคำศัพท์ใหม่ลงในสมุดโน้ต"
        }
    ],
    "漢": [
        {
            "word": "漢字", "reading": "かんじ", "meaning_en": "kanji, Chinese characters", "meaning_th": "อักษรคันจิ",
            "sentence_ja": "常用漢字は全部で二千百三十六字あります。", "sentence_th": "ตารางโจโยคันจิมีทั้งหมด 2,136 ตัวอักษร"
        },
        {
            "word": "漢検", "reading": "かんけん", "meaning_en": "Kanji Kentei exam", "meaning_th": "การสอบวัดระดับคันจิ (คันเค็น)",
            "sentence_ja": "来月、漢検二級に挑戦する予定です。", "sentence_th": "เดือนหน้าฉันมีกำหนดจะท้าทายสอบคันเค็นระดับ 2"
        }
    ],
    "愛": [
        {
            "word": "愛情", "reading": "あいじょう", "meaning_en": "love, affection", "meaning_th": "ความรักความผูกพัน",
            "sentence_ja": "親の深い愛情に感謝しています。", "sentence_th": "ฉันรู้สึกซาบซึ้งในความรักความผูกพันอันลึกซึ้งของพ่อแม่"
        },
        {
            "word": "愛国", "reading": "あいこく", "meaning_en": "patriotism", "meaning_th": "ความรักชาติ",
            "sentence_ja": "愛国心を持って社会に貢献したいです。", "sentence_th": "ฉันอยากตอบแทนสังคมด้วยจิตสำนึกรักชาติ"
        },
        {
            "word": "恋愛", "reading": "れんあい", "meaning_en": "romance, love", "meaning_th": "ความรักโรแมนติก",
            "sentence_ja": "最近人気の恋愛小説を読みました。", "sentence_th": "ฉันได้อ่านนิยายรักโรแมนติกที่กำลังเป็นที่นิยมเมื่อเร็วๆ นี้"
        }
    ],
    "夢": [
        {
            "word": "悪夢", "reading": "あくむ", "meaning_en": "nightmare", "meaning_th": "ฝันร้าย",
            "sentence_ja": "怖い悪夢を見て夜中に目が覚めました。", "sentence_th": "ฉันฝันร้ายจนสะดุ้งตื่นขึ้นมากลางดึก"
        },
        {
            "word": "夢中", "reading": "むちゅう", "meaning_en": "absorbed, engrossed", "meaning_th": "หลงใหล, จดจ่ออย่างใจจดใจจ่อ",
            "sentence_ja": "子供たちはゲームに夢中になっています。", "sentence_th": "พวกเด็กๆ กำลังเล่นเกมอย่างใจจดใจจ่อ"
        }
    ],
    "桜": [
        {
            "word": "桜前線", "reading": "さくらぜんせん", "meaning_en": "cherry blossom front", "meaning_th": "แนวพยากรณ์ซากุระบาน",
            "sentence_ja": "春のニュースで桜前線の情報が報じられました。", "sentence_th": "ในข่าวช่วงฤดูใบไม้ผลิมีการรายงานแนวพยากรณ์ซากุระบาน"
        },
        {
            "word": "夜桜", "reading": "よざくら", "meaning_en": "cherry blossoms at night", "meaning_th": "ซากุระยามค่ำคืน",
            "sentence_ja": "ライトアップされた夜桜はとても幻想的です。", "sentence_th": "ซากุระยามค่ำคืนที่ประดับไฟดูสวยงามราวกับภาพฝัน"
        }
    ],
    "鬱": [
        {
            "word": "鬱病", "reading": "うつびょう", "meaning_en": "depression", "meaning_th": "โรคซึมเศร้า",
            "sentence_ja": "ストレスが原因で鬱病になる人が増えています。", "sentence_th": "มีผู้คนป่วยเป็นโรคซึมเศร้าเนื่องจากความเครียดเพิ่มขึ้น"
        },
        {
            "word": "憂鬱", "reading": "ゆううつ", "meaning_en": "melancholy, depression", "meaning_th": "ความรู้สึกหม่นหมอง, หดหู่",
            "sentence_ja": "雨が降り続くと気分が憂鬱になります。", "sentence_th": "พอฝนตกติดต่อกันไม่หยุดก็รู้สึกหดหู่ใจ"
        }
    ],
    "薔": [
        {
            "word": "薔薇", "reading": "ばら", "meaning_en": "rose", "meaning_th": "ดอกกุหลาบ",
            "sentence_ja": "庭に真紅の薔薇が美しく咲いています。", "sentence_th": "ในสวนมีดอกกุหลาบสีแดงสดบานสะพรั่งอย่างสวยงาม"
        }
    ],
    "薇": [
        {
            "word": "薔薇", "reading": "ばら", "meaning_en": "rose", "meaning_th": "ดอกกุหลาบ",
            "sentence_ja": "記念日に薔薇の花束をプレゼントしました。", "sentence_th": "ฉันมอบช่อดอกกุหลาบเป็นของขวัญในวันครบรอบ"
        }
    ],
    # Additional common Kyōiku / Joyo Kanji
    "人": [
        {
            "word": "人生", "reading": "じんせい", "meaning_en": "human life", "meaning_th": "ชีวิตมนุษย์",
            "sentence_ja": "一度きりの人生を大切に生きましょう。", "sentence_th": "จงใช้ชีวิตที่มีเพียงครั้งเดียวนี้อย่างคุ้มค่า"
        },
        {
            "word": "人間", "reading": "にんげん", "meaning_en": "human being", "meaning_th": "มนุษย์",
            "sentence_ja": "人間関係を良好に保つことは大切です。", "sentence_th": "การรักษาความสัมพันธ์อันดีระหว่างมนุษย์เป็นสิ่งสำคัญ"
        }
    ],
    "休": [
        {
            "word": "休日", "reading": "きゅうじつ", "meaning_en": "holiday, day off", "meaning_th": "วันหยุด",
            "sentence_ja": "次の休日は家でゆっくり読書をします。", "sentence_th": "วันหยุดหน้าฉันจะพักผ่อนอ่านหนังสืออยู่ที่บ้าน"
        },
        {
            "word": "休憩", "reading": "きゅうけい", "meaning_en": "break, recess", "meaning_th": "การหยุดพักสั้นๆ",
            "sentence_ja": "一時間勉強した後に十分間休憩します。", "sentence_th": "หลังจากเรียนไปหนึ่งชั่วโมงฉันจะพักสิบนาที"
        }
    ],
    "本": [
        {
            "word": "本当", "reading": "ほんとう", "meaning_en": "truth, reality", "meaning_th": "ความจริง, จริงๆ",
            "sentence_ja": "それは本当の話ですか。", "sentence_th": "นั่นเป็นเรื่องจริงหรือเปล่าครับ"
        },
        {
            "word": "本屋", "reading": "ほんや", "meaning_en": "bookstore", "meaning_th": "ร้านหนังสือ",
            "sentence_ja": "駅前の本屋で辞書を買いました。", "sentence_th": "ฉันซื้อพจนานุกรมที่ร้านหนังสือหน้าสถานี"
        }
    ],
    "見": [
        {
            "word": "意見", "reading": "いけん", "meaning_en": "opinion", "meaning_th": "ความคิดเห็น",
            "sentence_ja": "会議で自分の意見を述べました。", "sentence_th": "ฉันได้แสดงความคิดเห็นของตนเองในที่ประชุม"
        },
        {
            "word": "見学", "reading": "けんがく", "meaning_en": "field trip, study tour", "meaning_th": "การทัศนศึกษาดูงาน",
            "sentence_ja": "来週、自動車工場を見学します。", "sentence_th": "สัปดาห์หน้าเราจะไปทัศนศึกษาดูงานที่โรงงานผลิตรถยนต์"
        }
    ],
    "聞": [
        {
            "word": "新聞", "reading": "しんぶん", "meaning_en": "newspaper", "meaning_th": "หนังสือพิมพ์",
            "sentence_ja": "毎朝朝食を食べながら新聞を読みます。", "sentence_th": "ฉันอ่านหนังสือพิมพ์ทุกเช้าขณะรับประทานอาหารเช้า"
        }
    ],
    "書": [
        {
            "word": "読書", "reading": "どくしょ", "meaning_en": "reading books", "meaning_th": "การอ่านหนังสือ",
            "sentence_ja": "秋の夜長に読書を楽しみます。", "sentence_th": "ฉันเพลิดเพลินกับการอ่านหนังสือในค่ำคืนอันยาวนานของฤดูใบไม้ร่วง"
        },
        {
            "word": "辞書", "reading": "じしょ", "meaning_en": "dictionary", "meaning_th": "พจนานุกรม",
            "sentence_ja": "わからない言葉を辞書で調べました。", "sentence_th": "ฉันค้นหาคำศัพท์ที่ไม่เข้าใจในพจนานุกรม"
        }
    ],
    "道": [
        {
            "word": "道路", "reading": "どうろ", "meaning_en": "road, street", "meaning_th": "ถนนหนทาง",
            "sentence_ja": "工事のため道路が一部通行止めになっています。", "sentence_th": "ถนนถูกปิดการจราจรบางส่วนเนื่องจากการก่อสร้าง"
        },
        {
            "word": "茶道", "reading": "さどう", "meaning_en": "tea ceremony", "meaning_th": "พิธีชงชาแบบญี่ปุ่น",
            "sentence_ja": "日本の伝統文化である茶道を習っています。", "sentence_th": "ฉันกำลังเรียนพิธีชงชาซึ่งเป็นวัฒนธรรมดั้งเดิมของญี่ปุ่น"
        }
    ]
}

# Update all level files
level_files = glob.glob('data/kanji-levels/kanken-*.json')
updated_count = 0

for lf in level_files:
    with open(lf, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    modified = False
    for k in data:
        char = k.get('kanji')
        if char in SENTENCE_DATA:
            k['examples'] = SENTENCE_DATA[char]
            modified = True
            updated_count += 1
            
    if modified:
        with open(lf, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Updated {updated_count} kanji entries with example sentences across level files.")

# Rebuild kanji.min.json
order = [
    'kanken-10.json', 'kanken-9.json', 'kanken-8.json', 'kanken-7.json',
    'kanken-6.json',  'kanken-5.json', 'kanken-4.json', 'kanken-3.json',
    'kanken-jun2.json', 'kanken-2.json', 'kanken-jun1.json', 'kanken-1.json'
]
combined = []
for ofile in order:
    p = os.path.join('data', 'kanji-levels', ofile)
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8') as fp:
            combined.extend(json.load(fp))

with open('data/kanji.min.json', 'w', encoding='utf-8') as fp:
    json.dump(combined, fp, ensure_ascii=False, separators=(',', ':'))

print(f"Rebuilt data/kanji.min.json with {len(combined)} kanji.")
