//! Fast, lossless Markdown parsers for all 6 Daijoubu JP content categories.

use std::fs;
use std::path::Path;

use crate::models::{
    BreakdownItem, CompoundEntry, EraGengoEntry, EraPeriodEntry, KanjiEntry, KanjiExample,
    OriginComponent, PrefListItem, PrefectureEntry, SpecialReadingEntry, VocabularyEntry,
};

pub fn parse_kv_line(line: &str) -> Option<(String, String)> {
    let trimmed = line.trim();
    if let Some(rest) = trimmed.strip_prefix("- ") {
        if let Some((k, v)) = rest.split_once(':') {
            let key = k.trim().to_lowercase().replace(' ', "_");
            let val = v.trim().to_string();
            return Some((key, val));
        }
    }
    None
}

fn split_csv(val: &str) -> Vec<String> {
    val.split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

pub fn split_markdown_sections(content: &str) -> (String, Vec<(String, String)>) {
    let normalized = content.replace("\r\n", "\n");
    let mut preamble = String::new();
    let mut sections: Vec<(String, String)> = Vec::new();
    let mut current_heading: Option<String> = None;
    let mut current_body = String::new();

    for line in normalized.lines() {
        if let Some(h) = line.strip_prefix("## ") {
            if let Some(prev_h) = current_heading.take() {
                sections.push((prev_h, current_body.trim_end().to_string()));
            }
            current_heading = Some(h.trim().to_string());
            current_body.clear();
        } else if current_heading.is_some() {
            current_body.push_str(line);
            current_body.push('\n');
        } else {
            preamble.push_str(line);
            preamble.push('\n');
        }
    }
    if let Some(prev_h) = current_heading.take() {
        sections.push((prev_h, current_body.trim_end().to_string()));
    }
    (preamble.trim_end().to_string(), sections)
}

fn collect_md_files(dir: &Path, base: &Path, out: &mut Vec<String>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    let mut paths: Vec<_> = entries.filter_map(|e| e.ok().map(|e| e.path())).collect();
    paths.sort();
    for p in paths {
        if p.is_dir() {
            collect_md_files(&p, base, out);
        } else if let Some(fname) = p.file_name().and_then(|n| n.to_str()) {
            if fname.ends_with(".md") && !fname.starts_with('_') && fname != "README.md" {
                if let Ok(rel) = p.strip_prefix(base) {
                    out.push(rel.to_string_lossy().replace('\\', "/"));
                }
            }
        }
    }
}

pub fn parse_kanji_section(heading: &str, body: &str, rel_path: &str) -> Option<KanjiEntry> {
    let kanji = heading.split_whitespace().next()?.trim().to_string();
    if kanji.is_empty() {
        return None;
    }

    let mut onyomi = Vec::new();
    let mut kunyomi = Vec::new();
    let mut jinmei = Vec::new();
    let mut meanings_ja = Vec::new();
    let mut meanings_th = Vec::new();
    let mut meanings_en = Vec::new();
    let mut strokes: i64 = 1;
    let mut jlpt: Option<i64> = None;
    let mut kanken = String::from("10");
    let mut radical = String::from("1 (一)");
    let mut notes: Option<String> = None;
    let mut origin_type: Option<String> = None;
    let mut origin_type_th: Option<String> = None;
    let mut origin_description: Option<String> = None;
    let mut name_use = false;
    let mut origin_components = Vec::new();
    let mut examples = Vec::new();

    #[derive(PartialEq)]
    enum Mode {
        Kv,
        OriginComps,
        Examples,
    }
    let mut mode = Mode::Kv;
    let mut current_ex: Option<KanjiExample> = None;

    for raw_line in body.lines() {
        let trimmed = raw_line.trim();
        if trimmed.is_empty() || trimmed == "---" {
            continue;
        }
        if trimmed.starts_with("### Origin Components") {
            if let Some(ex) = current_ex.take() {
                examples.push(ex);
            }
            mode = Mode::OriginComps;
            continue;
        }
        if trimmed.starts_with("### Examples") {
            mode = Mode::Examples;
            continue;
        }

        match mode {
            Mode::Kv => {
                if let Some((k, v)) = parse_kv_line(raw_line) {
                    match k.as_str() {
                        "onyomi" => onyomi = split_csv(&v),
                        "kunyomi" => kunyomi = split_csv(&v),
                        "jinmei" | "nanori" => jinmei = split_csv(&v),
                        "meanings_ja" => meanings_ja = split_csv(&v),
                        "meanings_th" => meanings_th = split_csv(&v),
                        "meanings_en" => meanings_en = split_csv(&v),
                        "strokes" => strokes = v.parse::<i64>().unwrap_or(1),
                        "jlpt" => jlpt = v.parse::<i64>().ok(),
                        "kanken" => kanken = v,
                        "radical" => radical = v,
                        "notes" => {
                            if !v.is_empty() {
                                notes = Some(v);
                            }
                        }
                        "origin_type" => {
                            if !v.is_empty() {
                                origin_type = Some(v);
                            }
                        }
                        "origin_type_th" => {
                            if !v.is_empty() {
                                origin_type_th = Some(v);
                            }
                        }
                        "origin_description" => {
                            if !v.is_empty() {
                                origin_description = Some(v);
                            }
                        }
                        "name_use" => {
                            name_use = matches!(v.to_lowercase().as_str(), "yes" | "true" | "1");
                        }
                        _ => {}
                    }
                }
            }
            Mode::OriginComps => {
                // Format: - **子** (音符・意符): ทารก
                if let Some(rest) = trimmed.strip_prefix("- **") {
                    if let Some((part, after_part)) = rest.split_once("**") {
                        let after_part = after_part.trim();
                        if let Some(after_open) = after_part.strip_prefix('(') {
                            if let Some((role, after_close)) = after_open.split_once("):") {
                                origin_components.push(OriginComponent {
                                    part: part.trim().to_string(),
                                    role: role.trim().to_string(),
                                    desc: after_close.trim().to_string(),
                                });
                            }
                        }
                    }
                }
            }
            Mode::Examples => {
                // Header format: - **一日** (ついたち / いちにち) : วันที่ 1 / หนึ่งวัน
                if let Some(rest) = trimmed.strip_prefix("- **") {
                    if let Some(prev) = current_ex.take() {
                        examples.push(prev);
                    }
                    if let Some((word, after_word)) = rest.split_once("**") {
                        let after_word = after_word.trim();
                        if let Some(after_open) = after_word.strip_prefix('(') {
                            if let Some((reading, after_close)) = after_open.split_once(')') {
                                let meaning_th = after_close
                                    .trim()
                                    .strip_prefix(':')
                                    .unwrap_or(after_close.trim())
                                    .trim()
                                    .to_string();
                                current_ex = Some(KanjiExample {
                                    word: word.trim().to_string(),
                                    reading: reading.trim().to_string(),
                                    meaning_th,
                                    sentence_ja: String::new(),
                                    sentence_th: String::new(),
                                    sentence_ruby: String::new(),
                                });
                            }
                        }
                    }
                } else if let Some(ref mut ex) = current_ex {
                    if let Some((k, v)) = parse_kv_line(raw_line) {
                        match k.as_str() {
                            "ja" => ex.sentence_ja = v,
                            "th" => ex.sentence_th = v,
                            "ruby" => ex.sentence_ruby = v,
                            _ => {}
                        }
                    }
                }
            }
        }
    }

    if let Some(prev) = current_ex.take() {
        examples.push(prev);
    }

    Some(KanjiEntry {
        kanji,
        file_path: rel_path.to_string(),
        onyomi,
        kunyomi,
        jinmei,
        meanings_ja,
        meanings_th,
        meanings_en,
        strokes,
        jlpt,
        kanken,
        radical,
        notes,
        origin_type,
        origin_type_th,
        origin_description,
        name_use,
        origin_components,
        examples,
    })
}

pub fn load_all_kanji(repo_root: &Path) -> (Vec<KanjiEntry>, Vec<String>) {
    let kanji_dir = repo_root.join("content/kanji");
    let mut files = Vec::new();
    collect_md_files(&kanji_dir, repo_root, &mut files);

    let mut entries = Vec::new();
    for rel_path in &files {
        let full = repo_root.join(rel_path);
        if let Ok(content) = fs::read_to_string(&full) {
            let (_, sections) = split_markdown_sections(&content);
            for (heading, body) in sections {
                if let Some(entry) = parse_kanji_section(&heading, &body, rel_path) {
                    entries.push(entry);
                }
            }
        }
    }
    (entries, files)
}

pub fn parse_compound_section(heading: &str, body: &str, rel_path: &str) -> Option<CompoundEntry> {
    let (surface_part, reading_part) = heading.rsplit_once('(')?;
    let surface = surface_part.trim().to_string();
    let reading = reading_part.strip_suffix(')')?.trim().to_string();
    if surface.is_empty() || reading.is_empty() {
        return None;
    }

    let mut meaning_en = String::new();
    let mut meaning_th: Option<String> = None;

    for line in body.lines() {
        if let Some((k, v)) = parse_kv_line(line) {
            match k.as_str() {
                "meaning_en" => meaning_en = v,
                "meaning_th" => {
                    if !v.is_empty() {
                        meaning_th = Some(v);
                    }
                }
                _ => {}
            }
        }
    }

    Some(CompoundEntry {
        surface,
        reading,
        file_path: rel_path.to_string(),
        meaning_en,
        meaning_th,
    })
}

pub fn compound_bucket_for_reading(reading: &str) -> &'static str {
    let first = reading.trim().chars().next().unwrap_or('あ');
    let bucket = match first {
        'あ'..='お' | 'ぁ'..='ぉ' | 'ア'..='オ' | 'ァ'..='ォ' | 'ヴ' => "a",
        'か'..='ご' | 'カ'..='ゴ' | 'ヵ' | 'ヶ' => "ka",
        'さ'..='ぞ' | 'サ'..='ゾ' => "sa",
        'た'..='ど' | 'タ'..='ド' => "ta",
        'な'..='の' | 'ナ'..='ノ' => "na",
        'は'..='ぽ' | 'ハ'..='ポ' => "ha",
        'ま'..='も' | 'マ'..='モ' => "ma",
        'や'..='よ' | 'ゃ'..='ょ' | 'ヤ'..='ヨ' | 'ャ'..='ョ' => "ya",
        'ら'..='ろ' | 'ラ'..='ロ' => "ra",
        _ => "wa",
    };
    match bucket {
        "a" => "content/compounds/a.md",
        "ka" => "content/compounds/ka.md",
        "sa" => "content/compounds/sa.md",
        "ta" => "content/compounds/ta.md",
        "na" => "content/compounds/na.md",
        "ha" => "content/compounds/ha.md",
        "ma" => "content/compounds/ma.md",
        "ya" => "content/compounds/ya.md",
        "ra" => "content/compounds/ra.md",
        _ => "content/compounds/wa.md",
    }
}

