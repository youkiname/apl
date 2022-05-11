import { Lexer } from "./lexer/lexer";
import { Grammar } from "./syntax/grammar";
import { Generator } from "./code-generator";

const code = `
int b = 2
int a = 2+ 2 * b
print(a)
`

const lexer = new Lexer(code)

const tokens = lexer.getTokens()
const grammar = new Grammar(tokens)
const ast = grammar.getAST()
ast.eval();
Generator.compile();
