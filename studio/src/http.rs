//! Lightweight, zero-dependency HTTP/1.1 server for the local Content Studio.

use std::collections::HashMap;
use std::io::{BufRead, BufReader, Read, Write};
use std::net::TcpStream;

use crate::json::JsonValue;

pub struct Request {
    pub method: String,
    pub path: String,
    pub query: HashMap<String, String>,
    pub body: String,
}

pub struct Response {
    pub status: u16,
    pub content_type: &'static str,
    pub body: Vec<u8>,
}

impl Response {
    pub fn html(content: &str) -> Self {
        Self {
            status: 200,
            content_type: "text/html; charset=utf-8",
            body: content.as_bytes().to_vec(),
        }
    }

    pub fn css(content: &str) -> Self {
        Self {
            status: 200,
            content_type: "text/css; charset=utf-8",
            body: content.as_bytes().to_vec(),
        }
    }

    pub fn js(content: &str) -> Self {
        Self {
            status: 200,
            content_type: "application/javascript; charset=utf-8",
            body: content.as_bytes().to_vec(),
        }
    }

    pub fn svg(content: Vec<u8>) -> Self {
        Self {
            status: 200,
            content_type: "image/svg+xml; charset=utf-8",
            body: content,
        }
    }

    pub fn json(val: &JsonValue) -> Self {
        Self {
            status: 200,
            content_type: "application/json; charset=utf-8",
            body: val.to_json_string().into_bytes(),
        }
    }

    pub fn err(status: u16, message: impl Into<String>) -> Self {
        let payload = JsonValue::obj(vec![
            ("ok", JsonValue::Bool(false)),
            ("error", JsonValue::str_val(message)),
        ]);
        Self {
            status,
            content_type: "application/json; charset=utf-8",
            body: payload.to_json_string().into_bytes(),
        }
    }
}

pub fn url_decode(input: &str) -> String {
    let mut bytes = Vec::with_capacity(input.len());
    let raw = input.as_bytes();
    let mut i = 0;
    while i < raw.len() {
        match raw[i] {
            b'+' => {
                bytes.push(b' ');
                i += 1;
            }
            b'%' if i + 2 < raw.len() => {
                if let Ok(hex_str) = std::str::from_utf8(&raw[i + 1..i + 3]) {
                    if let Ok(b) = u8::from_str_radix(hex_str, 16) {
                        bytes.push(b);
                        i += 3;
                        continue;
                    }
                }
                bytes.push(raw[i]);
                i += 1;
            }
            b => {
                bytes.push(b);
                i += 1;
            }
        }
    }
    String::from_utf8_lossy(&bytes).into_owned()
}

pub fn parse_query_string(q: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();
    for pair in q.split('&') {
        if pair.is_empty() {
            continue;
        }
        if let Some((k, v)) = pair.split_once('=') {
            map.insert(url_decode(k), url_decode(v));
        } else {
            map.insert(url_decode(pair), String::new());
        }
    }
    map
}

pub fn read_request(stream: &mut TcpStream) -> Option<Request> {
    let mut reader = BufReader::new(stream);
    let mut request_line = String::new();
    if reader.read_line(&mut request_line).ok()? == 0 {
        return None;
    }
    let mut parts = request_line.trim().split_whitespace();
    let method = parts.next()?.to_uppercase();
    let raw_target = parts.next()?;

    let (raw_path, query) = match raw_target.split_once('?') {
        Some((p, q)) => (url_decode(p), parse_query_string(q)),
        None => (url_decode(raw_target), HashMap::new()),
    };

    let mut content_length = 0usize;
    loop {
        let mut line = String::new();
        if reader.read_line(&mut line).ok()? == 0 {
            break;
        }
        let trimmed = line.trim();
        if trimmed.is_empty() {
            break;
        }
        if let Some((k, v)) = trimmed.split_once(':') {
            if k.trim().eq_ignore_ascii_case("content-length") {
                content_length = v.trim().parse::<usize>().unwrap_or(0);
            }
        }
    }

    let mut body_bytes = vec![0u8; content_length];
    if content_length > 0 {
        reader.read_exact(&mut body_bytes).ok()?;
    }
    let body = String::from_utf8_lossy(&body_bytes).into_owned();

    Some(Request {
        method,
        path: raw_path,
        query,
        body,
    })
}

pub fn write_response(stream: &mut TcpStream, resp: Response) {
    let status_text = match resp.status {
        200 => "OK",
        201 => "Created",
        400 => "Bad Request",
        404 => "Not Found",
        500 => "Internal Server Error",
        _ => "OK",
    };
    let header = format!(
        "HTTP/1.1 {} {}\r\nContent-Type: {}\r\nContent-Length: {}\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n",
        resp.status,
        status_text,
        resp.content_type,
        resp.body.len()
    );
    let _ = stream.write_all(header.as_bytes());
    let _ = stream.write_all(&resp.body);
    let _ = stream.flush();
}