pub fn load_all_compounds(repo_root: &Path) -> Vec<CompoundEntry> {
    let comp_dir = repo_root.join("content/compounds");
    let mut files = Vec::new();
    collect_md_files(&comp_dir, repo_root, &mut files);

    let mut entries = Vec::new();
    for rel_path in &files {
        let full = repo_root.join(rel_path);
        if let Ok(content) = fs::read_to_string(&full) {
            let (_, sections) = split_markdown_sections(&content);
            for (heading, body) in sections {
                if let Some(entry) = parse_compound_section(&heading, &body, rel_path) {
                    entries.push(entry);
                }
            }
        }
    }
    entries
}

pub fn parse_vocabulary_section(
    heading: &str,
    body: &str,
    rel_path: &str,
) -> Option<VocabularyEntry> {
    let (word, id) = if let Some((w, rest)) = heading.split_once('(') {
        let clean_id = rest.strip_suffix(')').unwrap_or(rest).trim().to_string();
        let clean_w = w.trim().to_string();
        (
            clean_w.clone(),
            if clean_id.is_empty() { clean_w } else { clean_id },
        )
    } else {
        let w = heading.trim().to_string();
        (w.clone(), w)
    };
    if word.is_empty() {
        return None;
    }

    let mut reading = String::new();
    let mut furigana: Option<String> = None;
    let mut romaji = String::new();
    let mut category = String::new();
    let mut category_th = String::new();
    let mut series: Option<String> = None;
    let mut meaning_th = String::new();
    let mut meaning_en = String::new();
    let mut jlpt: Option<i64> = None;
    let mut kanken: Option<String> = None;
    let mut tags = Vec::new();
    let mut breakdown = Vec::new();
    let mut lore_lines: Vec<String> = Vec::new();

    #[derive(PartialEq)]
    enum Mode {
        Kv,
        Breakdown,
        Lore,
    }
    let mut mode = Mode::Kv;

    for raw_line in body.lines() {
        let trimmed = raw_line.trim();
        if trimmed.is_empty() || trimmed == "---" {
            continue;
        }
        if trimmed.starts_with("### Breakdown") {
            mode = Mode::Breakdown;
            continue;
        }
        if trimmed.starts_with("### Lore") {
            mode = Mode::Lore;
            continue;
        }

        match mode {
            Mode::Kv => {
                if let Some((k, v)) = parse_kv_line(raw_line) {
                    match k.as_str() {
                        "reading" => reading = v,
                        "furigana" => {
                            if !v.is_empty() {
                                furigana = Some(v);
                            }
                        }
                        "romaji" => romaji = v,
                        "category" => category = v,
                        "category_th" => category_th = v,
                        "series" => {
                            if !v.is_empty() {
                                series = Some(v);
                            }
                        }
                        "meaning_th" => meaning_th = v,
                        "meaning_en" => meaning_en = v,
                        "jlpt" => jlpt = v.parse::<i64>().ok(),
                        "kanken" => {
                            if !v.is_empty() {
                                kanken = Some(v);
                            }
                        }
                        "tags" => tags = split_csv(&v),
                        _ => {}
                    }
                }
            }
            Mode::Breakdown => {
                if let Some(rest) = trimmed.strip_prefix("- ") {
                    if let Some((ch, m)) = rest.split_once(':') {
                        breakdown.push(BreakdownItem {
                            ch: ch.trim().to_string(),
                            meaning: m.trim().to_string(),
                        });
                    }
                }
            }
            Mode::Lore => {
                if !trimmed.starts_with('#') {
                    lore_lines.push(trimmed.to_string());
                }
            }
        }
    }

    let lore = if lore_lines.is_empty() {
        None
    } else {
        Some(lore_lines.join("\n"))
    };

    Some(VocabularyEntry {
        word,
        id,
        file_path: rel_path.to_string(),
        reading,
        furigana,
        romaji,
        category,
        category_th,
        series,
        meaning_th,
        meaning_en,
        jlpt,
        kanken,
        tags,
        breakdown,
        lore,
    })
}

