mod http;
mod json;
mod models;
mod parser;
mod serializer;

use std::env;
use std::fs;
use std::net::TcpListener;
use std::path::{Path, PathBuf};
use std::process::Command;

use http::{read_request, write_response, Request, Response};
use json::{parse_json, JsonValue};
use models::{
    CompoundEntry, EraGengoEntry, EraPeriodEntry, KanjiEntry, PrefectureEntry,
    SpecialReadingEntry, VocabularyEntry,
};
use parser::{
    compound_bucket_for_reading, load_all_compounds, load_all_eras, load_all_kanji,
    load_all_prefectures, load_all_special_readings, load_all_vocabulary,
};
use serializer::{
    remove_section_from_markdown, serialize_compound_entry, serialize_era_gengo_entry,
    serialize_era_period_entry, serialize_kanji_entry, serialize_prefecture_entry,
    serialize_special_reading_entry, serialize_vocabulary_entry, upsert_section_in_markdown,
};

const APP_HTML: &str = include_str!("assets/app.html");
const APP_CSS: &str = include_str!("assets/app.css");
const APP_JS: &str = include_str!("assets/app.js");

fn resolve_repo_root() -> PathBuf {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    if let Some(parent) = manifest_dir.parent() {
        if parent.join("content").exists() {
            return parent.to_path_buf();
        }
    }
    env::current_dir().unwrap_or(manifest_dir)
}

fn run_compiler(repo_root: &Path) -> (bool, String) {
    let output = Command::new("python3")
        .arg("scripts/compile_content.py")
        .current_dir(repo_root)
        .output();

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            let stderr = String::from_utf8_lossy(&out.stderr);
            let combined = if stderr.trim().is_empty() {
                stdout.to_string()
            } else {
                format!("{}\n{}", stdout.trim_end(), stderr.trim_end())
            };
            (out.status.success(), combined)
        }
        Err(e) => (false, format!("Failed to invoke python3 scripts/compile_content.py: {}", e)),
    }
}

fn matches_query(haystacks: &[&str], q_lower: &str) -> bool {
    if q_lower.is_empty() {
        return true;
    }
    haystacks
        .iter()
        .any(|h| h.to_lowercase().contains(q_lower))
}

fn paginate<T, F>(items: Vec<T>, page: usize, limit: usize, map_fn: F) -> JsonValue
where
    F: Fn(&T) -> JsonValue,
{
    let total = items.len();
    let p = page.max(1);
    let l = limit.clamp(1, 500);
    let start = (p - 1).saturating_mul(l);
    let slice: Vec<JsonValue> = items
        .iter()
        .skip(start)
        .take(l)
        .map(map_fn)
        .collect();

    JsonValue::obj(vec![
        ("total", JsonValue::Number(total as f64)),
        ("page", JsonValue::Number(p as f64)),
        ("limit", JsonValue::Number(l as f64)),
        ("items", JsonValue::Array(slice)),
    ])
}

