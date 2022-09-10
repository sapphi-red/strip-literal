mod utils;

use swc_common::sync::Lrc;
use swc_common::{
    FileName, SourceMap,
};
use swc_ecma_ast::EsVersion;
use swc_ecma_parser::token::Token;
use swc_ecma_parser::{lexer::Lexer, StringInput, Syntax};
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen(js_name = getLiteralPosSwc)]
pub fn get_literal_pos_swc(input: String) -> Vec<u32> {
    let cm: Lrc<SourceMap> = Default::default();
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

    return pos_list;
}