pub fn load_all_vocabulary(repo_root: &Path) -> (Vec<VocabularyEntry>, Vec<String>) {
    let vocab_dir = repo_root.join("content/vocabulary");
    let mut files = Vec::new();
    collect_md_files(&vocab_dir, repo_root, &mut files);

    let mut entries = Vec::new();
    for rel_path in &files {
        let full = repo_root.join(rel_path);
        if let Ok(content) = fs::read_to_string(&full) {
            let (_, sections) = split_markdown_sections(&content);
            for (heading, body) in sections {
                if let Some(entry) = parse_vocabulary_section(&heading, &body, rel_path) {
                    entries.push(entry);
                }
            }
        }
    }
    (entries, files)
}

pub fn load_all_special_readings(repo_root: &Path) -> Vec<SpecialReadingEntry> {
    let rel_path = "content/special-readings/ateji.md";
    let full = repo_root.join(rel_path);
    let Ok(content) = fs::read_to_string(&full) else {
        return Vec::new();
    };
    let (_, sections) = split_markdown_sections(&content);
    let mut entries = Vec::new();
    for (heading, body) in sections {
        let word = heading.split_whitespace().next().unwrap_or("").trim().to_string();
        if word.is_empty() {
            continue;
        }
        let mut reading = String::new();
        let mut kanji: Vec<String> = word
            .chars()
            .filter(|&c| ('\u{4E00}'..='\u{9FFF}').contains(&c))
            .map(|c| c.to_string())
            .collect();
        let mut meaning_th = String::new();
        let mut meaning_en = String::new();
        for line in body.lines() {
            if let Some((k, v)) = parse_kv_line(line) {
                match k.as_str() {
                    "reading" => reading = v,
                    "kanji" => kanji = split_csv(&v),
                    "meaning_th" => meaning_th = v,
                    "meaning_en" => meaning_en = v,
                    _ => {}
                }
            }
        }
        entries.push(SpecialReadingEntry {
            word,
            file_path: rel_path.to_string(),
            reading,
            kanji,
            meaning_th,
            meaning_en,
        });
    }
    entries
}

