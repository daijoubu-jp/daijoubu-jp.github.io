/**
 * chinese-zodiacs.js
 * Interactive 12 Japanese Zodiacs (十二支 - Jūnishi) wheel, live time sync,
 * traditional Edo bell clock, compass directions, and cultural etymology guide.
 */

import { playCorrect, isSoundEnabled, setSoundEnabled } from './games/audio.js';

export const ZODIACS = [
  {
    id: 'ne',
    kanji: '子',
    animalKanji: '鼠',
    animalTh: 'หนู',
    animalEn: 'Rat',
    emoji: '🐭',
    onyomi: ['シ'],
    kunyomi: ['ね'],
    thaiReading: 'เนะ (ชิ)',
    startHour: 23,
    endHour: 1,
    timeSpan: '23:00 – 01:00',
    periodJp: '子の刻 (ねのこく)',
    periodTh: 'ยามชวด (23:00 - 01:00)',
    periodPhase: 'night',
    bellCountJp: '九つ (夜九つ)',
    bellCountTh: 'ระฆัง 9 ย่ำ (เที่ยงคืน)',
    directionJp: '北',
    directionTh: 'ทิศเหนือ (0° / 360°)',
    degrees: 0,
    compassGate: '',
    lunarMonth: 11,
    element: '水',
    elementEn: 'water',
    elementTh: 'น้ำ',
    yinYang: '陽',
    yinYangTh: 'หยาง (สว่าง/รุก)',
    etymologyTh: 'อักษร 子 แต่เดิมคือภาพทารกแรกเกิดที่เริ่มแตกหน่อ สื่อถึงจุดเริ่มต้นของสรรพสิ่งและความอุดมสมบูรณ์ ในดาราศาสตร์โบราณเป็นตำแหน่งแรกของทิศเหนือและจุดกึ่งกลางของราตรี',
    triviaTh: 'คำว่า "子午線" (ชิโงเซ็น = เส้นเมริเดียน) มาจากการลากเส้นตรงเชื่อมระหว่างทิศเหนือ (子) และทิศใต้ (午)'
  },
  {
    id: 'ushi',
    kanji: '丑',
    animalKanji: '牛',
    animalTh: 'วัว',
    animalEn: 'Ox',
    emoji: '🐮',
    onyomi: ['チュウ'],
    kunyomi: ['うし'],
    thaiReading: 'อุชิ (ชู)',
    startHour: 1,
    endHour: 3,
    timeSpan: '01:00 – 03:00',
    periodJp: '丑の刻 (うしのこく)',
    periodTh: 'ยามฉลู (01:00 - 03:00)',
    periodPhase: 'night',
    bellCountJp: '八つ (夜八つ)',
    bellCountTh: 'ระฆัง 8 ย่ำ (ดึกสงัด)',
    directionJp: '北東微北',
    directionTh: 'ตะวันออกเฉียงเหนือค่อนเหนือ (30°)',
    degrees: 30,
    compassGate: '',
    lunarMonth: 12,
    element: '土',
    elementEn: 'earth',
    elementTh: 'ดิน',
    yinYang: '陰',
    yinYangTh: 'หยิน (มืด/รับ)',
    etymologyTh: 'อักษร 丑 เป็นรูปมือที่งองุ้มกำลังเกร็งหรือผูกมัด สื่อถึงเมล็ดพันธุ์ที่ยังอยู่ใต้ผืนดินในฤดูหนาวและกำลังสะสมพลังเตรียมจะแทงยอดในฤดูใบไม้ผลิ',
    triviaTh: 'ช่วงเวลา 02:00 - 02:30 น. เรียกว่า "丑三つ時" (อุชิมิตสึโดกิ) ถือเป็นยามวิกาลที่มืดมิดและเงียบสงัดที่สุด เป็นช่วงเวลาผีดุในนิทานพื้นบ้านญี่ปุ่นและพิธีสาปแช่งตุ๊กตาวูดูฟาง (藁人形)'
  },
  {
    id: 'tora',
    kanji: '寅',
    animalKanji: '虎',
    animalTh: 'เสือ',
    animalEn: 'Tiger',
    emoji: '🐯',
    onyomi: ['イン'],
    kunyomi: ['とら'],
    thaiReading: 'โทระ (อิน)',
    startHour: 3,
    endHour: 5,
    timeSpan: '03:00 – 05:00',
    periodJp: '寅の刻 (とらのこく)',
    periodTh: 'ยามขาล (03:00 - 05:00)',
    periodPhase: 'night',
    bellCountJp: '七つ (暁七つ)',
    bellCountTh: 'ระฆัง 7 ย่ำ (รุ่งสาง)',
    directionJp: '北東微南',
    directionTh: 'ตะวันออกเฉียงเหนือค่อนใต้ (60°)',
    degrees: 60,
    compassGate: '艮 (うしとら • 鬼門 Kimon)',
    lunarMonth: 1,
    element: '木',
    elementEn: 'wood',
    elementTh: 'ไม้',
    yinYang: '陽',
    yinYangTh: 'หยาง (สว่าง/รุก)',
    etymologyTh: 'อักษร 寅 เป็นรูปลูกศรที่ดึงด้วยสองมือ สื่อถึงการยืดขยาย การงอกขึ้นพ้นผิวดินของพืชพรรณ และการเริ่มต้นปีใหม่อย่างทรงพลัง (เดือน 1 ตามปฏิทินจันทรคติ)',
    triviaTh: 'ทิศระหว่าง 丑 (วัว) และ 寅 (เสือ) คือ "艮" (อุชิโทระ) หรือ "鬼門" (ประตูผี/คิมง) ซึ่งเป็นที่มาว่าทำไมปีศาจโอนิ (鬼) ในนิทานญี่ปุ่นจึงมีเขาเหมือนวัว และสวมกางเกงหนังเสือ!'
  },
  {
    id: 'u',
    kanji: '卯',
    animalKanji: '兎',
    animalTh: 'กระต่าย',
    animalEn: 'Rabbit',
    emoji: '🐰',
    onyomi: ['ボウ'],
    kunyomi: ['う'],
    thaiReading: 'อุ (โบ)',
    startHour: 5,
    endHour: 7,
    timeSpan: '05:00 – 07:00',
    periodJp: '卯の刻 (うのこく)',
    periodTh: 'ยามเถาะ (05:00 - 07:00)',
    periodPhase: 'day',
    bellCountJp: '六つ (明け六つ)',
    bellCountTh: 'ระฆัง 6 ย่ำ (ฟ้าสาง)',
    directionJp: '東',
    directionTh: 'ทิศตะวันออก (90°)',
    degrees: 90,
    compassGate: '',
    lunarMonth: 2,
    element: '木',
    elementEn: 'wood',
    elementTh: 'ไม้',
    yinYang: '陰',
    yinYangTh: 'หยิน (มืด/รับ)',
    etymologyTh: 'อักษร 卯 มีลักษณะเหมือนประตูกำลังเปิดแง้มออกสองบาน สื่อถึงดวงอาทิตย์ที่ขึ้นทางทิศตะวันออกและเปิดรับรุ่งอรุณแห่งวันใหม่ รวมถึงฤดูใบไม้ผลิที่เบ่งบาน',
    triviaTh: 'เสียงระฆัง "明け六つ" (อาเคะ มุตสึ) ในสมัยเอโดะเป็นสัญญาณบอกให้เปิดประตูปราสาทและผู้คนเริ่มออกไปทำไร่ทำสวน'
  },
  {
    id: 'tatsu',
    kanji: '辰',
    animalKanji: '竜 / 龍',
    animalTh: 'มังกร',
    animalEn: 'Dragon',
    emoji: '🐲',
    onyomi: ['シン'],
    kunyomi: ['たつ'],
    thaiReading: 'ทัตสึ (ชิน)',
    startHour: 7,
    endHour: 9,
    timeSpan: '07:00 – 09:00',
    periodJp: '辰の刻 (たつのこく)',
    periodTh: 'ยามมะโรง (07:00 - 09:00)',
    periodPhase: 'day',
    bellCountJp: '五つ (朝五つ)',
    bellCountTh: 'ระฆัง 5 ย่ำ (ยามเช้า)',
    directionJp: '南東微北',
    directionTh: 'ตะวันออกเฉียงใต้ค่อนเหนือ (120°)',
    degrees: 120,
    compassGate: '',
    lunarMonth: 3,
    element: '土',
    elementEn: 'earth',
    elementTh: 'ดิน',
    yinYang: '陽',
    yinYangTh: 'หยาง (สว่าง/รุก)',
    etymologyTh: 'อักษร 辰 เดิมเป็นภาพเปลือกหอยกาบที่ยื่นเนื้อออกมาขยับเขยื้อน สื่อถึงการเติบโต สั่นสะเทือน (震) ของสรรพสิ่ง เป็นสัตว์ในจินตนาการเพียงชนิดเดียวใน 12 นักษัตร',
    triviaTh: 'มังกรเป็นสัญลักษณ์แห่งพลังอำนาจ พลวัต และการก้าวหน้าสู่ความสำเร็จ ในญี่ปุ่นมักจัดพิธีขอฝนตามศาลเจ้าในเดือนมะโรง'
  },
  {
    id: 'mi',
    kanji: '巳',
    animalKanji: '蛇',
    animalTh: 'งู',
    animalEn: 'Snake',
    emoji: '🐍',
    onyomi: ['シ'],
    kunyomi: ['み'],
    thaiReading: 'มิ (ชิ)',
    startHour: 9,
    endHour: 11,
    timeSpan: '09:00 – 11:00',
    periodJp: '巳の刻 (みのこく)',
    periodTh: 'ยามมะเส็ง (09:00 - 11:00)',
    periodPhase: 'day',
    bellCountJp: '四つ (昼四つ)',
    bellCountTh: 'ระฆัง 4 ย่ำ (สาย)',
    directionJp: '南東微南',
    directionTh: 'ตะวันออกเฉียงใต้ค่อนใต้ (150°)',
    degrees: 150,
    compassGate: '巽 (たつみ)',
    lunarMonth: 4,
    element: '火',
    elementEn: 'fire',
    elementTh: 'ไฟ',
    yinYang: '陰',
    yinYangTh: 'หยิน (มืด/รับ)',
    etymologyTh: 'อักษร 巳 เดิมคือรูปทารกในครรภ์ที่อวัยวะครบสมบูรณ์แล้ว หรือภาพลูกงูที่ฟักตัว สื่อถึงความสมบูรณ์แบบและการหยุดนิ่งพร้อมที่จะเริ่มต้นก้าวต่อไป',
    triviaTh: 'งูเป็นบริวารของเทพีเบนไซเต็น (弁財天) เทพแห่งความมั่งคั่งและปัญญา ชาวญี่ปุ่นจึงเชื่อว่าการพบคราบงูขาวหรือเก็บไว้ในกระเป๋าสตางค์จะนำพาโชคลาภทางการเงิน'
  },
  {
    id: 'uma',
    kanji: '午',
    animalKanji: '馬',
    animalTh: 'ม้า',
    animalEn: 'Horse',
    emoji: '🐴',
    onyomi: ['ゴ'],
    kunyomi: ['うま'],
    thaiReading: 'อุมะ (โกะ)',
    startHour: 11,
    endHour: 13,
    timeSpan: '11:00 – 13:00',
    periodJp: '午の刻 (うまのこく)',
    periodTh: 'ยามมะเมีย (11:00 - 13:00)',
    periodPhase: 'day',
    bellCountJp: '九つ (真昼九つ)',
    bellCountTh: 'ระฆัง 9 ย่ำ (เที่ยงวัน)',
    directionJp: '南',
    directionTh: 'ทิศใต้ (180°)',
    degrees: 180,
    compassGate: '',
    lunarMonth: 5,
    element: '火',
    elementEn: 'fire',
    elementTh: 'ไฟ',
    yinYang: '陽',
    yinYangTh: 'หยาง (สว่าง/รุก)',
    etymologyTh: 'อักษร 午 มีรูปทรงคล้ายสากตำข้าวที่ตั้งตรง สื่อถึงดวงอาทิตย์ที่ขึ้นสู่จุดสูงสุดกลางท้องฟ้าพอดี เป็นทิศใต้และช่วงเวลาที่สว่างที่สุดของวัน',
    triviaTh: 'คำบอกเวลาในชีวิตประจำวันอย่าง "午前" (โกเซ็น = ก่อนเที่ยง/AM), "午後" (โกโงะ = หลังเที่ยง/PM), และ "正午" (โชโงะ = เที่ยงตรง) ล้วนมีที่มาจาก 午の刻 นี้เอง!'
  },
  {
    id: 'hitsuji',
    kanji: '未',
    animalKanji: '羊',
    animalTh: 'แพะ (แกะ)',
    animalEn: 'Goat/Sheep',
    emoji: '🐑',
    onyomi: ['ビ', 'ミ'],
    kunyomi: ['ひつじ'],
    thaiReading: 'ฮิตสึจิ (บิ/มิ)',
    startHour: 13,
    endHour: 15,
    timeSpan: '13:00 – 15:00',
    periodJp: '未の刻 (ひつじのこく)',
    periodTh: 'ยามมะแม (13:00 - 15:00)',
    periodPhase: 'day',
    bellCountJp: '八つ (昼八つ)',
    bellCountTh: 'ระฆัง 8 ย่ำ (บ่าย)',
    directionJp: '南西微南',
    directionTh: 'ตะวันตกเฉียงใต้ค่อนใต้ (210°)',
    degrees: 210,
    compassGate: '',
    lunarMonth: 6,
    element: '土',
    elementEn: 'earth',
    elementTh: 'ดิน',
    yinYang: '陰',
    yinYangTh: 'หยิน (มืด/รับ)',
    etymologyTh: 'อักษร 未 เป็นภาพกิ่งก้านต้นไม้ที่ยังแตกใบไม่เต็มที่ (ยังไม่ = 未だ) สื่อถึงผลไม้ที่ยังสุกไม่เต็มที่และยังมีรสหวานซ่อนอยู่ เป็นช่วงเวลาที่แสงแดดเริ่มคลายตัวลง',
    triviaTh: 'ของว่างยามบ่ายของคนญี่ปุ่นเรียกว่า "おやつ" (โอ่ยัตสึ) มาจาก "八つの刻" (ยัตสึโนะโคคุ) ซึ่งเป็นเวลาพักรับประทานอาหารว่างยามบ่ายในสมัยเอโดะนั่นเอง'
  },
  {
    id: 'saru',
    kanji: '申',
    animalKanji: '猿',
    animalTh: 'ลิง',
    animalEn: 'Monkey',
    emoji: '🐵',
    onyomi: ['シン'],
    kunyomi: ['さる'],
    thaiReading: 'ซารุ (ชิน)',
    startHour: 15,
    endHour: 17,
    timeSpan: '15:00 – 17:00',
    periodJp: '申の刻 (さるのこく)',
    periodTh: 'ยามวอก (15:00 - 17:00)',
    periodPhase: 'day',
    bellCountJp: '七つ (夕七つ)',
    bellCountTh: 'ระฆัง 7 ย่ำ (ยามเย็น)',
    directionJp: '南西微北',
    directionTh: 'ตะวันตกเฉียงใต้ค่อนเหนือ (240°)',
    degrees: 240,
    compassGate: '坤 (ひつじさる • 裏鬼門 Urakimon)',
    lunarMonth: 7,
    element: '金',
    elementEn: 'metal',
    elementTh: 'ทอง (โลหะ)',
    yinYang: '陽',
    yinYangTh: 'หยาง (สว่าง/รุก)',
    etymologyTh: 'อักษร 申 แต่เดิมเป็นภาพสายฟ้าฟาดที่เหยียดยาว (ที่มาของตัว 稲妻 และ 伸) สื่อถึงการยืดขยาย การนำเสนอ และการเก็บเกี่ยวผลผลิตที่งอกงาม',
    triviaTh: 'ทิศทางตรงข้ามกับ 鬼門 (ประตูผี 艮) คือ "裏鬼門" (อุระคิมง 坤) บริเวณ 申 (ลิง) จึงเป็นเหตุผลหนึ่งที่โมโมทาโร่นำลิง สุนัข และไก่ฟ้า ร่วมเดินทางไปปราบยักษ์'
  },
  {
    id: 'tori',
    kanji: '酉',
    animalKanji: '鳥 / 鶏',
    animalTh: 'ไก่',
    animalEn: 'Rooster',
    emoji: '🐔',
    onyomi: ['ユウ'],
    kunyomi: ['とり'],
    thaiReading: 'โทริ (ยู)',
    startHour: 17,
    endHour: 19,
    timeSpan: '17:00 – 19:00',
    periodJp: '酉の刻 (とりのこく)',
    periodTh: 'ยามระกา (17:00 - 19:00)',
    periodPhase: 'day',
    bellCountJp: '六つ (暮れ六つ)',
    bellCountTh: 'ระฆัง 6 ย่ำ (พลบค่ำ)',
    directionJp: '西',
    directionTh: 'ทิศตะวันตก (270°)',
    degrees: 270,
    compassGate: '',
    lunarMonth: 8,
    element: '金',
    elementEn: 'metal',
    elementTh: 'ทอง (โลหะ)',
    yinYang: '陰',
    yinYangTh: 'หยิน (มืด/รับ)',
    etymologyTh: 'อักษร 酉 เดิมเป็นภาพไหเหล้าที่มีน้ำหมักอยู่เต็ม (เป็นหมวดอักษรของ 酒 และ 酌) สื่อถึงผลผลิตทางการเกษตรที่หมักบ่มจนสมบูรณ์และเป็นเวลาเฉลิมฉลองยามค่ำ',
    triviaTh: 'เสียงระฆัง "暮れ六つ" (คุเระ มุตสึ) เป็นสัญญาณพระอาทิตย์ตกดินบอกให้ปิดประตูปราสาท และเทศกาล "酉の市" (โทริโนะอิจิ) ในเดือนพฤศจิกายนของญี่ปุ่นเป็นงานไหว้ขอพรความเจริญรุ่งเรืองทางการค้า'
  },
  {
    id: 'inu',
    kanji: '戌',
    animalKanji: '犬',
    animalTh: 'สุนัข',
    animalEn: 'Dog',
    emoji: '🐶',
    onyomi: ['ジュツ'],
    kunyomi: ['いぬ'],
    thaiReading: 'อินุ (จุตสึ)',
    startHour: 19,
    endHour: 21,
    timeSpan: '19:00 – 21:00',
    periodJp: '戌の刻 (いぬのこく)',
    periodTh: 'ยามจอ (19:00 - 21:00)',
    periodPhase: 'night',
    bellCountJp: '五つ (宵五つ)',
    bellCountTh: 'ระฆัง 5 ย่ำ (หัวค่ำ)',
    directionJp: '北西微南',
    directionTh: 'ตะวันตกเฉียงเหนือค่อนใต้ (300°)',
    degrees: 300,
    compassGate: '',
    lunarMonth: 9,
    element: '土',
    elementEn: 'earth',
    elementTh: 'ดิน',
    yinYang: '陽',
    yinYangTh: 'หยาง (สว่าง/รุก)',
    etymologyTh: 'อักษร 戌 เป็นภาพขวานด้ามยาว (Halberd) ที่ใช้เก็บเกี่ยวพืชผลหรือทำลายสิ่งเก่า สื่อถึงพืชพรรณที่เฉาลงในฤดูใบไม้ร่วงและเก็บเกี่ยวเข้าสู่ยุ้งฉาง',
    triviaTh: 'สุนัขในวัฒนธรรมญี่ปุ่นเป็นสัญลักษณ์ของการคลอดบุตรอย่างปลอดภัยและง่ายดาย (安産) จึงมีประเพณี "戌の日" (วันอินุ) ให้หญิงตั้งครรภ์ไปสักการะศาลเจ้าและคาดเข็มขัดพยุงครรภ์'
  },
  {
    id: 'i',
    kanji: '亥',
    animalKanji: '猪 / 豚',
    animalTh: 'หมูป่า',
    animalEn: 'Boar/Pig',
    emoji: '🐗',
    onyomi: ['ガイ'],
    kunyomi: ['い'],
    thaiReading: 'อิ (ไก)',
    startHour: 21,
    endHour: 23,
    timeSpan: '21:00 – 23:00',
    periodJp: '亥の刻 (いのこく)',
    periodTh: 'ยามกุน (21:00 - 23:00)',
    periodPhase: 'night',
    bellCountJp: '四つ (夜四つ)',
    bellCountTh: 'ระฆัง 4 ย่ำ (ดึก)',
    directionJp: '北西微北',
    directionTh: 'ตะวันตกเฉียงเหนือค่อนเหนือ (330°)',
    degrees: 330,
    compassGate: '乾 (いぬい)',
    lunarMonth: 10,
    element: '水',
    elementEn: 'water',
    elementTh: 'น้ำ',
    yinYang: '陰',
    yinYangTh: 'หยิน (มืด/รับ)',
    etymologyTh: 'อักษร 亥 เดิมเป็นภาพโครงกระดูกหมูที่ชำแหละแล้ว หรือเมล็ดพันธุ์พืชที่จำศีลอยู่ใต้ดินในฤดูหนาว สื่อถึงการปิดฉากหนึ่งวัฏจักรเพื่อเตรียมกำเนิดใหม่',
    triviaTh: 'ในภาษาจีน 亥 คือหมูบ้าน (豚) แต่เมื่อแพร่เข้าสู่ญี่ปุ่น หมูบ้านยังไม่แพร่หลาย จึงใช้หมูป่า (猪 - อิโนะชิชิ) แทน เป็นสัญลักษณ์แห่งความกล้าหาญ ปลอดภัยจากอัคคีภัย และสุขภาพแข็งแรงไร้โรคภัย'
  }
];

