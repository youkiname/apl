import { Lexer } from "./lexer/lexer";
import { Grammar } from "./syntax/grammar";
import { Translator } from "./translator/translator";
import { readFileSync } from 'fs';
// исправить float / float - использовать остаток от деления
// 

const code = readFileSync('./code.apl', 'utf-8');

const lexer = new Lexer(code)

const tokens = lexer.getTokens()
const grammar = new Grammar(tokens)
const ast = grammar.getAST()
ast.eval();
Translator.compile();