fn handle_request(req: Request, repo_root: &Path) -> Response {
    match (req.method.as_str(), req.path.as_str()) {
        ("GET", "/") | ("GET", "/index.html") => Response::html(APP_HTML),
        ("GET", "/assets/app.css") => Response::css(APP_CSS),
        ("GET", "/assets/app.js") => Response::js(APP_JS),

        ("GET", path) if path.starts_with("/data/kanjivg/") && path.ends_with(".svg") => {
            let fname = path.trim_start_matches("/data/kanjivg/");
            if fname.contains('/') || fname.contains("..") {
                return Response::err(400, "Invalid SVG filename");
            }
            let svg_path = repo_root.join("data/kanjivg").join(fname);
            match fs::read(svg_path) {
                Ok(bytes) => Response::svg(bytes),
                Err(_) => Response::err(404, "SVG not found"),
            }
        }

        ("GET", "/api/overview") => {
            let (kanji, kanji_files) = load_all_kanji(repo_root);
            let compounds = load_all_compounds(repo_root);
            let (vocab, vocab_files) = load_all_vocabulary(repo_root);
            let special = load_all_special_readings(repo_root);
            let prefs = load_all_prefectures(repo_root);
            let (periods, gengo) = load_all_eras(repo_root);

            Response::json(&JsonValue::obj(vec![
                ("kanji_count", JsonValue::Number(kanji.len() as f64)),
                ("compounds_count", JsonValue::Number(compounds.len() as f64)),
                ("vocabulary_count", JsonValue::Number(vocab.len() as f64)),
                ("special_readings_count", JsonValue::Number(special.len() as f64)),
                ("prefectures_count", JsonValue::Number(prefs.len() as f64)),
                ("periods_count", JsonValue::Number(periods.len() as f64)),
                ("gengo_count", JsonValue::Number(gengo.len() as f64)),
                ("kanji_files", JsonValue::str_array(&kanji_files)),
                ("vocabulary_files", JsonValue::str_array(&vocab_files)),
            ]))
        }

        ("GET", "/api/item/kanji") => {
            let key = req.query.get("key").cloned().unwrap_or_default();
            let (kanji, _) = load_all_kanji(repo_root);
            match kanji.into_iter().find(|k| k.kanji == key) {
                Some(entry) => Response::json(&entry.to_json()),
                None => Response::err(404, format!("Kanji '{}' not found", key)),
            }
        }

        ("GET", path) if path.starts_with("/api/list/") => {
            let cat = path.trim_start_matches("/api/list/");
            let q_lower = req
                .query
                .get("q")
                .map(|s| s.trim().to_lowercase())
                .unwrap_or_default();
            let file_filter = req.query.get("file").cloned().unwrap_or_default();
            let missing_filter = req.query.get("missing").cloned().unwrap_or_default();
            let sub = req.query.get("sub").cloned().unwrap_or_else(|| "periods".to_string());
            let page = req
                .query
                .get("page")
                .and_then(|s| s.parse::<usize>().ok())
                .unwrap_or(1);
            let limit = req
                .query
                .get("limit")
                .and_then(|s| s.parse::<usize>().ok())
                .unwrap_or(60);

            match cat {
                "kanji" => {
                    let (all, _) = load_all_kanji(repo_root);
                    let filtered: Vec<KanjiEntry> = all
                        .into_iter()
                        .filter(|k| {
                            if !file_filter.is_empty() && k.file_path != file_filter {
                                return false;
                            }
                            match missing_filter.as_str() {
                                "no_examples" if !k.examples.is_empty() => return false,
                                "no_origins" if k.origin_description.is_some() => return false,
                                "has_notes" if k.notes.is_none() => return false,
                                _ => {}
                            }
                            if q_lower.is_empty() {
                                return true;
                            }
                            let on = k.onyomi.join(" ");
                            let kun = k.kunyomi.join(" ");
                            let th = k.meanings_th.join(" ");
                            let en = k.meanings_en.join(" ");
                            matches_query(&[&k.kanji, &on, &kun, &th, &en], &q_lower)
                        })
                        .collect();
                    Response::json(&paginate(filtered, page, limit, |k| k.to_summary_json()))
                }
                "compounds" => {
                    let all = load_all_compounds(repo_root);
                    let filtered: Vec<CompoundEntry> = all
                        .into_iter()
                        .filter(|c| {
                            if !file_filter.is_empty() && c.file_path != file_filter {
                                return false;
                            }
                            match missing_filter.as_str() {
                                "missing_th" if c.meaning_th.is_some() => return false,
                                "has_th" if c.meaning_th.is_none() => return false,
                                _ => {}
                            }
                            let th = c.meaning_th.as_deref().unwrap_or("");
                            matches_query(&[&c.surface, &c.reading, &c.meaning_en, th], &q_lower)
                        })
                        .collect();
                    Response::json(&paginate(filtered, page, limit, |c| c.to_json()))
                }
                "vocabulary" => {
                    let (all, _) = load_all_vocabulary(repo_root);
                    let filtered: Vec<VocabularyEntry> = all
                        .into_iter()
                        .filter(|v| {
                            matches_query(
                                &[&v.word, &v.reading, &v.romaji, &v.meaning_th, &v.meaning_en, &v.category],
                                &q_lower,
                            )
                        })
                        .collect();
                    Response::json(&paginate(filtered, page, limit, |v| v.to_json()))
                }
                "special-readings" => {
                    let all = load_all_special_readings(repo_root);
                    let filtered: Vec<SpecialReadingEntry> = all
                        .into_iter()
                        .filter(|s| {
                            matches_query(
                                &[&s.word, &s.reading, &s.meaning_th, &s.meaning_en],
                                &q_lower,
                            )
                        })
                        .collect();
                    Response::json(&paginate(filtered, page, limit, |s| s.to_json()))
                }
                "prefectures" => {
                    let all = load_all_prefectures(repo_root);
                    let filtered: Vec<PrefectureEntry> = all
                        .into_iter()
                        .filter(|p| {
                            matches_query(
                                &[&p.code, &p.slug, &p.name_ja, &p.name_hira, &p.name_th, &p.region, &p.capital],
                                &q_lower,
                            )
                        })
                        .collect();
                    Response::json(&paginate(filtered, page, limit, |p| p.to_json()))
                }
                "eras" => {
                    let (periods, gengo) = load_all_eras(repo_root);
                    if sub == "gengo" {
                        let filtered: Vec<EraGengoEntry> = gengo
                            .into_iter()
                            .filter(|g| {
                                matches_query(
                                    &[&g.id, &g.name_ja, &g.name_hira, &g.name_th, &g.meaning_th],
                                    &q_lower,
                                )
                            })
                            .collect();
                        Response::json(&paginate(filtered, page, limit, |g| g.to_json()))
                    } else {
                        let filtered: Vec<EraPeriodEntry> = periods
                            .into_iter()
                            .filter(|p| {
                                matches_query(
                                    &[&p.slug, &p.name_ja, &p.name_hira, &p.name_th, &p.summary_th],
                                    &q_lower,
                                )
                            })
                            .collect();
                        Response::json(&paginate(filtered, page, limit, |p| p.to_json()))
                    }
                }
                _ => Response::err(404, format!("Unknown category '{}'", cat)),
            }
        }

        ("POST", path) if path.starts_with("/api/preview/") => {
            let cat = path.trim_start_matches("/api/preview/");
            let sub = req.query.get("sub").cloned().unwrap_or_else(|| "periods".to_string());
            let Ok(val) = parse_json(&req.body) else {
                return Response::err(400, "Invalid JSON body");
            };
            let md = match cat {
                "kanji" => KanjiEntry::from_json(&val).map(|e| serialize_kanji_entry(&e, true)),
                "compounds" => CompoundEntry::from_json(&val).map(|e| serialize_compound_entry(&e, true)),
                "vocabulary" => VocabularyEntry::from_json(&val).map(|e| serialize_vocabulary_entry(&e, true)),
                "special-readings" => {
                    SpecialReadingEntry::from_json(&val).map(|e| serialize_special_reading_entry(&e, true))
                }
                "prefectures" => PrefectureEntry::from_json(&val).map(|e| serialize_prefecture_entry(&e)),
                "eras" => {
                    if sub == "gengo" {
                        EraGengoEntry::from_json(&val).map(|e| serialize_era_gengo_entry(&e))
                    } else {
                        EraPeriodEntry::from_json(&val).map(|e| serialize_era_period_entry(&e))
                    }
                }
                _ => Err(format!("Unknown category '{}'", cat)),
            };

            match md {
                Ok(markdown) => Response::json(&JsonValue::obj(vec![
                    ("ok", JsonValue::Bool(true)),
                    ("markdown", JsonValue::str_val(markdown)),
                ])),
                Err(err) => Response::err(400, err),
            }
        }

        ("POST", path) if path.starts_with("/api/save/") => {
            let cat = path.trim_start_matches("/api/save/");
            let sub = req.query.get("sub").cloned().unwrap_or_else(|| "periods".to_string());
            let auto_compile = req.query.get("compile").map(|v| v == "1").unwrap_or(true);
            let Ok(val) = parse_json(&req.body) else {
                return Response::err(400, "Invalid JSON payload");
            };

            let save_res = save_entry_to_markdown(cat, &sub, &val, repo_root);
            match save_res {
                Ok(saved_path) => {
                    let (compile_ok, compile_output) = if auto_compile {
                        run_compiler(repo_root)
                    } else {
                        (true, String::from("Skipped auto-compile (Markdown saved)."))
                    };
                    if !compile_ok {
                        return Response::err(
                            400,
                            format!(
                                "Markdown written to {}, but compile_content.py reported validation errors:\n{}",
                                saved_path, compile_output
                            ),
                        );
                    }
                    Response::json(&JsonValue::obj(vec![
                        ("ok", JsonValue::Bool(true)),
                        ("file_path", JsonValue::str_val(saved_path)),
                        ("compile_output", JsonValue::str_val(compile_output)),
                    ]))
                }
                Err(e) => Response::err(400, e),
            }
        }

        ("POST", "/api/compile") => {
            let (ok, output) = run_compiler(repo_root);
            Response::json(&JsonValue::obj(vec![
                ("ok", JsonValue::Bool(ok)),
                ("output", JsonValue::str_val(output)),
            ]))
        }

        _ => Response::err(404, format!("Route not found: {} {}", req.method, req.path)),
    }
}

