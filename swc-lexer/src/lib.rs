#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

use swc_common::comments::{SingleThreadedComments};
use swc_common::sync::Lrc;
use swc_common::{
    FileName, SourceMap,
};
use swc_ecma_ast::EsVersion;
use swc_ecma_parser::token::Token;
use swc_ecma_parser::{lexer::Lexer, StringInput, Syntax};

fn fulfill(index: usize, input: &str, mut result: String) -> String {
    if index > result.len() {
        result.push_str(&input[result.len()..index])
    }
    return result
}

#[napi]
pub fn strip_literal_swc(input: String) -> String {
    let cm: Lrc<SourceMap> = Default::default();
    let code = input.clone();
    let fm = cm.new_source_file(
        FileName::Custom("test.js".into()),
        input,
    );

    let lexer = Lexer::new(
        Syntax::Es(Default::default()),
        EsVersion::Es2022,
        StringInput::from(&*fm),
        None,
    );

    let mut result = String::new();

    for t in lexer {
        let start = (t.span.lo.0 - 1) as usize;
        let end = (t.span.hi.0 - 1) as usize;
        result = fulfill(start, &code, result);
        match t.token {
            Token::Str { .. } => {
                result.push(code.as_bytes()[start] as char);
                result.push_str(&" ".repeat(end - start - 2));
                result.push(code.as_bytes()[end - 1] as char);
            },
            Token::Template { .. } => {
                result.push_str(&" ".repeat(end - start));
            },
            _ => {
                result.push_str(&code[start..end]);
            }
        }
    }

    result = fulfill(code.len(), &code, result);

    return result;
}

#[napi]
pub fn get_literal_pos_swc(input: String) -> Vec<u32> {
    let cm: Lrc<SourceMap> = Default::default();
    let fm = cm.new_source_file(
        FileName::Custom("test.js".into()),
        input,
    );

    let comments = SingleThreadedComments::default();

    let lexer = Lexer::new(
        Syntax::Es(Default::default()),
        EsVersion::Es2022,
        StringInput::from(&*fm),
        Some(&comments),
    );

    let mut pos_list = Vec::new();

    for t in lexer {
        match t.token {
            Token::Str { .. } => {
                pos_list.push(t.span.lo.0 + 1 - 1);
                pos_list.push(t.span.hi.0 - 1 - 1);
            },
            Token::Template { .. } => {
                pos_list.push(t.span.lo.0 - 1);
                pos_list.push(t.span.hi.0 - 1);
            },
            _ => {}
        }
    }

    let (leading_comments, trailing_comments) = comments.take_all();
    for c in leading_comments.take().into_values().flatten() {
        pos_list.push(c.span.lo.0 - 1);
        pos_list.push(c.span.hi.0 - 1);
    }
    for c in trailing_comments.take().into_values().flatten() {
        pos_list.push(c.span.lo.0 - 1);
        pos_list.push(c.span.hi.0 - 1);
    }

    return pos_list;
}