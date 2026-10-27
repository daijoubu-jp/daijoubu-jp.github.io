//! Strongly-typed models and JSON conversion for all 6 Daijoubu JP content categories:
//! Kanji, Compounds, Vocabulary, Special Readings (Ateji/Fuhyō), Prefectures, and Eras.

use crate::json::JsonValue;

#[derive(Debug, Clone, PartialEq)]
pub struct OriginComponent {
    pub part: String,
    pub role: String,
    pub desc: String,
}

impl OriginComponent {
    pub fn to_json(&self) -> JsonValue {
        JsonValue::obj(vec![
            ("part", JsonValue::str_val(&self.part)),
            ("role", JsonValue::str_val(&self.role)),
            ("desc", JsonValue::str_val(&self.desc)),
        ])
    }

    pub fn from_json(val: &JsonValue) -> Option<Self> {
        let part = val.get_str_or("part", "").trim().to_string();
        let role = val.get_str_or("role", "").trim().to_string();
        let desc = val.get_str_or("desc", "").trim().to_string();
        if part.is_empty() {
            return None;
        }
        Some(Self { part, role, desc })
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct KanjiExample {
    pub word: String,
    pub reading: String,
    pub meaning_th: String,
    pub sentence_ja: String,
    pub sentence_th: String,
    pub sentence_ruby: String,
}

impl KanjiExample {
    pub fn to_json(&self) -> JsonValue {
        JsonValue::obj(vec![
            ("word", JsonValue::str_val(&self.word)),
            ("reading", JsonValue::str_val(&self.reading)),
            ("meaning_th", JsonValue::str_val(&self.meaning_th)),
            ("sentence_ja", JsonValue::str_val(&self.sentence_ja)),
            ("sentence_th", JsonValue::str_val(&self.sentence_th)),
            ("sentence_ruby", JsonValue::str_val(&self.sentence_ruby)),
        ])
    }

    pub fn from_json(val: &JsonValue) -> Option<Self> {
        let word = val.get_str_or("word", "").trim().to_string();
        let reading = val.get_str_or("reading", "").trim().to_string();
        let meaning_th = val.get_str_or("meaning_th", "").trim().to_string();
        if word.is_empty() || reading.is_empty() {
            return None;
        }
        Some(Self {
            word,
            reading,
            meaning_th,
            sentence_ja: val.get_str_or("sentence_ja", "").trim().to_string(),
            sentence_th: val.get_str_or("sentence_th", "").trim().to_string(),
            sentence_ruby: val.get_str_or("sentence_ruby", "").trim().to_string(),
        })
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct KanjiEntry {
    pub kanji: String,
    pub file_path: String,
    pub onyomi: Vec<String>,
    pub kunyomi: Vec<String>,
    pub jinmei: Vec<String>,
    pub meanings_ja: Vec<String>,
    pub meanings_th: Vec<String>,
    pub meanings_en: Vec<String>,
    pub strokes: i64,
    pub jlpt: Option<i64>,
    pub kanken: String,
    pub radical: String,
    pub notes: Option<String>,
    pub origin_type: Option<String>,
    pub origin_type_th: Option<String>,
    pub origin_description: Option<String>,
    pub name_use: bool,
    pub origin_components: Vec<OriginComponent>,
    pub examples: Vec<KanjiExample>,
}

impl KanjiEntry {
    pub fn to_json(&self) -> JsonValue {
        let codepoint = self
            .kanji
            .chars()
            .next()
            .map(|c| format!("{:05x}", c as u32))
            .unwrap_or_default();
        JsonValue::obj(vec![
            ("kanji", JsonValue::str_val(&self.kanji)),
            ("codepoint", JsonValue::str_val(codepoint)),
            ("file_path", JsonValue::str_val(&self.file_path)),
            ("onyomi", JsonValue::str_array(&self.onyomi)),
            ("kunyomi", JsonValue::str_array(&self.kunyomi)),
            ("jinmei", JsonValue::str_array(&self.jinmei)),
            ("meanings_ja", JsonValue::str_array(&self.meanings_ja)),
            ("meanings_th", JsonValue::str_array(&self.meanings_th)),
            ("meanings_en", JsonValue::str_array(&self.meanings_en)),
            ("strokes", JsonValue::Number(self.strokes as f64)),
            (
                "jlpt",
                match self.jlpt {
                    Some(n) => JsonValue::Number(n as f64),
                    None => JsonValue::Null,
                },
            ),
            ("kanken", JsonValue::str_val(&self.kanken)),
            ("radical", JsonValue::str_val(&self.radical)),
            ("notes", JsonValue::opt_str(&self.notes)),
            ("origin_type", JsonValue::opt_str(&self.origin_type)),
            ("origin_type_th", JsonValue::opt_str(&self.origin_type_th)),
            ("origin_description", JsonValue::opt_str(&self.origin_description)),
            ("name_use", JsonValue::Bool(self.name_use)),
            (
                "origin_components",
                JsonValue::Array(self.origin_components.iter().map(|c| c.to_json()).collect()),
            ),
            (
                "examples",
                JsonValue::Array(self.examples.iter().map(|e| e.to_json()).collect()),
            ),
        ])
    }

    pub fn to_summary_json(&self) -> JsonValue {
        JsonValue::obj(vec![
            ("kanji", JsonValue::str_val(&self.kanji)),
            ("file_path", JsonValue::str_val(&self.file_path)),
            ("kanken", JsonValue::str_val(&self.kanken)),
            (
                "jlpt",
                match self.jlpt {
                    Some(n) => JsonValue::Number(n as f64),
                    None => JsonValue::Null,
                },
            ),
            ("strokes", JsonValue::Number(self.strokes as f64)),
            (
                "primary_reading",
                JsonValue::str_val(
                    self.onyomi
                        .first()
                        .or_else(|| self.kunyomi.first())
                        .cloned()
                        .unwrap_or_default(),
                ),
            ),
            (
                "primary_meaning_th",
                JsonValue::str_val(self.meanings_th.first().cloned().unwrap_or_default()),
            ),
            ("examples_count", JsonValue::Number(self.examples.len() as f64)),
            ("has_origin", JsonValue::Bool(self.origin_description.is_some())),
            ("has_notes", JsonValue::Bool(self.notes.is_some())),
        ])
    }

    pub fn from_json(val: &JsonValue) -> Result<Self, String> {
        let kanji = val.get_str_or("kanji", "").trim().to_string();
        if kanji.is_empty() {
            return Err("kanji character is required".to_string());
        }
        let file_path = val.get_str_or("file_path", "content/kanji/kanken-10.md");
        let onyomi = val.get_str_vec("onyomi");
        let kunyomi = val.get_str_vec("kunyomi");
        if onyomi.is_empty() && kunyomi.is_empty() {
            return Err(format!("{}: at least one onyomi or kunyomi reading is required", kanji));
        }
        let meanings_ja = val.get_str_vec("meanings_ja");
        let meanings_th = val.get_str_vec("meanings_th");
        let meanings_en = val.get_str_vec("meanings_en");
        if meanings_ja.is_empty() || meanings_th.is_empty() || meanings_en.is_empty() {
            return Err(format!(
                "{}: meanings_ja, meanings_th, and meanings_en are all required",
                kanji
            ));
        }
        let strokes = val.get_i64("strokes").unwrap_or(1).max(1);
        let jlpt = val.get_i64("jlpt").filter(|&n| (1..=5).contains(&n));
        let kanken = val.get_str_or("kanken", "10").trim().to_string();
        let radical = val.get_str_or("radical", "1 (一)").trim().to_string();

        let origin_components = match val.get("origin_components") {
            Some(JsonValue::Array(arr)) => arr.iter().filter_map(OriginComponent::from_json).collect(),
            _ => Vec::new(),
        };
        let examples = match val.get("examples") {
            Some(JsonValue::Array(arr)) => arr.iter().filter_map(KanjiExample::from_json).collect(),
            _ => Vec::new(),
        };

        Ok(Self {
            kanji,
            file_path,
            onyomi,
            kunyomi,
            jinmei: val.get_str_vec("jinmei"),
            meanings_ja,
            meanings_th,
            meanings_en,
            strokes,
            jlpt,
            kanken,
            radical,
            notes: val.get_opt_str("notes"),
            origin_type: val.get_opt_str("origin_type"),
            origin_type_th: val.get_opt_str("origin_type_th"),
            origin_description: val.get_opt_str("origin_description"),
            name_use: val.get_bool("name_use", false),
            origin_components,
            examples,
        })
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct CompoundEntry {
    pub surface: String,
    pub reading: String,
    pub file_path: String,
    pub meaning_en: String,
    pub meaning_th: Option<String>,
}

impl CompoundEntry {
    pub fn key(&self) -> String {
        format!("{} ({})", self.surface, self.reading)
    }

    pub fn to_json(&self) -> JsonValue {
        JsonValue::obj(vec![
            ("key", JsonValue::str_val(self.key())),
            ("surface", JsonValue::str_val(&self.surface)),
            ("reading", JsonValue::str_val(&self.reading)),
            ("file_path", JsonValue::str_val(&self.file_path)),
            ("meaning_en", JsonValue::str_val(&self.meaning_en)),
            ("meaning_th", JsonValue::opt_str(&self.meaning_th)),
        ])
    }

    pub fn from_json(val: &JsonValue) -> Result<Self, String> {
        let surface = val.get_str_or("surface", "").trim().to_string();
        let reading = val.get_str_or("reading", "").trim().to_string();
        let meaning_en = val.get_str_or("meaning_en", "").trim().to_string();
        let char_count = surface.chars().count();
        if !(2..=4).contains(&char_count) {
            return Err("Compound surface must be 2 to 4 kanji characters".to_string());
        }
        if reading.is_empty() {
            return Err("Compound reading is required".to_string());
        }
        if meaning_en.is_empty() {
            return Err("Compound meaning_en is required".to_string());
        }
        let file_path = val.get_str_or("file_path", "");
        Ok(Self {
            surface,
            reading,
            file_path,
            meaning_en,
            meaning_th: val.get_opt_str("meaning_th"),
        })
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct BreakdownItem {
    pub ch: String,
    pub meaning: String,
}

impl BreakdownItem {
    pub fn to_json(&self) -> JsonValue {
        JsonValue::obj(vec![
            ("char", JsonValue::str_val(&self.ch)),
            ("meaning", JsonValue::str_val(&self.meaning)),
        ])
    }

    pub fn from_json(val: &JsonValue) -> Option<Self> {
        let ch = val.get_str_or("char", "").trim().to_string();
        let meaning = val.get_str_or("meaning", "").trim().to_string();
        if ch.is_empty() {
            return None;
        }
        Some(Self { ch, meaning })
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct VocabularyEntry {
    pub word: String,
    pub id: String,
    pub file_path: String,
    pub reading: String,
    pub furigana: Option<String>,
    pub romaji: String,
    pub category: String,
    pub category_th: String,
    pub series: Option<String>,
    pub meaning_th: String,
    pub meaning_en: String,
    pub jlpt: Option<i64>,
    pub kanken: Option<String>,
    pub tags: Vec<String>,
    pub breakdown: Vec<BreakdownItem>,
    pub lore: Option<String>,
}

impl VocabularyEntry {
    pub fn to_json(&self) -> JsonValue {
        JsonValue::obj(vec![
            ("word", JsonValue::str_val(&self.word)),
            ("id", JsonValue::str_val(&self.id)),
            ("file_path", JsonValue::str_val(&self.file_path)),
            ("reading", JsonValue::str_val(&self.reading)),
            ("furigana", JsonValue::opt_str(&self.furigana)),
            ("romaji", JsonValue::str_val(&self.romaji)),
            ("category", JsonValue::str_val(&self.category)),
            ("category_th", JsonValue::str_val(&self.category_th)),
            ("series", JsonValue::opt_str(&self.series)),
            ("meaning_th", JsonValue::str_val(&self.meaning_th)),
            ("meaning_en", JsonValue::str_val(&self.meaning_en)),
            (
                "jlpt",
                match self.jlpt {
                    Some(n) => JsonValue::Number(n as f64),
                    None => JsonValue::Null,
                },
            ),
            ("kanken", JsonValue::opt_str(&self.kanken)),
            ("tags", JsonValue::str_array(&self.tags)),
            (
                "breakdown",
                JsonValue::Array(self.breakdown.iter().map(|b| b.to_json()).collect()),
            ),
            ("lore", JsonValue::opt_str(&self.lore)),
        ])
    }

    pub fn from_json(val: &JsonValue) -> Result<Self, String> {
        let word = val.get_str_or("word", "").trim().to_string();
        if word.is_empty() {
            return Err("Vocabulary word is required".to_string());
        }
        let id = {
            let raw = val.get_str_or("id", "").trim().to_string();
            if raw.is_empty() { word.clone() } else { raw }
        };
        let breakdown = match val.get("breakdown") {
            Some(JsonValue::Array(arr)) => arr.iter().filter_map(BreakdownItem::from_json).collect(),
            _ => Vec::new(),
        };
        Ok(Self {
            word,
            id,
            file_path: val.get_str_or("file_path", "content/vocabulary/yojijukugo.md"),
            reading: val.get_str_or("reading", "").trim().to_string(),
            furigana: val.get_opt_str("furigana"),
            romaji: val.get_str_or("romaji", "").trim().to_string(),
            category: val.get_str_or("category", "").trim().to_string(),
            category_th: val.get_str_or("category_th", "").trim().to_string(),
            series: val.get_opt_str("series"),
            meaning_th: val.get_str_or("meaning_th", "").trim().to_string(),
            meaning_en: val.get_str_or("meaning_en", "").trim().to_string(),
            jlpt: val.get_i64("jlpt").filter(|&n| (1..=5).contains(&n)),
            kanken: val.get_opt_str("kanken"),
            tags: val.get_str_vec("tags"),
            breakdown,
            lore: val.get_opt_str("lore"),
        })
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct SpecialReadingEntry {
    pub word: String,
    pub file_path: String,
    pub reading: String,
    pub kanji: Vec<String>,
    pub meaning_th: String,
    pub meaning_en: String,
}

impl SpecialReadingEntry {
    pub fn to_json(&self) -> JsonValue {
        JsonValue::obj(vec![
            ("word", JsonValue::str_val(&self.word)),
            ("file_path", JsonValue::str_val(&self.file_path)),
            ("reading", JsonValue::str_val(&self.reading)),
            ("kanji", JsonValue::str_array(&self.kanji)),
            ("meaning_th", JsonValue::str_val(&self.meaning_th)),
            ("meaning_en", JsonValue::str_val(&self.meaning_en)),
        ])
    }

    pub fn from_json(val: &JsonValue) -> Result<Self, String> {
        let word = val.get_str_or("word", "").trim().to_string();
        let reading = val.get_str_or("reading", "").trim().to_string();
        if word.is_empty() || reading.is_empty() {
            return Err("Special reading word and reading are required".to_string());
        }
        let mut kanji = val.get_str_vec("kanji");
        if kanji.is_empty() {
            kanji = word
                .chars()
                .filter(|&c| ('\u{4E00}'..='\u{9FFF}').contains(&c))
                .map(|c| c.to_string())
                .collect();
        }
        Ok(Self {
            word,
            file_path: val.get_str_or("file_path", "content/special-readings/ateji.md"),
            reading,
            kanji,
            meaning_th: val.get_str_or("meaning_th", "").trim().to_string(),
            meaning_en: val.get_str_or("meaning_en", "").trim().to_string(),
        })
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct PrefListItem {
    pub name: String,
    pub th: Option<String>,
}

impl PrefListItem {
    pub fn to_json(&self) -> JsonValue {
        JsonValue::obj(vec![
            ("name", JsonValue::str_val(&self.name)),
            ("th", JsonValue::opt_str(&self.th)),
        ])
    }

    pub fn from_json(val: &JsonValue) -> Option<Self> {
        let name = val.get_str_or("name", "").trim().to_string();
        if name.is_empty() {
            return None;
        }
        Some(Self {
            name,
            th: val.get_opt_str("th"),
        })
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct PrefectureEntry {
    pub code: String,
    pub slug: String,
    pub file_path: String,
    pub name_ja: String,
    pub name_hira: String,
    pub name_romaji: String,
    pub name_th: String,
    pub region: String,
    pub capital: String,
    pub capital_reading: String,
    pub population: String,
    pub population_year: String,
    pub area_km2: String,
    pub flower: String,
    pub tree: String,
    pub bird: String,
    pub etymology: String,
    pub places: Vec<PrefListItem>,
    pub products: Vec<PrefListItem>,
}

impl PrefectureEntry {
    pub fn to_json(&self) -> JsonValue {
        JsonValue::obj(vec![
            ("code", JsonValue::str_val(&self.code)),
            ("slug", JsonValue::str_val(&self.slug)),
            ("file_path", JsonValue::str_val(&self.file_path)),
            ("name_ja", JsonValue::str_val(&self.name_ja)),
            ("name_hira", JsonValue::str_val(&self.name_hira)),
            ("name_romaji", JsonValue::str_val(&self.name_romaji)),
            ("name_th", JsonValue::str_val(&self.name_th)),
            ("region", JsonValue::str_val(&self.region)),
            ("capital", JsonValue::str_val(&self.capital)),
            ("capital_reading", JsonValue::str_val(&self.capital_reading)),
            ("population", JsonValue::str_val(&self.population)),
            ("population_year", JsonValue::str_val(&self.population_year)),
            ("area_km2", JsonValue::str_val(&self.area_km2)),
            ("flower", JsonValue::str_val(&self.flower)),
            ("tree", JsonValue::str_val(&self.tree)),
            ("bird", JsonValue::str_val(&self.bird)),
            ("etymology", JsonValue::str_val(&self.etymology)),
            (
                "places",
                JsonValue::Array(self.places.iter().map(|p| p.to_json()).collect()),
            ),
            (
                "products",
                JsonValue::Array(self.products.iter().map(|p| p.to_json()).collect()),
            ),
        ])
    }

    pub fn from_json(val: &JsonValue) -> Result<Self, String> {
        let slug = val.get_str_or("slug", "").trim().to_string();
        let name_ja = val.get_str_or("name_ja", "").trim().to_string();
        if slug.is_empty() || name_ja.is_empty() {
            return Err("Prefecture slug and name_ja are required".to_string());
        }
        let places = match val.get("places") {
            Some(JsonValue::Array(arr)) => arr.iter().filter_map(PrefListItem::from_json).collect(),
            _ => Vec::new(),
        };
        let products = match val.get("products") {
            Some(JsonValue::Array(arr)) => arr.iter().filter_map(PrefListItem::from_json).collect(),
            _ => Vec::new(),
        };
        if places.len() < 3 || products.len() < 3 {
            return Err(format!("{}: requires at least 3 places and 3 products", name_ja));
        }
        Ok(Self {
            code: val.get_str_or("code", "").trim().to_string(),
            slug,
            file_path: val.get_str_or("file_path", ""),
            name_ja,
            name_hira: val.get_str_or("name_hira", "").trim().to_string(),
            name_romaji: val.get_str_or("name_romaji", "").trim().to_string(),
            name_th: val.get_str_or("name_th", "").trim().to_string(),
            region: val.get_str_or("region", "").trim().to_string(),
            capital: val.get_str_or("capital", "").trim().to_string(),
            capital_reading: val.get_str_or("capital_reading", "").trim().to_string(),
            population: val.get_str_or("population", "").trim().to_string(),
            population_year: val.get_str_or("population_year", "").trim().to_string(),
            area_km2: val.get_str_or("area_km2", "").trim().to_string(),
            flower: val.get_str_or("flower", "").trim().to_string(),
            tree: val.get_str_or("tree", "").trim().to_string(),
            bird: val.get_str_or("bird", "").trim().to_string(),
            etymology: val.get_str_or("etymology", "").trim().to_string(),
            places,
            products,
        })
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct EraPeriodEntry {
    pub order: String,
    pub slug: String,
    pub file_path: String,
    pub name_ja: String,
    pub name_hira: String,
    pub name_romaji: String,
    pub name_th: String,
    pub macro_era: String,
    pub macro_era_ja: String,
    pub macro_era_th: String,
    pub start_year: String,
    pub end_year: String,
    pub year_label: String,
    pub capital: String,
    pub etymology_th: String,
    pub summary_th: String,
    pub kanji_milestone_th: String,
    pub highlights: Vec<String>,
}

impl EraPeriodEntry {
    pub fn to_json(&self) -> JsonValue {
        JsonValue::obj(vec![
            ("order", JsonValue::str_val(&self.order)),
            ("slug", JsonValue::str_val(&self.slug)),
            ("file_path", JsonValue::str_val(&self.file_path)),
            ("name_ja", JsonValue::str_val(&self.name_ja)),
            ("name_hira", JsonValue::str_val(&self.name_hira)),
            ("name_romaji", JsonValue::str_val(&self.name_romaji)),
            ("name_th", JsonValue::str_val(&self.name_th)),
            ("macro_era", JsonValue::str_val(&self.macro_era)),
            ("macro_era_ja", JsonValue::str_val(&self.macro_era_ja)),
            ("macro_era_th", JsonValue::str_val(&self.macro_era_th)),
            ("start_year", JsonValue::str_val(&self.start_year)),
            ("end_year", JsonValue::str_val(&self.end_year)),
            ("year_label", JsonValue::str_val(&self.year_label)),
            ("capital", JsonValue::str_val(&self.capital)),
            ("etymology_th", JsonValue::str_val(&self.etymology_th)),
            ("summary_th", JsonValue::str_val(&self.summary_th)),
            ("kanji_milestone_th", JsonValue::str_val(&self.kanji_milestone_th)),
            ("highlights", JsonValue::str_array(&self.highlights)),
        ])
    }

    pub fn from_json(val: &JsonValue) -> Result<Self, String> {
        let slug = val.get_str_or("slug", "").trim().to_string();
        let name_ja = val.get_str_or("name_ja", "").trim().to_string();
        let highlights = val.get_str_vec("highlights");
        if slug.is_empty() || name_ja.is_empty() {
            return Err("Period slug and name_ja are required".to_string());
        }
        if highlights.len() < 2 {
            return Err(format!("{}: requires at least 2 highlights", name_ja));
        }
        Ok(Self {
            order: val.get_str_or("order", "1").trim().to_string(),
            slug,
            file_path: val.get_str_or("file_path", "content/eras/periods.md"),
            name_ja,
            name_hira: val.get_str_or("name_hira", "").trim().to_string(),
            name_romaji: val.get_str_or("name_romaji", "").trim().to_string(),
            name_th: val.get_str_or("name_th", "").trim().to_string(),
            macro_era: val.get_str_or("macro_era", "ancient").trim().to_string(),
            macro_era_ja: val.get_str_or("macro_era_ja", "").trim().to_string(),
            macro_era_th: val.get_str_or("macro_era_th", "").trim().to_string(),
            start_year: val.get_str_or("start_year", "").trim().to_string(),
            end_year: val.get_str_or("end_year", "").trim().to_string(),
            year_label: val.get_str_or("year_label", "").trim().to_string(),
            capital: val.get_str_or("capital", "").trim().to_string(),
            etymology_th: val.get_str_or("etymology_th", "").trim().to_string(),
            summary_th: val.get_str_or("summary_th", "").trim().to_string(),
            kanji_milestone_th: val.get_str_or("kanji_milestone_th", "").trim().to_string(),
            highlights,
        })
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct EraGengoEntry {
    pub order: String,
    pub id: String,
    pub file_path: String,
    pub name_ja: String,
    pub name_hira: String,
    pub name_romaji: String,
    pub name_th: String,
    pub start_year: String,
    pub end_year: String,
    pub period_slug: String,
    pub is_modern: String,
    pub source_classic: String,
    pub meaning_th: String,
}

impl EraGengoEntry {
    pub fn to_json(&self) -> JsonValue {
        JsonValue::obj(vec![
            ("order", JsonValue::str_val(&self.order)),
            ("id", JsonValue::str_val(&self.id)),
            ("file_path", JsonValue::str_val(&self.file_path)),
            ("name_ja", JsonValue::str_val(&self.name_ja)),
            ("name_hira", JsonValue::str_val(&self.name_hira)),
            ("name_romaji", JsonValue::str_val(&self.name_romaji)),
            ("name_th", JsonValue::str_val(&self.name_th)),
            ("start_year", JsonValue::str_val(&self.start_year)),
            ("end_year", JsonValue::str_val(&self.end_year)),
            ("period_slug", JsonValue::str_val(&self.period_slug)),
            ("is_modern", JsonValue::str_val(&self.is_modern)),
            ("source_classic", JsonValue::str_val(&self.source_classic)),
            ("meaning_th", JsonValue::str_val(&self.meaning_th)),
        ])
    }

    pub fn from_json(val: &JsonValue) -> Result<Self, String> {
        let id = val.get_str_or("id", "").trim().to_string();
        let name_ja = val.get_str_or("name_ja", "").trim().to_string();
        if id.is_empty() || name_ja.is_empty() {
            return Err("Gengo id and name_ja are required".to_string());
        }
        Ok(Self {
            order: val.get_str_or("order", "1").trim().to_string(),
            id,
            file_path: val.get_str_or("file_path", "content/eras/gengo.md"),
            name_ja,
            name_hira: val.get_str_or("name_hira", "").trim().to_string(),
            name_romaji: val.get_str_or("name_romaji", "").trim().to_string(),
            name_th: val.get_str_or("name_th", "").trim().to_string(),
            start_year: val.get_str_or("start_year", "").trim().to_string(),
            end_year: val.get_str_or("end_year", "").trim().to_string(),
            period_slug: val.get_str_or("period_slug", "").trim().to_string(),
            is_modern: val.get_str_or("is_modern", "no").trim().to_string(),
            source_classic: val.get_str_or("source_classic", "").trim().to_string(),
            meaning_th: val.get_str_or("meaning_th", "").trim().to_string(),
        })
    }
}