fn save_entry_to_markdown(
    cat: &str,
    sub: &str,
    val: &JsonValue,
    repo_root: &Path,
) -> Result<String, String> {
    match cat {
        "kanji" => {
            let entry = KanjiEntry::from_json(val)?;
            // Check if the kanji previously lived in a different file; if so, remove it there first
            let (all_kanji, _) = load_all_kanji(repo_root);
            if let Some(prev) = all_kanji.into_iter().find(|k| k.kanji == entry.kanji) {
                if prev.file_path != entry.file_path {
                    let old_full = repo_root.join(&prev.file_path);
                    if let Ok(old_content) = fs::read_to_string(&old_full) {
                        let (updated_old, removed) = remove_section_from_markdown(
                            &old_content,
                            |h, _| h.split_whitespace().next() == Some(entry.kanji.as_str()),
                        );
                        if removed {
                            fs::write(&old_full, updated_old).map_err(|e| e.to_string())?;
                        }
                    }
                }
            }

            let full = repo_root.join(&entry.file_path);
            let content = fs::read_to_string(&full).map_err(|e| format!("{}: {}", entry.file_path, e))?;
            let updated = upsert_section_in_markdown(
                &content,
                |h, _| h.split_whitespace().next() == Some(entry.kanji.as_str()),
                |include_hr| serialize_kanji_entry(&entry, include_hr),
            );
            fs::write(&full, updated).map_err(|e| e.to_string())?;
            Ok(entry.file_path)
        }

        "compounds" => {
            let mut entry = CompoundEntry::from_json(val)?;
            if entry.file_path.is_empty() || !entry.file_path.starts_with("content/compounds/") {
                entry.file_path = compound_bucket_for_reading(&entry.reading).to_string();
            }
            let expected_heading = format!("{} ({})", entry.surface, entry.reading);
            let full = repo_root.join(&entry.file_path);
            let content = fs::read_to_string(&full).map_err(|e| format!("{}: {}", entry.file_path, e))?;
            let updated = upsert_section_in_markdown(
                &content,
                |h, _| h.trim() == expected_heading,
                |include_hr| serialize_compound_entry(&entry, include_hr),
            );
            fs::write(&full, updated).map_err(|e| e.to_string())?;
            Ok(entry.file_path)
        }

        "vocabulary" => {
            let entry = VocabularyEntry::from_json(val)?;
            let full = repo_root.join(&entry.file_path);
            let content = fs::read_to_string(&full).map_err(|e| format!("{}: {}", entry.file_path, e))?;
            let updated = upsert_section_in_markdown(
                &content,
                |h, _| {
                    let h_word = h.split('(').next().unwrap_or("").trim();
                    h_word == entry.word || h.contains(&format!("({})", entry.id))
                },
                |include_hr| serialize_vocabulary_entry(&entry, include_hr),
            );
            fs::write(&full, updated).map_err(|e| e.to_string())?;
            Ok(entry.file_path)
        }

        "special-readings" => {
            let entry = SpecialReadingEntry::from_json(val)?;
            let full = repo_root.join(&entry.file_path);
            let content = fs::read_to_string(&full).map_err(|e| format!("{}: {}", entry.file_path, e))?;
            let updated = upsert_section_in_markdown(
                &content,
                |h, _| h.split_whitespace().next() == Some(entry.word.as_str()),
                |include_hr| serialize_special_reading_entry(&entry, include_hr),
            );
            fs::write(&full, updated).map_err(|e| e.to_string())?;
            Ok(entry.file_path)
        }

        "prefectures" => {
            let entry = PrefectureEntry::from_json(val)?;
            let full = repo_root.join(&entry.file_path);
            let updated = serialize_prefecture_entry(&entry);
            fs::write(&full, updated).map_err(|e| e.to_string())?;
            Ok(entry.file_path)
        }

        "eras" => {
            if sub == "gengo" {
                let entry = EraGengoEntry::from_json(val)?;
                let full = repo_root.join(&entry.file_path);
                let content = fs::read_to_string(&full).map_err(|e| e.to_string())?;
                let updated = upsert_section_in_markdown(
                    &content,
                    |h, _| h.trim() == entry.name_ja,
                    |_| serialize_era_gengo_entry(&entry),
                );
                fs::write(&full, updated).map_err(|e| e.to_string())?;
                Ok(entry.file_path)
            } else {
                let entry = EraPeriodEntry::from_json(val)?;
                let full = repo_root.join(&entry.file_path);
                let content = fs::read_to_string(&full).map_err(|e| e.to_string())?;
                let updated = upsert_section_in_markdown(
                    &content,
                    |h, _| h.trim() == entry.name_ja,
                    |_| serialize_era_period_entry(&entry),
                );
                fs::write(&full, updated).map_err(|e| e.to_string())?;
                Ok(entry.file_path)
            }
        }

        _ => Err(format!("Unsupported category '{}'", cat)),
    }
}