pub fn load_all_prefectures(repo_root: &Path) -> Vec<PrefectureEntry> {
    let pref_dir = repo_root.join("content/prefectures");
    let mut files = Vec::new();
    collect_md_files(&pref_dir, repo_root, &mut files);

    let mut entries = Vec::new();
    for rel_path in &files {
        let full = repo_root.join(rel_path);
        let Ok(content) = fs::read_to_string(&full) else {
            continue;
        };
        if let Some(entry) = parse_prefecture_file(&content, rel_path) {
            entries.push(entry);
        }
    }
    entries
}

pub fn parse_prefecture_file(content: &str, rel_path: &str) -> Option<PrefectureEntry> {
    let mut code = String::new();
    let mut slug = String::new();
    let mut name_ja = String::new();
    let mut name_hira = String::new();
    let mut name_romaji = String::new();
    let mut name_th = String::new();
    let mut region = String::new();
    let mut capital = String::new();
    let mut capital_reading = String::new();
    let mut population = String::new();
    let mut population_year = String::new();
    let mut area_km2 = String::new();
    let mut flower = String::new();
    let mut tree = String::new();
    let mut bird = String::new();
    let mut etymology = String::new();
    let mut places = Vec::new();
    let mut products = Vec::new();

    #[derive(PartialEq)]
    enum Section {
        Kv,
        Places,
        Products,
    }
    let mut sec = Section::Kv;

    for raw_line in content.lines() {
        let trimmed = raw_line.trim();
        if trimmed.is_empty() || trimmed.starts_with("## ") {
            continue;
        }
        if trimmed == "### Places" {
            sec = Section::Places;
            continue;
        }
        if trimmed == "### Products" {
            sec = Section::Products;
            continue;
        }
        match sec {
            Section::Kv => {
                if let Some((k, v)) = parse_kv_line(raw_line) {
                    match k.as_str() {
                        "code" => code = v,
                        "slug" => slug = v,
                        "name_ja" => name_ja = v,
                        "name_hira" => name_hira = v,
                        "name_romaji" => name_romaji = v,
                        "name_th" => name_th = v,
                        "region" => region = v,
                        "capital" => capital = v,
                        "capital_reading" => capital_reading = v,
                        "population" => population = v,
                        "population_year" => population_year = v,
                        "area_km2" => area_km2 = v,
                        "flower" => flower = v,
                        "tree" => tree = v,
                        "bird" => bird = v,
                        "etymology" => etymology = v,
                        _ => {}
                    }
                }
            }
            Section::Places | Section::Products => {
                if let Some(rest) = trimmed.strip_prefix("- ") {
                    let item = if let Some((n, t)) = rest.split_once('｜') {
                        PrefListItem {
                            name: n.trim().to_string(),
                            th: Some(t.trim().to_string()),
                        }
                    } else {
                        PrefListItem {
                            name: rest.trim().to_string(),
                            th: None,
                        }
                    };
                    if sec == Section::Places {
                        places.push(item);
                    } else {
                        products.push(item);
                    }
                }
            }
        }
    }

    if slug.is_empty() {
        return None;
    }

    Some(PrefectureEntry {
        code,
        slug,
        file_path: rel_path.to_string(),
        name_ja,
        name_hira,
        name_romaji,
        name_th,
        region,
        capital,
        capital_reading,
        population,
        population_year,
        area_km2,
        flower,
        tree,
        bird,
        etymology,
        places,
        products,
    })
}