/**
 * Returns the active zodiac index (0-11) for a given date/time.
 * 23:00-00:59 -> 0 (子)
 * 01:00-02:59 -> 1 (丑)
 * ...
 * 21:00-22:59 -> 11 (亥)
 * @param {Date} date
 * @returns {number}
 */
export function getZodiacIndexForDate(date = new Date()) {
  const hours = date.getHours();
  if (hours >= 23 || hours < 1) return 0;
  return Math.floor((hours + 1) / 2);
}

/**
 * Helper to build an SVG slice path (pie / donut wedge).
 * Angles in degrees, 0 = 12 o'clock (North).
 */
function describeArc(cx, cy, innerR, outerR, startAngle, endAngle) {
  const toRad = (deg) => ((deg - 90) * Math.PI) / 180.0;
  const p1 = { x: cx + outerR * Math.cos(toRad(startAngle)), y: cy + outerR * Math.sin(toRad(startAngle)) };
  const p2 = { x: cx + outerR * Math.cos(toRad(endAngle)), y: cy + outerR * Math.sin(toRad(endAngle)) };
  const p3 = { x: cx + innerR * Math.cos(toRad(endAngle)), y: cy + innerR * Math.sin(toRad(endAngle)) };
  const p4 = { x: cx + innerR * Math.cos(toRad(startAngle)), y: cy + innerR * Math.sin(toRad(startAngle)) };

  const arcSweep = (endAngle - startAngle) <= 180 ? 0 : 1;

  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outerR} ${outerR} 0 ${arcSweep} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${innerR} ${innerR} 0 ${arcSweep} 0 ${p4.x} ${p4.y}`,
    'Z'
  ].join(' ');
}

/**
 * Generates the complete SVG wheel markup.
 * Includes outer direction ring, main branch ring, inner bell ring, center hub,
 * and decorative compass points.
 */
export function generateWheelSvg() {
  const cx = 350;
  const cy = 350;

  // Radii
  const rCompass = 344;
  const rOuter = 328;
  const rMidOuter = 265;
  const rMidInner = 185;
  const rBellInner = 120;
  const rCenter = 76;

  let slicesHtml = '';
  let directionHtml = '';
  let bellHtml = '';

  ZODIACS.forEach((item, index) => {
    // Each branch covers 30 degrees, centered at item.degrees.
    // e.g. 0° (North) spans from -15° to +15°.
    const startAngle = item.degrees - 15;
    const endAngle = item.degrees + 15;
    const midAngle = item.degrees;
    const rad = ((midAngle - 90) * Math.PI) / 180.0;

    // 1. Outer direction wedge
    const dirD = describeArc(cx, cy, rMidOuter, rOuter, startAngle, endAngle);
    const dirTextR = (rMidOuter + rOuter) / 2;
    const dirX = cx + dirTextR * Math.cos(rad);
    const dirY = cy + dirTextR * Math.sin(rad);

    directionHtml += `
      <g class="wheel-dir-sector" data-index="${index}">
        <path class="wheel-dir-path" d="${dirD}" />
        <text class="wheel-dir-text" x="${dirX}" y="${dirY}" text-anchor="middle" dominant-baseline="central">
          ${item.directionJp}
        </text>
      </g>
    `;

    // 2. Main Zodiac Slice
    const sliceD = describeArc(cx, cy, rMidInner, rMidOuter, startAngle, endAngle);
    // Position kanji and emoji inside the slice
    const kanjiR = rMidInner + (rMidOuter - rMidInner) * 0.65;
    const emojiR = rMidInner + (rMidOuter - rMidInner) * 0.28;
    const kanjiX = cx + kanjiR * Math.cos(rad);
    const kanjiY = cy + kanjiR * Math.sin(rad);
    const emojiX = cx + emojiR * Math.cos(rad);
    const emojiY = cy + emojiR * Math.sin(rad);

    slicesHtml += `
      <g class="wheel-slice elem-${item.elementEn}" data-index="${index}" style="--slice-index: ${index};" role="button" tabindex="0" aria-label="${item.kanji} - ${item.animalTh}">
        <path class="wheel-slice-path" d="${sliceD}" />
        <text class="wheel-kanji" x="${kanjiX}" y="${kanjiY}" text-anchor="middle" dominant-baseline="central">
          ${item.kanji}
        </text>
        <text class="wheel-emoji" x="${emojiX}" y="${emojiY}" text-anchor="middle" dominant-baseline="central">
          ${item.emoji}
        </text>
      </g>
    `;

    // 3. Inner Bell & 24h Ring
    const bellD = describeArc(cx, cy, rBellInner, rMidInner, startAngle, endAngle);
    const bellR = (rBellInner + rMidInner) / 2;
    const bellX = cx + bellR * Math.cos(rad);
    const bellY = cy + bellR * Math.sin(rad);

    // Short bell label (e.g. 九つ, 八つ)
    const bellLabel = item.bellCountJp.split(' ')[0];
    const hourLabel = item.startHour.toString();

    bellHtml += `
      <g class="wheel-bell-sector" data-index="${index}">
        <path class="wheel-bell-path phase-${item.periodPhase}" d="${bellD}" />
        <text class="wheel-bell-text" x="${bellX}" y="${bellY - 6}" text-anchor="middle" dominant-baseline="central">
          ${bellLabel}
        </text>
        <text class="wheel-hour-text" x="${bellX}" y="${bellY + 8}" text-anchor="middle" dominant-baseline="central">
          ${hourLabel}:00
        </text>
      </g>
    `;
  });

  // Four Cardinal points and Gates indicators
  const cardinalMarks = `
    <g class="wheel-cardinals">
      <!-- North -->
      <circle cx="${cx}" cy="${cy - rCompass + 6}" r="3" class="compass-pip" />
      <text x="${cx}" y="${cy - rCompass - 2}" text-anchor="middle" class="compass-label is-north">北 (N)</text>
      <!-- South -->
      <circle cx="${cx}" cy="${cy + rCompass - 6}" r="3" class="compass-pip" />
      <text x="${cx}" y="${cy + rCompass + 12}" text-anchor="middle" class="compass-label">南 (S)</text>
      <!-- East -->
      <circle cx="${cx + rCompass - 6}" cy="${cy}" r="3" class="compass-pip" />
      <text x="${cx + rCompass + 14}" y="${cy}" text-anchor="start" dominant-baseline="central" class="compass-label">東 (E)</text>
      <!-- West -->
      <circle cx="${cx - rCompass + 6}" cy="${cy}" r="3" class="compass-pip" />
      <text x="${cx - rCompass - 14}" y="${cy}" text-anchor="end" dominant-baseline="central" class="compass-label">西 (W)</text>
    </g>
  `;

  // Center Hub: Day & Night indicator with sun / moon
  const centerHub = `
    <g class="wheel-center-hub">
      <circle cx="${cx}" cy="${cy}" r="${rBellInner}" class="hub-base-circle" />
      
      <!-- Upper Half: Night (よる 🌙) -->
      <path d="M ${cx - rBellInner} ${cy} A ${rBellInner} ${rBellInner} 0 0 1 ${cx + rBellInner} ${cy} Z" class="hub-night-bg" />
      <!-- Lower Half: Day (ひる ☀️) -->
      <path d="M ${cx - rBellInner} ${cy} A ${rBellInner} ${rBellInner} 0 0 0 ${cx + rBellInner} ${cy} Z" class="hub-day-bg" />
      
      <!-- Divider Line -->
      <line x1="${cx - rBellInner}" y1="${cy}" x2="${cx + rBellInner}" y2="${cy}" class="hub-divider" />
      
      <!-- Center Circle Badge -->
      <circle cx="${cx}" cy="${cy}" r="${rCenter}" class="hub-core-circle" />
      <text x="${cx}" y="${cy - 28}" text-anchor="middle" class="hub-label hub-label-night">よる 🌙</text>
      <text x="${cx}" y="${cy + 34}" text-anchor="middle" class="hub-label hub-label-day">ひる ☀️</text>
      <text x="${cx}" y="${cy + 2}" text-anchor="middle" dominant-baseline="central" class="hub-title-jp">十二支</text>
    </g>
  `;

  return `
    <svg viewBox="0 0 700 700" class="zodiac-wheel-svg" id="zodiac-wheel-svg" role="region" aria-label="วงล้อ 12 นักษัตรและเวลาโบราณญี่ปุ่น">
      <defs>
        <filter id="wheel-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      <circle cx="${cx}" cy="${cy}" r="${rOuter + 8}" class="wheel-outer-ring" />
      
      <!-- Direction Sectors -->
      <g class="wheel-direction-ring">${directionHtml}</g>
      
      <!-- Main Zodiac Slices -->
      <g class="wheel-slices-ring" id="wheel-slices-ring">${slicesHtml}</g>
      
      <!-- Bell / 24h Ring -->
      <g class="wheel-bell-ring">${bellHtml}</g>
      
      <!-- Center Hub -->
      ${centerHub}
      
      <!-- Compass Overlay & Cardinal Labels -->
      ${cardinalMarks}
    </svg>
  `;
}

/**
 * Initializes the Chinese Zodiacs interactive page.
 */
export function initChineseZodiacs() {
  const wheelContainer = document.getElementById('zodiac-wheel-container');
  const inspectorCard = document.getElementById('zodiac-inspector');
  const liveSyncBtn = document.getElementById('zodiac-btn-now');
  const soundToggleBtn = document.getElementById('zodiac-btn-sound');
  const modeDirectionsBtn = document.getElementById('zodiac-btn-directions');
  const modeElementsBtn = document.getElementById('zodiac-btn-elements');

  if (!wheelContainer || !inspectorCard) return;

  // Render SVG wheel
  wheelContainer.innerHTML = generateWheelSvg();

  let activeIndex = getZodiacIndexForDate();
  let isDirectionMode = false;
  let isElementsMode = false;

  const svg = document.getElementById('zodiac-wheel-svg');
  const slices = svg.querySelectorAll('.wheel-slice');

  // Trigger clockwise entrance animation
  triggerClockwiseAnimation(slices);

  /**
   * Updates the Inspector Card with details of the chosen branch.
   */
  function updateInspector(index, playChime = false) {
    const item = ZODIACS[index];
    activeIndex = index;

    // Update active class on SVG slices
    slices.forEach((slice, i) => {
      const isActive = i === index;
      slice.classList.toggle('is-active', isActive);
      slice.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Update outer direction active class
    svg.querySelectorAll('.wheel-dir-sector').forEach((sec, i) => {
      sec.classList.toggle('is-active', i === index);
    });

    // Update inner bell active class
    svg.querySelectorAll('.wheel-bell-sector').forEach((sec, i) => {
      sec.classList.toggle('is-active', i === index);
    });

    // Update Inspector DOM
    const kanjiEl = document.getElementById('zi-kanji');
    const animalEl = document.getElementById('zi-animal');
    const readingEl = document.getElementById('zi-reading');
    const periodEl = document.getElementById('zi-period');
    const bellEl = document.getElementById('zi-bell');
    const dirEl = document.getElementById('zi-direction');
    const elemEl = document.getElementById('zi-element');
    const yinyangEl = document.getElementById('zi-yinyang');
    const monthEl = document.getElementById('zi-month');
    const etymologyEl = document.getElementById('zi-etymology');
    const triviaEl = document.getElementById('zi-trivia');
    const dictLink = document.getElementById('zi-dict-link');
    const gateBadge = document.getElementById('zi-gate-badge');

    if (kanjiEl) kanjiEl.textContent = item.kanji;
    if (animalEl) animalEl.textContent = `${item.emoji} ${item.animalTh} (${item.animalKanji} / ${item.animalEn})`;
    if (readingEl) {
      readingEl.innerHTML = `
        <span class="zi-pill"><strong>訓:</strong> ${item.kunyomi.join(', ')}</span>
        <span class="zi-pill"><strong>音:</strong> ${item.onyomi.join(', ')}</span>
        <span class="zi-pill"><strong>คำอ่าน:</strong> ${item.thaiReading}</span>
      `;
    }
    if (periodEl) periodEl.innerHTML = `<strong>${item.periodJp}</strong> (${item.periodTh})`;
    if (bellEl) bellEl.textContent = `${item.bellCountJp} · ${item.bellCountTh}`;
    if (dirEl) dirEl.textContent = `${item.directionJp} (${item.directionTh})`;
    if (elemEl) {
      elemEl.innerHTML = `<span class="badge-elem elem-${item.elementEn}">${item.element} (${item.elementTh})</span>`;
    }
    if (yinyangEl) yinyangEl.textContent = `${item.yinYang} (${item.yinYangTh})`;
    if (monthEl) monthEl.textContent = `เดือน ${item.lunarMonth} (ปฏิทินจันทรคติเดิม)`;
    if (etymologyEl) etymologyEl.textContent = item.etymologyTh;
    if (triviaEl) triviaEl.textContent = item.triviaTh;

    if (gateBadge) {
      if (item.compassGate) {
        gateBadge.textContent = item.compassGate;
        gateBadge.hidden = false;
      } else {
        gateBadge.hidden = true;
      }
    }

    if (dictLink) {
      dictLink.href = `../browse/kanji.html?k=${encodeURIComponent(item.kanji)}`;
      dictLink.setAttribute('aria-label', `ดูคันจิ ${item.kanji} ในพจนานุกรม`);
    }

    // Optional audio tone feedback
    if (playChime && isSoundEnabled()) {
      playCorrect();
    }
  }

  /**
   * Staggered clockwise entrance animation.
   */
  function triggerClockwiseAnimation(sliceEls) {
    sliceEls.forEach((slice) => {
      slice.classList.remove('is-animating');
      // Force reflow
      void slice.offsetWidth;
      slice.classList.add('is-animating');
    });
  }

  // Wire slice interactions
  slices.forEach((slice, idx) => {
    slice.addEventListener('click', () => {
      updateInspector(idx, true);
    });

    slice.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        updateInspector(idx, true);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (idx + 1) % ZODIACS.length;
        slices[next].focus();
        updateInspector(next, true);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = (idx - 1 + ZODIACS.length) % ZODIACS.length;
        slices[prev].focus();
        updateInspector(prev, true);
      }
    });
  });

  // Live Time Sync Button
  if (liveSyncBtn) {
    liveSyncBtn.addEventListener('click', () => {
      const nowIdx = getZodiacIndexForDate();
      updateInspector(nowIdx, true);
      slices[nowIdx].focus();
    });
  }

  // Direction Mode Toggle
  if (modeDirectionsBtn) {
    modeDirectionsBtn.addEventListener('click', () => {
      isDirectionMode = !isDirectionMode;
      modeDirectionsBtn.classList.toggle('is-active', isDirectionMode);
      svg.classList.toggle('mode-directions', isDirectionMode);
    });
  }

  // Five Elements Mode Toggle
  if (modeElementsBtn) {
    modeElementsBtn.addEventListener('click', () => {
      isElementsMode = !isElementsMode;
      modeElementsBtn.classList.toggle('is-active', isElementsMode);
      svg.classList.toggle('mode-elements', isElementsMode);
    });
  }

  // Sound Toggle Button
  if (soundToggleBtn) {
    const updateSoundBtn = () => {
      const enabled = isSoundEnabled();
      soundToggleBtn.textContent = enabled ? '🔊' : '🔇';
      soundToggleBtn.setAttribute('aria-pressed', String(enabled));
      soundToggleBtn.setAttribute('title', enabled ? 'ปิดเสียงเอฟเฟกต์ (Sound: ON)' : 'เปิดเสียงเอฟเฟกต์ (Sound: OFF)');
    };
    updateSoundBtn();

    soundToggleBtn.addEventListener('click', () => {
      const next = !isSoundEnabled();
      setSoundEnabled(next);
      updateSoundBtn();
      if (next) playCorrect();
    });
  }

  // Initial state display
  updateInspector(activeIndex, false);
}