fn main() {
    let repo_root = resolve_repo_root();
    let args: Vec<String> = env::args().collect();

    let mut port: u16 = 4000;
    for i in 1..args.len() {
        if args[i] == "--port" && i + 1 < args.len() {
            port = args[i + 1].parse::<u16>().unwrap_or(4000);
        }
    }

    let addr = format!("127.0.0.1:{}", port);
    let listener = TcpListener::bind(&addr).unwrap_or_else(|e| {
        eprintln!("❌ Could not bind to {}: {}", addr, e);
        std::process::exit(1);
    });

    println!("🦀 Daijoubu JP Content Studio running at http://{}", addr);
    println!("📂 Repository root: {}", repo_root.display());
    println!("💡 Press Ctrl+C to stop.");

    for stream_res in listener.incoming() {
        if let Ok(mut stream) = stream_res {
            if let Some(req) = read_request(&mut stream) {
                let resp = handle_request(req, &repo_root);
                write_response(&mut stream, resp);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parser::{parse_kanji_section, split_markdown_sections};

    #[test]
    fn json_parser_handles_japanese_thai_and_escapes() {
        let raw = r#"{"kanji":"日","meanings_th":["วัน","พระอาทิตย์"],"strokes":4,"name_use":true}"#;
        let parsed = parse_json(raw).expect("valid JSON");
        assert_eq!(parsed.get_str("kanji"), Some("日"));
        assert_eq!(parsed.get_i64("strokes"), Some(4));
        assert!(parsed.get_bool("name_use", false));
        assert_eq!(parsed.get_str_vec("meanings_th"), vec!["วัน", "พระอาทิตย์"]);

        let roundtrip = parse_json(&parsed.to_json_string()).expect("roundtrip JSON");
        assert_eq!(parsed, roundtrip);
    }

    #[test]
    fn loads_all_six_content_categories_from_repository() {
        let root = resolve_repo_root();
        let (kanji, kanji_files) = load_all_kanji(&root);
        assert_eq!(kanji.len(), 5867, "expected all 5,867 kanji entries");
        assert_eq!(kanji_files.len(), 24, "expected 24 kanji markdown files");

        let compounds = load_all_compounds(&root);
        assert_eq!(compounds.len(), 17765, "expected all 17,765 compounds");

        let (vocab, _) = load_all_vocabulary(&root);
        assert_eq!(vocab.len(), 62, "expected 62 vocabulary items");

        let special = load_all_special_readings(&root);
        assert_eq!(special.len(), 130, "expected 130 special readings");

        let prefs = load_all_prefectures(&root);
        assert_eq!(prefs.len(), 47, "expected 47 prefectures");

        let (periods, gengo) = load_all_eras(&root);
        assert_eq!(periods.len(), 15, "expected 15 historical periods");
        assert_eq!(gengo.len(), 19, "expected 19 gengo entries");
    }

    #[test]
    fn kanji_roundtrip_serialization_is_lossless() {
        let root = resolve_repo_root();
        let content = fs::read_to_string(root.join("content/kanji/kanken-10.md")).unwrap();
        let (_, sections) = split_markdown_sections(&content);
        let (h, b) = &sections[0];
        let parsed = parse_kanji_section(h, b, "content/kanji/kanken-10.md").unwrap();
        assert_eq!(parsed.kanji, "一");
        assert_eq!(parsed.examples.len(), 5);

        let serialized = serialize_kanji_entry(&parsed, true);
        let (_, reparsed_sections) = split_markdown_sections(&serialized);
        let (rh, rb) = &reparsed_sections[0];
        let reparsed = parse_kanji_section(rh, rb, "content/kanji/kanken-10.md").unwrap();
        assert_eq!(parsed, reparsed);
    }

    #[test]
    fn surgical_section_upsert_preserves_other_sections_byte_for_byte() {
        let sample = "# Title\n\n## 一\n\n- strokes: 1\n\n---\n\n## 二\n\n- strokes: 2\n\n---\n";
        let updated = upsert_section_in_markdown(
            sample,
            |h, _| h == "一",
            |include_hr| {
                format!(
                    "## 一\n\n- strokes: 1\n- notes: Updated note{}",
                    if include_hr { "\n\n---" } else { "" }
                )
            },
        );
        assert!(updated.contains("- notes: Updated note"));
        assert!(updated.contains("## 二\n\n- strokes: 2\n\n---\n"));
    }

    #[test]
    fn compound_bucket_routing_handles_dakuten_and_all_rows() {
        assert_eq!(compound_bucket_for_reading("あいじょう"), "content/compounds/a.md");
        assert_eq!(compound_bucket_for_reading("がっこう"), "content/compounds/ka.md");
        assert_eq!(compound_bucket_for_reading("しんぶん"), "content/compounds/sa.md");
        assert_eq!(compound_bucket_for_reading("でんしゃ"), "content/compounds/ta.md");
        assert_eq!(compound_bucket_for_reading("にほん"), "content/compounds/na.md");
        assert_eq!(compound_bucket_for_reading("びょういん"), "content/compounds/ha.md");
        assert_eq!(compound_bucket_for_reading("まいにち"), "content/compounds/ma.md");
        assert_eq!(compound_bucket_for_reading("やくそく"), "content/compounds/ya.md");
        assert_eq!(compound_bucket_for_reading("れきし"), "content/compounds/ra.md");
        assert_eq!(compound_bucket_for_reading("わたし"), "content/compounds/wa.md");
    }

    #[test]
    fn api_routes_serve_overview_lists_and_previews() {
        let root = resolve_repo_root();

        let ov_resp = handle_request(
            Request {
                method: "GET".to_string(),
                path: "/api/overview".to_string(),
                query: std::collections::HashMap::new(),
                body: String::new(),
            },
            &root,
        );
        assert_eq!(ov_resp.status, 200);
        let ov_json = parse_json(&String::from_utf8(ov_resp.body).unwrap()).unwrap();
        assert_eq!(ov_json.get_i64("kanji_count"), Some(5867));

        let mut q = std::collections::HashMap::new();
        q.insert("key".to_string(), "一".to_string());
        let item_resp = handle_request(
            Request {
                method: "GET".to_string(),
                path: "/api/item/kanji".to_string(),
                query: q,
                body: String::new(),
            },
            &root,
        );
        assert_eq!(item_resp.status, 200);
        let item_body = String::from_utf8(item_resp.body).unwrap();

        let prev_resp = handle_request(
            Request {
                method: "POST".to_string(),
                path: "/api/preview/kanji".to_string(),
                query: std::collections::HashMap::new(),
                body: item_body,
            },
            &root,
        );
        assert_eq!(prev_resp.status, 200);
        let prev_json = parse_json(&String::from_utf8(prev_resp.body).unwrap()).unwrap();
        assert!(prev_json.get_bool("ok", false));
        assert!(prev_json.get_str("markdown").unwrap().starts_with("## 一\n"));
    }
}
