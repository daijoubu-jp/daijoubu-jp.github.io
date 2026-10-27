//! Lossless, markdownlint-compliant serializers and surgical in-place section updaters
//! for all 6 Daijoubu JP content categories.

use std::fmt::Write as _;

use crate::models::{
    CompoundEntry, EraGengoEntry, EraPeriodEntry, KanjiEntry, PrefectureEntry,
    SpecialReadingEntry, VocabularyEntry,
};
use crate::parser::split_markdown_sections;

pub fn serialize_kanji_entry(entry: &KanjiEntry, include_hr: bool) -> String {
    let mut out = String::new();
    let _ = writeln!(out, "## {}\n", entry.kanji);

    if !entry.onyomi.is_empty() {
        let _ = writeln!(out, "- onyomi: {}", entry.onyomi.join(", "));
    }
    if !entry.kunyomi.is_empty() {
        let _ = writeln!(out, "- kunyomi: {}", entry.kunyomi.join(", "));
    }
    if !entry.jinmei.is_empty() {
        let _ = writeln!(out, "- jinmei: {}", entry.jinmei.join(", "));
    }
    let _ = writeln!(out, "- meanings_ja: {}", entry.meanings_ja.join(", "));
    let _ = writeln!(out, "- meanings_th: {}", entry.meanings_th.join(", "));
    let _ = writeln!(out, "- meanings_en: {}", entry.meanings_en.join(", "));
    let _ = writeln!(out, "- strokes: {}", entry.strokes);
    if let Some(jlpt) = entry.jlpt {
        let _ = writeln!(out, "- jlpt: {}", jlpt);
    }
    let _ = writeln!(out, "- kanken: {}", entry.kanken);
    let _ = writeln!(out, "- radical: {}", entry.radical);
    if let Some(ref notes) = entry.notes {
        if !notes.trim().is_empty() {
            let _ = writeln!(out, "- notes: {}", notes.trim());
        }
    }

    if entry.origin_type.is_some() || entry.origin_description.is_some() {
        out.push('\n');
        if let Some(ref ot) = entry.origin_type {
            let _ = writeln!(out, "- origin_type: {}", ot.trim());
        }
        if let Some(ref ott) = entry.origin_type_th {
            let _ = writeln!(out, "- origin_type_th: {}", ott.trim());
        }
        if let Some(ref od) = entry.origin_description {
            let _ = writeln!(out, "- origin_description: {}", od.trim());
        }
    }

    if entry.name_use {
        out.push('\n');
        let _ = writeln!(out, "- name_use: yes");
    }

    if !entry.origin_components.is_empty() {
        out.push_str("\n### Origin Components\n\n");
        for comp in &entry.origin_components {
            let _ = writeln!(out, "- **{}** ({}): {}", comp.part, comp.role, comp.desc);
        }
    }

    if !entry.examples.is_empty() {
        out.push_str("\n### Examples\n\n");
        for ex in &entry.examples {
            let _ = writeln!(out, "- **{}** ({}) : {}", ex.word, ex.reading, ex.meaning_th);
            if !ex.sentence_ja.is_empty() {
                let _ = writeln!(out, "  - ja: {}", ex.sentence_ja);
            }
            if !ex.sentence_th.is_empty() {
                let _ = writeln!(out, "  - th: {}", ex.sentence_th);
            }
            if !ex.sentence_ruby.is_empty() {
                let _ = writeln!(out, "  - ruby: {}", ex.sentence_ruby);
            }
        }
    }

    if include_hr {
        out.push_str("\n---\n");
    }
    out.trim_end().to_string()
}

pub fn serialize_compound_entry(entry: &CompoundEntry, include_hr: bool) -> String {
    let mut out = String::new();
    let _ = writeln!(out, "## {} ({})\n", entry.surface, entry.reading);
    let _ = writeln!(out, "- meaning_en: {}", entry.meaning_en);
    if let Some(ref th) = entry.meaning_th {
        if !th.trim().is_empty() {
            let _ = writeln!(out, "- meaning_th: {}", th.trim());
        }
    }
    if include_hr {
        out.push_str("\n---\n");
    }
    out.trim_end().to_string()
}