pub fn load_all_eras(repo_root: &Path) -> (Vec<EraPeriodEntry>, Vec<EraGengoEntry>) {
    let periods_rel = "content/eras/periods.md";
    let gengo_rel = "content/eras/gengo.md";

    let mut periods = Vec::new();
    if let Ok(content) = fs::read_to_string(repo_root.join(periods_rel)) {
        let (_, sections) = split_markdown_sections(&content);
        for (_, body) in sections {
            let mut order = String::new();
            let mut slug = String::new();
            let mut name_ja = String::new();
            let mut name_hira = String::new();
            let mut name_romaji = String::new();
            let mut name_th = String::new();
            let mut macro_era = String::new();
            let mut macro_era_ja = String::new();
            let mut macro_era_th = String::new();
            let mut start_year = String::new();
            let mut end_year = String::new();
            let mut year_label = String::new();
            let mut capital = String::new();
            let mut etymology_th = String::new();
            let mut summary_th = String::new();
            let mut kanji_milestone_th = String::new();
            let mut highlights = Vec::new();
            let mut in_highlights = false;

            for raw_line in body.lines() {
                let trimmed = raw_line.trim();
                if trimmed.is_empty() {
                    continue;
                }
                if trimmed == "### Highlights" {
                    in_highlights = true;
                    continue;
                }
                if in_highlights {
                    if let Some(h) = trimmed.strip_prefix("- ") {
                        highlights.push(h.trim().to_string());
                    }
                    continue;
                }
                if let Some((k, v)) = parse_kv_line(raw_line) {
                    match k.as_str() {
                        "order" => order = v,
                        "slug" => slug = v,
                        "name_ja" => name_ja = v,
                        "name_hira" => name_hira = v,
                        "name_romaji" => name_romaji = v,
                        "name_th" => name_th = v,
                        "macro_era" => macro_era = v,
                        "macro_era_ja" => macro_era_ja = v,
                        "macro_era_th" => macro_era_th = v,
                        "start_year" => start_year = v,
                        "end_year" => end_year = v,
                        "year_label" => year_label = v,
                        "capital" => capital = v,
                        "etymology_th" => etymology_th = v,
                        "summary_th" => summary_th = v,
                        "kanji_milestone_th" => kanji_milestone_th = v,
                        _ => {}
                    }
                }
            }
            if !slug.is_empty() {
                periods.push(EraPeriodEntry {
                    order,
                    slug,
                    file_path: periods_rel.to_string(),
                    name_ja,
                    name_hira,
                    name_romaji,
                    name_th,
                    macro_era,
                    macro_era_ja,
                    macro_era_th,
                    start_year,
                    end_year,
                    year_label,
                    capital,
                    etymology_th,
                    summary_th,
                    kanji_milestone_th,
                    highlights,
                });
            }
        }
    }

    let mut gengo = Vec::new();
    if let Ok(content) = fs::read_to_string(repo_root.join(gengo_rel)) {
        let (_, sections) = split_markdown_sections(&content);
        for (_, body) in sections {
            let mut order = String::new();
            let mut id = String::new();
            let mut name_ja = String::new();
            let mut name_hira = String::new();
            let mut name_romaji = String::new();
            let mut name_th = String::new();
            let mut start_year = String::new();
            let mut end_year = String::new();
            let mut period_slug = String::new();
            let mut is_modern = String::new();
            let mut source_classic = String::new();
            let mut meaning_th = String::new();

            for raw_line in body.lines() {
                if let Some((k, v)) = parse_kv_line(raw_line) {
                    match k.as_str() {
                        "order" => order = v,
                        "id" => id = v,
                        "name_ja" => name_ja = v,
                        "name_hira" => name_hira = v,
                        "name_romaji" => name_romaji = v,
                        "name_th" => name_th = v,
                        "start_year" => start_year = v,
                        "end_year" => end_year = v,
                        "period_slug" => period_slug = v,
                        "is_modern" => is_modern = v,
                        "source_classic" => source_classic = v,
                        "meaning_th" => meaning_th = v,
                        _ => {}
                    }
                }
            }
            if !id.is_empty() {
                gengo.push(EraGengoEntry {
                    order,
                    id,
                    file_path: gengo_rel.to_string(),
                    name_ja,
                    name_hira,
                    name_romaji,
                    name_th,
                    start_year,
                    end_year,
                    period_slug,
                    is_modern,
                    source_classic,
                    meaning_th,
                });
            }
        }
    }

    (periods, gengo)
}
