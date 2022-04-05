import { Lexer } from "./lexer";
import { Grammar } from "./syntax-grammar";

const code = `
a = 3+2*2
`

const lexer = new Lexer(code)

const tokens = lexer.getTokens()
const grammar = new Grammar(tokens)
const ast = grammar.getAST()