pub fn serialize_vocabulary_entry(entry: &VocabularyEntry, include_hr: bool) -> String {
    let mut out = String::new();
    if entry.id != entry.word && !entry.id.is_empty() {
        let _ = writeln!(out, "## {} ({})\n", entry.word, entry.id);
    } else {
        let _ = writeln!(out, "## {}\n", entry.word);
    }
    let _ = writeln!(out, "- reading: {}", entry.reading);
    if let Some(ref furi) = entry.furigana {
        if !furi.trim().is_empty() {
            let _ = writeln!(out, "- furigana: {}", furi.trim());
        }
    }
    if !entry.romaji.is_empty() {
        let _ = writeln!(out, "- romaji: {}", entry.romaji);
    }
    if !entry.category.is_empty() {
        let _ = writeln!(out, "- category: {}", entry.category);
    }
    if !entry.category_th.is_empty() {
        let _ = writeln!(out, "- category_th: {}", entry.category_th);
    }
    if let Some(ref series) = entry.series {
        if !series.trim().is_empty() {
            let _ = writeln!(out, "- series: {}", series.trim());
        }
    }
    let _ = writeln!(out, "- meaning_th: {}", entry.meaning_th);
    let _ = writeln!(out, "- meaning_en: {}", entry.meaning_en);
    if let Some(jlpt) = entry.jlpt {
        let _ = writeln!(out, "- jlpt: {}", jlpt);
    }
    if let Some(ref kanken) = entry.kanken {
        if !kanken.trim().is_empty() {
            let _ = writeln!(out, "- kanken: {}", kanken.trim());
        }
    }
    if !entry.tags.is_empty() {
        let _ = writeln!(out, "- tags: {}", entry.tags.join(", "));
    }

    if !entry.breakdown.is_empty() {
        out.push_str("\n### Breakdown\n\n");
        for b in &entry.breakdown {
            let _ = writeln!(out, "- {}: {}", b.ch, b.meaning);
        }
    }

    if let Some(ref lore) = entry.lore {
        if !lore.trim().is_empty() {
            out.push_str("\n### Lore\n\n");
            let _ = writeln!(out, "{}", lore.trim());
        }
    }

    if include_hr {
        out.push_str("\n---\n");
    }
    out.trim_end().to_string()
}

pub fn serialize_special_reading_entry(entry: &SpecialReadingEntry, include_hr: bool) -> String {
    let mut out = String::new();
    let _ = writeln!(out, "## {}\n", entry.word);
    let _ = writeln!(out, "- reading: {}", entry.reading);
    if !entry.kanji.is_empty() {
        let _ = writeln!(out, "- kanji: {}", entry.kanji.join(", "));
    }
    let _ = writeln!(out, "- meaning_th: {}", entry.meaning_th);
    let _ = writeln!(out, "- meaning_en: {}", entry.meaning_en);
    if include_hr {
        out.push_str("\n---\n");
    }
    out.trim_end().to_string()
}

pub fn serialize_prefecture_entry(entry: &PrefectureEntry) -> String {
    let mut out = String::new();
    let _ = writeln!(out, "## {}\n", entry.name_ja);
    let _ = writeln!(out, "- code: {}", entry.code);
    let _ = writeln!(out, "- slug: {}", entry.slug);
    let _ = writeln!(out, "- name_ja: {}", entry.name_ja);
    let _ = writeln!(out, "- name_hira: {}", entry.name_hira);
    let _ = writeln!(out, "- name_romaji: {}", entry.name_romaji);
    let _ = writeln!(out, "- name_th: {}", entry.name_th);
    let _ = writeln!(out, "- region: {}", entry.region);
    let _ = writeln!(out, "- capital: {}", entry.capital);
    let _ = writeln!(out, "- capital_reading: {}", entry.capital_reading);
    let _ = writeln!(out, "- population: {}", entry.population);
    let _ = writeln!(out, "- population_year: {}", entry.population_year);
    let _ = writeln!(out, "- area_km2: {}", entry.area_km2);
    let _ = writeln!(out, "- flower: {}", entry.flower);
    let _ = writeln!(out, "- tree: {}", entry.tree);
    let _ = writeln!(out, "- bird: {}", entry.bird);
    let _ = writeln!(out, "- etymology: {}", entry.etymology);

    out.push_str("\n### Places\n\n");
    for p in &entry.places {
        if let Some(ref th) = p.th {
            if !th.is_empty() {
                let _ = writeln!(out, "- {} ｜ {}", p.name, th);
                continue;
            }
        }
        let _ = writeln!(out, "- {}", p.name);
    }

    out.push_str("\n### Products\n\n");
    for p in &entry.products {
        if let Some(ref th) = p.th {
            if !th.is_empty() {
                let _ = writeln!(out, "- {} ｜ {}", p.name, th);
                continue;
            }
        }
        let _ = writeln!(out, "- {}", p.name);
    }

    out.trim_end().to_string() + "\n"
}

