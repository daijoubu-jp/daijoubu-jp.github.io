//! Minimal, zero-dependency RFC 8259 JSON parser and serializer for the Content Studio.
//! Handles full UTF-8 (Japanese CJK, Kana, Thai, emoji), `\uXXXX` escapes (including
//! UTF-16 surrogate pairs), numbers, booleans, null, arrays, and ordered key-value objects.

use std::fmt::Write as _;

#[derive(Debug, Clone, PartialEq)]
pub enum JsonValue {
    Null,
    Bool(bool),
    Number(f64),
    Str(String),
    Array(Vec<JsonValue>),
    Object(Vec<(String, JsonValue)>),
}

impl JsonValue {
    pub fn obj(entries: Vec<(&str, JsonValue)>) -> Self {
        JsonValue::Object(
            entries
                .into_iter()
                .map(|(k, v)| (k.to_string(), v))
                .collect(),
        )
    }

    pub fn str_val(s: impl Into<String>) -> Self {
        JsonValue::Str(s.into())
    }

    pub fn opt_str(s: &Option<String>) -> Self {
        match s {
            Some(v) => JsonValue::Str(v.clone()),
            None => JsonValue::Null,
        }
    }

    pub fn str_array(items: &[String]) -> Self {
        JsonValue::Array(items.iter().cloned().map(JsonValue::Str).collect())
    }

    pub fn get(&self, key: &str) -> Option<&JsonValue> {
        match self {
            JsonValue::Object(entries) => entries.iter().find(|(k, _)| k == key).map(|(_, v)| v),
            _ => None,
        }
    }

    pub fn get_str(&self, key: &str) -> Option<&str> {
        self.get(key).and_then(|v| match v {
            JsonValue::Str(s) => Some(s.as_str()),
            _ => None,
        })
    }

    pub fn get_str_or(&self, key: &str, default: &str) -> String {
        self.get_str(key).unwrap_or(default).to_string()
    }

    pub fn get_opt_str(&self, key: &str) -> Option<String> {
        self.get(key).and_then(|v| match v {
            JsonValue::Str(s) => {
                let trimmed = s.trim();
                if trimmed.is_empty() {
                    None
                } else {
                    Some(trimmed.to_string())
                }
            }
            _ => None,
        })
    }

    pub fn get_bool(&self, key: &str, default: bool) -> bool {
        self.get(key)
            .and_then(|v| match v {
                JsonValue::Bool(b) => Some(*b),
                JsonValue::Str(s) => Some(matches!(s.trim().to_lowercase().as_str(), "true" | "yes" | "1")),
                _ => None,
            })
            .unwrap_or(default)
    }

    pub fn get_i64(&self, key: &str) -> Option<i64> {
        self.get(key).and_then(|v| match v {
            JsonValue::Number(n) => Some(*n as i64),
            JsonValue::Str(s) => s.trim().parse::<i64>().ok(),
            _ => None,
        })
    }

    pub fn get_str_vec(&self, key: &str) -> Vec<String> {
        match self.get(key) {
            Some(JsonValue::Array(arr)) => arr
                .iter()
                .filter_map(|item| match item {
                    JsonValue::Str(s) => {
                        let t = s.trim();
                        if t.is_empty() {
                            None
                        } else {
                            Some(t.to_string())
                        }
                    }
                    _ => None,
                })
                .collect(),
            Some(JsonValue::Str(s)) => s
                .split(',')
                .map(|part| part.trim().to_string())
                .filter(|part| !part.is_empty())
                .collect(),
            _ => Vec::new(),
        }
    }

    pub fn to_json_string(&self) -> String {
        let mut buf = String::with_capacity(256);
        self.write_to(&mut buf);
        buf
    }

    fn write_to(&self, out: &mut String) {
        match self {
            JsonValue::Null => out.push_str("null"),
            JsonValue::Bool(true) => out.push_str("true"),
            JsonValue::Bool(false) => out.push_str("false"),
            JsonValue::Number(n) => {
                if n.is_finite() {
                    if n.fract() == 0.0 && *n >= (i64::MIN as f64) && *n <= (i64::MAX as f64) {
                        let _ = write!(out, "{}", *n as i64);
                    } else {
                        let _ = write!(out, "{}", n);
                    }
                } else {
                    out.push_str("null");
                }
            }
            JsonValue::Str(s) => write_escaped_str(s, out),
            JsonValue::Array(items) => {
                out.push('[');
                for (i, item) in items.iter().enumerate() {
                    if i > 0 {
                        out.push(',');
                    }
                    item.write_to(out);
                }
                out.push(']');
            }
            JsonValue::Object(entries) => {
                out.push('{');
                for (i, (k, v)) in entries.iter().enumerate() {
                    if i > 0 {
                        out.push(',');
                    }
                    write_escaped_str(k, out);
                    out.push(':');
                    v.write_to(out);
                }
                out.push('}');
            }
        }
    }
}

fn write_escaped_str(s: &str, out: &mut String) {
    out.push('"');
    for ch in s.chars() {
        match ch {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            '\u{08}' => out.push_str("\\b"),
            '\u{0C}' => out.push_str("\\f"),
            c if (c as u32) < 0x20 => {
                let _ = write!(out, "\\u{:04x}", c as u32);
            }
            c => out.push(c),
        }
    }
    out.push('"');
}

pub fn parse_json(input: &str) -> Result<JsonValue, String> {
    let mut parser = Parser {
        chars: input.chars().collect(),
        pos: 0,
    };
    let val = parser.parse_value()?;
    parser.skip_ws();
    if parser.pos < parser.chars.len() {
        return Err(format!("Unexpected trailing characters at position {}", parser.pos));
    }
    Ok(val)
}

struct Parser {
    chars: Vec<char>,
    pos: usize,
}

