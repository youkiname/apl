import { Lexer } from "./lexer/lexer";
import { Grammar } from "./syntax/grammar";
import { Generator } from "./code-generator";

const code = `

`

const lexer = new Lexer(code)

const tokens = lexer.getTokens()
const grammar = new Grammar(tokens)
const ast = grammar.getAST()
ast.eval();
Generator.compile();