pub fn serialize_era_period_entry(entry: &EraPeriodEntry) -> String {
    let mut out = String::new();
    let _ = writeln!(out, "## {}\n", entry.name_ja);
    let _ = writeln!(out, "- order: {}", entry.order);
    let _ = writeln!(out, "- slug: {}", entry.slug);
    let _ = writeln!(out, "- name_ja: {}", entry.name_ja);
    let _ = writeln!(out, "- name_hira: {}", entry.name_hira);
    let _ = writeln!(out, "- name_romaji: {}", entry.name_romaji);
    let _ = writeln!(out, "- name_th: {}", entry.name_th);
    let _ = writeln!(out, "- macro_era: {}", entry.macro_era);
    let _ = writeln!(out, "- macro_era_ja: {}", entry.macro_era_ja);
    let _ = writeln!(out, "- macro_era_th: {}", entry.macro_era_th);
    let _ = writeln!(out, "- start_year: {}", entry.start_year);
    let _ = writeln!(out, "- end_year: {}", entry.end_year);
    let _ = writeln!(out, "- year_label: {}", entry.year_label);
    let _ = writeln!(out, "- capital: {}", entry.capital);
    let _ = writeln!(out, "- etymology_th: {}", entry.etymology_th);
    let _ = writeln!(out, "- summary_th: {}", entry.summary_th);
    let _ = writeln!(out, "- kanji_milestone_th: {}", entry.kanji_milestone_th);

    out.push_str("\n### Highlights\n\n");
    for h in &entry.highlights {
        let _ = writeln!(out, "- {}", h);
    }
    out.trim_end().to_string()
}

pub fn serialize_era_gengo_entry(entry: &EraGengoEntry) -> String {
    let mut out = String::new();
    let _ = writeln!(out, "## {}\n", entry.name_ja);
    let _ = writeln!(out, "- order: {}", entry.order);
    let _ = writeln!(out, "- id: {}", entry.id);
    let _ = writeln!(out, "- name_ja: {}", entry.name_ja);
    let _ = writeln!(out, "- name_hira: {}", entry.name_hira);
    let _ = writeln!(out, "- name_romaji: {}", entry.name_romaji);
    let _ = writeln!(out, "- name_th: {}", entry.name_th);
    let _ = writeln!(out, "- start_year: {}", entry.start_year);
    let _ = writeln!(out, "- end_year: {}", entry.end_year);
    let _ = writeln!(out, "- period_slug: {}", entry.period_slug);
    let _ = writeln!(out, "- is_modern: {}", entry.is_modern);
    let _ = writeln!(out, "- source_classic: {}", entry.source_classic);
    let _ = writeln!(out, "- meaning_th: {}", entry.meaning_th);
    out.trim_end().to_string()
}

/// Surgically updates an existing `## <heading>` section in a Markdown file, or appends it
/// if not found, preserving the preamble and all untouched sections byte-for-byte.
pub fn upsert_section_in_markdown<F>(
    file_content: &str,
    match_heading: F,
    render_section: impl Fn(bool) -> String,
) -> String
where
    F: Fn(&str, &str) -> bool,
{
    let (preamble, sections) = split_markdown_sections(file_content);
    let mut out = String::new();
    if !preamble.is_empty() {
        out.push_str(&preamble);
        out.push_str("\n\n");
    }

    let mut found = false;
    for (idx, (heading, body)) in sections.iter().enumerate() {
        if idx > 0 {
            out.push_str("\n\n");
        }
        let had_hr = body.trim_end().ends_with("---");
        if !found && match_heading(heading, body) {
            found = true;
            out.push_str(&render_section(had_hr));
        } else {
            out.push_str("## ");
            out.push_str(heading);
            if !body.trim().is_empty() {
                out.push('\n');
                out.push_str(body);
            }
        }
    }

    if !found {
        // Ensure previous last section has a trailing `---` if other sections use `---`
        let uses_hr = sections.iter().any(|(_, b)| b.trim_end().ends_with("---"));
        if !sections.is_empty() {
            if uses_hr && !out.trim_end().ends_with("---") {
                out.push_str("\n\n---");
            }
            out.push_str("\n\n");
        }
        out.push_str(&render_section(uses_hr));
    }

    out.trim_end().to_string() + "\n"
}

/// Removes a matching `## <heading>` section from a Markdown file.
pub fn remove_section_from_markdown<F>(file_content: &str, match_heading: F) -> (String, bool)
where
    F: Fn(&str, &str) -> bool,
{
    let (preamble, sections) = split_markdown_sections(file_content);
    let mut out = String::new();
    if !preamble.is_empty() {
        out.push_str(&preamble);
        out.push_str("\n\n");
    }

    let mut removed = false;
    let mut kept_idx = 0usize;
    for (heading, body) in &sections {
        if !removed && match_heading(heading, body) {
            removed = true;
            continue;
        }
        if kept_idx > 0 {
            out.push_str("\n\n");
        }
        out.push_str("## ");
        out.push_str(heading);
        if !body.trim().is_empty() {
            out.push('\n');
            out.push_str(body);
        }
        kept_idx += 1;
    }

    (out.trim_end().to_string() + "\n", removed)
}