impl Parser {
    fn skip_ws(&mut self) {
        while self.pos < self.chars.len() && self.chars[self.pos].is_whitespace() {
            self.pos += 1;
        }
    }

    fn peek(&self) -> Option<char> {
        self.chars.get(self.pos).copied()
    }

    fn next(&mut self) -> Option<char> {
        let ch = self.peek()?;
        self.pos += 1;
        Some(ch)
    }

    fn parse_value(&mut self) -> Result<JsonValue, String> {
        self.skip_ws();
        match self.peek() {
            Some('"') => self.parse_string().map(JsonValue::Str),
            Some('{') => self.parse_object(),
            Some('[') => self.parse_array(),
            Some('t') | Some('f') => self.parse_bool(),
            Some('n') => self.parse_null(),
            Some(c) if c == '-' || c.is_ascii_digit() => self.parse_number(),
            Some(c) => Err(format!("Unexpected character '{}' at pos {}", c, self.pos)),
            None => Err("Unexpected end of JSON input".to_string()),
        }
    }

    fn parse_null(&mut self) -> Result<JsonValue, String> {
        if self.chars[self.pos..].starts_with(&['n', 'u', 'l', 'l']) {
            self.pos += 4;
            Ok(JsonValue::Null)
        } else {
            Err(format!("Invalid literal at pos {}", self.pos))
        }
    }

    fn parse_bool(&mut self) -> Result<JsonValue, String> {
        if self.chars[self.pos..].starts_with(&['t', 'r', 'u', 'e']) {
            self.pos += 4;
            Ok(JsonValue::Bool(true))
        } else if self.chars[self.pos..].starts_with(&['f', 'a', 'l', 's', 'e']) {
            self.pos += 5;
            Ok(JsonValue::Bool(false))
        } else {
            Err(format!("Invalid boolean at pos {}", self.pos))
        }
    }

    fn parse_number(&mut self) -> Result<JsonValue, String> {
        let start = self.pos;
        if self.peek() == Some('-') {
            self.pos += 1;
        }
        while let Some(c) = self.peek() {
            if c.is_ascii_digit() || matches!(c, '.' | 'e' | 'E' | '+' | '-') {
                self.pos += 1;
            } else {
                break;
            }
        }
        let s: String = self.chars[start..self.pos].iter().collect();
        s.parse::<f64>()
            .map(JsonValue::Number)
            .map_err(|_| format!("Invalid number '{}' at pos {}", s, start))
    }

    fn parse_string(&mut self) -> Result<String, String> {
        if self.next() != Some('"') {
            return Err("Expected '\"'".to_string());
        }
        let mut out = String::new();
        while let Some(ch) = self.next() {
            match ch {
                '"' => return Ok(out),
                '\\' => {
                    let esc = self.next().ok_or("Unterminated escape sequence")?;
                    match esc {
                        '"' => out.push('"'),
                        '\\' => out.push('\\'),
                        '/' => out.push('/'),
                        'n' => out.push('\n'),
                        'r' => out.push('\r'),
                        't' => out.push('\t'),
                        'b' => out.push('\u{08}'),
                        'f' => out.push('\u{0C}'),
                        'u' => {
                            let code = self.read_hex4()?;
                            if (0xD800..=0xDBFF).contains(&code) {
                                // High surrogate; check for \uDC00..\uDFFF low surrogate
                                if self.chars[self.pos..].starts_with(&['\\', 'u']) {
                                    self.pos += 2;
                                    let low = self.read_hex4()?;
                                    let combined =
                                        0x10000 + (((code as u32 - 0xD800) << 10) | (low as u32 - 0xDC00));
                                    if let Some(c) = char::from_u32(combined) {
                                        out.push(c);
                                    }
                                }
                            } else if let Some(c) = char::from_u32(code as u32) {
                                out.push(c);
                            }
                        }
                        other => out.push(other),
                    }
                }
                c => out.push(c),
            }
        }
        Err("Unterminated string literal".to_string())
    }

    fn read_hex4(&mut self) -> Result<u16, String> {
        if self.pos + 4 > self.chars.len() {
            return Err("Incomplete \\uXXXX escape".to_string());
        }
        let hex: String = self.chars[self.pos..self.pos + 4].iter().collect();
        self.pos += 4;
        u16::from_str_radix(&hex, 16).map_err(|_| format!("Invalid hex escape \\u{}", hex))
    }

    fn parse_array(&mut self) -> Result<JsonValue, String> {
        self.next(); // '['
        self.skip_ws();
        let mut items = Vec::new();
        if self.peek() == Some(']') {
            self.pos += 1;
            return Ok(JsonValue::Array(items));
        }
        loop {
            items.push(self.parse_value()?);
            self.skip_ws();
            match self.next() {
                Some(',') => continue,
                Some(']') => return Ok(JsonValue::Array(items)),
                other => return Err(format!("Expected ',' or ']', got {:?}", other)),
            }
        }
    }

    fn parse_object(&mut self) -> Result<JsonValue, String> {
        self.next(); // '{'
        self.skip_ws();
        let mut entries = Vec::new();
        if self.peek() == Some('}') {
            self.pos += 1;
            return Ok(JsonValue::Object(entries));
        }
        loop {
            self.skip_ws();
            let key = self.parse_string()?;
            self.skip_ws();
            if self.next() != Some(':') {
                return Err(format!("Expected ':' after object key '{}'", key));
            }
            let val = self.parse_value()?;
            entries.push((key, val));
            self.skip_ws();
            match self.next() {
                Some(',') => continue,
                Some('}') => return Ok(JsonValue::Object(entries)),
                other => return Err(format!("Expected ',' or '}}', got {:?}", other)),
            }
        }
    }
}
